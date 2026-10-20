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

test("keeps identity centralised and the retired Sites hosting config absent", async () => {
  // This checks local configuration only. Whether Vercel hosting is live is verified separately (see vercel-launch.md).
  const [page, brand, layout, vite] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/brand.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../vite.config.ts", import.meta.url), "utf8"),
  ]);

  assert.match(brand, /type WorkshopProfile/);
  assert.match(brand, /ownerName:\s*"Jabulani"/);
  assert.match(brand, /Ratanda, Heidelberg, Gauteng \(GP\)/);
  assert.match(brand, /logoPath:\s*"\/brand\/jb-motors-logo\.png"/);
  assert.match(brand, /contact:\s*\{ telephone: null/);
  assert.match(page, /import \{ BrandLockup, WORKSHOP_PROFILE \} from "\.\/components\/brand"/);
  assert.doesNotMatch(page, /const WORKSHOP_PROFILE/);
  for (const source of [page, brand]) assert.doesNotMatch(source, /Johan Meyer|011 555 0184|workshop@jbmotors|4123456789/);
  assert.doesNotMatch(layout, /openGraph|twitter|\/og\.png|codex-preview/);
  assert.doesNotMatch(vite, /sites\(|hosting\.json|hostingConfig/);

  await access(new URL("../public/brand/jb-motors-logo.png", import.meta.url));
  await assert.rejects(access(new URL("../public/og.png", import.meta.url)));
  await assert.rejects(access(new URL(".openai/hosting.json", projectRoot)));
});

test("does not announce actions that the prototype cannot perform", async () => {
  const sources = await Promise.all([
    "../app/page.tsx",
    "../app/features/workshop-prototype/JobWorkspace.tsx",
    "../app/features/customer-portal/CustomerPortal.tsx",
    "../app/features/problem-reports/ProblemReportForm.tsx",
  ].map((path) => readFile(new URL(path, import.meta.url), "utf8")));
  const misleading = [
    /form opened/i, /link copied/i, /Payment capture opened/i, /Booking confirmation workflow opened/i,
    /Job card changes saved/i, /Technician note saved/i, /Estimate preview opened/i, /saved in this demo session/i,
    /has received your report/i, /This reading is sent to JB Motors/i, /Ready to call/i,
  ];
  for (const source of sources) for (const pattern of misleading) assert.doesNotMatch(source, pattern);
});
