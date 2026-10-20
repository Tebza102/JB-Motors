"use client";

import { FormEvent, useState } from "react";
import { BrandLockup } from "../../components/brand";
import { StatusPill } from "../../components/ui";
import { SERVICE_HISTORY_DOCUMENT } from "../documents/data";
import { ProblemReportForm } from "../problem-reports/ProblemReportForm";
import type { ProblemReport, ReportMutationResult } from "../problem-reports/types";
import { isValidSaMobile } from "../workshop-prototype/contact";
import { formatCalendarDay, formatDate, formatKilometres, toCalendarDay } from "../workshop-prototype/format";
import { SERVICE_TYPES, getServiceStatus, validateOdometerReading } from "../workshop-prototype/service";
import type { ServicePlan, ServiceStatus } from "../workshop-prototype/service";
import { CONTACT_PREFERENCES } from "../workshop-prototype/types";
import type { ContactPreference, CustomerRecord, PrototypeMutationResult, ServiceRequestRecord, VehicleRecord } from "../workshop-prototype/types";

type CustomerView = "home" | "vehicles" | "service" | "problem" | "history" | "profile" | "kilometres";
export type LatestReading = { kilometres: number; recordedAt: string; source: string } | undefined;
export type ServiceRequestSubmission = { vehicleId: string; serviceType: string; preferredDate: string; notes: string };

type PortalProps = {
  customer?: CustomerRecord;
  servicePlans: ServicePlan[];
  latestReading: (vehicleId: string) => LatestReading;
  reports: ProblemReport[];
  serviceRequests: ServiceRequestRecord[];
  onExit: () => void;
  onSubmitReport: (report: ProblemReport) => ReportMutationResult;
  onRecordKilometres: (vehicleId: string, kilometres: number) => { ok: true; status: ServiceStatus | null } | { ok: false; message: string };
  onSubmitServiceRequest: (submission: ServiceRequestSubmission) => { ok: true; request: ServiceRequestRecord } | { ok: false; message: string };
  onSaveProfile: (customer: CustomerRecord) => PrototypeMutationResult;
};

const SERVICE_STATE_COPY = {
  ok: { pill: "SERVICE OK", tone: "green", css: "ok" },
  "due-soon": { pill: "SERVICE DUE SOON", tone: "orange", css: "due-soon" },
  overdue: { pill: "SERVICE OVERDUE", tone: "red", css: "overdue" },
} as const;

export function CustomerPortal(props: PortalProps) {
  const { customer, onExit } = props;
  const [view, setView] = useState<CustomerView>("home");
  const activeVehicles = customer?.vehicles.filter((vehicle) => vehicle.status === "active") ?? [];
  const [vehicleId, setVehicleId] = useState(activeVehicles[0]?.id ?? "");
  const vehicle = activeVehicles.find((item) => item.id === vehicleId) ?? activeVehicles[0];
  const plan = vehicle ? props.servicePlans.find((item) => item.vehicleId === vehicle.id) : undefined;
  const status = plan && vehicle ? getServiceStatus(plan, vehicle.odometer) : null;
  const home = () => setView("home");
  const content = () => {
    if (!customer) return <section className="mobile-success"><h1>Customer record unavailable</h1><p>The demo customer could not be found in this browser.</p></section>;
    if (view === "vehicles") return <CustomerVehicle vehicle={vehicle} status={status} onNavigate={setView} />;
    if (view === "service") return <ServiceRequestForm vehicles={activeVehicles} defaultVehicleId={vehicle?.id} onSubmit={props.onSubmitServiceRequest} onDone={home} />;
    if (view === "problem") return <ProblemReportForm customer={{ id: customer.id, name: customer.name, mobile: customer.mobile }} vehicles={activeVehicles} defaultVehicleId={vehicle?.id} onDone={home} onSubmit={props.onSubmitReport} />;
    if (view === "kilometres") return vehicle ? <UpdateKilometres vehicle={vehicle} plan={plan} latest={props.latestReading(vehicle.id)} onRecord={props.onRecordKilometres} onDone={home} /> : <NoVehicle />;
    if (view === "history") return <CustomerHistory vehicle={vehicle} reports={props.reports} serviceRequests={props.serviceRequests} />;
    if (view === "profile") return <CustomerProfile customer={customer} onSave={props.onSaveProfile} />;
    return <CustomerHome customer={customer} vehicles={activeVehicles} vehicle={vehicle} plan={plan} status={status} serviceRequests={props.serviceRequests} onSelectVehicle={setVehicleId} onNavigate={setView} />;
  };
  return <div className="portal-stage"><aside className="portal-context"><BrandLockup /><span className="section-kicker">CUSTOMER CARE PORTAL · DEMO</span><h1>Your vehicle, professionally managed from arrival to its next service.</h1><p>There is no sign-in in this prototype. The portal always shows the demo customer {customer?.name ?? ""} and saves changes only in this browser.</p><button className="secondary-dark" onClick={onExit}>← Return to workshop platform</button><div className="portal-help"><span>Need help?</span><strong>Contact JB Motors</strong><small>Workshop contact details require owner confirmation.</small></div></aside><main className="customer-app"><header className="customer-header"><BrandLockup compact /><button onClick={onExit}>Workshop view</button></header><div className="customer-content">{content()}</div><nav className="customer-bottom-nav" aria-label="Customer portal navigation">{[
    ["home","HM","Home"],["vehicles","VH","My vehicles"],["service","SV","Service"],["problem","RP","Report"],["history","HS","History"],["profile","PF","Profile"],
  ].map(([target,code,label]) => <button key={target} className={view===target?"active":""} onClick={() => setView(target as CustomerView)}><span>{code}</span><small>{label}</small></button>)}</nav></main></div>;
}

function NoVehicle() {
  return <section className="mobile-success"><h1>No active vehicles</h1><p>There is no active vehicle on this profile. JB Motors can add one to your customer record.</p></section>;
}

function ServiceSummary({ vehicle, plan, status }: { vehicle: VehicleRecord; plan?: ServicePlan; status: ServiceStatus | null }) {
  if (!plan || !status) return <div className="service-state"><div className="service-state-copy"><StatusPill tone="grey">SERVICE SCHEDULE NOT SET</StatusPill><strong>{vehicle.odometer !== undefined ? formatKilometres(vehicle.odometer) : "No reading"}</strong><span>JB Motors has not recorded a service interval for this vehicle yet.</span></div></div>;
  const copy = SERVICE_STATE_COPY[status.state];
  return <div className={`service-state ${copy.css}`}><div className="service-state-copy"><StatusPill tone={copy.tone}>{copy.pill}</StatusPill><strong>{formatKilometres(Math.abs(status.remainingKm))}</strong><span>{status.state === "overdue" ? "past your planned service" : "remaining until your next service"}</span></div><div className="service-gauge"><span style={{ width: `${status.progressPercent}%` }} /></div><div className="service-values"><span><small>Current</small><strong>{formatKilometres(vehicle.odometer ?? 0)}</strong></span><span><small>Next service</small><strong>{formatKilometres(status.nextServiceKm)}</strong></span></div></div>;
}

function CustomerHome({ customer, vehicles, vehicle, plan, status, serviceRequests, onSelectVehicle, onNavigate }: { customer: CustomerRecord; vehicles: VehicleRecord[]; vehicle?: VehicleRecord; plan?: ServicePlan; status: ServiceStatus | null; serviceRequests: ServiceRequestRecord[]; onSelectVehicle: (id: string) => void; onNavigate: (view: CustomerView) => void }) {
  const [today] = useState(() => new Date());
  const openRequest = serviceRequests.find((request) => request.status !== "Closed");
  return <><section className="customer-greeting"><span>{today.toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long" }).toUpperCase()}</span><h1>Hello, {customer.name.split(" ")[0]}</h1><p>{vehicle ? `Here’s what your ${vehicle.label} needs next.` : "Your vehicles will appear here."}</p></section>
    {!vehicle ? <NoVehicle /> : <section className="customer-vehicle-card"><div className="vehicle-card-header"><span className="vehicle-mark light">{vehicle.label.split(" ").filter((part) => !/^\d+$/.test(part)).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span><div><small>{vehicles.length > 1 ? "SELECTED VEHICLE" : "PRIMARY VEHICLE"}</small><h2>{vehicle.label}</h2><p>{vehicle.registration}</p></div><button aria-label="View vehicle details" onClick={() => onNavigate("vehicles")}>→</button></div>{vehicles.length > 1 && <label className="portal-vehicle-select"><span>Vehicle</span><select value={vehicle.id} onChange={(event) => onSelectVehicle(event.target.value)}>{vehicles.map((item) => <option key={item.id} value={item.id}>{item.label} · {item.registration}</option>)}</select></label>}<ServiceSummary vehicle={vehicle} plan={plan} status={status} />{plan && <div className="last-service"><span>LAST SERVICE · SAMPLE RECORD</span><strong>{formatCalendarDay(plan.lastServiceDate)} · {formatKilometres(plan.lastServiceKm)}</strong><small>{plan.lastServiceLabel} · JB Motors</small></div>}</section>}
    <section className="customer-primary-actions"><button onClick={() => onNavigate("kilometres")} disabled={!vehicle}><span>KM</span><strong>Update kilometres</strong><small>Keep reminders accurate</small></button><button onClick={() => onNavigate("service")} disabled={!vehicle}><span>SV</span><strong>Request a service</strong><small>Saved as a request</small></button><button onClick={() => onNavigate("problem")} disabled={!vehicle}><span>!</span><strong>Report a problem</strong><small>Tell us what the car is doing</small></button></section>
    {(status?.state === "due-soon" || status?.state === "overdue" || openRequest) && <section className="customer-notices"><div className="customer-section-heading"><span className="section-kicker">YOUR VEHICLE</span><h2>Needs attention</h2></div>{status && status.state !== "ok" && <article className="customer-notice orange"><span className="notice-mark">01</span><div><StatusPill tone={status.state === "overdue" ? "red" : "orange"}>SERVICE REMINDER</StatusPill><h3>{status.state === "overdue" ? "Your service is overdue" : "Your service is approaching"}</h3><p>Based on your latest kilometre reading, it is a good time to plan your next visit.</p></div><button onClick={() => onNavigate("service")}>Request service</button></article>}{openRequest && <article className="customer-notice blue"><span className="notice-mark">02</span><div><StatusPill tone="blue">{openRequest.status.toUpperCase()}</StatusPill><h3>{openRequest.serviceType} request · {openRequest.reference}</h3><p>Saved {formatDate(openRequest.submittedAt)} for {formatCalendarDay(openRequest.preferredDate)}. This is a request, not a confirmed booking.</p></div><button onClick={() => onNavigate("history")}>View request</button></article>}</section>}
    <button className="contact-workshop" type="button" onClick={() => onNavigate("profile")}><span>JB</span><div><strong>Contact JB Motors</strong><small>Contact details require owner confirmation</small></div><b>View profile</b></button></>;
}

function CustomerVehicle({ vehicle, status, onNavigate }: { vehicle?: VehicleRecord; status: ServiceStatus | null; onNavigate: (view: CustomerView) => void }) {
  if (!vehicle) return <NoVehicle />;
  const copy = status ? SERVICE_STATE_COPY[status.state] : null;
  return <><section className="mobile-page-heading"><button aria-label="Back to home" onClick={() => onNavigate("home")}>←</button><div><span className="section-kicker">MY VEHICLE</span><h1>{vehicle.label}</h1><p>{vehicle.registration}</p></div></section><section className="mobile-vehicle-profile"><div className="vehicle-mark large">{vehicle.registration.slice(0, 2)}</div>{copy ? <StatusPill tone={copy.tone}>{copy.pill}</StatusPill> : <StatusPill tone="grey">SERVICE SCHEDULE NOT SET</StatusPill>}<div className="mobile-vehicle-stats"><div><span>Current km</span><strong>{vehicle.odometer !== undefined ? formatKilometres(vehicle.odometer) : "Not recorded"}</strong></div><div><span>Next service</span><strong>{status ? formatKilometres(status.nextServiceKm) : "Not set"}</strong></div><div><span>Remaining</span><strong>{status ? (status.remainingKm < 0 ? `Overdue ${formatKilometres(-status.remainingKm)}` : formatKilometres(status.remainingKm)) : "—"}</strong></div></div><button className="primary-button wide-primary" onClick={() => onNavigate("kilometres")}>Update kilometres</button></section><section className="customer-detail-list"><h2>Vehicle information</h2><div><span>Vehicle</span><strong>{vehicle.label}</strong></div><div><span>Registration</span><strong>{vehicle.registration}</strong></div><div><span>VIN</span><strong>{vehicle.vin ?? "Not recorded"}</strong></div><div><span>Colour</span><strong>{vehicle.colour ?? "Not recorded"}</strong></div></section></>;
}

function UpdateKilometres({ vehicle, plan, latest, onRecord, onDone }: { vehicle: VehicleRecord; plan?: ServicePlan; latest: LatestReading; onRecord: PortalProps["onRecordKilometres"]; onDone: () => void }) {
  const [value, setValue] = useState(vehicle.odometer !== undefined ? String(vehicle.odometer) : "");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<{ kilometres: number; status: ServiceStatus | null } | null>(null);
  const current = Number(value);
  const preview = plan && value !== "" && Number.isInteger(current) ? getServiceStatus(plan, current) : null;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const problem = validateOdometerReading(current, vehicle.odometer);
    if (value === "" || problem) { setError(problem ?? "Enter your current odometer reading."); return; }
    const result = onRecord(vehicle.id, current);
    if (!result.ok) { setError(result.message); return; }
    setSaved({ kilometres: current, status: result.status });
  };
  if (saved) return <section className="mobile-success"><span className="success-check">✓</span><StatusPill tone="green">READING SAVED</StatusPill><h1>Kilometres saved on this device.</h1><p>The workshop view in this browser now shows this reading{saved.status && saved.status.state !== "ok" ? " and a service follow-up for the team" : ""}. Nothing is sent to JB Motors in this prototype.</p><div className="success-summary"><span><small>Recorded kilometres</small><strong>{formatKilometres(saved.kilometres)}</strong></span><span><small>Next service</small><strong>{saved.status ? formatKilometres(saved.status.nextServiceKm) : "Not set"}</strong></span></div><button className="primary-button wide-primary" onClick={onDone}>Back to home</button></section>;
  const copy = preview ? SERVICE_STATE_COPY[preview.state] : null;
  return <><section className="mobile-page-heading"><button aria-label="Back to home" onClick={onDone}>←</button><div><span className="section-kicker">{vehicle.label.toUpperCase()} · {vehicle.registration}</span><h1>Update kilometres</h1><p>Keep your service reminders accurate.</p></div></section><form className="mobile-form" onSubmit={submit} noValidate><div className="previous-reading"><span>PREVIOUS READING</span><strong>{vehicle.odometer !== undefined ? formatKilometres(vehicle.odometer) : "None recorded"}</strong><small>{latest ? `${formatDate(latest.recordedAt)} · ${latest.source}` : "Source not recorded"}</small></div><label className="odometer-input"><span>Current odometer reading</span><div><input type="number" inputMode="numeric" min={vehicle.odometer ?? 0} max="999999" step="1" required value={value} aria-invalid={Boolean(error)} onChange={(event) => { setValue(event.target.value); setError(""); }} /><b>km</b></div><small>Enter the number shown on your vehicle’s dashboard. It cannot be lower than the previous reading.</small></label>{copy && preview && <section className={`km-result ${preview.state === "overdue" ? "overdue" : preview.state === "due-soon" ? "due" : "ok"}`}><StatusPill tone={copy.tone}>{copy.pill}</StatusPill><span>{preview.remainingKm < 0 ? "Overdue by" : "Kilometres remaining"}</span><strong>{formatKilometres(Math.abs(preview.remainingKm))}</strong><small>Next service due at {formatKilometres(preview.nextServiceKm)}</small></section>}{error && <p className="submit-error" role="alert">{error}</p>}<button className="primary-button wide-primary" type="submit">Save kilometres</button><p className="form-reassurance">Saved in this browser for the demo. In the production system this reading would go to JB Motors.</p></form></>;
}

function ServiceRequestForm({ vehicles, defaultVehicleId, onSubmit, onDone }: { vehicles: VehicleRecord[]; defaultVehicleId?: string; onSubmit: PortalProps["onSubmitServiceRequest"]; onDone: () => void }) {
  const [vehicleId, setVehicleId] = useState(defaultVehicleId ?? vehicles[0]?.id ?? "");
  const [serviceType, setServiceType] = useState(SERVICE_TYPES[0]);
  const [preferredDate, setPreferredDate] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<ServiceRequestRecord | null>(null);
  const [tomorrow] = useState(() => { const date = new Date(); date.setDate(date.getDate() + 1); return toCalendarDay(date); });
  if (!vehicles.length) return <NoVehicle />;
  if (saved) return <section className="mobile-success"><span className="success-check">✓</span><StatusPill tone="green">REQUEST SAVED</StatusPill><h1>Your service request is saved on this device.</h1><p>It appears in the workshop’s Customer Requests view in this browser. It is not sent to JB Motors in this prototype, and the preferred date is not a confirmed booking.</p><div className="success-summary column"><span><small>Reference</small><strong>{saved.reference}</strong></span><span><small>Vehicle</small><strong>{saved.vehicleLabel} · {saved.registration}</strong></span><span><small>Service</small><strong>{saved.serviceType}</strong></span><span><small>Preferred date</small><strong>{formatCalendarDay(saved.preferredDate)}</strong></span>{saved.notes && <span><small>Notes</small><strong>{saved.notes}</strong></span>}</div><button className="primary-button wide-primary" onClick={onDone}>Back to home</button></section>;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const result = onSubmit({ vehicleId, serviceType, preferredDate, notes });
    if (result.ok) setSaved(result.request); else setError(result.message);
  };
  return <><section className="mobile-page-heading"><button aria-label="Back to home" onClick={onDone}>←</button><div><span className="section-kicker">SERVICE REQUEST</span><h1>How can we help?</h1><p>Tell us what your vehicle needs. A request is not an instant booking.</p></div></section><form className="mobile-form" onSubmit={submit}><label><span>Vehicle</span><select value={vehicleId} onChange={(event) => setVehicleId(event.target.value)}>{vehicles.map((item) => <option key={item.id} value={item.id}>{item.label} · {item.registration}</option>)}</select></label><fieldset><legend>Service type</legend><div className="choice-grid">{SERVICE_TYPES.map((item) => <label key={item} className={serviceType === item ? "selected" : ""}><input type="radio" name="service" checked={serviceType === item} onChange={() => setServiceType(item)} />{item}</label>)}</div></fieldset><label><span>Preferred date</span><input type="date" value={preferredDate} min={tomorrow} required onChange={(event) => { setPreferredDate(event.target.value); setError(""); }} /></label><label><span>Description / notes <small>Optional</small></span><textarea value={notes} maxLength={1000} onChange={(event) => setNotes(event.target.value)} placeholder="Anything JB Motors should know before calling you…" /></label>{error && <p className="submit-error" role="alert">{error}</p>}<button className="primary-button wide-primary" type="submit">Save service request</button><p className="form-reassurance">Saved in this browser for the demo. JB Motors confirms bookings by phone in the production workflow.</p></form></>;
}

function CustomerHistory({ vehicle, reports, serviceRequests }: { vehicle?: VehicleRecord; reports: ProblemReport[]; serviceRequests: ServiceRequestRecord[] }) {
  const sampleHistory = vehicle?.id === "vehicle-corolla" ? SERVICE_HISTORY_DOCUMENT.entries : [];
  return <><section className="mobile-page-heading no-back"><div><span className="section-kicker">VEHICLE RECORD</span><h1>History and requests</h1><p>Requests and reports saved in this browser, plus sample service history.</p></div></section>
    {serviceRequests.length > 0 && <section className="customer-report-history"><div className="customer-section-heading"><span className="section-kicker">YOUR SERVICE REQUESTS</span><h2>Saved on this device</h2></div>{serviceRequests.map((request) => <article key={request.id}><div><StatusPill tone={request.status === "Booked" ? "green" : request.status === "Closed" ? "grey" : "blue"}>{request.status.toUpperCase()}</StatusPill><time>{formatDate(request.submittedAt)}</time></div><h3>{request.reference} · {request.serviceType}</h3><p>{request.vehicleLabel} · {request.registration} · preferred {formatCalendarDay(request.preferredDate)}</p>{request.notes && <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{request.notes}</p>}</article>)}</section>}
    {reports.length > 0 && <section className="customer-report-history"><div className="customer-section-heading"><span className="section-kicker">YOUR PROBLEM REPORTS</span><h2>Saved on this device</h2></div>{reports.map((report) => <article key={report.id}><div><StatusPill tone={report.status === "Resolved" ? "green" : report.status === "Under review" ? "amber" : "blue"}>{report.status.toUpperCase()}</StatusPill><time>{formatDate(report.submittedAt)}</time></div><h3>{report.reference}</h3><p>{report.customer.name} · {report.vehicle.label} · {report.vehicle.registration}</p>{report.issues.map((issue, index) => <section key={issue.id}><h4>Issue {index + 1}: {issue.categories.join(" / ")}</h4><p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{issue.description}</p><p>{issue.occurrence} · {issue.severity}</p></section>)}<strong>{report.issues.length} {report.issues.length === 1 ? "issue" : "issues"}</strong></article>)}</section>}
    {sampleHistory.length > 0 ? <div className="mobile-history">{sampleHistory.map((entry) => <article key={entry.date}><time>{entry.date}</time><StatusPill tone="green">COMPLETED · SAMPLE</StatusPill><h2>{entry.service}</h2><p>{entry.kilometres} · {vehicle?.label}</p><strong>{entry.total}</strong></article>)}</div> : <section className="mobile-success"><p>No completed service history is recorded for this vehicle in the prototype.</p></section>}</>;
}

function CustomerProfile({ customer, onSave }: { customer: CustomerRecord; onSave: PortalProps["onSaveProfile"] }) {
  const [mobile, setMobile] = useState(customer.mobile);
  const [email, setEmail] = useState(customer.email ?? "");
  const [preferredContact, setPreferredContact] = useState<ContactPreference>(customer.preferredContact ?? "WhatsApp");
  const [serviceReminders, setServiceReminders] = useState(customer.serviceReminders ?? true);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!isValidSaMobile(mobile)) { setMessage({ ok: false, text: "Enter a valid South African mobile number." }); return; }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setMessage({ ok: false, text: "Enter a valid email address or leave it blank." }); return; }
    const result = onSave({ ...customer, mobile: mobile.trim(), email: email.trim() || undefined, preferredContact, serviceReminders });
    setMessage(result.ok ? { ok: true, text: "Profile saved in this browser. The workshop customer record now shows these details." } : { ok: false, text: result.message });
  };
  const since = new Date(customer.createdAt).toLocaleDateString("en-ZA", { month: "long", year: "numeric" });
  return <><section className="mobile-page-heading no-back"><div><span className="section-kicker">MY DETAILS</span><h1>Profile</h1><p>Keep your contact information up to date.</p></div></section><section className="customer-profile-card"><span className="large-avatar">{customer.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span><h2>{customer.name}</h2><p>JB Motors customer since {since}</p></section><form className="mobile-form profile-form" onSubmit={submit} noValidate><label><span>Mobile number</span><input value={mobile} inputMode="tel" onChange={(event) => { setMobile(event.target.value); setMessage(null); }} /></label><label><span>Email address <small>Optional</small></span><input type="email" value={email} onChange={(event) => { setEmail(event.target.value); setMessage(null); }} /></label><label><span>Preferred contact method</span><select value={preferredContact} onChange={(event) => setPreferredContact(event.target.value as ContactPreference)}>{CONTACT_PREFERENCES.map((item) => <option key={item}>{item}</option>)}</select></label><label className="toggle-label"><input type="checkbox" aria-label="Enable service reminders" checked={serviceReminders} onChange={(event) => setServiceReminders(event.target.checked)} /><span><strong>Service reminders</strong><small>Allow JB Motors to contact me about approaching services. Reminders are not sent in this prototype.</small></span></label>{message && <p className={message.ok ? "form-success" : "submit-error"} role={message.ok ? "status" : "alert"}>{message.text}</p>}<button className="primary-button wide-primary" type="submit">Save profile</button></form></>;
}
