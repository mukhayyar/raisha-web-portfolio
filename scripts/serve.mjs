// Static server for the built site (used behind Tailscale Funnel).
// Serves dist/ with Brotli or gzip, compressed once per file and kept in memory, plus cache headers:
// hashed files in /assets/ are immutable, everything else revalidates via ETag.
//   node scripts/serve.mjs [dir=dist]      env: PORT (4173), HOST (127.0.0.1)
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { brotliCompress, gzip, constants } from "node:zlib";
import { promisify } from "node:util";
import { extname, join, resolve, sep } from "node:path";

const ROOT = resolve(process.argv[2] ?? "dist");
const PORT = Number(process.env.PORT ?? 4173);
const HOST = process.env.HOST ?? "127.0.0.1";
const br = promisify(brotliCompress);
const gz = promisify(gzip);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};
const COMPRESSIBLE = new Set([".html", ".js", ".css", ".svg", ".json", ".txt"]);
const cache = new Map();

async function load(file) {
  const info = await stat(file);
  const hit = cache.get(file);
  if (hit && hit.mtime === info.mtimeMs) return hit;
  const raw = await readFile(file);
  const entry = { mtime: info.mtimeMs, raw, etag: `"${info.size.toString(36)}-${Math.round(info.mtimeMs).toString(36)}"` };
  if (COMPRESSIBLE.has(extname(file)) && raw.length > 512) {
    [entry.br, entry.gz] = await Promise.all([
      br(raw, { params: { [constants.BROTLI_PARAM_QUALITY]: 11, [constants.BROTLI_PARAM_SIZE_HINT]: raw.length } }),
      gz(raw, { level: 9 }),
    ]);
  }
  cache.set(file, entry);
  return entry;
}

async function resolveFile(urlPath) {
  let path = decodeURIComponent(urlPath.split("?")[0]);
  if (path.endsWith("/")) path += "index.html";
  const file = resolve(join(ROOT, path));
  if (file !== ROOT && !file.startsWith(ROOT + sep)) return null; // no escaping the root
  try {
    const info = await stat(file);
    return info.isDirectory() ? join(file, "index.html") : file;
  } catch {
    return null;
  }
}

const server = createServer(async (req, res) => {
  try {
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405, { Allow: "GET, HEAD" }).end();
      return;
    }
    const file = await resolveFile(req.url ?? "/");
    if (!file) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Not found");
      return;
    }
    const entry = await load(file);
    const headers = {
      "Content-Type": TYPES[extname(file)] ?? "application/octet-stream",
      "Cache-Control": file.includes(`${sep}assets${sep}`) ? "public, max-age=31536000, immutable" : "no-cache",
      ETag: entry.etag,
      Vary: "Accept-Encoding",
      "X-Content-Type-Options": "nosniff",
    };
    if (req.headers["if-none-match"] === entry.etag) {
      res.writeHead(304, headers).end();
      return;
    }
    const accept = String(req.headers["accept-encoding"] ?? "");
    let body = entry.raw;
    if (entry.br && /\bbr\b/.test(accept)) [body, headers["Content-Encoding"]] = [entry.br, "br"];
    else if (entry.gz && /\bgzip\b/.test(accept)) [body, headers["Content-Encoding"]] = [entry.gz, "gzip"];
    headers["Content-Length"] = body.length;
    res.writeHead(200, headers);
    res.end(req.method === "HEAD" ? undefined : body);
  } catch (error) {
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" }).end("Server error");
    console.error(error);
  }
});

server.listen(PORT, HOST, () => console.log(`serving ${ROOT} on http://${HOST}:${PORT}`));
