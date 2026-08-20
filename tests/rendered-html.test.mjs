import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the JB Motors workshop dashboard", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>JB Motors Digital Workshop Management<\/title>/i);
  assert.match(html, /What needs your attention today\?/i);
  assert.match(html, /JB Motors logo/i);
  assert.match(html, /%2Fbrand%2Fjb-motors-logo\.png/i);
  assert.match(html, /Jabulani/i);
  assert.match(html, /LOCAL UI PROTOTYPE/i);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|\/og\.png/i);
});

test("keeps identity centralised and hosting disabled", async () => {
  const [page, layout, vite] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../vite.config.ts", import.meta.url), "utf8"),
  ]);

  assert.match(page, /type WorkshopProfile/);
  assert.match(page, /ownerName:\s*"Jabulani"/);
  assert.match(page, /Ratanda, Heidelberg, Gauteng \(GP\)/);
  assert.match(page, /logoPath:\s*"\/brand\/jb-motors-logo\.png"/);
  assert.match(page, /contact:\s*\{ telephone: null/);
  assert.doesNotMatch(page, /Johan Meyer|011 555 0184|workshop@jbmotors|4123456789/);
  assert.doesNotMatch(layout, /openGraph|twitter|\/og\.png|codex-preview/);
  assert.doesNotMatch(vite, /sites\(|hosting\.json|hostingConfig/);

  await access(new URL("../public/brand/jb-motors-logo.png", import.meta.url));
  await assert.rejects(access(new URL("../public/og.png", import.meta.url)));
  await assert.rejects(access(new URL(".openai/hosting.json", projectRoot)));
});
