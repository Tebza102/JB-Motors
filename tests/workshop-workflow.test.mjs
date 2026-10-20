import assert from "node:assert/strict";
import { resolve } from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

const load = (path) => import(pathToFileURL(resolve(path)).href);
const [jobs, service, seed, storage, format, contact] = await Promise.all([
  load("app/features/workshop-prototype/jobs.ts"),
  load("app/features/workshop-prototype/service.ts"),
  load("app/features/workshop-prototype/seed.ts"),
  load("app/features/workshop-prototype/storage.ts"),
  load("app/features/workshop-prototype/format.ts"),
  load("app/features/workshop-prototype/contact.ts"),
]);
const NOW = "2026-10-20T08:00:00.000Z";
const ACTOR = "Jabulani (demo role)";
const jobList = (data) => jobs.buildJobList(seed.SEED_JOBS, data, seed.SEED_CUSTOMERS);
const job = (data, id) => jobList(data).find((item) => item.id === id);

test("one shared job list resolves customers and applies saved progress", () => {
  const data = storage.createEmptyWorkshopData();
  const list = jobList(data);
  assert.equal(list.length, seed.SEED_JOBS.length);
  const ranger = list.find((item) => item.id === "JB-JOB-0248");
  assert.equal(ranger.customerName, "Sipho Dlamini");
  assert.equal(ranger.registration, "NW 81 LM GP");
  assert.equal(ranger.status, "In Progress");
  for (const item of list) assert.notEqual(item.customerName, "Unknown customer", `${item.reference} must reference a seeded customer`);

  data.jobProgress.push({ jobId: "JB-JOB-0248", status: "Waiting Parts", statusChangedAt: NOW, statusChangedBy: ACTOR });
  const moved = job(data, "JB-JOB-0248");
  assert.equal(moved.status, "Waiting Parts");
  assert.deepEqual(moved.qcChecks, seed.SEED_JOBS[0].qcChecks, "unchanged fields fall back to the seeded values");
});

test("status changes persist with actor and enforce the QC gate for Ready", () => {
  let data = storage.createEmptyWorkshopData();
  const blocked = jobs.changeJobStatus(data, job(data, "JB-JOB-0248"), "Ready", seed.QC_CHECKLIST, ACTOR, NOW);
  assert.equal(blocked.ok, false);
  assert.match(blocked.message, /QC/);
  assert.equal(jobs.changeJobStatus(data, job(data, "JB-JOB-0248"), "Draft", seed.QC_CHECKLIST, ACTOR, NOW).ok, false);

  for (const item of seed.QC_CHECKLIST) {
    if (job(data, "JB-JOB-0248").qcChecks.includes(item)) continue;
    const result = jobs.toggleJobChecklistItem(data, job(data, "JB-JOB-0248"), "qc", item, ACTOR, NOW);
    assert.equal(result.ok, true);
    data = result.data;
  }
  assert.equal(jobs.changeJobStatus(data, job(data, "JB-JOB-0248"), "Ready", seed.QC_CHECKLIST, ACTOR, NOW).ok, false, "a passed road test is also required");
  data = jobs.setRoadTestResult(data, job(data, "JB-JOB-0248"), "Passed", ACTOR, NOW).data;
  const ready = jobs.changeJobStatus(data, job(data, "JB-JOB-0248"), "Ready", seed.QC_CHECKLIST, ACTOR, NOW);
  assert.equal(ready.ok, true);
  data = ready.data;
  const saved = job(data, "JB-JOB-0248");
  assert.equal(saved.status, "Ready");
  assert.equal(saved.statusChangedBy, ACTOR);
  assert.equal(jobs.getJobActivity(data, "JB-JOB-0248")[0].summary, "Moved from In Progress to Ready");
  assert.equal(jobs.toggleJobChecklistItem(data, saved, "qc", seed.QC_CHECKLIST[0], ACTOR, NOW).ok, false, "QC is locked while Ready");
  assert.equal(storage.isWorkshopPrototypeData(data), true);
});

test("notes are validated and saved against the job", () => {
  const data = storage.createEmptyWorkshopData();
  assert.equal(jobs.addJobNote(data, job(data, "JB-JOB-0246"), "  ", ACTOR, NOW).ok, false);
  const result = jobs.addJobNote(data, job(data, "JB-JOB-0246"), "  Turbo actuator ordered from supplier.  ", "Mandla Dube (demo)", NOW);
  assert.equal(result.ok, true);
  const notes = jobs.getJobNotes(result.data, "JB-JOB-0246");
  assert.equal(notes.length, 1);
  assert.equal(notes[0].text, "Turbo actuator ordered from supplier.");
  assert.equal(notes[0].author, "Mandla Dube (demo)");
});

test("estimate conversion creates one linked draft and is idempotent", () => {
  const data = storage.createEmptyWorkshopData();
  const first = jobs.convertEstimateToJob(data, jobList(data), seed.ESTIMATE_CONVERSION_SOURCE, ACTOR, NOW);
  assert.equal(first.created, true);
  assert.equal(first.data.jobCards.length, 1);
  const draft = first.data.jobCards[0];
  assert.equal(draft.sourceReference, "JB-EST-0226");
  assert.equal(draft.customerId, "customer-anika");
  assert.equal(draft.vehicleId, "vehicle-ecosport");
  assert.equal(job(first.data, draft.id).status, "Draft");
  assert.equal(job(first.data, draft.id).customerName, "Anika van Wyk");

  const second = jobs.convertEstimateToJob(first.data, jobList(first.data), seed.ESTIMATE_CONVERSION_SOURCE, ACTOR, NOW);
  assert.equal(second.created, false);
  assert.equal(second.jobId, draft.id);
  assert.equal(second.data.jobCards.length, 1);
});

test("kilometre readings reject regressions, update the vehicle and raise a service follow-up", () => {
  const data = storage.createEmptyWorkshopData();
  const thabo = seed.SEED_CUSTOMERS.find((customer) => customer.id === "customer-thabo");
  const plan = seed.SERVICE_PLANS.find((item) => item.vehicleId === "vehicle-corolla");
  const args = { data, customer: thabo, vehicleId: "vehicle-corolla", source: "Customer portal", now: NOW, plan, seedFollowUps: seed.SEED_FOLLOW_UPS };

  const regression = service.recordOdometerReading({ ...args, kilometres: 140000 });
  assert.equal(regression.ok, false);
  assert.match(regression.message, /cannot be lower/);

  const result = service.recordOdometerReading({ ...args, kilometres: 145600 });
  assert.equal(result.ok, true);
  assert.equal(result.status.state, "overdue");
  assert.equal(result.status.remainingKm, -600);
  assert.equal(result.data.customers[0].vehicles[0].odometer, 145600);
  assert.equal(result.data.odometerReadings[0].kilometres, 145600);
  const followUp = result.data.followUps[0];
  assert.equal(followUp.id, "followup-thabo-service", "the existing seeded follow-up is refreshed, not duplicated");
  assert.equal(followUp.priority, "Urgent");
  assert.equal(followUp.due, "Overdue by 600 km");
  assert.equal(storage.isWorkshopPrototypeData(result.data), true);

  const ok = service.getServiceStatus(plan, 140000);
  assert.deepEqual([ok.state, ok.nextServiceKm, ok.remainingKm, ok.progressPercent], ["ok", 145000, 5000, 50]);
  assert.equal(service.getServiceStatus(plan, 143240).state, "due-soon");
});

test("service requests validate dates and allocate sequential references", () => {
  const thabo = seed.SEED_CUSTOMERS.find((customer) => customer.id === "customer-thabo");
  const input = { customer: thabo, vehicleId: "vehicle-corolla", serviceType: "Routine Service", preferredDate: "2026-10-20", notes: "", channel: "Customer portal" };
  assert.equal(service.createServiceRequest(input, seed.SEED_SERVICE_REQUESTS, "2026-10-20", NOW).ok, false, "the preferred date must be after today");
  assert.equal(service.createServiceRequest({ ...input, preferredDate: "2026-10-22", serviceType: "Spa day" }, seed.SEED_SERVICE_REQUESTS, "2026-10-20", NOW).ok, false);
  const created = service.createServiceRequest({ ...input, preferredDate: "2026-10-22", notes: "  Morning drop-off  " }, seed.SEED_SERVICE_REQUESTS, "2026-10-20", NOW);
  assert.equal(created.ok, true);
  assert.equal(created.request.reference, "JB-SR-0002");
  assert.equal(created.request.notes, "Morning drop-off");
  assert.equal(created.request.registration, "GP 123-456");
  assert.equal(service.nextSequentialReference(["JB-SR-0002", "JB-SR-0010", "OTHER-99"], "JB-SR-"), "JB-SR-0011");
});

test("formatting and contact validation stay consistent", () => {
  assert.equal(format.formatRand(610650), "R6,106.50");
  assert.equal(format.formatRand(-250000), "−R2,500.00");
  assert.equal(format.formatKilometres(143240), "143,240 km");
  assert.equal(contact.isValidSaMobile("082 555 0148"), true);
  assert.equal(contact.isValidSaMobile("+27 82 555 0148"), true);
  assert.equal(contact.isValidSaMobile("011 555 0148"), false);
  assert.equal(contact.isValidSaMobile("082 555"), false);
  const lowStock = seed.INVENTORY_ITEMS.filter((item) => seed.getStockStatus(item) !== "In stock").map((item) => item.sku);
  assert.deepEqual(lowStock, ["BRK-1042", "BAT-646", "CLT-G12"]);
});
