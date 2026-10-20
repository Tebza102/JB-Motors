import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

const content = await import(pathToFileURL(resolve("app/features/guide/content.ts")).href);
const { searchHowTo, topicsForPage } = await import(pathToFileURL(resolve("app/features/guide/search.ts")).href);

test("every screen has a page guide and every topic is well formed", () => {
  for (const page of content.STAFF_PAGES) assert.ok(content.STAFF_PAGE_GUIDES[page]?.summary, `staff page ${page} needs a guide`);
  for (const page of content.CUSTOMER_PAGES) assert.ok(content.CUSTOMER_PAGE_GUIDES[page]?.summary, `customer page ${page} needs a guide`);
  const ids = new Set();
  for (const topic of content.HOW_TO_TOPICS) {
    assert.ok(!ids.has(topic.id), `duplicate topic ${topic.id}`);
    ids.add(topic.id);
    assert.ok(topic.steps.length > 0 && topic.keywords.length > 0, `${topic.id} needs steps and keywords`);
    if (topic.page) assert.ok([...content.STAFF_PAGES, ...content.CUSTOMER_PAGES].includes(topic.page), `${topic.id} points to an unknown page`);
  }
});

test("“Ask me how” finds the right instructions in plain language", () => {
  const first = (query, audience = "staff") => searchHowTo(query, audience)[0];
  assert.equal(first("send an invoice").id, "send-invoice");
  assert.equal(first("send an invoice").status, "coming-soon", "unbuilt features must not get fake steps");
  assert.equal(first("How do I create a job card?").id, "create-job");
  assert.equal(first("mark the car ready for collection").id, "mark-ready");
  assert.equal(first("add new customer").id, "add-customer");
  assert.equal(first("whatsapp a customer").id, "follow-up");
  assert.equal(first("record a payment").id, "record-payment");
  assert.equal(first("update my km", "customer").id, "c-kilometres");
  assert.equal(first("book a service", "customer").id, "c-service");
  assert.equal(first("warning light", "customer").id, "c-problem");
  assert.deepEqual(searchHowTo("zzzz qqqq", "staff"), []);
  assert.ok(searchHowTo("invoice", "customer").every((topic) => topic.audience === "customer"));
  assert.ok(topicsForPage("job-card", "staff").length >= 3);
});

test("instructions only quote buttons and labels that exist in the app", async () => {
  const files = [
    "app/page.tsx", "app/features/workshop-prototype/JobWorkspace.tsx", "app/features/workshop-prototype/CreationDialog.tsx",
    "app/features/workshop-prototype/types.ts", "app/features/customer-portal/CustomerPortal.tsx", "app/features/problem-reports/ProblemReportForm.tsx",
  ];
  const source = (await Promise.all(files.map((file) => readFile(resolve(file), "utf8")))).join("\n").toLowerCase();
  for (const topic of content.HOW_TO_TOPICS.filter((item) => item.status === "available")) {
    for (const step of topic.steps) {
      for (const [, label] of step.matchAll(/“([^”]+)”/g)) assert.ok(source.includes(label.toLowerCase()), `“${label}” in ${topic.id} is not in the app`);
    }
  }
});
