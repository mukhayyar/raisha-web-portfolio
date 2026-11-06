import { defineConfig } from "vite";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

// Anatomy figures are drawn in Node at build time (the kit computes every path once) and
// injected into the HTML wherever a <!--figure:name--> marker sits. Only the moving parts are
// touched again in the browser.
const FIGURES = {
  plotter: ["figures/plotter.mjs", "plotterHtml"],
  projector: ["figures/projector.mjs", "projectorHtml"],
  catalog: ["figures/catalog.mjs", "catalogHtml"],
  // Not a figure, but the same trick: the Selected work grid is rendered from src/work/data.js.
  work: ["src/work/render.js", "workHtml"],
};

function anatomyFigures() {
  return {
    name: "anatomy-figures",
    async transformIndexHtml(html) {
      let out = html;
      for (const [name, [file, render]] of Object.entries(FIGURES)) {
        const marker = `<!--figure:${name}-->`;
        if (!out.includes(marker) || !existsSync(resolve(file))) continue;
        const module = await import(`${pathToFileURL(resolve(file)).href}?t=${Date.now()}`);
        out = out.replace(marker, () => module[render]());
      }
      return out;
    },
    handleHotUpdate({ file, server }) {
      if (file.includes("/figures/") || file.includes("/src/work/")) server.ws.send({ type: "full-reload" });
    },
  };
}

export default defineConfig({
  // Relative asset paths: the build works at https://<user>.github.io/<repo>/, at a custom
  // domain, or opened from any sub-folder. Override with BASE_PATH if you need an absolute base.
  base: process.env.BASE_PATH || "./",
  plugins: [anatomyFigures()],
  // Listen on every interface (LAN, Tailscale 100.x), not just localhost. Raw IPs are always
  // accepted; MagicDNS names (*.ts.net) must be allowed explicitly since Vite checks the Host header.
  server: { host: true, allowedHosts: [".ts.net"] },
  preview: { host: true, allowedHosts: [".ts.net"] },
  build: {
    target: "es2022",
    rollupOptions: { input: { main: resolve("index.html") } },
  },
});
