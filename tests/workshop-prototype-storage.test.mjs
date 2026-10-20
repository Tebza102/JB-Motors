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

const importStorage = () => import(`${pathToFileURL(resolve("app/features/workshop-prototype/storage.ts")).href}?test=${Date.now()}-${Math.random()}`);

function sampleData() {
  return {
    customers: [{ id: "customer-1", createdAt: "2026-09-26T10:00:00.000Z", name: "Test Customer", mobile: "082 000 0000", source: "local", vehicles: [{ id: "vehicle-1", label: "Test Vehicle", registration: "GP TEST", odometer: 120000, status: "active" }] }],
    jobCards: [{ id: "job-1", reference: "DRAFT-000001", createdAt: "2026-09-26T10:01:00.000Z", customerId: "customer-1", vehicleId: "vehicle-1", complaint: "A sufficiently detailed complaint.", odometer: 120000, assignee: "Petrus Nkosi", priority: "Routine", initialStatus: "Scheduled", status: "Draft", sourceReference: "JB-EST-0226" }],
    findings: [{ id: "finding-1", jobId: "JB-JOB-0248", createdAt: "2026-09-26T10:02:00.000Z", severity: "Attention", title: "Test finding", details: "A sufficiently detailed diagnostic finding." }],
    followUps: [], followUpActivities: [],
    jobProgress: [{ jobId: "job-1", status: "Scheduled", statusChangedAt: "2026-09-26T10:03:00.000Z", statusChangedBy: "Jabulani (demo role)", qcChecks: ["Fluid levels checked"], roadTest: "Pending" }],
    jobNotes: [{ id: "note-1", jobId: "job-1", createdAt: "2026-09-26T10:04:00.000Z", author: "Petrus Nkosi (demo)", text: "Waiting for the thermostat housing." }],
    jobActivity: [{ id: "activity-1", jobId: "job-1", at: "2026-09-26T10:03:00.000Z", actor: "Jabulani (demo role)", summary: "Moved from Draft to Scheduled" }],
    odometerReadings: [{ id: "reading-1", customerId: "customer-1", vehicleId: "vehicle-1", kilometres: 120000, recordedAt: "2026-09-26T10:05:00.000Z", source: "Customer portal" }],
    serviceRequests: [{ id: "request-1", reference: "JB-SR-0002", channel: "Customer portal", customerId: "customer-1", vehicleId: "vehicle-1", customerName: "Test Customer", customerMobile: "082 000 0000", vehicleLabel: "Test Vehicle", registration: "GP TEST", serviceType: "Routine Service", preferredDate: "2026-10-01", submittedAt: "2026-09-26T10:06:00.000Z", updatedAt: "2026-09-26T10:06:00.000Z", status: "Submitted" }],
  };
}

test("persists every workshop collection in a versioned envelope", async () => {
  try {
    const storage = await importStorage();
    globalThis.window = { localStorage: new MemoryStorage() };
    const data = sampleData();
    assert.deepEqual(storage.saveWorkshopPrototypeData(data), { ok: true });
    assert.equal(JSON.parse(window.localStorage.getItem(storage.workshopPrototypeStorageKey)).version, 3);
    assert.deepEqual(storage.loadWorkshopPrototypeData(), { data, warning: null, migrated: false, blocked: false });
  } finally {
    delete globalThis.window;
  }
});

test("migrates version 1 and version 2 records without losing them", async () => {
  try {
    const storage = await importStorage();
    globalThis.window = { localStorage: new MemoryStorage() };
    const legacy = { customers: [{ id: "legacy-customer", createdAt: "2026-01-01T00:00:00.000Z", name: "Legacy Customer", mobile: "082 111 1111", vehicle: "Legacy Car", registration: "GP OLD" }], jobCards: [{ id: "legacy-job", reference: "DRAFT-OLD", customerName: "Legacy Customer", vehicle: "Legacy Car", registration: "GP OLD", complaint: "Legacy complaint", odometer: 100, assignee: "Unassigned", priority: "Routine", initialStatus: "Scheduled" }], findings: [] };
    window.localStorage.setItem(storage.workshopPrototypeStorageKey, JSON.stringify({ version: 1, data: legacy }));
    const fromV1 = storage.loadWorkshopPrototypeData();
    assert.equal(fromV1.migrated, true);
    assert.equal(fromV1.data.customers[0].vehicles[0].registration, "GP OLD");
    assert.equal(fromV1.data.jobCards[0].customerId, "legacy-customer");
    assert.deepEqual(fromV1.data.serviceRequests, []);

    const { jobProgress, jobNotes, jobActivity, odometerReadings, serviceRequests, ...v2 } = sampleData();
    void jobProgress; void jobNotes; void jobActivity; void odometerReadings; void serviceRequests;
    delete v2.jobCards[0].sourceReference;
    window.localStorage.setItem(storage.workshopPrototypeStorageKey, JSON.stringify({ version: 2, data: v2 }));
    const fromV2 = storage.loadWorkshopPrototypeData();
    assert.equal(fromV2.migrated, true);
    assert.equal(fromV2.blocked, false);
    assert.equal(fromV2.data.customers[0].name, "Test Customer");
    assert.deepEqual(fromV2.data.jobNotes, []);
    assert.deepEqual(storage.saveWorkshopPrototypeData(fromV2.data), { ok: true });
    assert.equal(JSON.parse(window.localStorage.getItem(storage.workshopPrototypeStorageKey)).version, 3);
  } finally {
    delete globalThis.window;
  }
});

test("never overwrites unreadable or malformed saved records", async () => {
  try {
    const storage = await importStorage();
    globalThis.window = { localStorage: new MemoryStorage() };
    const key = storage.workshopPrototypeStorageKey;

    window.localStorage.setItem(key, "not-json");
    const corrupt = storage.loadWorkshopPrototypeData();
    assert.deepEqual(corrupt.data, storage.createEmptyWorkshopData());
    assert.equal(corrupt.blocked, true);
    assert.match(corrupt.warning, /could not be read/i);
    assert.equal(storage.saveWorkshopPrototypeData(sampleData()).ok, false);
    assert.equal(window.localStorage.getItem(key), "not-json");

    const malformed = sampleData();
    delete malformed.customers[0].name;
    const malformedRaw = JSON.stringify({ version: 3, data: malformed });
    window.localStorage.setItem(key, malformedRaw);
    assert.equal(storage.loadWorkshopPrototypeData().blocked, true);
    assert.equal(storage.saveWorkshopPrototypeData(sampleData()).ok, false);
    assert.equal(window.localStorage.getItem(key), malformedRaw);

    const invalidNew = sampleData();
    invalidNew.odometerReadings[0].kilometres = -5;
    window.localStorage.removeItem(key);
    assert.equal(storage.saveWorkshopPrototypeData(invalidNew).ok, false);
    assert.equal(window.localStorage.getItem(key), null);
  } finally {
    delete globalThis.window;
  }
});

test("backs up unreadable data before resetting, then accepts new saves", async () => {
  try {
    const storage = await importStorage();
    globalThis.window = { localStorage: new MemoryStorage() };
    const key = storage.workshopPrototypeStorageKey;
    window.localStorage.setItem(key, "{broken");
    const result = storage.backupAndResetWorkshopPrototypeData(new Date("2026-10-20T08:00:00.000Z"));
    assert.equal(result.ok, true);
    assert.equal(result.backupKey, `${key}.backup.2026-10-20T08:00:00.000Z`);
    assert.equal(window.localStorage.getItem(result.backupKey), "{broken");
    assert.equal(window.localStorage.getItem(key), null);
    assert.deepEqual(storage.saveWorkshopPrototypeData(sampleData()), { ok: true });

    const exported = JSON.parse(storage.createLocalBackupJson([key, result.backupKey], new Date("2026-10-20T09:00:00.000Z")));
    assert.equal(exported.exportedAt, "2026-10-20T09:00:00.000Z");
    assert.equal(exported.entries[key].version, 3);
    assert.deepEqual(exported.entries[result.backupKey], { unreadableText: "{broken" });

    window.localStorage.setItem = () => { throw new Error("Quota exceeded"); };
    assert.equal(storage.saveWorkshopPrototypeData(sampleData()).ok, false);
    assert.equal(storage.backupAndResetWorkshopPrototypeData().ok, false);
    assert.notEqual(window.localStorage.getItem(key), null);
  } finally {
    delete globalThis.window;
  }
});
