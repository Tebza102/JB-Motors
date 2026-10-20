import { createFeatureId } from "../problem-reports/types.ts";
import { formatDateTime, formatKilometres } from "./format.ts";
import type { CustomerRecord, FollowUpRecord, OdometerReading, ServiceRequestRecord, VehicleRecord, WorkshopPrototypeData } from "./types";

export type ServicePlan = { vehicleId:string; intervalKm:number; lastServiceKm:number; lastServiceDate:string; lastServiceLabel:string };
export type ServiceStatus = { nextServiceKm:number; remainingKm:number; state:"ok"|"due-soon"|"overdue"; progressPercent:number };

/** Prototype reminder threshold. The real threshold awaits owner confirmation in Settings → Workshop rules. */
export const SERVICE_DUE_SOON_KM = 2000;
export const SERVICE_TYPES = ["Routine Service","Vehicle Inspection","Mechanical Repair","Electrical Fault","Brake Service","Suspension","Diagnostic Check","Other"];

export function getServiceStatus(plan:ServicePlan, currentKm:number|undefined):ServiceStatus|null {
  if (currentKm === undefined) return null;
  const nextServiceKm = plan.lastServiceKm + plan.intervalKm;
  const remainingKm = nextServiceKm - currentKm;
  const state = remainingKm < 0 ? "overdue" : remainingKm <= SERVICE_DUE_SOON_KM ? "due-soon" : "ok";
  const progressPercent = Math.min(100, Math.max(0, Math.round(((currentKm - plan.lastServiceKm) / plan.intervalKm) * 100)));
  return { nextServiceKm, remainingKm, state, progressPercent };
}

export function validateOdometerReading(value:number, previous?:number):string|null {
  if (!Number.isInteger(value)) return "Enter the odometer reading as a whole number of kilometres.";
  if (value < 0 || value > 999999) return "Enter a reading between 0 and 999,999 km.";
  if (previous !== undefined && value < previous) return `The reading cannot be lower than the previous reading of ${formatKilometres(previous)}. Contact JB Motors if the odometer was replaced.`;
  return null;
}

/** Seeded records with local overrides applied (matched by id), plus local-only records first. */
export function mergeSeededRecords<T extends { id:string }>(seed:T[], local:T[]):T[] {
  const overrides = new Map(local.map((item) => [item.id, item]));
  return [...local.filter((item) => !seed.some((entry) => entry.id === item.id)), ...seed.map((item) => overrides.get(item.id) ?? item)];
}

/** Creates or refreshes the active service follow-up for a vehicle after a reading puts it near or past its service. */
export function upsertServiceFollowUp(followUps:FollowUpRecord[], seedFollowUps:FollowUpRecord[], customer:CustomerRecord, vehicle:VehicleRecord, status:ServiceStatus, now:string):FollowUpRecord[] {
  const merged = mergeSeededRecords(seedFollowUps, followUps);
  const existing = merged.find((item) => item.customerId === customer.id && item.status === "active" && /service/i.test(item.reason) && (item.vehicleId ? item.vehicleId === vehicle.id : item.vehicle.includes(vehicle.registration)));
  const overdue = status.state === "overdue";
  const fields = {
    priority:(overdue ? "Urgent" : "High") as FollowUpRecord["priority"], tone:overdue ? "red" : "orange",
    reason:`Kilometres updated · Service ${overdue ? "overdue" : "due soon"}`,
    due:overdue ? `Overdue by ${formatKilometres(-status.remainingKm)}` : `${formatKilometres(status.remainingKm)} remaining`,
    last:`Customer kilometre update · ${formatDateTime(now)}`, vehicleId:vehicle.id,
  };
  const updated:FollowUpRecord = existing
    ? { ...existing, ...fields }
    : { id:`followup-km-${vehicle.id}`, customerId:customer.id, customerName:customer.name, vehicle:`${vehicle.label} · ${vehicle.registration}`, phone:customer.mobile, status:"active", ...fields };
  return [updated, ...followUps.filter((item) => item.id !== updated.id)];
}

export type OdometerUpdate = { ok:true; data:WorkshopPrototypeData; status:ServiceStatus|null; message:string } | { ok:false; message:string };

/** Saves a customer-supplied reading: rejects regressions, updates the vehicle, keeps history and applies the follow-up rule. */
export function recordOdometerReading(args:{ data:WorkshopPrototypeData; customer:CustomerRecord; vehicleId:string; kilometres:number; source:OdometerReading["source"]; now:string; plan?:ServicePlan; seedFollowUps:FollowUpRecord[] }):OdometerUpdate {
  const { data, customer, vehicleId, kilometres, source, now, plan, seedFollowUps } = args;
  const vehicle = customer.vehicles.find((item) => item.id === vehicleId && item.status === "active");
  if (!vehicle) return { ok:false, message:"This vehicle is no longer active on your profile." };
  const error = validateOdometerReading(kilometres, vehicle.odometer);
  if (error) return { ok:false, message:error };
  const updatedVehicle = { ...vehicle, odometer:kilometres };
  const updatedCustomer = { ...customer, vehicles:customer.vehicles.map((item) => item.id === vehicleId ? updatedVehicle : item) };
  const reading:OdometerReading = { id:createFeatureId("reading"), customerId:customer.id, vehicleId, kilometres, recordedAt:now, source };
  const status = plan ? getServiceStatus(plan, kilometres) : null;
  return {
    ok:true, status, message:`${formatKilometres(kilometres)} saved for ${vehicle.registration}`,
    data:{ ...data,
      customers:[updatedCustomer, ...data.customers.filter((item) => item.id !== customer.id)],
      odometerReadings:[reading, ...data.odometerReadings],
      followUps:status && status.state !== "ok" ? upsertServiceFollowUp(data.followUps, seedFollowUps, updatedCustomer, updatedVehicle, status, now) : data.followUps },
  };
}

export function nextSequentialReference(references:string[], prefix:string, width = 4):string {
  const highest = references.reduce((max, reference) => {
    if (!reference.startsWith(prefix)) return max;
    const value = Number(reference.slice(prefix.length));
    return Number.isInteger(value) && value > max ? value : max;
  }, 0);
  return `${prefix}${String(highest + 1).padStart(width, "0")}`;
}

export type ServiceRequestInput = { customer:CustomerRecord; vehicleId:string; serviceType:string; preferredDate:string; notes:string; channel:ServiceRequestRecord["channel"] };

/** Validates and builds a service request. `today` is a YYYY-MM-DD calendar day; preferred dates must be later. */
export function createServiceRequest(input:ServiceRequestInput, existing:ServiceRequestRecord[], today:string, now:string):{ok:true;request:ServiceRequestRecord}|{ok:false;message:string} {
  const vehicle = input.customer.vehicles.find((item) => item.id === input.vehicleId && item.status === "active");
  if (!vehicle) return { ok:false, message:"Select an active vehicle for this request." };
  if (!SERVICE_TYPES.includes(input.serviceType)) return { ok:false, message:"Select the type of service needed." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.preferredDate) || input.preferredDate <= today) return { ok:false, message:"Choose a preferred date after today." };
  const notes = input.notes.trim();
  if (notes.length > 1000) return { ok:false, message:"Keep the notes under 1,000 characters." };
  return { ok:true, request:{
    id:createFeatureId("request"), reference:nextSequentialReference(existing.map((item) => item.reference), "JB-SR-"), channel:input.channel,
    customerId:input.customer.id, vehicleId:vehicle.id, customerName:input.customer.name, customerMobile:input.customer.mobile,
    vehicleLabel:vehicle.label, registration:vehicle.registration, serviceType:input.serviceType, preferredDate:input.preferredDate,
    notes:notes || undefined, submittedAt:now, updatedAt:now, status:"Submitted",
  } };
}
