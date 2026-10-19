// Renders the link-preview images with headless Chrome (no npm dependencies):
//   og/card.html      → public/og-card.png         (1200×630, Open Graph / X card)
//   public/favicon.svg → public/apple-touch-icon.png (180×180, iOS + some chat apps)
// Usage: npm run og   (set CHROME_PATH if Chrome is not in a standard place)
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CHROME = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].find((p) => p && existsSync(p));
if (!CHROME) {
  console.error("Chrome not found; set CHROME_PATH.");
  process.exit(1);
}

const profile = mkdtempSync(join(tmpdir(), "og-card-"));
const chrome = spawn(CHROME, ["--headless=new", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "--no-first-run", "--hide-scrollbars", "--allow-file-access-from-files", "about:blank"]);
const port = await new Promise((done, fail) => {
  let text = "";
  const timer = setTimeout(() => fail(new Error("Chrome did not start")), 20000);
  chrome.stderr.on("data", (chunk) => {
    text += chunk;
    const match = text.match(/DevTools listening on ws:\/\/[^:]+:(\d+)\//);
    if (match) {
      clearTimeout(timer);
      done(Number(match[1]));
    }
  });
});
const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })).json();
const socket = new WebSocket(target.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
socket.onmessage = (message) => {
  const data = JSON.parse(message.data);
  if (data.id && pending.has(data.id)) {
    pending.get(data.id)(data);
    pending.delete(data.id);
  }
};
await new Promise((ready) => (socket.onopen = ready));
const send = (method, params = {}) => new Promise((done) => { const n = ++id; pending.set(n, done); socket.send(JSON.stringify({ id: n, method, params })); });
const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

async function render(url, width, height, out) {
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url });
  // Wait for the web fonts, then one more frame so the text is laid out with them.
  for (let i = 0; i < 100; i++) {
    const r = await send("Runtime.evaluate", { expression: "document.readyState === 'complete' && document.fonts.status === 'loaded'", returnByValue: true });
    if (r.result?.result?.value) break;
    await sleep(100);
  }
  await send("Runtime.evaluate", { expression: "document.fonts.ready.then(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))", awaitPromise: true });
  const shot = await send("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width, height, scale: 1 } });
  writeFileSync(out, Buffer.from(shot.result.data, "base64"));
  console.log(`wrote ${out.replace(ROOT + "/", "")} · ${width}×${height} · ${(statSync(out).size / 1024).toFixed(0)} KB`);
}

try {
  await render(pathToFileURL(join(ROOT, "og/card.html")).href, 1200, 630, join(ROOT, "public/og-card.png"));
  // The icon: favicon art on a full-bleed ink square (iOS rounds the corners itself).
  const svg = readFileSync(join(ROOT, "public/favicon.svg"), "utf8").replace(/<rect width="64" height="64" rx="16"/, '<rect width="64" height="64"');
  const icon = join(profile, "icon.html");
  writeFileSync(icon, `<!doctype html><style>html,body{margin:0;width:180px;height:180px;background:#16131c}svg{display:block;width:180px;height:180px}</style>${svg}`);
  await render(pathToFileURL(icon).href, 180, 180, join(ROOT, "public/apple-touch-icon.png"));
} finally {
  chrome.kill("SIGKILL");
  await sleep(300);
  rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
process.exit(0);
