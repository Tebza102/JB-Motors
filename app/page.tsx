"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { BrandLockup, WORKSHOP_PROFILE } from "./components/brand";
import { MetricCard, PageHeader, PlannedButton, StatusPill, padCount } from "./components/ui";
import { CustomerPortal } from "./features/customer-portal/CustomerPortal";
import type { ServiceRequestSubmission } from "./features/customer-portal/CustomerPortal";
import { clearProblemReports, loadProblemReports, PROBLEM_REPORT_STORAGE_KEY, saveProblemReports } from "./features/problem-reports/storage";
import { createFeatureId, getReportUrgency, REPORT_STATUSES } from "./features/problem-reports/types";
import type { ProblemReport, ProblemReportStatus, ReportMutationResult } from "./features/problem-reports/types";
import { ESTIMATE_DOCUMENT, INVOICE_DOCUMENT, MONTHLY_REPORT_DOCUMENT, SERVICE_HISTORY_DOCUMENT } from "./features/documents/data";
import type { PdfDocumentKind } from "./features/documents/data";
import { downloadPdf } from "./features/documents/pdf";
import { CreationDialog } from "./features/workshop-prototype/CreationDialog";
import type { ServiceRequestDraft } from "./features/workshop-prototype/CreationDialog";
import { CustomerRecordDialog } from "./features/workshop-prototype/CustomerRecordDialog";
import { buildTelUrl, buildWhatsAppUrl } from "./features/workshop-prototype/contact";
import { formatCalendarDay, formatDate, formatDateTime, formatKilometres, formatRand, toCalendarDay } from "./features/workshop-prototype/format";
import { addJobNote, buildJobList, changeJobStatus, convertEstimateToJob, findJobBySource, getJobActivity, getJobNotes, setRoadTestResult, toggleJobChecklistItem } from "./features/workshop-prototype/jobs";
import type { JobMutation, WorkshopJob } from "./features/workshop-prototype/jobs";
import { JobWorkspace, TechnicianWorkspace, statusTone } from "./features/workshop-prototype/JobWorkspace";
import type { JobActions, JobMode } from "./features/workshop-prototype/JobWorkspace";
import { DEMO_PORTAL_CUSTOMER_ID, ESTIMATE_CONVERSION_SOURCE, INVENTORY_ITEMS, QC_CHECKLIST, SAMPLE_INVOICES, SAMPLE_PERIOD_LABEL, SEED_CUSTOMERS, SEED_FOLLOW_UPS, SEED_JOBS, SEED_ODOMETER_HISTORY, SEED_SERVICE_REQUESTS, SERVICE_PLANS, getStockStatus, resolveLegacyId } from "./features/workshop-prototype/seed";
import { createServiceRequest, getServiceStatus, mergeSeededRecords, recordOdometerReading } from "./features/workshop-prototype/service";
import type { ServiceStatus } from "./features/workshop-prototype/service";
import { backupAndResetWorkshopPrototypeData, createEmptyWorkshopData, createLocalBackupJson, loadWorkshopPrototypeData, saveWorkshopPrototypeData, workshopPrototypeStorageKey } from "./features/workshop-prototype/storage";
import { SERVICE_REQUEST_STATUSES } from "./features/workshop-prototype/types";
import type { CreationDialogState, CustomerDialogState, CustomerRecord, DiagnosticFinding, FollowUpActivity, FollowUpMethod, FollowUpRecord, JobCardDraft, OdometerReading, PrototypeMutationResult, ServiceRequestRecord, ServiceRequestStatus, VehicleRecord, WorkshopPrototypeData } from "./features/workshop-prototype/types";

type WorkshopView =
  | "dashboard"
  | "customers"
  | "vehicle"
  | "estimate"
  | "job-card"
  | "inventory"
  | "suppliers"
  | "invoice"
  | "payments"
  | "warranties"
  | "requests"
  | "follow-ups"
  | "reports"
  | "settings"
  | "technician";

type StaffRole = "Owner / Administrator" | "Service Advisor" | "Technician" | "Store / Parts" | "Finance / Accounts";
type InterfaceState = "ready" | "loading" | "empty" | "error";
type ReadingPoint = { kilometres: number; recordedAt: string; source: string; sample: boolean };

const navItems: Array<{ label: string; code: string; view: WorkshopView; roles: StaffRole[] }> = [
  { label: "Dashboard", code: "DB", view: "dashboard", roles: ["Owner / Administrator", "Service Advisor", "Finance / Accounts"] },
  { label: "Customers", code: "CU", view: "customers", roles: ["Owner / Administrator", "Service Advisor", "Finance / Accounts"] },
  { label: "Vehicles", code: "VH", view: "vehicle", roles: ["Owner / Administrator", "Service Advisor", "Technician"] },
  { label: "Estimates", code: "ES", view: "estimate", roles: ["Owner / Administrator", "Service Advisor"] },
  { label: "Job Cards", code: "JC", view: "job-card", roles: ["Owner / Administrator", "Service Advisor", "Technician", "Store / Parts"] },
  { label: "Inventory", code: "IN", view: "inventory", roles: ["Owner / Administrator", "Store / Parts"] },
  { label: "Suppliers", code: "SU", view: "suppliers", roles: ["Owner / Administrator", "Store / Parts"] },
  { label: "Invoices", code: "IV", view: "invoice", roles: ["Owner / Administrator", "Service Advisor", "Finance / Accounts"] },
  { label: "Payments", code: "PY", view: "payments", roles: ["Owner / Administrator", "Finance / Accounts"] },
  { label: "Warranties", code: "WA", view: "warranties", roles: ["Owner / Administrator", "Service Advisor", "Technician"] },
  { label: "Customer Requests", code: "CR", view: "requests", roles: ["Owner / Administrator", "Service Advisor"] },
  { label: "Follow-ups", code: "FU", view: "follow-ups", roles: ["Owner / Administrator", "Service Advisor"] },
  { label: "Reports", code: "RP", view: "reports", roles: ["Owner / Administrator", "Finance / Accounts"] },
];

const invoiceBalance = (invoice: (typeof SAMPLE_INVOICES)[number]) => invoice.totalCents - invoice.paidCents;
const outstandingCents = SAMPLE_INVOICES.reduce((sum, invoice) => sum + invoiceBalance(invoice), 0);
const subscribeNever = () => () => {};

/** Renders a client-only value without a hydration mismatch: the server and first paint use the fallback. */
function useClientValue<T>(read: () => T, fallback: T) {
  return useSyncExternalStore(subscribeNever, read, () => fallback);
}

function shortWhen(iso: string) {
  const date = new Date(iso);
  return toCalendarDay(date) === toCalendarDay(new Date())
    ? date.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString("en-ZA", { day: "2-digit", month: "short" });
}

function InterfaceStatePanel({ state, onReset }: { state: Exclude<InterfaceState, "ready">; onReset: () => void }) {
  const content = {
    loading: ["Preparing workshop view", "Demo records are being organised for this screen."],
    empty: ["No records in this view", "Adjust the filters or return to the populated demo state."],
    error: ["This demo view could not load", "No workshop data was changed. Retry the local interface."],
  }[state];
  return <section className={`panel interface-state state-${state}`} aria-live="polite"><span>{state === "loading" ? "…" : state === "empty" ? "0" : "!"}</span><h2>{content[0]}</h2><p>{content[1]}</p><button className="primary-button" onClick={onReset}>{state === "error" ? "Retry" : "Return to demo data"}</button></section>;
}

function PdfDownloadButton({
  kind,
  label,
  className = "secondary-button",
  notify,
}: {
  kind: PdfDocumentKind;
  label: string;
  className?: string;
  notify?: (message: string) => void;
}) {
  const [state, setState] = useState<"idle" | "working" | "error">("idle");
  const [error, setError] = useState("");
  const handleDownload = async () => {
    if (state === "working") return;
    setState("working");
    setError("");
    try {
      const filename = await downloadPdf(kind);
      setState("idle");
      notify?.(`${filename} download started`);
    } catch (reason) {
      setState("error");
      setError(reason instanceof Error ? reason.message : "The PDF could not be generated. Try again.");
    }
  };
  return <span className="download-action">
    <button type="button" className={className} onClick={handleDownload} disabled={state === "working"}>{state === "working" ? "Generating PDF…" : label}</button>
    {error && <small role="alert">{error}</small>}
  </span>;
}

type AttentionItem = { key: string; type: string; title: string; meta: string; detail: string; tone: string; action: string; href?: string; run: () => void };

function Dashboard({ jobs, customers, followUps, serviceRequests, problemReports, readings, onOpen, onOpenJob, onOpenCustomer }: { jobs: WorkshopJob[]; customers: CustomerRecord[]; followUps: FollowUpRecord[]; serviceRequests: ServiceRequestRecord[]; problemReports: ProblemReport[]; readings: OdometerReading[]; onOpen: (view: WorkshopView) => void; onOpenJob: (jobId: string) => void; onOpenCustomer: (customerId: string, vehicleId?: string) => void }) {
  const count = (status: WorkshopJob["status"]) => jobs.filter((job) => job.status === status);
  const waiting = count("Waiting Parts");
  const activeFollowUps = followUps.filter((item) => item.status === "active");
  const openRequests = serviceRequests.filter((request) => request.status === "Submitted" || request.status === "Contacted");
  const openReports = problemReports.filter((report) => report.status !== "Resolved");
  const lowStock = INVENTORY_ITEMS.filter((item) => getStockStatus(item) !== "In stock");
  const kpis = [
    [padCount(count("In Progress").length), "Jobs in progress", `${count("Draft").length} draft job cards`, "blue"],
    [padCount(waiting.length), "Waiting for parts", waiting[0] ? `${waiting[0].reference} · ${waiting[0].work}` : "No jobs blocked", "amber"],
    [padCount(count("Ready").length), "Vehicles ready", "QC complete, ready to collect", "green"],
    [padCount(openRequests.length), "Service requests", `${openRequests.filter((request) => request.status === "Submitted").length} awaiting first contact`, "blue"],
    [padCount(activeFollowUps.length), "Customers to contact", `${activeFollowUps.filter((item) => item.priority !== "Medium").length} high priority`, "orange"],
    [padCount(openReports.length), "Open problem reports", "Saved in this browser", "red"],
    [formatRand(outstandingCents), "Outstanding invoices", `${SAMPLE_INVOICES.filter((invoice) => invoiceBalance(invoice) > 0).length} sample invoices`, "amber"],
    [padCount(lowStock.length), "Low stock items", `${lowStock.filter((item) => getStockStatus(item) === "Out of stock").length} out of stock · sample stock`, "red"],
  ];
  const attention: AttentionItem[] = [];
  for (const plan of SERVICE_PLANS) {
    const customer = customers.find((item) => item.vehicles.some((vehicle) => vehicle.id === plan.vehicleId && vehicle.status === "active"));
    const vehicle = customer?.vehicles.find((item) => item.id === plan.vehicleId);
    const status = vehicle ? getServiceStatus(plan, vehicle.odometer) : null;
    if (!customer || !vehicle || !status || status.state === "ok") continue;
    attention.push({ key: `service-${vehicle.id}`, type: status.state === "overdue" ? "SERVICE OVERDUE" : "SERVICE DUE", title: vehicle.label, meta: `${vehicle.registration} · ${customer.name}`, detail: `${formatKilometres(vehicle.odometer ?? 0)} / Service at ${formatKilometres(status.nextServiceKm)}`, tone: status.state === "overdue" ? "red" : "orange", action: "Call customer", href: buildTelUrl(customer.mobile), run: () => onOpenCustomer(customer.id, vehicle.id) });
  }
  const latestReport = openReports[0];
  attention.push(latestReport
    ? { key: `report-${latestReport.id}`, type: "PROBLEM REPORT", title: latestReport.vehicle.label, meta: `${latestReport.issues[0].categories.join(" / ")} · ${latestReport.customer.name}`, detail: `Saved ${formatDateTime(latestReport.submittedAt)} · ${latestReport.status}`, tone: "red", action: "Review report", run: () => onOpen("requests") }
    : { key: "report-sample", type: "PROBLEM REPORT · SAMPLE", title: "2021 VW Polo 1.0 TSI", meta: "Warning light and loss of power", detail: "Sample report from Kabelo Ndlovu", tone: "red", action: "Review requests", run: () => onOpen("requests") });
  if (waiting[0]) attention.push({ key: `job-${waiting[0].id}`, type: "WAITING FOR PARTS", title: waiting[0].vehicleLabel, meta: `${waiting[0].reference} · ${waiting[0].customerName}`, detail: waiting[0].work, tone: "amber", action: "Open job", run: () => onOpenJob(waiting[0].id) });
  attention.push({ key: "invoice-sample", type: "BALANCE DUE · SAMPLE", title: INVOICE_DOCUMENT.customer.name, meta: `${INVOICE_DOCUMENT.reference} · ${INVOICE_DOCUMENT.vehicle.label}`, detail: `${formatRand(invoiceBalance(SAMPLE_INVOICES[0]))} outstanding · ${INVOICE_DOCUMENT.paymentTerms.toLowerCase()}`, tone: "red", action: "View invoice", run: () => onOpen("invoice") });
  const openJobs = jobs.filter((job) => job.status !== "Ready" && job.status !== "Draft");
  const portalActivity = [
    ...readings.filter((reading) => reading.source === "Customer portal").map((reading) => ({ at: reading.recordedAt, tone: "orange", title: `${customers.find((customer) => customer.id === reading.customerId)?.name ?? "Customer"} updated kilometres`, detail: `${formatKilometres(reading.kilometres)} recorded` })),
    ...problemReports.map((report) => ({ at: report.submittedAt, tone: "red", title: `${report.customer.name} reported a problem`, detail: `${report.vehicle.label} · ${report.issues.length} ${report.issues.length === 1 ? "issue" : "issues"}` })),
    ...serviceRequests.filter((request) => !request.id.startsWith("request-lerato")).map((request) => ({ at: request.submittedAt, tone: "blue", title: `${request.customerName} requested a service`, detail: `${request.vehicleLabel} · Preferred ${formatCalendarDay(request.preferredDate)}` })),
  ].sort((a, b) => Date.parse(b.at) - Date.parse(a.at)).slice(0, 3);
  const performance = MONTHLY_REPORT_DOCUMENT.groups[0].stats;
  return (
    <>
      <PageHeader eyebrow="WORKSHOP DASHBOARD" title="What needs your attention today?" description="Job, request and follow-up figures are calculated from the records in this browser. Money and stock figures are labelled samples." actions={<div className="open-status"><span /> Local prototype <strong>Demo data</strong></div>} />
      <section className="metrics-grid metrics-eight" aria-label="Workshop summary">
        {kpis.map(([value, label, note, tone]) => <MetricCard key={label} value={value} label={label} note={note} tone={tone} />)}
      </section>
      <div className="dashboard-grid">
        <section className="panel attention-panel">
          <div className="panel-heading"><div><span className="section-kicker">ACTION CENTRE</span><h2>Needs attention</h2></div><button className="text-button" onClick={() => onOpen("follow-ups")}>Follow-ups ({activeFollowUps.length}) →</button></div>
          <div className="attention-list">
            {attention.map((item) => (
              <article className="attention-item" key={item.key}>
                <span className={`attention-line ${item.tone}`} />
                <div className="attention-copy"><StatusPill tone={item.tone}>{item.type}</StatusPill><h3>{item.title}</h3><p>{item.meta}</p><small>{item.detail}</small></div>
                <div className="row-actions">{item.href ? <a className="compact-button call-link" href={item.href}>{item.action}</a> : <button className="compact-button" onClick={item.run}>{item.action}</button>}<button className="icon-button" aria-label={`Open ${item.title}`} onClick={item.run}>→</button></div>
              </article>
            ))}
          </div>
        </section>
        <aside className="panel today-panel">
          <div className="panel-heading"><div><span className="section-kicker">WORKSHOP LOAD</span><h2>Open jobs</h2></div><StatusPill tone="blue">{openJobs.length} jobs</StatusPill></div>
          <div className="today-jobs">
            {openJobs.slice(0, 6).map((job) => <button className="today-job" key={job.id} onClick={() => onOpenJob(job.id)}><time>{job.origin === "local" ? "Local" : job.due.replace("Today ", "")}</time><span><strong>{job.vehicleLabel}</strong><small>{job.registration} · {job.work}</small></span><StatusPill tone={statusTone(job.status)}>{job.status}</StatusPill></button>)}
          </div>
          <button className="wide-button" onClick={() => onOpen("job-card")}>Open job cards</button>
        </aside>
      </div>
      <div className="support-grid">
        <section className="panel"><div className="panel-heading"><div><span className="section-kicker">RECENT CUSTOMER ACTIVITY</span><h2>Portal updates</h2></div><button className="text-button" onClick={() => onOpen("requests")}>View requests →</button></div>
          <div className="activity-feed">
            {portalActivity.length > 0 ? portalActivity.map((item) => <div className="activity-item" key={`${item.at}-${item.title}`}><span className={`activity-dot ${item.tone}`} /><div><strong>{item.title}</strong><p>{item.detail}</p></div><time>{shortWhen(item.at)}</time></div>) : <div className="activity-item"><span className="activity-dot blue" /><div><strong>No portal activity in this browser yet</strong><p>Open the customer portal to update kilometres, request a service or report a problem.</p></div><time>—</time></div>}
          </div>
        </section>
        <section className="panel revenue-card"><div className="panel-heading"><div><span className="section-kicker">{SAMPLE_PERIOD_LABEL.toUpperCase()}</span><h2>Revenue trend</h2></div><strong className="revenue-total">{performance[0][0]}</strong></div>
          <div className="bar-chart" aria-label="Sample six week revenue trend">{[42,58,51,76,68,88].map((height, index) => <div key={index}><span style={{height: `${height}%`}} /><small>W{index + 1}</small></div>)}</div>
          <div className="revenue-footer"><span>Jobs completed <strong>{performance[1][0]}</strong></span><span>Avg. job value <strong>{performance[2][0]}</strong></span><span>Turnaround <strong>{performance[3][0]}</strong></span></div>
        </section>
      </div>
    </>
  );
}

const CUSTOMER_FILTERS = ["All customers", "Follow-up due", "Added locally", "No active vehicle"] as const;

function CustomerDirectory({ onOpen, records, followUps, activities, onAddCustomer }: { onOpen: (customerId:string,vehicleId?:string) => void; records:CustomerRecord[]; followUps:FollowUpRecord[]; activities:FollowUpActivity[]; onAddCustomer: () => void }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof CUSTOMER_FILTERS)[number]>("All customers");
  const followUpCustomers = useMemo(() => new Set(followUps.filter((item) => item.status === "active").map((item) => item.customerId)), [followUps]);
  const filtered = useMemo(() => records.filter((customer) => {
    const matchesQuery = `${customer.name} ${customer.mobile} ${customer.vehicles.map((vehicle)=>`${vehicle.label} ${vehicle.registration}`).join(" ")}`.toLowerCase().includes(query.trim().toLowerCase());
    const matchesFilter = filter === "All customers" || (filter === "Follow-up due" && followUpCustomers.has(customer.id)) || (filter === "Added locally" && customer.source === "local") || (filter === "No active vehicle" && !customer.vehicles.some((vehicle) => vehicle.status === "active"));
    return matchesQuery && matchesFilter;
  }), [records, query, filter, followUpCustomers]);
  const activeVehicles = records.flatMap((customer) => customer.vehicles).filter((vehicle) => vehicle.status === "active").length;
  return (
    <>
      <PageHeader eyebrow="CUSTOMER MANAGEMENT" title="Customers" description="Sample customers plus records added or edited in this browser." actions={<button className="primary-button" onClick={onAddCustomer}>+ Add customer</button>} />
      <section className="metrics-grid metrics-four"><MetricCard value={padCount(records.length)} label="Customers" note={`${records.filter((customer) => customer.source === "local").length} added in this browser`} tone="steel" /><MetricCard value={padCount(activeVehicles)} label="Active vehicles" note="Across all customer records" tone="green" /><MetricCard value={padCount(followUpCustomers.size)} label="Follow-up due" note="Customers in the active queue" tone="orange" /><MetricCard value={formatRand(outstandingCents)} label="Outstanding balance" note="Sample invoices" tone="amber" /></section>
      <section className="panel table-panel">
        <div className="filter-bar"><label className="search-field"><span>SEARCH</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, mobile number or vehicle…" /></label><div className="filter-actions">{CUSTOMER_FILTERS.map((item) => <button key={item} className={`filter-chip ${filter === item ? "active" : ""}`} aria-pressed={filter === item} onClick={() => setFilter(item)}>{item}</button>)}</div></div>
        <div className="responsive-table customer-table">
          <div className="table-head"><span>Customer</span><span>Mobile number</span><span>Vehicles</span><span>Last service</span><span>Next service</span><span>Outstanding</span><span>Last contact</span><span>Status</span></div>
          {filtered.length === 0 && <div className="followup-empty"><strong>No customers match</strong><p>Change the filter or search text.</p></div>}
          {filtered.map((customer) => {
            const active=customer.vehicles.filter((vehicle)=>vehicle.status==="active");
            const plan=SERVICE_PLANS.find((item)=>active.some((vehicle)=>vehicle.id===item.vehicleId));
            const balance=SAMPLE_INVOICES.filter((invoice)=>invoice.customerId===customer.id).reduce((sum,invoice)=>sum+invoiceBalance(invoice),0);
            const lastContact=activities.find((activity)=>followUps.some((item)=>item.id===activity.followUpId&&item.customerId===customer.id));
            return <button className="table-row" key={customer.id} onClick={() => onOpen(customer.id,active[0]?.id)}><span className="customer-cell"><b>{customer.name.split(" ").map((part) => part[0]).join("")}</b><strong>{customer.name}</strong></span><span data-label="Mobile">{customer.mobile}</span><span data-label="Vehicles">{active.length}</span><span data-label="Last service">{plan?`${formatCalendarDay(plan.lastServiceDate)} · sample`:"Not recorded"}</span><span data-label="Next service">{plan?formatKilometres(plan.lastServiceKm+plan.intervalKm):"Not set"}</span><span data-label="Outstanding">{balance>0?`${formatRand(balance)} · sample`:"—"}</span><span data-label="Last contact">{lastContact?formatDate(lastContact.completedAt):"Not recorded"}</span><span data-label="Status"><StatusPill tone={active.length?"green":"grey"}>{active.length?"Active":"No vehicle"}</StatusPill></span></button>;
          })}
        </div>
      </section>
    </>
  );
}

function VehicleProfile({ customer, vehicle, jobs, readings, notify, onSelectVehicle, onNewJob, onOpenJob, onEditCustomer, onAddVehicle, onEditVehicle, onArchiveVehicle }: { customer:CustomerRecord;vehicle?:VehicleRecord;jobs:WorkshopJob[];readings:ReadingPoint[];notify:(message:string)=>void;onSelectVehicle:(id:string)=>void;onNewJob:(customerId:string,vehicleId?:string)=>void;onOpenJob:(jobId:string)=>void;onEditCustomer:()=>void;onAddVehicle:()=>void;onEditVehicle:(id:string)=>void;onArchiveVehicle:(id:string)=>void }) {
  const [tab, setTab] = useState("Overview");
  const activeVehicles=customer.vehicles.filter((item)=>item.status==="active");
  if(!vehicle)return <><PageHeader eyebrow="CUSTOMER 360" title={customer.name} description={customer.mobile} actions={<><button className="secondary-button" onClick={onEditCustomer}>Edit customer</button><button className="primary-button" onClick={onAddVehicle}>+ Add vehicle</button></>}/><section className="panel interface-state"><span>0</span><h2>No active vehicles</h2><p>Add a vehicle before creating a job card for this customer.</p><button className="primary-button" onClick={onAddVehicle}>Add vehicle</button></section></>;
  const plan = SERVICE_PLANS.find((item) => item.vehicleId === vehicle.id);
  const status: ServiceStatus | null = plan ? getServiceStatus(plan, vehicle.odometer) : null;
  const latest = readings[readings.length - 1];
  const vehicleJobs = jobs.filter((job) => job.vehicleId === vehicle.id);
  const hasSampleHistory = vehicle.id === "vehicle-corolla";
  const tabs = ["Overview", `Job Cards (${vehicleJobs.length})`, "Kilometres", ...(hasSampleHistory ? ["Service History"] : [])];
  const currentTab = tabs.includes(tab) ? tab : tab.startsWith("Job Cards") ? tabs[1] : "Overview";
  return (
    <>
      <PageHeader eyebrow="VEHICLE PROFILE / CUSTOMER 360" title={vehicle.label} description={`${vehicle.registration}${vehicle.vin?` · VIN ${vehicle.vin}`:""}`} actions={<><button className="secondary-button" onClick={onEditCustomer}>Edit customer</button><button className="secondary-button" onClick={onAddVehicle}>+ Add vehicle</button><button className="primary-button" onClick={()=>onNewJob(customer.id,vehicle.id)} disabled={vehicle.status!=="active"}>+ New job card</button></>} />
      <section className="vehicle-hero panel">
        <div className="vehicle-identity"><div className="vehicle-mark">{vehicle.label.split(" ").slice(-2).map((part)=>part[0]).join("")}</div><div><StatusPill tone={vehicle.status==="active"?"orange":"grey"}>{vehicle.status==="active"?"ACTIVE VEHICLE":"ARCHIVED"}</StatusPill><h2>{vehicle.label}</h2><p>{vehicle.colour??"Colour not recorded"} · {vehicle.registration}</p><div className="vehicle-owner"><span>OWNER</span><button onClick={onEditCustomer}>{customer.name} →</button><small>{customer.mobile}</small></div></div></div>
        <div className="vehicle-metrics"><div><span>CURRENT KM</span><strong>{vehicle.odometer!==undefined?formatKilometres(vehicle.odometer):"Not recorded"}</strong><small>{latest?`${formatDate(latest.recordedAt)} · ${latest.source}${latest.sample?" (sample)":""}`:"No reading history"}</small></div><div><span>LAST SERVICE</span><strong>{plan?formatKilometres(plan.lastServiceKm):"Not recorded"}</strong><small>{plan?`${formatCalendarDay(plan.lastServiceDate)} · sample`:"No service record"}</small></div><div><span>NEXT SERVICE</span><strong>{status?formatKilometres(status.nextServiceKm):"Not set"}</strong><small>{plan?`${formatKilometres(plan.intervalKm)} interval`:"Service interval not set"}</small></div><div className="highlight"><span>{status&&status.remainingKm<0?"KM OVERDUE":"KM REMAINING"}</span><strong>{status?formatKilometres(Math.abs(status.remainingKm)):"—"}</strong><small>{status?status.state==="ok"?"No action needed":"Contact customer soon":"No service target recorded"}</small></div></div>
      </section>
      <nav className="tab-bar" aria-label="Vehicle sections">{tabs.map((item) => <button key={item} className={currentTab === item ? "active" : ""} onClick={() => setTab(item)}>{item}</button>)}</nav>
      {currentTab === "Kilometres" ? <KilometreHistory readings={readings} /> : currentTab === "Service History" ? <ServiceHistory notify={notify} /> : currentTab.startsWith("Job Cards") ? (
        <section className="panel"><div className="panel-heading"><div><span className="section-kicker">THIS VEHICLE</span><h2>Job cards</h2></div><button className="secondary-button" onClick={()=>onNewJob(customer.id,vehicle.id)} disabled={vehicle.status!=="active"}>+ New job card</button></div><div className="today-jobs">{vehicleJobs.length===0?<p className="empty-line">No job cards for this vehicle yet.</p>:vehicleJobs.map((job)=><button className="today-job" key={job.id} onClick={()=>onOpenJob(job.id)}><time>{job.origin==="local"?"Local":"Sample"}</time><span><strong>{job.reference}</strong><small>{job.work}</small></span><StatusPill tone={statusTone(job.status)}>{job.status}</StatusPill></button>)}</div></section>
      ) : (
        <div className="vehicle-content-grid">
          <section className="panel detail-panel"><div className="panel-heading"><div><span className="section-kicker">VEHICLE OVERVIEW</span><h2>Current workshop picture</h2></div><div className="record-actions"><button className="text-button" onClick={()=>onEditVehicle(vehicle.id)}>Edit vehicle</button>{vehicle.status==="active"&&<button className="text-button danger-text" onClick={()=>onArchiveVehicle(vehicle.id)}>Archive vehicle</button>}</div></div>
            <div className="detail-grid"><div><span>Registration</span><strong>{vehicle.registration}</strong></div><div><span>VIN</span><strong>{vehicle.vin??"Not recorded"}</strong></div><div><span>Current km</span><strong>{vehicle.odometer!==undefined?formatKilometres(vehicle.odometer):"Not recorded"}</strong></div><div><span>Colour</span><strong>{vehicle.colour??"Not recorded"}</strong></div><div><span>Customer since</span><strong>{formatDate(customer.createdAt)}</strong></div><div><span>Status</span><strong>{vehicle.status}</strong></div></div>
            <div className="service-alert"><span className="alert-gauge"><i style={{width:`${status?.progressPercent??0}%`}} /></span><div><StatusPill tone={status&&status.state!=="ok"?"orange":"grey"}>CUSTOMER CONTACT</StatusPill><h3>{customer.name}</h3><p>{customer.mobile}{customer.email?` · ${customer.email}`:""}{customer.preferredContact?` · prefers ${customer.preferredContact}`:""}</p></div><a className="compact-button call-link" href={buildTelUrl(customer.mobile)}>Call customer</a></div>
          </section>
          <aside className="panel relationship-panel"><div className="panel-heading"><div><span className="section-kicker">CUSTOMER VEHICLES</span><h2>{activeVehicles.length} active</h2></div></div><div className="customer-vehicle-switcher">{customer.vehicles.map((item)=><button key={item.id} className={item.id===vehicle.id?"active":""} onClick={()=>onSelectVehicle(item.id)}><strong>{item.label}</strong><span>{item.registration}</span><StatusPill tone={item.status==="active"?"green":"grey"}>{item.status.toUpperCase()}</StatusPill></button>)}</div>
          </aside>
        </div>
      )}
    </>
  );
}

function KilometreHistory({ readings }: { readings: ReadingPoint[] }) {
  if (readings.length === 0) return <section className="panel interface-state"><span>0</span><h2>No kilometre readings yet</h2><p>Readings appear when the customer updates kilometres or staff record an odometer value.</p></section>;
  const values = readings.map((reading) => reading.kilometres);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const ticks = [max, min + span * (2 / 3), min + span / 3, min].map((value) => `${Math.round(value / 1000)}k`);
  return <div className="history-grid"><section className="panel mileage-panel"><div className="panel-heading"><div><span className="section-kicker">STRUCTURED ODOMETER RECORDS</span><h2>Kilometre history</h2></div><StatusPill tone="grey">Source tracked per entry</StatusPill></div><div className="mileage-chart"><div className="chart-scale">{ticks.map((tick, index) => <span key={`${tick}-${index}`}>{tick}</span>)}</div><div className="chart-track">{readings.map((reading, index) => <div className="chart-point" style={{left:`${8 + (readings.length > 1 ? index * (84 / (readings.length - 1)) : 42)}%`, bottom:`${14 + ((reading.kilometres - min) / span) * 72}%`}} key={`${reading.recordedAt}-${index}`}><i /><span>{formatKilometres(reading.kilometres)}</span></div>)}</div></div></section><section className="panel"><div className="panel-heading"><div><span className="section-kicker">LATEST FIRST</span><h2>Recorded entries</h2></div></div><div className="record-list">{[...readings].reverse().map((reading, index) => <div key={`${reading.recordedAt}-${index}`}><span className="record-dot" /><strong>{formatKilometres(reading.kilometres)}</strong><span>{formatDate(reading.recordedAt)}{reading.sample ? " · sample" : ""}</span><StatusPill tone={reading.source === "Workshop" ? "blue" : "orange"}>{reading.source}</StatusPill></div>)}</div></section></div>;
}

function ServiceHistory({ notify }: { notify: (message: string) => void }) {
  return <section className="panel service-history"><div className="panel-heading"><div><span className="section-kicker">SAMPLE VEHICLE RECORD</span><h2>Service history</h2></div><PdfDownloadButton kind="service-history" label="Download sample history PDF" notify={notify} /></div>{SERVICE_HISTORY_DOCUMENT.entries.map((entry) => <div className="service-record" key={entry.date}><time>{entry.date}</time><strong>{entry.service}</strong><span>{entry.kilometres}</span><span>{entry.jobReference}</span><b>{entry.total}</b><span /></div>)}</section>;
}

function FollowUpCentre({ records, activities, onOpen, onAction, onComplete }: { records:FollowUpRecord[];activities:FollowUpActivity[];onOpen:(customerId:string)=>void;onAction:(id:string,method:Exclude<FollowUpMethod,"manual">)=>void;onComplete:(id:string)=>void }) {
  const [filter, setFilter] = useState("All");
  const active=records.filter((item)=>item.status==="active");
  const visible=filter==="All"?active:active.filter((item)=>item.priority===filter||item.reason.includes(filter));
  return <><PageHeader eyebrow="RETENTION HEART OF THE WORKSHOP" title="Customer Follow-ups" description="A practical queue for human contact. Opening a call or WhatsApp does not prove contact happened; mark it complete only once it has." /><section className="metrics-grid metrics-four"><MetricCard value={padCount(active.length)} label="Needs contact" note={`${active.filter((item)=>item.priority==="Urgent"||item.priority==="High").length} high priority`} tone="orange" /><MetricCard value={padCount(active.filter((item)=>item.reason.includes("Service")).length)} label="Service follow-ups" note="Active queue" tone="amber" /><MetricCard value={padCount(active.filter((item)=>item.reason.includes("problem")).length)} label="Problem reports" note="Awaiting workshop action" tone="red" /><MetricCard value={padCount(activities.length)} label="Completed" note="Retained in history" tone="green" /></section><section className="panel followup-panel"><div className="filter-bar"><div className="filter-actions">{["All","Urgent","High","Service","Estimate"].map((item)=><button key={item} className={`filter-chip ${filter===item?"active":""}`} aria-pressed={filter===item} onClick={()=>setFilter(item)}>{item}</button>)}</div></div><div className="followup-list">{visible.length===0?<div className="followup-empty"><strong>No active follow-ups</strong><p>Nothing currently matches this filter.</p></div>:visible.map((item)=><article className="followup-row" key={item.id}><span className={`priority-rail ${item.tone}`}/><div className="followup-reason"><StatusPill tone={item.tone}>{item.priority}</StatusPill><strong>{item.reason}</strong><small>{item.due}</small></div><div><strong>{item.customerName}</strong><span>{item.vehicle}</span></div><div><a href={buildTelUrl(item.phone)}>{item.phone}</a><span>{item.last}</span></div><div className="followup-actions"><a className="primary-button small action-link" href={buildTelUrl(item.phone)} onClick={()=>onAction(item.id,"call")}>Call</a><a className="secondary-button small action-link" href={buildWhatsAppUrl(item)} target="_blank" rel="noreferrer" onClick={()=>onAction(item.id,"whatsapp")}>WhatsApp</a><button className="secondary-button small" onClick={()=>onComplete(item.id)}>Mark complete</button><button className="icon-button" aria-label={`Open ${item.customerName}`} onClick={()=>onOpen(item.customerId)}>→</button></div></article>)}</div></section>{activities.length>0&&<section className="panel completed-followups"><div className="panel-heading"><div><span className="section-kicker">AUDIT HISTORY</span><h2>Completed follow-ups</h2></div><StatusPill tone="green">{activities.length} COMPLETED</StatusPill></div>{activities.map((activity)=><div key={activity.id}><span><strong>{activity.customerName}</strong><small>{activity.note}</small></span><StatusPill tone="grey">{activity.method.toUpperCase()}</StatusPill><time>{formatDateTime(activity.completedAt)}</time></div>)}</section>}</>;
}

function EstimateDetail({ linkedJob, onConvert, notify }: { linkedJob?: WorkshopJob; onConvert: () => void; notify: (message: string) => void }) {
  const doc = ESTIMATE_DOCUMENT;
  return <><PageHeader eyebrow={`ESTIMATES / ${doc.reference} · SAMPLE`} title="Estimate detail" description={`Prepared for ${doc.customer.name} · ${doc.vehicle.label} · ${doc.vehicle.registration}`} actions={<><PdfDownloadButton kind="estimate" label="Download PDF" notify={notify} /><button className="primary-button" onClick={onConvert}>{linkedJob ? `Open ${linkedJob.reference}` : "Convert to job card"}</button></>} /><div className="document-layout"><section className="panel document-sheet"><div className="document-brand"><BrandLockup dark={false} /><div><StatusPill tone="green">{doc.status}</StatusPill><h2>{doc.type}</h2><span>{doc.reference}</span></div></div><div className="document-parties"><div><span>PREPARED FOR</span><strong>{doc.customer.name}</strong><p>{doc.customer.phone}<br />{doc.customer.email}</p></div><div><span>VEHICLE</span><strong>{doc.vehicle.label}</strong><p>{doc.vehicle.registration}<br />{doc.vehicle.kilometres}</p></div><div><span>DETAILS</span><strong>Created {doc.created}</strong><p>Valid until {doc.validUntil}<br />Prepared by {doc.preparedBy}</p></div></div><div className="document-lines"><div className="doc-line-head"><span>Description</span><span>Qty</span><span>Unit price</span><span>Total</span></div>{doc.lines.map((line) => <div key={line.description}><span><strong>{line.description}</strong><small>{line.detail}</small></span><span>{line.quantity}</span><span>{line.unitPrice}</span><strong>{line.total}</strong></div>)}</div><div className="document-bottom"><div className="document-notes"><span>NOTES</span><p>{doc.notes}</p><span>VALIDITY</span><p>{doc.terms}</p></div><div className="document-totals">{doc.totals.map(([label, value], index) => <div className={index === doc.totals.length - 1 ? "grand-total" : ""} key={label}><span>{label}</span><strong>{value}</strong></div>)}</div></div></section><aside className="document-aside"><section className="panel approval-card"><span className="section-kicker">APPROVAL STATUS · SAMPLE</span><StatusPill tone="green">APPROVED</StatusPill><h3>Approved by customer</h3><p>Sample record: {doc.customer.name} approved this estimate by WhatsApp confirmation. Capturing approval evidence is planned.</p><dl><div><dt>Date</dt><dd>20 Aug 2026</dd></div><div><dt>Time</dt><dd>08:46</dd></div><div><dt>Recorded by</dt><dd>{doc.preparedBy}</dd></div></dl></section><section className="panel"><div className="panel-heading"><div><span className="section-kicker">ACTIVITY</span><h2>Estimate timeline</h2></div></div><div className="timeline compact-timeline">{linkedJob && <div><time>{linkedJob.createdAt ? formatDateTime(linkedJob.createdAt) : "Saved locally"}</time><strong>Converted to {linkedJob.reference}</strong><p>Linked job card · {linkedJob.status}</p></div>}<div><time>20 Aug 2026 08:46 · sample</time><strong>Estimate approved</strong><p>Customer confirmation recorded</p></div><div><time>19 Aug 2026 15:14 · sample</time><strong>Estimate shared</strong><p>Sent by WhatsApp</p></div><div><time>19 Aug 2026 14:52 · sample</time><strong>Estimate created</strong><p>{doc.preparedBy}</p></div></div></section></aside></div></>;
}

function InvoiceDetail({ notify, onOpenJob }: { notify: (message: string) => void; onOpenJob: (jobId: string) => void }) {
  const doc = INVOICE_DOCUMENT;
  const invoice = SAMPLE_INVOICES[0];
  const paidPercent = Math.round((invoice.paidCents / invoice.totalCents) * 100);
  const paymentReason = "Payment capture, allocation and receipts are planned for the invoice and payment phase.";
  return <><PageHeader eyebrow={`INVOICES / ${doc.reference} · SAMPLE`} title="Invoice detail" description={`Sample invoice issued to ${doc.customer.name} · Linked to ${doc.jobReference}`} actions={<><PdfDownloadButton kind="invoice" label="Download PDF" notify={notify} /><button className="secondary-button" onClick={() => onOpenJob(doc.jobReference)}>Open {doc.jobReference}</button><PlannedButton className="primary-button" label="Record payment" reason={paymentReason} /></>} /><div className="document-layout"><section className="panel document-sheet"><div className="document-brand"><BrandLockup dark={false} /><div><StatusPill tone="amber">{doc.status}</StatusPill><h2>{doc.type}</h2><span>{doc.reference}</span></div></div><div className="document-parties"><div><span>BILL TO</span><strong>{doc.customer.name}</strong><p>{doc.customer.phone}<br />{doc.customer.vatStatus}</p></div><div><span>VEHICLE</span><strong>{doc.vehicle.label}</strong><p>{doc.vehicle.registration}<br />{doc.vehicle.kilometres}</p></div><div><span>INVOICE DETAILS</span><strong>{doc.issued}</strong><p>Job: {doc.jobReference}<br />{doc.paymentTerms}</p></div></div><div className="document-lines"><div className="doc-line-head"><span>Description</span><span>Qty</span><span>Unit price</span><span>Total</span></div>{doc.lines.map((line) => <div key={line.description}><span><strong>{line.description}</strong><small>{line.detail}</small></span><span>{line.quantity}</span><span>{line.unitPrice}</span><strong>{line.total}</strong></div>)}</div><div className="document-bottom"><div className="payment-history"><span>PAYMENTS RECEIVED</span><div><strong>{formatRand(invoice.paidCents)}</strong><p>{doc.payment}</p></div><small>JB Motors VAT registration requires owner confirmation.</small></div><div className="document-totals">{doc.totals.map(([label, value], index) => <div className={index === doc.totals.length - 1 ? "grand-total" : ""} key={label}><span>{label}</span><strong>{label === "Paid" ? `−${value}` : value}</strong></div>)}</div></div></section><aside className="document-aside"><section className="panel balance-card"><span className="section-kicker">PAYMENT POSITION · SAMPLE</span><strong>{formatRand(invoiceBalance(invoice))}</strong><p>Outstanding balance due on vehicle collection.</p><div className="payment-progress"><span style={{width:`${paidPercent}%`}} /></div><small>{paidPercent}% paid</small><PlannedButton className="primary-button wide-primary" label="Record payment" reason={paymentReason} /></section><section className="panel"><div className="panel-heading"><div><span className="section-kicker">PAYMENT METHODS</span><h2>Accepted</h2></div></div><div className="method-list"><span>EFT</span><span>Card</span><span>Cash</span></div></section></aside></div></>;
}

const STOCK_FILTERS = ["All stock", "Low stock", "Out of stock"] as const;
const STOCK_COLUMNS = ["SKU","Part","Category","Supplier","Qty","Reorder","Cost","Selling","Status"];

function Inventory() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof STOCK_FILTERS)[number]>("All stock");
  const rows = INVENTORY_ITEMS.filter((item) => {
    const status = getStockStatus(item);
    const matchesFilter = filter === "All stock" || (filter === "Out of stock" ? status === "Out of stock" : status === "Low stock" || status === "Reorder");
    return matchesFilter && `${item.sku} ${item.part} ${item.category} ${item.supplier}`.toLowerCase().includes(query.trim().toLowerCase());
  });
  const low = INVENTORY_ITEMS.filter((item) => ["Low stock", "Reorder"].includes(getStockStatus(item)));
  const out = INVENTORY_ITEMS.filter((item) => getStockStatus(item) === "Out of stock");
  const stockValue = INVENTORY_ITEMS.reduce((sum, item) => sum + item.quantity * item.costCents, 0);
  const ledgerReason = "Stock receipts, issues and returns need the inventory ledger planned after the job workflow.";
  return <><PageHeader eyebrow="PARTS & STOCK CONTROL · SAMPLE STOCK" title="Inventory" description="Sample stock items. Figures below are calculated from these rows; no stock ledger exists yet." actions={<><PlannedButton label="Record stock movement" reason={ledgerReason} /><PlannedButton className="primary-button" label="+ Add stock item" reason={ledgerReason} /></>} /><section className="metrics-grid metrics-four"><MetricCard value={padCount(INVENTORY_ITEMS.length)} label="Sample stock items" note={`Across ${new Set(INVENTORY_ITEMS.map((item) => item.category)).size} categories`} tone="steel" /><MetricCard value={padCount(low.length)} label="Low or at reorder" note="Reorder action needed" tone="amber" /><MetricCard value={padCount(out.length)} label="Out of stock" note={out[0]?.part ?? "None"} tone="red" /><MetricCard value={formatRand(stockValue)} label="Stock value" note="Quantity × cost" tone="green" /></section><section className="panel table-panel"><div className="filter-bar"><label className="search-field"><span>SEARCH STOCK</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="SKU, part, supplier or category…" /></label><div className="filter-actions">{STOCK_FILTERS.map((item) => <button key={item} className={`filter-chip ${filter === item ? "active" : ""}`} aria-pressed={filter === item} onClick={() => setFilter(item)}>{item}</button>)}</div></div><div className="responsive-table inventory-table"><div className="table-head">{STOCK_COLUMNS.map((header) => <span key={header}>{header}</span>)}</div>{rows.length === 0 && <div className="followup-empty"><strong>No stock items match</strong><p>Change the filter or search text.</p></div>}{rows.map((item) => { const status = getStockStatus(item); const cells = [item.sku, item.part, item.category, item.supplier, String(item.quantity), String(item.reorderLevel), formatRand(item.costCents), formatRand(item.sellCents)]; return <div className="table-row static-row" key={item.sku}>{cells.map((cell,index) => <span key={STOCK_COLUMNS[index]} data-label={STOCK_COLUMNS[index]} className={index === 1 ? "part-cell" : ""}>{cell}</span>)}<span data-label="Status"><StatusPill tone={status === "In stock" ? "green" : status === "Out of stock" ? "red" : "amber"}>{status}</StatusPill></span></div>; })}</div></section></>;
}

function Requests({ reports, storageWarning, serviceRequests, jobs, onUpdateReportStatus, onUpdateRequestStatus, onReset, onRecordPhone, onCreateJob, onOpenJob, onOpenCustomer, currentMobile, notify }: { reports: ProblemReport[]; storageWarning: string | null; serviceRequests: ServiceRequestRecord[]; jobs: WorkshopJob[]; onUpdateReportStatus: (id: string, status: ProblemReportStatus) => ReportMutationResult; onUpdateRequestStatus: (id: string, status: ServiceRequestStatus) => void; onReset: () => void; onRecordPhone: () => void; onCreateJob: (prefill: { customerId: string; vehicleId: string; complaint: string; sourceReference: string }) => void; onOpenJob: (jobId: string) => void; onOpenCustomer: (customerId: string, vehicleId?: string) => void; currentMobile: (customerId: string, fallback: string) => string; notify: (message: string) => void }) {
  const [expandedReportId, setExpandedReportId] = useState<string | null>(reports[0]?.id ?? null);
  const openReports = reports.filter((report) => report.status !== "Resolved");
  const urgentReports = openReports.filter((report) => ["High", "Vehicle cannot drive"].includes(getReportUrgency(report)));
  const openServiceRequests = serviceRequests.filter((request) => request.status === "Submitted" || request.status === "Contacted");
  const changeStatus = (report: ProblemReport, status: ProblemReportStatus) => {
    const result = onUpdateReportStatus(report.id, status);
    if (result.ok) notify(`${report.reference} moved to ${status}`);
    else notify(result.message);
  };
  const jobButton = (reference: string, prefill: () => { customerId: string; vehicleId: string; complaint: string }) => {
    const linked = findJobBySource(jobs, reference);
    return linked ? <button className="secondary-button" onClick={() => onOpenJob(linked.id)}>Open {linked.reference}</button> : <button className="primary-button" onClick={() => onCreateJob({ ...prefill(), sourceReference: reference })}>Create job card</button>;
  };
  return <><PageHeader eyebrow="CUSTOMER PORTAL INBOX" title="Customer Requests" description="Requests and reports saved in this browser, plus labelled samples. Contact the customer to confirm the next step." actions={<>{(reports.length > 0 || storageWarning) && <button className="secondary-button" onClick={onReset}>Reset demo reports</button>}<button className="primary-button" onClick={onRecordPhone}>+ Record phone request</button></>} />{storageWarning && <div className="storage-warning" role="alert"><strong>Saved reports unavailable</strong><span>{storageWarning}</span></div>}<section className="metrics-grid metrics-four"><MetricCard value={padCount(openServiceRequests.length)} label="Open service requests" note={`${openServiceRequests.filter((request) => request.status === "Submitted").length} awaiting first contact`} tone="blue" /><MetricCard value={padCount(openReports.length)} label="Open problem reports" note={`${urgentReports.length} high severity`} tone="red" /><MetricCard value={padCount(serviceRequests.filter((request) => request.status === "Submitted").length + reports.filter((report) => report.status === "Submitted").length)} label="Awaiting contact" note="Submitted, not yet reviewed" tone="amber" /><MetricCard value={padCount(serviceRequests.filter((request) => request.status === "Booked").length)} label="Booked" note="Confirmed with the customer" tone="green" /></section><section className="request-grid">
    {serviceRequests.map((request) => <article className="panel request-card" key={request.id}><div className="request-card-top"><StatusPill tone={request.status === "Booked" ? "green" : request.status === "Closed" ? "grey" : "blue"}>SERVICE REQUEST · {request.status.toUpperCase()}</StatusPill><time>{request.id.startsWith("request-lerato") ? "Sample" : formatDateTime(request.submittedAt)}</time></div><h2>{request.serviceType}</h2><p className="request-vehicle">{request.vehicleLabel} · {request.registration}</p><div className="request-customer"><span className="avatar">{request.customerName.split(" ").map((part) => part[0]).join("")}</span><div><strong>{request.customerName}</strong><small>{request.customerMobile} · {request.reference}</small></div></div><dl><div><dt>Preferred date</dt><dd>{formatCalendarDay(request.preferredDate)}</dd></div><div><dt>Channel</dt><dd>{request.channel}</dd></div><div><dt>Status</dt><dd>{request.status}</dd></div><div><dt>Booking</dt><dd>{request.status === "Booked" ? "Confirmed" : "Not confirmed"}</dd></div></dl>{request.notes && <p className="request-note">{request.notes}</p>}<div className="report-review-controls"><label><span>Request status</span><select value={request.status} onChange={(event) => onUpdateRequestStatus(request.id, event.target.value as ServiceRequestStatus)}>{SERVICE_REQUEST_STATUSES.map((status) => <option key={status}>{status}</option>)}</select></label><a className="secondary-button action-link" href={buildTelUrl(currentMobile(request.customerId, request.customerMobile))}>Call customer</a><button className="secondary-button" onClick={() => onOpenCustomer(request.customerId, request.vehicleId)}>Open customer</button>{jobButton(request.reference, () => ({ customerId: request.customerId, vehicleId: request.vehicleId, complaint: `${request.serviceType} requested via ${request.channel.toLowerCase()} (${request.reference}).${request.notes ? ` Notes: ${request.notes}` : ""}` }))}</div></article>)}
    {reports.map((report) => {
    const urgency = getReportUrgency(report);
    const urgent = urgency === "High" || urgency === "Vehicle cannot drive";
    const expanded = expandedReportId === report.id;
    const customerId = resolveLegacyId(report.customer.id);
    const vehicleId = resolveLegacyId(report.vehicle.id);
    return <article className={`panel request-card ${urgent ? "urgent" : ""}`} key={report.id}><div className="request-card-top"><StatusPill tone={report.status === "Resolved" ? "green" : urgent ? "red" : "blue"}>PROBLEM REPORT · {report.status.toUpperCase()}</StatusPill><time>{formatDateTime(report.submittedAt)}</time></div><h2>{report.issues.length} vehicle {report.issues.length === 1 ? "issue" : "issues"}</h2><p className="request-vehicle">{report.vehicle.label} · {report.vehicle.registration}</p><div className="request-customer"><span className="avatar">{report.customer.name.split(" ").map((part) => part[0]).join("")}</span><div><strong>{report.customer.name}</strong><small>{report.customer.mobile} · {report.reference}</small></div></div><dl><div><dt>Issues</dt><dd>{report.issues.length}</dd></div><div><dt>Urgency</dt><dd><StatusPill tone={urgent ? "red" : urgency === "Medium" ? "amber" : "green"}>{urgency}</StatusPill></dd></div><div><dt>Status</dt><dd>{report.status}</dd></div><div><dt>Media</dt><dd>Not available</dd></div></dl>{expanded && <div className="reported-issues">{report.issues.map((issue, index) => <section key={issue.id}><span>ISSUE {index + 1}</span><h3>{issue.categories.join(" / ")}</h3><p>{issue.description}</p><dl><div><dt>Occurs</dt><dd>{issue.occurrence}</dd></div><div><dt>Severity</dt><dd>{issue.severity}</dd></div></dl></section>)}</div>}<div className="report-review-controls"><label><span>Review status</span><select value={report.status} onChange={(event) => changeStatus(report, event.target.value as ProblemReportStatus)}>{REPORT_STATUSES.map((status) => <option key={status}>{status}</option>)}</select></label><button className="secondary-button" onClick={() => setExpandedReportId(expanded ? null : report.id)}>{expanded ? "Hide issues" : "Review all issues"}</button><a className="secondary-button action-link" href={buildTelUrl(currentMobile(customerId, report.customer.mobile))}>Call customer</a>{jobButton(report.reference, () => ({ customerId, vehicleId, complaint: report.issues.map((issue, index) => `Issue ${index + 1} (${issue.categories.join(" / ")}, ${issue.severity}): ${issue.description}`).join(" ") }))}</div></article>;
  })}<article className="panel request-card urgent"><div className="request-card-top"><StatusPill tone="red">PROBLEM REPORT · SAMPLE</StatusPill><time>Sample</time></div><h2>Warning light and loss of power</h2><p className="request-vehicle">2021 VW Polo 1.0 TSI · CA 459-882</p><div className="request-customer"><span className="avatar">KN</span><div><strong>Kabelo Ndlovu</strong><small>079 441 8802</small></div></div><dl><div><dt>Category</dt><dd>Engine / Warning light</dd></div><div><dt>Occurs</dt><dd>Under acceleration</dd></div><div><dt>Severity</dt><dd><StatusPill tone="red">High</StatusPill></dd></div><div><dt>Media</dt><dd>Not available</dd></div></dl><blockquote>“The engine light comes on when I accelerate onto the highway and the car suddenly feels weak.”</blockquote><div className="card-actions"><a className="secondary-button action-link" href={buildTelUrl("079 441 8802")}>Call customer</a><button className="secondary-button" onClick={() => onOpenCustomer("customer-kabelo", "vehicle-polo")}>Open customer</button></div></article></section></>;
}

function Reports({ notify }: { notify: (message: string) => void }) {
  const doc = MONTHLY_REPORT_DOCUMENT;
  return <><PageHeader eyebrow="REPORTING / OPERATIONAL DECISIONS" title="Workshop Reports" description={`Sample figures for ${doc.period}. They illustrate the report layout and are not calculated from workshop records.`} actions={<><PlannedButton label="Export Excel" reason="Excel export is planned for a later phase" /><PdfDownloadButton kind="monthly-report" label="Download sample report" className="primary-button" notify={notify} /></>} /><div className="report-grid">{doc.groups.map((group) => <section className="panel report-card" key={group.title}><div className="panel-heading"><div><span className="section-kicker">{doc.period.toUpperCase()} · SAMPLE</span><h2>{group.title}</h2></div></div><div className="report-stats">{group.stats.map(([value,label],index) => <div key={label}><strong>{value}</strong><span>{label}</span><i><b style={{width:`${group.bars[index]}%`}} /></i></div>)}</div><div className="report-insight"><StatusPill tone={group.title === "Workshop quality" ? "amber" : "green"}>INSIGHT</StatusPill><p>{group.insight}</p></div></section>)}</div></>;
}

const SETTINGS_SECTIONS = ["Workshop profile", "Workshop rules", "Numbering", "Service catalogue", "Payment methods", "Staff & roles", "Notifications", "Local demo data"];

function Settings({ section, onSectionChange, storageWarning, localCounts, onDownloadBackup, onResetLocalData }: { section: string; onSectionChange: (section: string) => void; storageWarning: string | null; localCounts: Array<[string, number]>; onDownloadBackup: () => void; onResetLocalData: () => void }) {
  const pending = "Requires owner confirmation";
  const content: Record<string, React.ReactNode> = {
    "Workshop profile": <><div className="panel-heading"><div><span className="section-kicker">BUSINESS IDENTITY</span><h2>Workshop profile</h2></div></div><div className="logo-setting"><BrandLockup dark={false} /><div><strong>Official JB Motors logo</strong><p>The supplied logo is used unchanged across the platform and workshop documents.</p><StatusPill tone="green">OFFICIAL ASSET</StatusPill></div></div><div className="form-grid"><label><span>Workshop name</span><input value={WORKSHOP_PROFILE.businessName} readOnly /></label><label><span>Owner / Administrator</span><input value={WORKSHOP_PROFILE.ownerName} readOnly /></label><label className="full"><span>Confirmed operating area</span><input value={WORKSHOP_PROFILE.location} readOnly /></label>{[["Telephone",WORKSHOP_PROFILE.contact.telephone],["WhatsApp",WORKSHOP_PROFILE.contact.whatsapp],["Email",WORKSHOP_PROFILE.contact.email],["Street address",WORKSHOP_PROFILE.contact.streetAddress],["VAT number",WORKSHOP_PROFILE.contact.vatNumber],["Labour rate",WORKSHOP_PROFILE.contact.labourRate]].map(([label,value]) => <label key={label}><span>{label}</span><input value={value ?? pending} readOnly className={!value ? "pending-input" : ""} /></label>)}</div></>,
    "Workshop rules": <SettingsCards kicker="OWNER CONFIRMATION" title="Workshop rules" items={[["Default service interval",pending],["Service reminder threshold",`${pending} · prototype uses 2,000 km`],["Labour rate",pending],["VAT treatment",pending],["Estimate validity",pending]]} />,
    "Numbering": <SettingsCards kicker="DOCUMENT CONTROL" title="Numbering" items={[["Estimate","JB-EST-0001"],["Job card","JB-JOB-0001 · local drafts use DRAFT-xxxxxx"],["Invoice","JB-INV-0001"],["Service request","JB-SR-0001"]]} />,
    "Service catalogue": <SettingsCards kicker="SERVICE CATALOGUE" title="Available service categories" items={[["Routine service","Active"],["Vehicle inspection","Active"],["Mechanical repair","Active"],["Electrical fault","Active"],["Diagnostic check","Active"]]} />,
    "Payment methods": <SettingsCards kicker="PAYMENT METHODS" title="Workshop payment options" items={[["Cash","Shown in prototype"],["EFT","Shown in prototype"],["Card","Shown in prototype"]]} />,
    "Staff & roles": <SettingsCards kicker="ROLE ACCESS" title="Staff and permissions" items={[["Jabulani","Owner / Administrator"],["Service advisor","Customer, estimate and job workflow"],["Technician","Assigned jobs, inspection and QC"],["Store / Parts","Inventory and suppliers"],["Finance / Accounts","Invoices, payments and reports"],["Enforcement","Not enforced: the role selector only changes the screens shown"]]} />,
    "Notifications": <SettingsCards kicker="FOLLOW-UP PREFERENCES" title="Notification controls" items={[["Service due soon","Human follow-up queue"],["Service overdue","Human follow-up queue"],["Kilometre update","Creates or refreshes a follow-up in this browser"],["Problem report","Appears in Customer Requests in this browser"],["Automatic outbound messaging","Not active in this prototype"]]} />,
    "Local demo data": <><div className="panel-heading"><div><span className="section-kicker">BROWSER STORAGE</span><h2>Local demo data</h2></div></div><div className="settings-detail-list"><div><span>Where records live</span><strong>Only in this browser on this device. Not shared, backed up or access-controlled.</strong></div>{localCounts.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}{storageWarning && <div><span>Storage status</span><strong className="danger-text">{storageWarning}</strong></div>}</div><div className="settings-actions"><button className="secondary-button" onClick={onDownloadBackup}>Download backup (JSON)</button><button className="secondary-button danger-text" onClick={onResetLocalData}>Back up and reset workshop records</button></div><p className="settings-hint">Reset keeps a copy of the current browser data under a backup key before clearing it. Sample records always remain. Problem reports are reset separately in Customer Requests.</p></>,
  };
  return <><PageHeader eyebrow="WORKSHOP CONFIGURATION" title="Settings" description={`Manage ${WORKSHOP_PROFILE.businessName} without inventing unconfirmed business details.`} actions={<StatusPill tone="amber">READ-ONLY UNTIL OWNER CONFIRMATION</StatusPill>} /><div className="settings-layout"><nav className="panel settings-nav">{SETTINGS_SECTIONS.map((item) => <button className={section===item?"active":""} key={item} onClick={() => onSectionChange(item)}>{item}<span>→</span></button>)}</nav><section className="panel settings-form">{content[section] ?? content["Workshop profile"]}</section></div></>;
}

function SettingsCards({ kicker, title, items }: { kicker: string; title: string; items: string[][] }) {
  return <><div className="panel-heading"><div><span className="section-kicker">{kicker}</span><h2>{title}</h2></div></div><div className="settings-detail-list">{items.map(([label,value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div></>;
}

function OperationalModule({ view }: { view: WorkshopView }) {
  const [query, setQuery] = useState("");
  const [attentionOnly, setAttentionOnly] = useState(false);
  const content: Record<string, {eyebrow:string; title:string; description:string; headers:string[]; rows:string[][]; action:string; reason:string}> = {
    suppliers:{eyebrow:"PARTS SUPPLY NETWORK · SAMPLE",title:"Suppliers",description:"Sample supplier contacts and order counts. Supplier records and purchase orders are planned.",headers:["Supplier","Contact","Categories","Last order","Outstanding","Status"],rows:[["AutoZone Johannesburg","011 402 1158","Brakes, filters","18 Aug 2026","2 orders","Active"],["Goldwagen Randburg","011 781 4471","VW, cooling","20 Aug 2026","1 order","Active"],["Midas Crown Mines","011 837 4902","General service parts","16 Aug 2026","None","Active"],["Battery Centre","011 493 7720","Batteries, electrical","08 Aug 2026","1 backorder","Follow-up"]],action:"+ Add supplier",reason:"Supplier records, verified contacts and purchase orders are planned with the inventory ledger."},
    payments:{eyebrow:"PAYMENTS & RECEIPTS · SAMPLE",title:"Payments",description:"Sample payments against invoices. Recording, allocation, receipts and reversals are planned.",headers:["Date","Reference","Customer","Invoice","Method","Amount","Recorded by"],rows:[["20 Aug 2026","SIPHO-2008","Sipho Dlamini","JB-INV-0194","EFT","R2,500.00","Lindiwe Maseko"],["20 Aug 2026","CARD-8841","Lerato Molefe","JB-INV-0192","Card","R3,680.00","Lindiwe Maseko"],["19 Aug 2026","CASH-0191","Kabelo Ndlovu","JB-INV-0191","Cash","R1,450.00","Jabulani"]],action:"+ Record payment",reason:"Payment capture, allocation and receipts are planned for the invoice and payment phase."},
    warranties:{eyebrow:"QUALITY / COMEBACK CONTROL · SAMPLE",title:"Warranties & Comebacks",description:"Sample comeback cases against original work. Case creation and investigation are planned.",headers:["Case","Customer","Vehicle","Original job","Reason","Opened","Cost","Status"],rows:[["JB-WAR-0018","Naledi Khumalo","Hyundai i20","JB-JOB-0227","Brake noise returned","18 Aug 2026","R420.00","Investigating"],["JB-WAR-0017","Pieter Botha","Toyota Hilux","JB-JOB-0208","Oil leak at filter housing","02 Aug 2026","R185.00","Resolved"]],action:"+ Open warranty case",reason:"Warranty case creation, assignment and resolution are planned."},
  };
  const item = content[view] ?? content.suppliers;
  const settled = (status: string) => status === "Resolved" || status === "Active";
  const rows = item.rows.filter((row) => (!attentionOnly || (item.headers[item.headers.length - 1] === "Status" && !settled(row[row.length - 1]))) && row.join(" ").toLowerCase().includes(query.trim().toLowerCase()));
  const hasStatus = item.headers[item.headers.length - 1] === "Status";
  return <><PageHeader eyebrow={item.eyebrow} title={item.title} description={item.description} actions={<PlannedButton className="primary-button" label={item.action} reason={item.reason} />} /><section className="panel table-panel generic-table"><div className="filter-bar"><label className="search-field"><span>SEARCH</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${item.title.toLowerCase()}…`} /></label>{hasStatus && <div className="filter-actions"><button className={`filter-chip ${!attentionOnly ? "active" : ""}`} aria-pressed={!attentionOnly} onClick={() => setAttentionOnly(false)}>All</button><button className={`filter-chip ${attentionOnly ? "active" : ""}`} aria-pressed={attentionOnly} onClick={() => setAttentionOnly(true)}>Needs attention</button></div>}</div><div className="responsive-table"><div className="table-head" style={{gridTemplateColumns:`repeat(${item.headers.length}, minmax(110px, 1fr))`}}>{item.headers.map((header) => <span key={header}>{header}</span>)}</div>{rows.length === 0 && <div className="followup-empty"><strong>Nothing matches</strong><p>Change the filter or search text.</p></div>}{rows.map((row) => <div className="table-row static-row" style={{gridTemplateColumns:`repeat(${row.length}, minmax(110px, 1fr))`}} key={row.join("")}>{row.map((cell,index) => <span data-label={item.headers[index]} key={index}>{hasStatus && index===row.length-1?<StatusPill tone={settled(cell)?"green":"amber"}>{cell}</StatusPill>:cell}</span>)}</div>)}</div></section></>;
}

function MobileNavigationDrawer({ open, items, activeView, role, triggerRef, onNavigate, onPortal, onClose }: { open: boolean; items: Array<(typeof navItems)[number] & { count?:number }>; activeView: WorkshopView; role: StaffRole; triggerRef: React.RefObject<HTMLButtonElement | null>; onNavigate: (view: WorkshopView) => void; onPortal: () => void; onClose: () => void }) {
  const drawerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    const triggerButton = triggerRef.current;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    drawerRef.current?.querySelector<HTMLElement>("button")?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !drawerRef.current) return;
      const focusable = [...drawerRef.current.querySelectorAll<HTMLElement>("button")];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKey);
      triggerButton?.focus();
    };
  }, [open, onClose, triggerRef]);
  if (!open) return null;
  const navigate = (view: WorkshopView) => { onNavigate(view); onClose(); };
  return <div className="mobile-drawer-layer"><button className="mobile-drawer-backdrop" aria-label="Close navigation menu" onClick={onClose} /><aside className="mobile-drawer" role="dialog" aria-modal="true" aria-label="Workshop navigation" ref={drawerRef}><header><BrandLockup /><button type="button" aria-label="Close navigation menu" onClick={onClose}>×</button></header><nav>{items.map((item) => <button className={`nav-item ${activeView === item.view ? "active" : ""}`} key={item.view} onClick={() => navigate(item.view)}><span className="nav-code">{item.code}</span>{item.label}{item.view === "follow-ups" && <b className="nav-count">{item.count??0}</b>}</button>)}{role === "Owner / Administrator" && <button className={`nav-item settings ${activeView === "settings" ? "active" : ""}`} onClick={() => navigate("settings")}><span className="nav-code">ST</span>Settings</button>}</nav><button className="mobile-drawer-portal" onClick={() => { onPortal(); onClose(); }}>Customer portal</button><div className="user-card"><span className="avatar">J</span><span><strong>{WORKSHOP_PROFILE.ownerName}</strong><small>{role} · demo role</small></span></div></aside></div>;
}

export default function Home() {
  const [activeView, setActiveView] = useState<WorkshopView>("dashboard");
  const [role, setRole] = useState<StaffRole>("Owner / Administrator");
  const [portalOpen, setPortalOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [interfaceState, setInterfaceState] = useState<InterfaceState>("ready");
  const [problemReports, setProblemReports] = useState<ProblemReport[]>([]);
  const [reportStorageWarning, setReportStorageWarning] = useState<string | null>(null);
  const [prototypeData, setPrototypeData] = useState<WorkshopPrototypeData>(createEmptyWorkshopData);
  const [prototypeStorageWarning, setPrototypeStorageWarning] = useState<string | null>(null);
  const [prototypeStorageBlocked, setPrototypeStorageBlocked] = useState(false);
  const [creationDialog, setCreationDialog] = useState<CreationDialogState>(null);
  const [customerDialog,setCustomerDialog]=useState<CustomerDialogState>(null);
  const [selectedCustomerId,setSelectedCustomerId]=useState("customer-thabo");
  const [selectedVehicleId,setSelectedVehicleId]=useState("vehicle-corolla");
  const [selectedJobId,setSelectedJobId]=useState("JB-JOB-0248");
  const [jobMode,setJobMode]=useState<JobMode>("detail");
  const [settingsSection,setSettingsSection]=useState(SETTINGS_SECTIONS[0]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const todayLabel = useClientValue(() => new Date().toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).toUpperCase(), "TODAY");

  const loadStoredRecords = useCallback(() => {
    const loaded = loadProblemReports();
    setProblemReports(loaded.reports);
    setReportStorageWarning(loaded.warning);
    const prototype = loadWorkshopPrototypeData();
    setPrototypeData(prototype.data);
    setPrototypeStorageWarning(prototype.warning);
    setPrototypeStorageBlocked(prototype.blocked);
  }, []);
  useEffect(() => {
    // Browser storage is read only after mount: reading it during render would make the
    // client's first render differ from the server-rendered sample data (hydration mismatch).
    /* eslint-disable react-hooks/set-state-in-effect */
    const loaded = loadProblemReports();
    setProblemReports(loaded.reports);
    setReportStorageWarning(loaded.warning);
    const prototype = loadWorkshopPrototypeData();
    setPrototypeData(prototype.data);
    setPrototypeStorageWarning(prototype.warning);
    setPrototypeStorageBlocked(prototype.blocked);
    /* eslint-enable react-hooks/set-state-in-effect */
    if(prototype.migrated)saveWorkshopPrototypeData(prototype.data);
    // Another tab saving the same browser storage would otherwise be overwritten by this tab's stale copy.
    const handleStorage = (event: StorageEvent) => { if (event.key === null || event.key === workshopPrototypeStorageKey || event.key === PROBLEM_REPORT_STORAGE_KEY) loadStoredRecords(); };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [loadStoredRecords]);

  const customerRecords=useMemo(()=>{const overrides=new Map(prototypeData.customers.map((customer)=>[customer.id,customer]));return [...SEED_CUSTOMERS.map((customer)=>overrides.get(customer.id)??customer),...prototypeData.customers.filter((customer)=>!SEED_CUSTOMERS.some((seed)=>seed.id===customer.id))];},[prototypeData.customers]);
  // Follow-ups dial the customer's current mobile, not the number captured when the follow-up was created.
  const followUpRecords=useMemo(()=>mergeSeededRecords(SEED_FOLLOW_UPS,prototypeData.followUps).map((item)=>({...item,phone:customerRecords.find((customer)=>customer.id===item.customerId)?.mobile??item.phone})),[prototypeData.followUps,customerRecords]);
  const serviceRequests=useMemo(()=>mergeSeededRecords(SEED_SERVICE_REQUESTS,prototypeData.serviceRequests),[prototypeData.serviceRequests]);
  const jobs=useMemo(()=>buildJobList(SEED_JOBS,{jobCards:prototypeData.jobCards,jobProgress:prototypeData.jobProgress},customerRecords),[prototypeData.jobCards,prototypeData.jobProgress,customerRecords]);
  const activeFollowUpCount=followUpRecords.filter((item)=>item.status==="active").length;
  const visibleNav = navItems.filter((item) => item.roles.includes(role)).map((item)=>item.view==="follow-ups"?{...item,count:activeFollowUpCount}:item);
  const selectedCustomer=customerRecords.find((customer)=>customer.id===selectedCustomerId)??customerRecords[0];
  const selectedVehicle=selectedCustomer?.vehicles.find((vehicle)=>vehicle.id===selectedVehicleId)??selectedCustomer?.vehicles.find((vehicle)=>vehicle.status==="active")??selectedCustomer?.vehicles[0];
  const selectedJob=jobs.find((job)=>job.id===selectedJobId)??jobs.find((job)=>job.id==="JB-JOB-0248");
  const dialogCustomer=customerDialog?customerRecords.find((customer)=>customer.id===customerDialog.customerId):undefined;
  const portalCustomer=customerRecords.find((customer)=>customer.id===DEMO_PORTAL_CUSTOMER_ID);
  const staffActor = `${role === "Owner / Administrator" ? WORKSHOP_PROFILE.ownerName : role} (demo role)`;
  const notify = (message: string) => setToast(message);
  const nowIso = () => new Date().toISOString();
  const openCreationDialog = (dialog: Exclude<CreationDialogState, null>) => { setToast(""); setCreationDialog(dialog); };
  const readingsFor = (vehicleId: string): ReadingPoint[] => [
    ...SEED_ODOMETER_HISTORY.filter((reading) => reading.vehicleId === vehicleId).map((reading) => ({ kilometres: reading.kilometres, recordedAt: `${reading.day}T12:00:00`, source: reading.source, sample: true })),
    ...prototypeData.odometerReadings.filter((reading) => reading.vehicleId === vehicleId).map((reading) => ({ kilometres: reading.kilometres, recordedAt: reading.recordedAt, source: reading.source, sample: false })),
  ].sort((a, b) => Date.parse(a.recordedAt) - Date.parse(b.recordedAt));

  /** Writes to browser storage first; screen state changes only after the write succeeds. */
  const persist = (next: WorkshopPrototypeData): PrototypeMutationResult => {
    const result = saveWorkshopPrototypeData(next);
    if (!result.ok) { setPrototypeStorageWarning(result.message); return result; }
    setPrototypeData(next);
    setPrototypeStorageWarning(null);
    setPrototypeStorageBlocked(false);
    return result;
  };
  const persistPrototypeData = (next: WorkshopPrototypeData, successMessage: string) => {
    const result = persist(next);
    if (!result.ok) { notify(result.message); return false; }
    setCreationDialog(null);
    notify(successMessage);
    return true;
  };
  const applyJobMutation = (result: JobMutation) => {
    if (!result.ok) { notify(result.message); return false; }
    return persistPrototypeData(result.data, result.message);
  };
  const openJob = (jobId: string) => { setSelectedJobId(jobId); setJobMode("detail"); setActiveView("job-card"); };
  const addCustomer = (customer: CustomerRecord) => persistPrototypeData({ ...prototypeData, customers: [customer, ...prototypeData.customers] }, `${customer.name} added as a local customer`);
  const saveCustomerRecord=(customer:CustomerRecord,message:string)=>{
    const previous=customerRecords.find((item)=>item.id===customer.id);
    const recordedAt=nowIso();
    const readings:OdometerReading[]=customer.vehicles.filter((vehicle)=>vehicle.odometer!==undefined&&vehicle.odometer!==previous?.vehicles.find((item)=>item.id===vehicle.id)?.odometer).map((vehicle)=>({id:createFeatureId("reading"),customerId:customer.id,vehicleId:vehicle.id,kilometres:vehicle.odometer as number,recordedAt,source:"Workshop"}));
    const saved=persistPrototypeData({...prototypeData,customers:[customer,...prototypeData.customers.filter((item)=>item.id!==customer.id)],odometerReadings:[...readings,...prototypeData.odometerReadings]},message);
    if(saved)setCustomerDialog(null);
    return saved;
  };
  const addJob = (job: JobCardDraft) => {
    const existing = job.sourceReference ? findJobBySource(jobs, job.sourceReference) : undefined;
    if (existing) { setCreationDialog(null); notify(`${job.sourceReference} already has job card ${existing.reference}; opened it`); openJob(existing.id); return true; }
    const created = { id:createFeatureId("activity"), jobId:job.id, at:job.createdAt, actor:staffActor, summary:job.sourceReference ? `Draft created from ${job.sourceReference}` : "Draft job card created" };
    const saved = persistPrototypeData({ ...prototypeData, jobCards: [job, ...prototypeData.jobCards], jobActivity: [created, ...prototypeData.jobActivity] }, `${job.reference} saved as a local draft job card`);
    if (saved) openJob(job.id);
    return saved;
  };
  const addFinding = (finding: DiagnosticFinding) => {
    const job = jobs.find((item) => item.id === finding.jobId);
    const entry = { id:createFeatureId("activity"), jobId:finding.jobId, at:finding.createdAt, actor:staffActor, summary:`Diagnostic finding added: ${finding.title}` };
    return persistPrototypeData({ ...prototypeData, findings: [...prototypeData.findings, finding], jobActivity: [entry, ...prototypeData.jobActivity] }, `Diagnostic finding added to ${job?.reference ?? "the job card"}`);
  };
  const convertEstimate = () => {
    const result = convertEstimateToJob(prototypeData, jobs, ESTIMATE_CONVERSION_SOURCE, staffActor, nowIso());
    if (!result.created) { notify(result.message); openJob(result.jobId); return; }
    if (persistPrototypeData(result.data, result.message)) openJob(result.jobId);
  };
  const jobActions: JobActions = {
    selectJob: setSelectedJobId,
    newJob: () => openCreationDialog({ kind: "job" }),
    addFinding: (jobId) => openCreationDialog({ kind: "finding", jobId }),
    changeStatus: (jobId, status) => { const job = jobs.find((item) => item.id === jobId); if (job) applyJobMutation(changeJobStatus(prototypeData, job, status, QC_CHECKLIST, staffActor, nowIso())); },
    toggleCheck: (jobId, list, item) => { const job = jobs.find((entry) => entry.id === jobId); if (job) applyJobMutation(toggleJobChecklistItem(prototypeData, job, list, item, staffActor, nowIso())); },
    setRoadTest: (jobId, result) => { const job = jobs.find((item) => item.id === jobId); if (job) applyJobMutation(setRoadTestResult(prototypeData, job, result, staffActor, nowIso())); },
    addNote: (jobId, text, author) => { const job = jobs.find((item) => item.id === jobId); return job ? applyJobMutation(addJobNote(prototypeData, job, text, author, nowIso())) : false; },
    openSource: (reference) => setActiveView(reference.startsWith("JB-EST-") ? "estimate" : "requests"),
    openCustomer: (customerId, vehicleId) => openCustomer(customerId, vehicleId),
  };
  const openCustomer=(customerId:string,vehicleId?:string)=>{const customer=customerRecords.find((item)=>item.id===customerId);setSelectedCustomerId(customerId);setSelectedVehicleId(vehicleId??customer?.vehicles.find((item)=>item.status==="active")?.id??customer?.vehicles[0]?.id??"");setActiveView("vehicle");};
  const archiveVehicle=(vehicleId:string)=>{if(!selectedCustomer||!window.confirm("Archive this vehicle? It will leave active job-card selections while its history remains available."))return;const updated={...selectedCustomer,vehicles:selectedCustomer.vehicles.map((vehicle)=>vehicle.id===vehicleId?{...vehicle,status:"archived" as const}:vehicle)};if(saveCustomerRecord(updated,"Vehicle archived; history retained")){const next=updated.vehicles.find((vehicle)=>vehicle.status==="active");setSelectedVehicleId(next?.id??vehicleId);}};
  const recordFollowUpAction=(id:string,method:Exclude<FollowUpMethod,"manual">)=>{const item=followUpRecords.find((entry)=>entry.id===id);if(!item)return;const updated={...item,lastOpenedMethod:method,last:`${method==="call"?"Call":"WhatsApp"} opened · ${formatDateTime(nowIso())}`};persistPrototypeData({...prototypeData,followUps:[updated,...prototypeData.followUps.filter((entry)=>entry.id!==id)]},`${method==="call"?"Calling app":"WhatsApp"} opened; completion not yet confirmed`);};
  const completeFollowUp=(id:string)=>{const item=followUpRecords.find((entry)=>entry.id===id);if(!item)return;const completedAt=nowIso();const activity:FollowUpActivity={id:createFeatureId("activity"),followUpId:id,customerName:item.customerName,method:item.lastOpenedMethod??"manual",note:`${item.reason} marked complete`,completedAt};const updated:FollowUpRecord={...item,status:"completed",completedAt};persistPrototypeData({...prototypeData,followUps:[updated,...prototypeData.followUps.filter((entry)=>entry.id!==id)],followUpActivities:[activity,...prototypeData.followUpActivities]},`${item.customerName} follow-up completed`);};
  /** A saved service request also places the customer in the follow-up queue so staff confirm the booking. */
  const withServiceRequest = (request: ServiceRequestRecord): WorkshopPrototypeData => {
    const followUp: FollowUpRecord = { id:`followup-${request.id}`, priority:"Medium", reason:"Service request", customerId:request.customerId, customerName:request.customerName, vehicle:`${request.vehicleLabel} · ${request.registration}`, vehicleId:request.vehicleId, phone:request.customerMobile, last:`${request.channel} request · ${formatDateTime(request.submittedAt)}`, due:`Preferred date ${formatCalendarDay(request.preferredDate)}`, tone:"blue", status:"active" };
    return { ...prototypeData, serviceRequests:[request, ...prototypeData.serviceRequests], followUps:[followUp, ...prototypeData.followUps] };
  };
  const recordPhoneRequest = (draft: ServiceRequestDraft): PrototypeMutationResult => {
    const customer = customerRecords.find((item) => item.id === draft.customerId);
    if (!customer) return { ok:false, message:"Select a customer for this request." };
    const result = createServiceRequest({ customer, vehicleId:draft.vehicleId, serviceType:draft.serviceType, preferredDate:draft.preferredDate, notes:draft.notes, channel:"Phone" }, serviceRequests, toCalendarDay(new Date()), nowIso());
    if (!result.ok) return result;
    return persistPrototypeData(withServiceRequest(result.request), `${result.request.reference} recorded for ${customer.name}`) ? { ok:true } : { ok:false, message:"The request could not be saved in this browser." };
  };
  const submitPortalServiceRequest = (submission: ServiceRequestSubmission) => {
    if (!portalCustomer) return { ok:false as const, message:"The demo customer record is unavailable." };
    const result = createServiceRequest({ customer:portalCustomer, ...submission, channel:"Customer portal" }, serviceRequests, toCalendarDay(new Date()), nowIso());
    if (!result.ok) return result;
    const saved = persist(withServiceRequest(result.request));
    return saved.ok ? result : saved;
  };
  const updateServiceRequestStatus = (id: string, status: ServiceRequestStatus) => {
    const request = serviceRequests.find((item) => item.id === id);
    if (!request || request.status === status) return;
    const updated = { ...request, status, updatedAt:nowIso() };
    persistPrototypeData({ ...prototypeData, serviceRequests:[updated, ...prototypeData.serviceRequests.filter((item) => item.id !== id)] }, `${request.reference} marked ${status}`);
  };
  const recordPortalKilometres = (vehicleId: string, kilometres: number) => {
    if (!portalCustomer) return { ok:false as const, message:"The demo customer record is unavailable." };
    const result = recordOdometerReading({ data:prototypeData, customer:portalCustomer, vehicleId, kilometres, source:"Customer portal", now:nowIso(), plan:SERVICE_PLANS.find((plan) => plan.vehicleId === vehicleId), seedFollowUps:SEED_FOLLOW_UPS });
    if (!result.ok) return result;
    const saved = persist(result.data);
    return saved.ok ? { ok:true as const, status:result.status } : saved;
  };
  const savePortalProfile = (customer: CustomerRecord) => persist({ ...prototypeData, customers:[customer, ...prototypeData.customers.filter((item) => item.id !== customer.id)] });
  const submitProblemReport = (report: ProblemReport): ReportMutationResult => {
    const next = [report, ...problemReports];
    const result = saveProblemReports(next);
    if (result.ok) {
      setProblemReports(next);
      setReportStorageWarning(null);
    } else setReportStorageWarning(result.message);
    return result;
  };
  const updateProblemReportStatus = (id: string, status: ProblemReportStatus): ReportMutationResult => {
    const next = problemReports.map((report) => report.id === id ? { ...report, status, updatedAt: new Date().toISOString() } : report);
    const result = saveProblemReports(next);
    if (result.ok) {
      setProblemReports(next);
      setReportStorageWarning(null);
    } else setReportStorageWarning(result.message);
    return result;
  };
  const resetProblemReports = () => {
    if (!window.confirm("Remove only the problem reports saved by this local demo? This cannot be undone.")) return;
    const result = clearProblemReports();
    if (result.ok) {
      setProblemReports([]);
      setReportStorageWarning(null);
      notify("Saved demo problem reports were reset");
    } else {
      setReportStorageWarning(result.message);
      notify(result.message);
    }
  };
  const downloadLocalBackup = () => {
    const blob = new Blob([createLocalBackupJson([workshopPrototypeStorageKey, PROBLEM_REPORT_STORAGE_KEY])], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `jb-motors-local-demo-backup-${toCalendarDay(new Date())}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify("Local demo data backup download started");
  };
  const resetLocalWorkshopData = () => {
    if (!window.confirm("Back up and reset the workshop records saved in this browser? A copy is kept under a backup key, and sample records remain.")) return;
    const result = backupAndResetWorkshopPrototypeData();
    if (!result.ok) { notify(result.message); return; }
    setPrototypeData(createEmptyWorkshopData());
    setPrototypeStorageWarning(null);
    setPrototypeStorageBlocked(false);
    notify(result.backupKey ? `Local workshop records reset. Backup kept as ${result.backupKey}` : "There were no local workshop records to reset");
  };
  const openLocalDataSettings = () => { setSettingsSection("Local demo data"); setActiveView("settings"); };
  const changeRole = (nextRole: StaffRole) => {setRole(nextRole); setMobileMenuOpen(false); if (nextRole === "Technician") setActiveView("technician"); else if (nextRole === "Store / Parts") setActiveView("inventory"); else if (nextRole === "Finance / Accounts") setActiveView("invoice"); else setActiveView("dashboard");};
  const renderView = () => {
    if (activeView === "dashboard") return <Dashboard jobs={jobs} customers={customerRecords} followUps={followUpRecords} serviceRequests={serviceRequests} problemReports={problemReports} readings={prototypeData.odometerReadings} onOpen={setActiveView} onOpenJob={openJob} onOpenCustomer={openCustomer} />;
    if (activeView === "customers") return <CustomerDirectory onOpen={openCustomer} records={customerRecords} followUps={followUpRecords} activities={prototypeData.followUpActivities} onAddCustomer={() => openCreationDialog({ kind: "customer" })} />;
    if (activeView === "vehicle"&&selectedCustomer) return <VehicleProfile key={`${selectedCustomer.id}-${selectedVehicle?.id ?? "none"}`} customer={selectedCustomer} vehicle={selectedVehicle} jobs={jobs} readings={selectedVehicle?readingsFor(selectedVehicle.id):[]} notify={notify} onSelectVehicle={setSelectedVehicleId} onNewJob={(customerId,vehicleId)=>openCreationDialog({kind:"job",customerId,vehicleId})} onOpenJob={openJob} onEditCustomer={()=>setCustomerDialog({kind:"edit-customer",customerId:selectedCustomer.id})} onAddVehicle={()=>setCustomerDialog({kind:"add-vehicle",customerId:selectedCustomer.id})} onEditVehicle={(vehicleId)=>setCustomerDialog({kind:"edit-vehicle",customerId:selectedCustomer.id,vehicleId})} onArchiveVehicle={archiveVehicle} />;
    if (activeView === "job-card") return <JobWorkspace mode={jobMode} onModeChange={setJobMode} jobs={jobs} selectedJob={selectedJob} records={{ notes: selectedJob ? getJobNotes(prototypeData, selectedJob.id) : [], activity: selectedJob ? getJobActivity(prototypeData, selectedJob.id) : [], findings: selectedJob ? prototypeData.findings.filter((finding) => finding.jobId === selectedJob.id) : [] }} actions={jobActions} actor={staffActor} />;
    if (activeView === "follow-ups") return <FollowUpCentre records={followUpRecords} activities={prototypeData.followUpActivities} onOpen={openCustomer} onAction={recordFollowUpAction} onComplete={completeFollowUp} />;
    if (activeView === "estimate") return <EstimateDetail notify={notify} linkedJob={findJobBySource(jobs, ESTIMATE_DOCUMENT.reference)} onConvert={convertEstimate} />;
    if (activeView === "invoice") return <InvoiceDetail notify={notify} onOpenJob={openJob} />;
    if (activeView === "inventory") return <Inventory />;
    if (activeView === "requests") return <Requests reports={problemReports} storageWarning={reportStorageWarning} serviceRequests={serviceRequests} jobs={jobs} onUpdateReportStatus={updateProblemReportStatus} onUpdateRequestStatus={updateServiceRequestStatus} onReset={resetProblemReports} onRecordPhone={() => openCreationDialog({ kind: "service-request" })} onCreateJob={(prefill) => openCreationDialog({ kind: "job", ...prefill, customerId: customerRecords.some((customer) => customer.id === prefill.customerId) ? prefill.customerId : undefined, vehicleId: customerRecords.some((customer) => customer.vehicles.some((vehicle) => vehicle.id === prefill.vehicleId && vehicle.status === "active")) ? prefill.vehicleId : undefined })} onOpenJob={openJob} onOpenCustomer={openCustomer} currentMobile={(customerId, fallback) => customerRecords.find((customer) => customer.id === customerId)?.mobile ?? fallback} notify={notify} />;
    if (activeView === "reports") return <Reports notify={notify} />;
    if (activeView === "settings") return <Settings section={settingsSection} onSectionChange={setSettingsSection} storageWarning={prototypeStorageWarning} localCounts={[["Customers added or edited", prototypeData.customers.length], ["Job cards", prototypeData.jobCards.length], ["Job notes", prototypeData.jobNotes.length], ["Odometer readings", prototypeData.odometerReadings.length], ["Service requests", prototypeData.serviceRequests.length], ["Problem reports", problemReports.length]]} onDownloadBackup={downloadLocalBackup} onResetLocalData={resetLocalWorkshopData} />;
    if (activeView === "technician") return <TechnicianWorkspace jobs={jobs} notesFor={(jobId) => getJobNotes(prototypeData, jobId)} actions={jobActions} />;
    return <OperationalModule key={activeView} view={activeView} />;
  };
  if (portalOpen) return <CustomerPortal customer={portalCustomer} servicePlans={SERVICE_PLANS} latestReading={(vehicleId) => readingsFor(vehicleId).at(-1)} reports={problemReports.filter((report) => resolveLegacyId(report.customer.id) === DEMO_PORTAL_CUSTOMER_ID)} serviceRequests={serviceRequests.filter((request) => request.customerId === DEMO_PORTAL_CUSTOMER_ID)} onExit={() => setPortalOpen(false)} onSubmitReport={submitProblemReport} onRecordKilometres={recordPortalKilometres} onSubmitServiceRequest={submitPortalServiceRequest} onSaveProfile={savePortalProfile} />;
  return <main className="app-shell"><aside className="sidebar"><BrandLockup /><nav className="side-nav" aria-label="Workshop navigation">{visibleNav.map((item) => <button className={`nav-item ${activeView===item.view?"active":""}`} key={item.view} onClick={() => setActiveView(item.view)}><span className="nav-code">{item.code}</span>{item.label}{item.view==="follow-ups"&&<b className="nav-count">{activeFollowUpCount}</b>}</button>)}</nav>{role === "Owner / Administrator" && <button className={`nav-item settings ${activeView==="settings"?"active":""}`} onClick={() => setActiveView("settings")}><span className="nav-code">ST</span>Settings</button>}<div className="user-card"><span className="avatar">J</span><span><strong>{WORKSHOP_PROFILE.ownerName}</strong><small>{role} · demo role</small></span></div></aside><section className="workspace"><header className="topbar"><button className="mobile-menu-button" ref={mobileMenuButtonRef} aria-label="Open workshop navigation" aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen(true)}><span /><span /><span /></button><button className="mobile-brand" onClick={() => setActiveView("dashboard")}><BrandLockup compact /></button><button className="mobile-portal-button" onClick={() => setPortalOpen(true)}>Customer portal</button><div className="desktop-greeting"><span className="eyebrow">{todayLabel}</span><strong>JB Motors Workshop</strong></div><div className="top-actions"><StatusPill tone="orange">LOCAL UI PROTOTYPE</StatusPill><label className="demo-state-select"><span>STATE</span><select value={interfaceState} onChange={(event) => setInterfaceState(event.target.value as InterfaceState)}><option value="ready">Ready</option><option value="loading">Loading</option><option value="empty">Empty</option><option value="error">Error</option></select></label><label className="role-select" title="Changes the screens shown. This is not sign-in or access control."><span>DEMO ROLE</span><select value={role} onChange={(event) => changeRole(event.target.value as StaffRole)}>{["Owner / Administrator","Service Advisor","Technician","Store / Parts","Finance / Accounts"].map((item) => <option key={item}>{item}</option>)}</select></label><button className="secondary-button portal-button" onClick={() => setPortalOpen(true)}>Customer portal</button><button className="primary-button" onClick={() => openCreationDialog({ kind: "job" })}>+ New job card</button></div></header>{prototypeStorageWarning && <div className="prototype-warning" role="status"><span>{prototypeStorageWarning}</span>{prototypeStorageBlocked && activeView !== "settings" && <button className="text-button" onClick={openLocalDataSettings}>Open local demo data →</button>}</div>}<div className="content">{interfaceState === "ready" ? renderView() : <InterfaceStatePanel state={interfaceState} onReset={() => setInterfaceState("ready")} />}</div><nav className="staff-mobile-nav" aria-label="Quick workshop navigation">{visibleNav.slice(0,5).map((item) => <button className={activeView===item.view?"active":""} key={item.view} onClick={() => setActiveView(item.view)}><span>{item.code}</span><small>{item.label}</small></button>)}</nav></section><MobileNavigationDrawer open={mobileMenuOpen} items={visibleNav} activeView={activeView} role={role} triggerRef={mobileMenuButtonRef} onNavigate={setActiveView} onPortal={() => setPortalOpen(true)} onClose={() => setMobileMenuOpen(false)} />{creationDialog && <CreationDialog dialog={creationDialog} customers={customerRecords} onClose={() => setCreationDialog(null)} onSaveCustomer={addCustomer} onSaveJob={addJob} onSaveFinding={addFinding} onSaveServiceRequest={recordPhoneRequest} />}{customerDialog&&dialogCustomer&&<CustomerRecordDialog dialog={customerDialog} customer={dialogCustomer} onClose={()=>setCustomerDialog(null)} onSave={saveCustomerRecord}/>} {toast && <div className="toast" role="status"><span>✓</span><p>{toast}</p><button aria-label="Dismiss notification" onClick={() => setToast("")}>×</button></div>}</main>;
}
