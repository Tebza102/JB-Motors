"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { isValidSaMobile } from "./contact";
import { SERVICE_TYPES } from "./service";
import { toCalendarDay } from "./format";
import type { CreationDialogState, CustomerRecord, DiagnosticFinding, JobCardDraft, PrototypeMutationResult } from "./types";
import { useModalFocus } from "./useModalFocus";

export type ServiceRequestDraft = { customerId:string; vehicleId:string; serviceType:string; preferredDate:string; notes:string };

type Props = {
  dialog: Exclude<CreationDialogState, null>;
  customers: CustomerRecord[];
  onClose: () => void;
  onSaveCustomer: (customer: CustomerRecord) => boolean;
  onSaveJob: (job: JobCardDraft) => boolean;
  onSaveFinding: (finding: DiagnosticFinding) => boolean;
  onSaveServiceRequest: (request: ServiceRequestDraft) => PrototypeMutationResult;
};

const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function CreationDialog({ dialog, customers, onClose, onSaveCustomer, onSaveJob, onSaveFinding, onSaveServiceRequest }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [jobCustomerId, setJobCustomerId] = useState(dialog.kind === "job" ? dialog.customerId ?? "" : "");
  const [jobVehicleId, setJobVehicleId] = useState(dialog.kind === "job" ? dialog.vehicleId ?? "" : "");
  const [tomorrow] = useState(() => { const date = new Date(); date.setDate(date.getDate() + 1); return toCalendarDay(date); });
  const selectedCustomer = useMemo(() => customers.find((customer) => customer.id === jobCustomerId), [customers, jobCustomerId]);
  const activeVehicles = selectedCustomer?.vehicles.filter((vehicle) => vehicle.status === "active") ?? [];
  const selectedVehicle = activeVehicles.find((vehicle) => vehicle.id === jobVehicleId);
  const customerLocked = dialog.kind === "job" && Boolean(dialog.customerId);
  const vehicleLocked = dialog.kind === "job" && Boolean(dialog.vehicleId);
  const choosesVehicle = dialog.kind === "job" || dialog.kind === "service-request";
  useModalFocus(panelRef, onClose);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    setError("");
    setSaving(true);
    const form = new FormData(event.currentTarget);
    let saved = false;
    if (dialog.kind === "customer") {
      const mobile = String(form.get("mobile") ?? "").trim();
      if (!isValidSaMobile(mobile)) {
        setError("Enter a valid South African mobile number."); setSaving(false); return;
      }
      const customerId=makeId("customer");
      saved = onSaveCustomer({ id:customerId, createdAt:new Date().toISOString(), name:String(form.get("name")).trim(), mobile, email:String(form.get("email")??"").trim()||undefined, source:"local", vehicles:[{id:makeId("vehicle"),label:String(form.get("vehicle")).trim(),registration:String(form.get("registration")).trim().toUpperCase(),status:"active"}] });
    } else if (dialog.kind === "job") {
      const odometer = Number(form.get("odometer"));
      if (!Number.isInteger(odometer) || odometer < 0 || odometer > 999999) {
        setError("Enter an odometer reading between 0 and 999,999 km."); setSaving(false); return;
      }
      const id = makeId("job");
      if(!selectedCustomer||!selectedVehicle){setError("Select an active customer vehicle before saving.");setSaving(false);return;}
      saved = onSaveJob({ id,reference:`DRAFT-${id.slice(-6).toUpperCase()}`,createdAt:new Date().toISOString(),customerId:selectedCustomer.id,vehicleId:selectedVehicle.id,complaint:String(form.get("complaint")).trim(),odometer,assignee:String(form.get("assignee")),priority:String(form.get("priority")) as JobCardDraft["priority"],initialStatus:String(form.get("initialStatus")) as JobCardDraft["initialStatus"],status:"Draft",sourceReference:dialog.sourceReference });
    } else if (dialog.kind === "service-request") {
      if(!selectedCustomer||!selectedVehicle){setError("Select an active customer vehicle before saving.");setSaving(false);return;}
      const result = onSaveServiceRequest({ customerId:selectedCustomer.id, vehicleId:selectedVehicle.id, serviceType:String(form.get("serviceType")), preferredDate:String(form.get("preferredDate")), notes:String(form.get("notes") ?? "") });
      if (!result.ok) { setError(result.message); setSaving(false); }
      return;
    } else {
      saved = onSaveFinding({ id: makeId("finding"), jobId: dialog.jobId, createdAt: new Date().toISOString(), severity: String(form.get("severity")) as DiagnosticFinding["severity"], title: String(form.get("title")).trim(), details: String(form.get("details")).trim(), technicianNote: String(form.get("technicianNote") ?? "").trim() || undefined });
    }
    if (!saved) { setError("The record could not be saved. Check local storage and try again."); setSaving(false); }
  };

  const title = dialog.kind === "customer" ? "Add customer" : dialog.kind === "job" ? "Create new job card" : dialog.kind === "service-request" ? "Record phone request" : "Add diagnostic finding";
  return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="creation-dialog" role="dialog" aria-modal="true" aria-labelledby="creation-dialog-title" ref={panelRef}>
      <header><div><span className="section-kicker">LOCAL PROTOTYPE RECORD</span><h2 id="creation-dialog-title">{title}</h2></div><button type="button" aria-label="Close dialog" onClick={onClose}>×</button></header>
      <form onSubmit={submit}>
        {dialog.kind === "customer" && <>
          <label><span>Customer name</span><input name="name" required minLength={2} autoComplete="name" /></label>
          <label><span>Mobile number</span><input name="mobile" required inputMode="tel" placeholder="082 555 0148" /></label>
          <label><span>Email address <small>Optional</small></span><input name="email" type="email" autoComplete="email" /></label>
          <label><span>Initial vehicle</span><input name="vehicle" required placeholder="2020 Toyota Corolla 1.8" /></label>
          <label><span>Registration</span><input name="registration" required minLength={3} /></label>
        </>}
        {choosesVehicle && <>
          <label><span>Customer</span><select name="customerId" required value={jobCustomerId} disabled={customerLocked} onChange={(event)=>{setJobCustomerId(event.target.value);setJobVehicleId("");}}><option value="">Select customer</option>{customers.map((customer)=><option key={customer.id} value={customer.id}>{customer.name} · {customer.mobile}</option>)}</select></label>
          <label><span>Vehicle</span><select name="vehicleId" required value={jobVehicleId} disabled={!selectedCustomer||vehicleLocked} onChange={(event)=>setJobVehicleId(event.target.value)}><option value="">{selectedCustomer?activeVehicles.length?"Select vehicle":"No active vehicles":"Select a customer first"}</option>{activeVehicles.map((vehicle)=><option key={vehicle.id} value={vehicle.id}>{vehicle.label} · {vehicle.registration}</option>)}</select></label>
          {selectedCustomer&&selectedVehicle&&<div className="dialog-context-summary dialog-full"><div><span>CUSTOMER</span><strong>{selectedCustomer.name}</strong><small>{selectedCustomer.mobile}</small></div><div><span>VEHICLE</span><strong>{selectedVehicle.label}</strong><small>{selectedVehicle.registration}</small></div></div>}
          {selectedCustomer&&activeVehicles.length===0&&<p className="dialog-error dialog-full">This customer has no active vehicles. Add or restore a vehicle first.</p>}
        </>}
        {dialog.kind === "job" && <>
          {dialog.sourceReference && <p className="dialog-note dialog-full">This job card will be linked to <strong>{dialog.sourceReference}</strong>.</p>}
          <label><span>Odometer in</span><input key={jobVehicleId||"no-vehicle"} name="odometer" type="number" min="0" max="999999" defaultValue={selectedVehicle?.odometer ?? ""} required /></label>
          <label className="dialog-full"><span>Customer complaint</span><textarea name="complaint" required minLength={10} defaultValue={dialog.complaint ?? ""} /></label>
          <label><span>Assigned technician</span><select name="assignee" defaultValue="Petrus Nkosi"><option>Petrus Nkosi</option><option>Mandla Dube</option><option>Unassigned</option></select></label>
          <label><span>Priority</span><select name="priority" defaultValue="Routine"><option>Routine</option><option>High</option><option>Urgent</option></select></label>
          <label><span>Initial workflow status</span><select name="initialStatus" defaultValue="Scheduled"><option>Scheduled</option><option>In Progress</option><option>Waiting Parts</option></select></label>
        </>}
        {dialog.kind === "service-request" && <>
          <label><span>Service type</span><select name="serviceType" required defaultValue=""><option value="" disabled>Select service</option>{SERVICE_TYPES.map((item)=><option key={item}>{item}</option>)}</select></label>
          <label><span>Preferred date</span><input name="preferredDate" type="date" min={tomorrow} required /></label>
          <label className="dialog-full"><span>Notes from the call <small>Optional</small></span><textarea name="notes" maxLength={1000} /></label>
          <p className="dialog-note dialog-full">Saved in this browser only. The preferred date is a request, not a confirmed booking.</p>
        </>}
        {dialog.kind === "finding" && <>
          <label><span>Severity</span><select name="severity" defaultValue="Attention"><option>Critical</option><option>Attention</option><option>Observed</option></select></label>
          <label className="dialog-full"><span>Finding title</span><input name="title" required minLength={3} /></label>
          <label className="dialog-full"><span>Finding details</span><textarea name="details" required minLength={10} /></label>
          <label className="dialog-full"><span>Technician note <small>Optional</small></span><textarea name="technicianNote" /></label>
        </>}
        {error && <p className="dialog-error" role="alert">{error}</p>}
        <footer><button type="button" className="secondary-button" onClick={onClose} disabled={saving}>Cancel</button><button type="submit" className="primary-button" disabled={saving}>{saving ? "Saving…" : "Save local record"}</button></footer>
      </form>
    </div>
  </div>;
}
