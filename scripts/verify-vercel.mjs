import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

const output = new URL("../.vercel/output/", import.meta.url);
const config = JSON.parse(await readFile(new URL("config.json", output), "utf8"));
assert.equal(config.version, 3);
assert.ok(config.routes.some((route) => route.dest === "/__server"));
const { default: app } = await import(new URL("functions/__server.func/index.mjs", output));
const response = await app.fetch(new Request("https://jb-motors.example/", {
  headers: { accept: "text/html" },
}), { waitUntil() {} });
assert.equal(response.status, 200);
const html = await response.text();
assert.match(html, /JB Motors Digital Workshop Management/);
assert.match(html, /What needs your attention today\?/);
const assets = [...html.matchAll(/(?:src|href)="([^"?#]+)[^"\s]*"/g)]
  .map((match) => match[1]).filter((path) => path.startsWith("/_next/static/"));
assert.ok(assets.some((path) => path.endsWith(".css")));
assert.ok(assets.some((path) => path.endsWith(".js")));
for (const path of new Set(assets)) await access(new URL(`static${path}`, output));
await access(new URL("static/brand/jb-motors-logo.png", output));
console.log(`Vercel output verified: HTTP 200, dashboard, ${new Set(assets).size} CSS/JS assets and logo.`);
console.log("Image URLs:", [...html.matchAll(/<img[^>]+src="([^"]+)"/g)].map((match) => match[1]));
