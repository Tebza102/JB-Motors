import assert from "node:assert/strict";
import { resolve } from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

class MemoryStorage {
  #items = new Map();
  getItem(key) { return this.#items.has(key) ? this.#items.get(key) : null; }
  setItem(key, value) { this.#items.set(key, String(value)); }
  removeItem(key) { this.#items.delete(key); }
}

test("saves, reloads, updates and clears a multi-issue problem report", async () => {
  try {
    const storageModule = await import(`${pathToFileURL(resolve("app/features/problem-reports/storage.ts")).href}?test=${Date.now()}`);
    globalThis.window = { localStorage: new MemoryStorage() };
    const report = {
      id: "report-test",
      reference: "JB-PR-000001",
      customer: { id: "customer-test", name: "Test Customer", mobile: "080 000 0000" },
      vehicle: { id: "vehicle-test", label: "Test Vehicle", registration: "GP TEST" },
      submittedAt: "2026-09-25T10:00:00.000Z",
      updatedAt: "2026-09-25T10:00:00.000Z",
      status: "Submitted",
      issues: [
        { id: "issue-1", categories: ["Starting / Battery", "Warning Light"], description: "Battery warning light remains on after starting.", occurrence: "When starting", severity: "High" },
        { id: "issue-2", categories: ["Brakes"], description: "Grinding sound occurs when applying the brakes.", occurrence: "When braking", severity: "Vehicle cannot drive" },
      ],
    };

    assert.deepEqual(storageModule.saveProblemReports([report]), { ok: true });
    assert.deepEqual(storageModule.loadProblemReports(), { reports: [report], warning: null });
    const reviewed = { ...report, status: "Under review", updatedAt: "2026-09-25T10:05:00.000Z" };
    assert.deepEqual(storageModule.saveProblemReports([reviewed]), { ok: true });
    assert.equal(storageModule.loadProblemReports().reports[0].status, "Under review");
    assert.deepEqual(storageModule.clearProblemReports(), { ok: true });
    assert.deepEqual(storageModule.loadProblemReports(), { reports: [], warning: null });

    window.localStorage.setItem(storageModule.PROBLEM_REPORT_STORAGE_KEY, "not-json");
    const malformed = storageModule.loadProblemReports();
    assert.deepEqual(malformed.reports, []);
    assert.match(malformed.warning, /could not be read/i);
    assert.equal(storageModule.saveProblemReports([report]).ok, false);
    assert.equal(window.localStorage.getItem(storageModule.PROBLEM_REPORT_STORAGE_KEY), "not-json");
    window.localStorage.setItem("unrelated-feature", "keep-me");
    assert.equal(storageModule.clearProblemReports().ok, true);
    assert.equal(window.localStorage.getItem("unrelated-feature"), "keep-me");
    window.localStorage.setItem = () => { throw new Error("Quota exceeded"); };
    assert.equal(storageModule.saveProblemReports([report]).ok, false);
    assert.match(storageModule.loadProblemReports().warning, /unavailable/i);
    assert.equal(storageModule.clearProblemReports().ok, false);
  } finally {
    delete globalThis.window;
  }
});
