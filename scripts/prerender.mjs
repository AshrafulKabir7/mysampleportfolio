// Injects server-rendered HTML into dist/index.html so the page has real
// content before JavaScript runs (SEO, link previews, AI readers, faster LCP).
import { readFile, writeFile, rm, readdir } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const ssrDir = path.join(root, "dist-ssr");

const { render } = await import(pathToFileURL(path.join(ssrDir, "entry-server.js")).href);

const templatePath = path.join(dist, "index.html");
let html = await readFile(templatePath, "utf8");
const marker = '<div id="root"></div>';
if (!html.includes(marker)) throw new Error("prerender: #root marker not found in dist/index.html");

const app = render();
if (!app || app.length < 1000) throw new Error(`prerender: suspiciously small output (${app.length} chars)`);

// The Bangla font is a hand-made subset; fail the build if new Bengali text isn't covered.
const covered = new Set(await readFile(path.join(root, "src/assets/fonts/anek-bangla-sub.chars.txt"), "utf8"));
const missing = [...new Set(app.match(/[ঀ-৿]/g) ?? [])].filter((c) => !covered.has(c));
if (missing.length) {
  throw new Error(
    `prerender: Bengali glyphs ${missing.join("")} are not in src/assets/fonts/anek-bangla-sub.woff2 — ` +
      "re-run pyftsubset with them added (see README) and update anek-bangla-sub.chars.txt",
  );
}

// Preload the hero name face only (body text paints in the fallback with font-display: swap)
const assets = await readdir(path.join(dist, "assets"));
const preload = ["bricolage-grotesque-latin-opsz-normal-"]
  .map((prefix) => assets.find((f) => f.startsWith(prefix) && f.endsWith(".woff2")))
  .filter(Boolean)
  .map((f) => `<link rel="preload" as="font" type="font/woff2" crossorigin href="/assets/${f}" />`)
  .join("\n    ");
if (preload) html = html.replace("</title>", `</title>\n    ${preload}`);

await writeFile(templatePath, html.replace(marker, `<div id="root">${app}</div>`));
await rm(ssrDir, { recursive: true, force: true });
console.log(`prerender: injected ${(app.length / 1024).toFixed(1)} KB of HTML into dist/index.html`);
