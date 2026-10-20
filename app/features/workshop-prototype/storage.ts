import { CONTACT_PREFERENCES, JOB_STATUSES, ROAD_TEST_RESULTS, SERVICE_REQUEST_STATUSES } from "./types.ts";
import type { CustomerRecord, JobCardDraft, PrototypeMutationResult, WorkshopPrototypeData } from "./types.ts";

const STORAGE_KEY = "jb-motors-workshop-prototype";
const BACKUP_KEY_PREFIX = `${STORAGE_KEY}.backup.`;
const STORAGE_VERSION = 3;
const COLLECTION_KEYS = ["customers","jobCards","findings","followUps","followUpActivities","jobProgress","jobNotes","jobActivity","odometerReadings","serviceRequests"] as const;
const UNREADABLE_WARNING = "Saved workshop records in this browser could not be read. They have not been changed. Back them up and reset them in Settings → Local demo data before saving new records.";
const BLOCKED_SAVE_MESSAGE = "Nothing was saved because the existing workshop records in this browser could not be read. Back them up and reset them in Settings → Local demo data first.";

export const workshopPrototypeStorageKey = STORAGE_KEY;
export const createEmptyWorkshopData = (): WorkshopPrototypeData => ({ customers:[], jobCards:[], findings:[], followUps:[], followUpActivities:[], jobProgress:[], jobNotes:[], jobActivity:[], odometerReadings:[], serviceRequests:[] });

const isObject = (value:unknown): value is Record<string,unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const isString = (value:unknown): value is string => typeof value === "string";
const isText = (value:unknown): value is string => typeof value === "string" && value.length > 0;
const isOptionalString = (value:unknown) => value === undefined || typeof value === "string";
const isTimestamp = (value:unknown) => isText(value) && !Number.isNaN(Date.parse(value));
const isOptionalTimestamp = (value:unknown) => value === undefined || isTimestamp(value);
const isKilometres = (value:unknown) => typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 999999;
const isOneOf = (values:readonly string[], value:unknown) => typeof value === "string" && values.includes(value);
const isStringList = (value:unknown) => value === undefined || (Array.isArray(value) && value.every(isString));
const slug = (value:string) => value.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");

const isVehicle = (value:unknown) => isObject(value) && isText(value.id) && isText(value.label) && isText(value.registration) && isOptionalString(value.vin) && isOptionalString(value.colour) && (value.odometer === undefined || isKilometres(value.odometer)) && isOneOf(["active","archived"], value.status);
const isCustomer = (value:unknown) => isObject(value) && isText(value.id) && isTimestamp(value.createdAt) && isText(value.name) && isString(value.mobile) && isOptionalString(value.email) && Array.isArray(value.vehicles) && value.vehicles.every(isVehicle) && isOneOf(["seeded","local"], value.source) && (value.preferredContact === undefined || isOneOf(CONTACT_PREFERENCES, value.preferredContact)) && (value.serviceReminders === undefined || typeof value.serviceReminders === "boolean");
const isJobCard = (value:unknown) => isObject(value) && isText(value.id) && isText(value.reference) && isTimestamp(value.createdAt) && isText(value.customerId) && isText(value.vehicleId) && isOptionalString(value.customerNameSnapshot) && isOptionalString(value.vehicleSnapshot) && isOptionalString(value.registrationSnapshot) && isText(value.complaint) && isKilometres(value.odometer) && isText(value.assignee) && isOneOf(["Routine","High","Urgent"], value.priority) && isOneOf(["Scheduled","In Progress","Waiting Parts"], value.initialStatus) && value.status === "Draft" && isOptionalString(value.sourceReference);
const isFinding = (value:unknown) => isObject(value) && isText(value.id) && isText(value.jobId) && isTimestamp(value.createdAt) && isOneOf(["Critical","Attention","Observed"], value.severity) && isText(value.title) && isText(value.details) && isOptionalString(value.technicianNote);
const isFollowUp = (value:unknown) => isObject(value) && isText(value.id) && isOneOf(["Urgent","High","Medium"], value.priority) && isText(value.reason) && isText(value.customerId) && isText(value.customerName) && isString(value.vehicle) && isOptionalString(value.vehicleId) && isString(value.phone) && isString(value.last) && isString(value.due) && isString(value.tone) && isOneOf(["active","completed"], value.status) && (value.lastOpenedMethod === undefined || isOneOf(["call","whatsapp"], value.lastOpenedMethod)) && isOptionalTimestamp(value.completedAt);
const isFollowUpActivity = (value:unknown) => isObject(value) && isText(value.id) && isText(value.followUpId) && isText(value.customerName) && isOneOf(["call","whatsapp","manual"], value.method) && isString(value.note) && isTimestamp(value.completedAt);
const isJobProgress = (value:unknown) => isObject(value) && isText(value.jobId) && (value.status === undefined || isOneOf(JOB_STATUSES, value.status)) && isOptionalTimestamp(value.statusChangedAt) && isOptionalString(value.statusChangedBy) && isStringList(value.qcChecks) && isStringList(value.inspectionChecks) && (value.roadTest === undefined || isOneOf(ROAD_TEST_RESULTS, value.roadTest));
const isJobNote = (value:unknown) => isObject(value) && isText(value.id) && isText(value.jobId) && isTimestamp(value.createdAt) && isText(value.author) && isText(value.text);
const isJobActivity = (value:unknown) => isObject(value) && isText(value.id) && isText(value.jobId) && isTimestamp(value.at) && isText(value.actor) && isText(value.summary);
const isOdometerReading = (value:unknown) => isObject(value) && isText(value.id) && isText(value.customerId) && isText(value.vehicleId) && isKilometres(value.kilometres) && isTimestamp(value.recordedAt) && isOneOf(["Customer portal","Workshop"], value.source);
const isServiceRequest = (value:unknown) => isObject(value) && isText(value.id) && isText(value.reference) && isOneOf(["Customer portal","Phone"], value.channel) && isText(value.customerId) && isText(value.vehicleId) && isText(value.customerName) && isString(value.customerMobile) && isText(value.vehicleLabel) && isText(value.registration) && isText(value.serviceType) && isString(value.preferredDate) && /^\d{4}-\d{2}-\d{2}$/.test(value.preferredDate) && isOptionalString(value.notes) && isTimestamp(value.submittedAt) && isTimestamp(value.updatedAt) && isOneOf(SERVICE_REQUEST_STATUSES, value.status);

const RECORD_VALIDATORS: Record<(typeof COLLECTION_KEYS)[number], (value:unknown) => boolean> = {
  customers:isCustomer, jobCards:isJobCard, findings:isFinding, followUps:isFollowUp, followUpActivities:isFollowUpActivity,
  jobProgress:isJobProgress, jobNotes:isJobNote, jobActivity:isJobActivity, odometerReadings:isOdometerReading, serviceRequests:isServiceRequest,
};

/** Every collection must be present and every record must match its shape; partial data is treated as unreadable. */
export function isWorkshopPrototypeData(value:unknown): value is WorkshopPrototypeData {
  return isObject(value) && COLLECTION_KEYS.every((key) => Array.isArray(value[key]) && (value[key] as unknown[]).every(RECORD_VALIDATORS[key]));
}

function migrateV1(data:Record<string,unknown>):Record<string,unknown>|null {
  if (!Array.isArray(data.customers)||!Array.isArray(data.jobCards)||!Array.isArray(data.findings)) return null;
  const customers:CustomerRecord[] = data.customers.filter(isObject).map((item,index) => {
    const id=isString(item.id)?item.id:`migrated-customer-${index}`;
    return {id,createdAt:isString(item.createdAt)?item.createdAt:new Date(0).toISOString(),name:isString(item.name)?item.name:"Migrated customer",mobile:isString(item.mobile)?item.mobile:"",email:isString(item.email)?item.email:undefined,source:"local",vehicles:[{id:`${id}-vehicle-1`,label:isString(item.vehicle)?item.vehicle:"Vehicle details pending",registration:isString(item.registration)?item.registration:"PENDING",status:"active"}]};
  });
  const jobCards:JobCardDraft[] = data.jobCards.filter(isObject).map((item,index) => {
    const name=isString(item.customerName)?item.customerName:"Migrated customer"; const matched=customers.find((customer)=>customer.name===name); const customerId=matched?.id??`legacy-${slug(name)||index}`;
    return {id:isString(item.id)?item.id:`migrated-job-${index}`,reference:isString(item.reference)?item.reference:`DRAFT-MIGRATED-${index+1}`,createdAt:isString(item.createdAt)?item.createdAt:new Date(0).toISOString(),customerId,vehicleId:matched?.vehicles[0]?.id??`${customerId}-vehicle`,customerNameSnapshot:name,vehicleSnapshot:isString(item.vehicle)?item.vehicle:"Migrated vehicle",registrationSnapshot:isString(item.registration)?item.registration:"PENDING",complaint:isString(item.complaint)?item.complaint:"Migrated job card",odometer:typeof item.odometer==="number"?item.odometer:0,assignee:isString(item.assignee)?item.assignee:"Unassigned",priority:item.priority==="High"||item.priority==="Urgent"?item.priority:"Routine",initialStatus:item.initialStatus==="In Progress"||item.initialStatus==="Waiting Parts"?item.initialStatus:"Scheduled",status:"Draft"};
  });
  return {customers,jobCards,findings:data.findings,followUps:[],followUpActivities:[]};
}

/** Adds collections introduced after v2 without touching existing records. */
const upgradeToCurrent = (data:Record<string,unknown>) => ({ ...createEmptyWorkshopData(), ...data });

function readStoredData(raw:string):{ok:true;data:WorkshopPrototypeData;migrated:boolean}|{ok:false} {
  try {
    const envelope = JSON.parse(raw) as unknown;
    if (!isObject(envelope) || !isObject(envelope.data)) return { ok:false };
    let candidate:unknown = null;
    if (envelope.version === STORAGE_VERSION) candidate = envelope.data;
    else if (envelope.version === 2) candidate = upgradeToCurrent(envelope.data);
    else if (envelope.version === 1) { const migrated = migrateV1(envelope.data); candidate = migrated ? upgradeToCurrent(migrated) : null; }
    if (!isWorkshopPrototypeData(candidate)) return { ok:false };
    return { ok:true, data:candidate, migrated:envelope.version !== STORAGE_VERSION };
  } catch {
    return { ok:false };
  }
}

export function loadWorkshopPrototypeData():{data:WorkshopPrototypeData;warning:string|null;migrated:boolean;blocked:boolean} {
  if(typeof window==="undefined") return {data:createEmptyWorkshopData(),warning:null,migrated:false,blocked:false};
  let raw:string|null;
  try{raw=window.localStorage.getItem(STORAGE_KEY);}catch{return {data:createEmptyWorkshopData(),warning:"Local prototype storage is unavailable. New records will not survive a refresh.",migrated:false,blocked:false};}
  if(raw===null)return {data:createEmptyWorkshopData(),warning:null,migrated:false,blocked:false};
  const stored = readStoredData(raw);
  if (!stored.ok) return {data:createEmptyWorkshopData(),warning:UNREADABLE_WARNING,migrated:false,blocked:true};
  return {data:stored.data,warning:null,migrated:stored.migrated,blocked:false};
}

export function saveWorkshopPrototypeData(data:WorkshopPrototypeData):PrototypeMutationResult {
  if(typeof window==="undefined")return {ok:false,message:"Local prototype storage is unavailable."};
  try{
    const storage = window.localStorage;
    const existing = storage.getItem(STORAGE_KEY);
    if (existing !== null && !readStoredData(existing).ok) return {ok:false,message:BLOCKED_SAVE_MESSAGE};
    if (!isWorkshopPrototypeData(data)) return {ok:false,message:"The record contains invalid details and was not saved."};
    storage.setItem(STORAGE_KEY,JSON.stringify({version:STORAGE_VERSION,data}));
    return {ok:true};
  }catch{return {ok:false,message:"The record could not be saved locally. No existing demo data was changed."};}
}

/** Copies whatever is stored (readable or not) to a timestamped backup key, then clears the working key. */
export function backupAndResetWorkshopPrototypeData(now = new Date()):{ok:true;backupKey:string|null}|{ok:false;message:string} {
  if(typeof window==="undefined")return {ok:false,message:"Local prototype storage is unavailable."};
  try{
    const storage = window.localStorage;
    const raw = storage.getItem(STORAGE_KEY);
    if (raw === null) return {ok:true,backupKey:null};
    const backupKey = `${BACKUP_KEY_PREFIX}${now.toISOString()}`;
    storage.setItem(backupKey, raw);
    if (storage.getItem(backupKey) !== raw) return {ok:false,message:"The backup could not be verified, so nothing was reset."};
    storage.removeItem(STORAGE_KEY);
    return {ok:true,backupKey};
  }catch{return {ok:false,message:"The local records could not be backed up, so nothing was reset."};}
}

/** Builds a downloadable snapshot of the given storage keys. Unreadable values are kept verbatim as text. */
export function createLocalBackupJson(keys:string[] = [STORAGE_KEY], now = new Date()):string {
  const entries:Record<string,unknown> = {};
  if (typeof window !== "undefined") {
    for (const key of keys) {
      try {
        const raw = window.localStorage.getItem(key);
        if (raw === null) continue;
        try { entries[key] = JSON.parse(raw); } catch { entries[key] = { unreadableText: raw }; }
      } catch { entries[key] = { unavailable: true }; }
    }
  }
  return JSON.stringify({ exportedAt: now.toISOString(), note: "JB Motors prototype browser data. Synthetic demonstration records only.", entries }, null, 2);
}
