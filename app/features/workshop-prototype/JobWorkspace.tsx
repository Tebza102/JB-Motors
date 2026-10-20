"use client";

import { useMemo, useState } from "react";
import { PageHeader, PlannedButton, StatusPill } from "../../components/ui";
import { formatDateTime, formatKilometres } from "./format";
import { JOB_WORKFLOW_STEPS, isQcComplete } from "./jobs";
import type { WorkshopJob } from "./jobs";
import { INSPECTION_CHECKLIST, QC_CHECKLIST } from "./seed";
import { ROAD_TEST_RESULTS } from "./types";
import type { DiagnosticFinding, JobActivity, JobNote, JobStatus, RoadTestResult } from "./types";

export type JobMode = "detail" | "board" | "table";
export type JobActions = {
  selectJob: (jobId: string) => void;
  newJob: () => void;
  addFinding: (jobId: string) => void;
  changeStatus: (jobId: string, status: JobStatus) => void;
  toggleCheck: (jobId: string, list: "qc" | "inspection", item: string) => void;
  setRoadTest: (jobId: string, result: RoadTestResult) => void;
  addNote: (jobId: string, text: string, author: string) => boolean;
  openSource: (reference: string) => void;
  openCustomer: (customerId: string, vehicleId?: string) => void;
};
export type JobRecords = { notes: JobNote[]; activity: JobActivity[]; findings: DiagnosticFinding[] };

export const statusTone = (status: JobStatus) => status === "Ready" ? "green" : status === "Waiting Parts" ? "amber" : status === "QC" ? "blue" : status === "Draft" ? "orange" : status === "In Progress" ? "blue" : "grey";
const initials = (name: string) => name.split(" ").filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "?";
const PRINT_REASON = "A printable job card is planned with the production document workflow.";

// Sample content that exists only for the fully illustrated demonstration job JB-JOB-0248.
const SAMPLE_FINDINGS = [
  { tone: "red", severity: "CRITICAL", title: "Brake fluid leak at master cylinder", details: "Visible seepage and pressure loss confirmed during pedal hold test." },
  { tone: "amber", severity: "ATTENTION", title: "Front left pads unevenly worn", details: "Inner pad at 2 mm; right side at 5 mm." },
  { tone: "grey", severity: "OBSERVED", title: "ABS warning stored", details: "C1234 historic low-voltage fault; cleared and retested." },
];
const SAMPLE_LINES = [
  ["Replace brake master cylinder", "Labour · Petrus Nkosi", "2.5 hrs", "R650.00", "R1,625.00"],
  ["Brake master cylinder", "Part · BRK-MC-228", "1", "R2,480.00", "R2,480.00"],
  ["ATE front brake pad set", "Part · BRK-1042", "1", "R1,020.00", "R1,020.00"],
  ["DOT 4 brake fluid", "Consumable · FLD-DOT4", "1", "R185.00", "R185.00"],
];
const SAMPLE_TIMELINE = [["10:18", "Technician note added", "Petrus Nkosi"], ["09:42", "Moved to In Progress", "Jabulani"], ["09:26", "Customer authorised work", "Telephone approval"], ["08:11", "Initial inspection completed", "Petrus Nkosi"]];

export function JobWorkspace({ mode, onModeChange, jobs, selectedJob, records, actions, actor }: { mode: JobMode; onModeChange: (mode: JobMode) => void; jobs: WorkshopJob[]; selectedJob?: WorkshopJob; records: JobRecords; actions: JobActions; actor: string }) {
  const open = (jobId: string) => { actions.selectJob(jobId); onModeChange("detail"); };
  if (mode === "board") return <JobBoard jobs={jobs} onOpen={open} onTable={() => onModeChange("table")} onNewJob={actions.newJob} />;
  if (mode === "table" || !selectedJob) return <JobTable jobs={jobs} onOpen={open} onBoard={() => onModeChange("board")} onNewJob={actions.newJob} />;
  return <JobDetail job={selectedJob} records={records} actions={actions} actor={actor} onTable={() => onModeChange("table")} onBoard={() => onModeChange("board")} />;
}

function JobDetail({ job, records, actions, actor, onTable, onBoard }: { job: WorkshopJob; records: JobRecords; actions: JobActions; actor: string; onTable: () => void; onBoard: () => void }) {
  const sample = job.hasFullDetail;
  const qcDone = QC_CHECKLIST.filter((item) => job.qcChecks.includes(item)).length;
  const readyBlocked = job.status !== "Ready" && !isQcComplete(job, QC_CHECKLIST);
  const kind = job.origin === "local" ? "LOCAL RECORD" : sample ? "SAMPLE JOB · FULL DETAIL" : "SAMPLE JOB · SUMMARY ONLY";
  return (
    <>
      <PageHeader eyebrow={`JOB CARDS / ${kind}`} title={job.reference} description={`${job.vehicleLabel} · ${job.registration} · ${job.customerName}`} actions={<><button className="secondary-button" onClick={onTable}>Table view</button><button className="secondary-button" onClick={onBoard}>Board view</button><PlannedButton label="Print" reason={PRINT_REASON} /><button className="primary-button" onClick={() => actions.openCustomer(job.customerId, job.vehicleId)}>Open customer</button></>} />
      <section className="status-control panel"><div><span className="section-kicker">JOB STATUS</span><strong>{job.status}</strong><small>{job.statusChangedAt ? `Last changed ${formatDateTime(job.statusChangedAt)}${job.statusChangedBy ? ` by ${job.statusChangedBy}` : ""}` : "No status change recorded"}</small></div><div className="status-steps">{JOB_WORKFLOW_STEPS.map((step) => <button className={job.status === step ? "active" : ""} aria-pressed={job.status === step} key={step} title={step === "Ready" && readyBlocked ? "Complete QC and a passed road test first" : undefined} onClick={() => actions.changeStatus(job.id, step)}><span />{step}</button>)}</div><small className="autosave-note">Changes save immediately in this browser</small></section>
      {job.status === "Draft" && <p className="workflow-note">Draft job card. Choose a workflow status above to release it to the workshop{job.initialStatus ? ` (intended start: ${job.initialStatus})` : ""}.</p>}
      <div className="job-layout">
        <div className="job-main">
          <section className="panel job-summary"><div className="job-summary-grid"><div><span>CUSTOMER</span><strong>{job.customerName}</strong><small>{job.customerMobile ?? "Mobile not recorded"}</small></div><div><span>VEHICLE</span><strong>{job.vehicleLabel}</strong><small>{job.registration}</small></div><div><span>ODOMETER IN</span><strong>{job.odometer !== undefined ? formatKilometres(job.odometer) : "Not recorded"}</strong><small>{job.origin === "local" ? `Created ${job.createdAt ? formatDateTime(job.createdAt) : ""}` : `Due ${job.due}`}</small></div><div><span>ASSIGNED TO</span><strong>{job.assignee}</strong><small>{job.priority} priority</small></div></div></section>
          <section className="panel work-section"><div className="section-heading"><span className="section-number">01</span><div><h2>{job.complaint ? "Customer complaint" : "Work summary"}</h2><p>{job.complaint ? "The customer’s words are preserved before diagnosis." : "This sample job has a summary only; no complaint was recorded."}</p></div></div><blockquote>{job.complaint ? `“${job.complaint}”` : job.work}</blockquote>{job.sourceReference && <div className="source-link"><span>Created from <strong>{job.sourceReference}</strong></span><button className="text-button" onClick={() => actions.openSource(job.sourceReference!)}>Open source record →</button></div>}</section>
          <section className="panel work-section"><div className="section-heading"><span className="section-number">02</span><div><h2>Inspection & diagnostic findings</h2><p>Technician findings linked to the original complaint.</p></div>{sample && <StatusPill tone="grey">SAMPLE FINDINGS</StatusPill>}</div><div className="finding-list">{sample && SAMPLE_FINDINGS.map((finding) => <div key={finding.title}><StatusPill tone={finding.tone}>{finding.severity}</StatusPill><span><strong>{finding.title}</strong><p>{finding.details}</p></span></div>)}{records.findings.map((finding) => <div className="local-finding" key={finding.id}><StatusPill tone={finding.severity === "Critical" ? "red" : finding.severity === "Attention" ? "amber" : "grey"}>{finding.severity.toUpperCase()}</StatusPill><span><strong>{finding.title}</strong><p>{finding.details}</p>{finding.technicianNote && <small>Technician note: {finding.technicianNote}</small>}<small>Saved {formatDateTime(finding.createdAt)}</small></span></div>)}{!sample && records.findings.length === 0 && <p className="empty-line">No findings recorded yet.</p>}</div><button className="inline-add" onClick={() => actions.addFinding(job.id)}>+ Add diagnostic finding</button></section>
          <section className="panel work-section"><div className="section-heading"><span className="section-number">03</span><div><h2>Labour & parts</h2><p>{sample ? "Sample lines illustrating work and parts consumed." : "Line entry arrives with the estimate and invoice workflow."}</p></div><PlannedButton label="+ Add line" reason="Labour and parts entry is planned with stock and invoicing." /></div>{sample ? <><div className="line-table"><div className="line-head"><span>Description</span><span>Qty / hrs</span><span>Rate</span><span>Total</span><span /></div>{SAMPLE_LINES.map(([description, detail, quantity, rate, total]) => <div key={description}><span><b>{description}</b><small>{detail}</small></span><span>{quantity}</span><span>{rate}</span><strong>{total}</strong><span /></div>)}</div><div className="job-total"><span>Sample job value</span><strong>R6,106.50 <small>incl. VAT (VAT treatment unconfirmed)</small></strong></div></> : <p className="empty-line">No labour or parts are recorded for this job in the prototype.</p>}</section>
          <section className="panel work-section"><div className="section-heading"><span className="section-number">04</span><div><h2>Technician notes & attachments</h2><p>Notes save to this job in this browser. Photo uploads are planned.</p></div></div><JobNoteForm job={job} author={actor} onAddNote={actions.addNote} /><JobNotesList notes={records.notes} />{sample && <><div className="note-box"><span className="avatar">PN</span><div><strong>Petrus Nkosi <small>Sample note</small></strong><p>Master cylinder removed. Replacement supplied has a different rear port angle; stores contacted supplier to confirm correct variant before fitment.</p></div></div><div className="attachment-grid"><div className="attachment-tile"><span>PHOTO 01</span><strong>Master cylinder leak</strong><small>Sample placeholder</small></div><div className="attachment-tile"><span>PHOTO 02</span><strong>Front left pad wear</strong><small>Sample placeholder</small></div><PlannedButton className="add-attachment" label="+ Add attachment" reason="Protected photo storage is planned for the production phase." /></div></>}</section>
        </div>
        <aside className="job-aside">
          <section className="panel qc-card"><div className="panel-heading"><div><span className="section-kicker">QUALITY CONTROL</span><h2>Release checklist</h2></div><span className="progress-ring">{qcDone}/{QC_CHECKLIST.length}</span></div>{QC_CHECKLIST.map((item) => <label key={item}><input type="checkbox" checked={job.qcChecks.includes(item)} onChange={() => actions.toggleCheck(job.id, "qc", item)} /> {item}</label>)}<div className="road-test"><span id={`road-test-${job.id}`}>ROAD-TEST RESULT</span><select aria-labelledby={`road-test-${job.id}`} value={job.roadTest} onChange={(event) => actions.setRoadTest(job.id, event.target.value as RoadTestResult)}>{ROAD_TEST_RESULTS.map((result) => <option key={result}>{result}</option>)}</select></div><p className="qc-rule">Ready requires every check and a passed road test.</p></section>
          <section className="panel authorisation-card"><div className="panel-heading"><div><span className="section-kicker">CUSTOMER AUTHORISATION</span><h2>{sample ? "Approved work" : job.sourceReference?.startsWith("JB-EST-") ? "Linked estimate" : "Not recorded"}</h2></div></div>{sample ? <><StatusPill tone="green">APPROVED · SAMPLE</StatusPill><strong>R6,106.50 incl. VAT</strong><p>Sample record: approved by Sipho Dlamini by telephone on 20 Aug 2026 at 09:26.</p></> : job.sourceReference?.startsWith("JB-EST-") ? <><StatusPill tone="green">ESTIMATE APPROVED · SAMPLE</StatusPill><p>Work scope comes from approved estimate {job.sourceReference}. Approval evidence capture is planned.</p><button className="wide-button" onClick={() => actions.openSource(job.sourceReference!)}>Open {job.sourceReference}</button></> : <p>No customer authorisation is recorded for this job. Capture approval before starting chargeable work.</p>}</section>
          <section className="panel activity-card"><div className="panel-heading"><div><span className="section-kicker">ACTIVITY HISTORY</span><h2>Job timeline</h2></div></div><div className="timeline compact-timeline">{records.activity.map((entry) => <div key={entry.id}><time>{formatDateTime(entry.at)}</time><strong>{entry.summary}</strong><p>{entry.actor}</p></div>)}{sample && SAMPLE_TIMELINE.map(([time, summary, actor]) => <div key={time}><time>{time} · sample</time><strong>{summary}</strong><p>{actor}</p></div>)}{!sample && records.activity.length === 0 && <p className="empty-line">No activity recorded yet.</p>}</div></section>
        </aside>
      </div>
    </>
  );
}

function JobNoteForm({ job, author, onAddNote }: { job: WorkshopJob; author: string; onAddNote: JobActions["addNote"] }) {
  const [note, setNote] = useState("");
  return <form className="job-note-form" onSubmit={(event) => { event.preventDefault(); if (onAddNote(job.id, note, author)) setNote(""); }}><label><span>Add a note to {job.reference}</span><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Record findings, work completed or what is blocking the job…" maxLength={2000} /></label><button className="primary-button" type="submit" disabled={note.trim().length < 3}>Save note</button></form>;
}

function JobNotesList({ notes, limit }: { notes: JobNote[]; limit?: number }) {
  return <>{notes.slice(0, limit ?? notes.length).map((note) => <div className="note-box" key={note.id}><span className="avatar">{initials(note.author)}</span><div><strong>{note.author} <small>{formatDateTime(note.createdAt)}</small></strong><p>{note.text}</p></div></div>)}</>;
}

const TABLE_FILTERS = ["Open", "Draft", "Waiting Parts", "QC", "Ready", "All"] as const;
const TABLE_COLUMNS = ["Job", "Customer", "Vehicle", "Registration", "Technician", "Status", "Due"];
const TABLE_GRID = { gridTemplateColumns: "1fr 1.1fr 1.5fr .9fr 1fr .9fr .8fr" };

function JobTable({ jobs, onOpen, onBoard, onNewJob }: { jobs: WorkshopJob[]; onOpen: (jobId: string) => void; onBoard: () => void; onNewJob: () => void }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof TABLE_FILTERS)[number]>("Open");
  const rows = useMemo(() => jobs.filter((job) => (filter === "All" || (filter === "Open" ? job.status !== "Ready" : job.status === filter)) && `${job.reference} ${job.customerName} ${job.vehicleLabel} ${job.registration} ${job.assignee}`.toLowerCase().includes(query.trim().toLowerCase())), [jobs, filter, query]);
  return <><PageHeader eyebrow="JOB CARDS / TABLE VIEW" title="Workshop job cards" description="Sample jobs plus job cards saved in this browser. Open any row for its own record." actions={<><button className="secondary-button" onClick={onBoard}>Board view</button><button className="primary-button" onClick={onNewJob}>+ New job card</button></>} /><section className="panel"><div className="filter-bar"><label className="search-field"><span>SEARCH</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search job, customer, registration…" /></label><div className="filter-actions">{TABLE_FILTERS.map((item) => <button key={item} className={`filter-chip ${filter === item ? "active" : ""}`} aria-pressed={filter === item} onClick={() => setFilter(item)}>{item}</button>)}</div></div><div className="responsive-table generic-table"><div className="table-head" style={TABLE_GRID}>{TABLE_COLUMNS.map((header) => <span key={header}>{header}</span>)}</div>{rows.length === 0 ? <div className="followup-empty"><strong>No job cards match</strong><p>Change the filter or search text.</p></div> : rows.map((job) => { const cells = [job.reference, job.customerName, job.vehicleLabel, job.registration, job.assignee, job.status, job.origin === "local" ? "Local record" : job.due]; return <button className="table-row job-table-row" style={TABLE_GRID} key={job.id} onClick={() => onOpen(job.id)}>{cells.map((cell, index) => <span data-label={TABLE_COLUMNS[index]} key={TABLE_COLUMNS[index]}>{index === 5 ? <StatusPill tone={statusTone(job.status)}>{cell}</StatusPill> : cell}</span>)}</button>; })}</div></section></>;
}

function JobBoard({ jobs, onOpen, onTable, onNewJob }: { jobs: WorkshopJob[]; onOpen: (jobId: string) => void; onTable: () => void; onNewJob: () => void }) {
  const drafts = jobs.filter((job) => job.status === "Draft");
  return <><PageHeader eyebrow="JOB CARDS / WORKSHOP BOARD" title="Workshop flow" description="Every column is calculated from the same job list as the table and dashboard." actions={<><button className="secondary-button" onClick={onTable}>Table view</button><button className="primary-button" onClick={onNewJob}>+ New job card</button></>} />{drafts.length > 0 && <section className="local-draft-strip" aria-label="Draft job cards">{drafts.map((job) => <button key={job.id} onClick={() => onOpen(job.id)}><StatusPill tone="orange">DRAFT</StatusPill><strong>{job.reference} · {job.vehicleLabel}</strong><span>{job.customerName} · {job.registration}</span></button>)}</section>}<div className="board">{JOB_WORKFLOW_STEPS.map((step) => { const columnJobs = jobs.filter((job) => job.status === step); return <section key={step} className="board-column"><header><StatusPill tone={statusTone(step)}>{step}</StatusPill><strong>{columnJobs.length}</strong></header>{columnJobs.map((job) => <button key={job.id} className="job-tile" onClick={() => onOpen(job.id)}><span>{job.reference}</span><strong>{job.vehicleLabel}</strong><p>{job.registration}</p><small>{job.work}</small><div><span className="mini-avatar">{initials(job.assignee)}</span><time>{job.origin === "local" ? "Local" : job.due}</time></div></button>)}</section>; })}</div></>;
}

export function TechnicianWorkspace({ jobs, notesFor, actions }: { jobs: WorkshopJob[]; notesFor: (jobId: string) => JobNote[]; actions: JobActions }) {
  const technicians = useMemo(() => [...new Set(jobs.map((job) => job.assignee).filter((name) => name !== "Unassigned"))], [jobs]);
  const [technician, setTechnician] = useState(() => technicians.includes("Petrus Nkosi") ? "Petrus Nkosi" : technicians[0] ?? "Petrus Nkosi");
  const assigned = jobs.filter((job) => job.assignee === technician && job.status !== "Ready");
  const [activeId, setActiveId] = useState<string | null>(null);
  const job = assigned.find((item) => item.id === activeId) ?? assigned[0];
  const author = `${technician} (demo, not signed in)`;
  return <div className="technician-view"><PageHeader eyebrow="TECHNICIAN MOBILE WORKSPACE" title="My assigned jobs" description={`${technician} · ${assigned.length} open ${assigned.length === 1 ? "job" : "jobs"}`} actions={<label className="technician-select"><span>DEMO TECHNICIAN</span><select value={technician} onChange={(event) => { setTechnician(event.target.value); setActiveId(null); }}>{technicians.map((name) => <option key={name}>{name}</option>)}</select></label>} />
    {!job ? <section className="panel interface-state"><span>0</span><h2>No open jobs assigned</h2><p>Jobs assigned to {technician} that are not yet Ready appear here.</p></section> : <>
      <section className="tech-job-card"><div className="tech-job-top"><div><span>ACTIVE JOB</span><strong>{job.reference}</strong></div><StatusPill tone="blue">{job.status}</StatusPill></div><h2>{job.vehicleLabel}</h2><p>{job.registration}{job.odometer !== undefined ? ` · ${formatKilometres(job.odometer)}` : ""}</p><blockquote>{job.complaint ?? job.work}</blockquote><div className="tech-status-actions">{job.status === "In Progress" ? <button onClick={() => actions.changeStatus(job.id, "Waiting Parts")}>Waiting parts</button> : <button onClick={() => actions.changeStatus(job.id, "In Progress")} disabled={job.status === "QC"}>Start work</button>}<button onClick={() => actions.changeStatus(job.id, "QC")} disabled={job.status === "QC"}>{job.status === "QC" ? "With QC" : "Send to QC"}</button></div></section>
      {assigned.length > 1 && <section className="panel tech-job-list"><div className="panel-heading"><div><span className="section-kicker">ASSIGNED TO {technician.toUpperCase()}</span><h2>Switch job</h2></div></div><div className="today-jobs">{assigned.map((item) => <button className="today-job" key={item.id} aria-pressed={item.id === job.id} onClick={() => setActiveId(item.id)}><time>{item.reference.replace("JB-JOB-", "#")}</time><span><strong>{item.vehicleLabel}</strong><small>{item.registration} · {item.work}</small></span><StatusPill tone={statusTone(item.status)}>{item.status}</StatusPill></button>)}</div></section>}
      <section className="tech-tools"><article className="panel"><div className="panel-heading"><div><span className="section-kicker">INITIAL INSPECTION</span><h2>Quick checks</h2></div><span className="progress-ring">{INSPECTION_CHECKLIST.filter((item) => job.inspectionChecks.includes(item)).length}/{INSPECTION_CHECKLIST.length}</span></div>{INSPECTION_CHECKLIST.map((item) => <label key={item}><input type="checkbox" checked={job.inspectionChecks.includes(item)} onChange={() => actions.toggleCheck(job.id, "inspection", item)} />{item}</label>)}</article><article className="panel"><div className="panel-heading"><div><span className="section-kicker">WORK NOTES</span><h2>Add technician update</h2></div></div><JobNoteForm job={job} author={author} onAddNote={actions.addNote} /><div className="tech-upload"><PlannedButton label="Capture photo" reason="Photo uploads need protected storage and are planned for production." /></div><JobNotesList notes={notesFor(job.id)} limit={3} /></article><article className="panel parts-used"><div className="panel-heading"><div><span className="section-kicker">PARTS USED</span><h2>Job stock</h2></div><PlannedButton className="text-button" label="+ Add part" reason="Parts requests and stock issues are planned with the inventory ledger." /></div>{job.hasFullDetail ? <><div><strong>Brake master cylinder</strong><span>1 × R2,480.00 · sample</span></div><div><strong>ATE front brake pads</strong><span>1 × R1,020.00 · sample</span></div><div><strong>DOT 4 brake fluid</strong><span>1 × R185.00 · sample</span></div></> : <div><strong>No parts recorded</strong><span>Stock issue to jobs is planned</span></div>}</article></section>
    </>}
  </div>;
}
