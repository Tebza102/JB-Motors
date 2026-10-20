import { createFeatureId } from "../problem-reports/types.ts";
import type { CustomerRecord, JobActivity, JobCardDraft, JobNote, JobPriority, JobProgress, JobStatus, RoadTestResult, WorkshopPrototypeData } from "./types";

export const JOB_WORKFLOW_STEPS:JobStatus[] = ["Scheduled","In Progress","Waiting Parts","QC","Ready"];

export type SeedJob = {
  id:string; reference:string; customerId:string; vehicleId:string; assignee:string; priority:JobPriority; status:JobStatus; due:string; work:string;
  complaint?:string; odometer?:number; hasFullDetail?:boolean; statusChangedAt?:string; statusChangedBy?:string;
  qcChecks?:string[]; inspectionChecks?:string[]; roadTest?:RoadTestResult;
};

/** View model shared by every job screen, built from seeded jobs, local drafts and the progress overlay. */
export type WorkshopJob = {
  id:string; reference:string; origin:"seeded"|"local"; hasFullDetail:boolean;
  customerId:string; vehicleId:string; customerName:string; customerMobile?:string; vehicleLabel:string; registration:string;
  assignee:string; priority:JobPriority; work:string; complaint?:string; odometer?:number; due:string; createdAt?:string;
  status:JobStatus; statusChangedAt?:string; statusChangedBy?:string; initialStatus?:JobCardDraft["initialStatus"];
  qcChecks:string[]; inspectionChecks:string[]; roadTest:RoadTestResult; sourceReference?:string;
};

export type JobMutation = { ok:true; data:WorkshopPrototypeData; message:string } | { ok:false; message:string };

const summarise = (text:string) => text.length > 64 ? `${text.slice(0, 61).trimEnd()}…` : text;

export function buildJobList(seedJobs:SeedJob[], data:Pick<WorkshopPrototypeData,"jobCards"|"jobProgress">, customers:CustomerRecord[]):WorkshopJob[] {
  const progress = new Map(data.jobProgress.map((item) => [item.jobId, item]));
  const lookup = (customerId:string, vehicleId:string) => {
    const customer = customers.find((item) => item.id === customerId);
    return { customer, vehicle: customer?.vehicles.find((item) => item.id === vehicleId) };
  };
  const local = data.jobCards.map((job):WorkshopJob => {
    const { customer, vehicle } = lookup(job.customerId, job.vehicleId);
    const overlay = progress.get(job.id);
    return {
      id:job.id, reference:job.reference, origin:"local", hasFullDetail:false,
      customerId:job.customerId, vehicleId:job.vehicleId,
      customerName:customer?.name ?? job.customerNameSnapshot ?? "Unknown customer", customerMobile:customer?.mobile,
      vehicleLabel:vehicle?.label ?? job.vehicleSnapshot ?? "Unknown vehicle", registration:vehicle?.registration ?? job.registrationSnapshot ?? "Pending",
      assignee:job.assignee, priority:job.priority, work:summarise(job.complaint), complaint:job.complaint, odometer:job.odometer,
      due:"Not scheduled", createdAt:job.createdAt, initialStatus:job.initialStatus, sourceReference:job.sourceReference,
      status:overlay?.status ?? "Draft", statusChangedAt:overlay?.statusChangedAt ?? job.createdAt, statusChangedBy:overlay?.statusChangedBy,
      qcChecks:overlay?.qcChecks ?? [], inspectionChecks:overlay?.inspectionChecks ?? [], roadTest:overlay?.roadTest ?? "Pending",
    };
  });
  const seeded = seedJobs.map((job):WorkshopJob => {
    const { customer, vehicle } = lookup(job.customerId, job.vehicleId);
    const overlay = progress.get(job.id);
    return {
      id:job.id, reference:job.reference, origin:"seeded", hasFullDetail:Boolean(job.hasFullDetail),
      customerId:job.customerId, vehicleId:job.vehicleId,
      customerName:customer?.name ?? "Unknown customer", customerMobile:customer?.mobile,
      vehicleLabel:vehicle?.label ?? "Unknown vehicle", registration:vehicle?.registration ?? "Pending",
      assignee:job.assignee, priority:job.priority, work:job.work, complaint:job.complaint, odometer:job.odometer, due:job.due,
      status:overlay?.status ?? job.status, statusChangedAt:overlay?.statusChangedAt ?? job.statusChangedAt, statusChangedBy:overlay?.statusChangedBy ?? job.statusChangedBy,
      qcChecks:overlay?.qcChecks ?? job.qcChecks ?? [], inspectionChecks:overlay?.inspectionChecks ?? job.inspectionChecks ?? [], roadTest:overlay?.roadTest ?? job.roadTest ?? "Pending",
    };
  });
  return [...local, ...seeded];
}

export const isQcComplete = (job:WorkshopJob, checklist:string[]) => checklist.every((item) => job.qcChecks.includes(item)) && job.roadTest === "Passed";

/** Returns why a status change is not allowed, or null when it may proceed. */
export function getStatusChangeBlocker(job:WorkshopJob, next:JobStatus, qcChecklist:string[]):string|null {
  if (job.status === next) return `${job.reference} is already ${next}.`;
  if (next === "Draft") return "A job cannot return to Draft once it has entered the workshop.";
  if (next === "Ready" && !isQcComplete(job, qcChecklist)) return "Complete every QC check and record a passed road test before marking the vehicle Ready.";
  return null;
}

const upsertProgress = (items:JobProgress[], jobId:string, patch:Omit<JobProgress,"jobId">):JobProgress[] => {
  const existing = items.find((item) => item.jobId === jobId);
  return [{ ...existing, ...patch, jobId }, ...items.filter((item) => item.jobId !== jobId)];
};
const activity = (jobId:string, actor:string, summary:string, at:string):JobActivity => ({ id:createFeatureId("activity"), jobId, actor, summary, at });

export function changeJobStatus(data:WorkshopPrototypeData, job:WorkshopJob, next:JobStatus, qcChecklist:string[], actor:string, now:string):JobMutation {
  const blocker = getStatusChangeBlocker(job, next, qcChecklist);
  if (blocker) return { ok:false, message:blocker };
  return {
    ok:true, message:`${job.reference} moved to ${next}`,
    data:{ ...data,
      jobProgress:upsertProgress(data.jobProgress, job.id, { status:next, statusChangedAt:now, statusChangedBy:actor }),
      jobActivity:[activity(job.id, actor, `Moved from ${job.status} to ${next}`, now), ...data.jobActivity] },
  };
}

export function toggleJobChecklistItem(data:WorkshopPrototypeData, job:WorkshopJob, list:"qc"|"inspection", item:string, actor:string, now:string):JobMutation {
  if (list === "qc" && job.status === "Ready") return { ok:false, message:"Move the job out of Ready before changing its QC checklist." };
  const current = list === "qc" ? job.qcChecks : job.inspectionChecks;
  const checked = !current.includes(item);
  const next = checked ? [...current, item] : current.filter((entry) => entry !== item);
  return {
    ok:true, message:`${item} ${checked ? "checked" : "unchecked"} on ${job.reference}`,
    data:{ ...data,
      jobProgress:upsertProgress(data.jobProgress, job.id, list === "qc" ? { qcChecks:next } : { inspectionChecks:next }),
      jobActivity:[activity(job.id, actor, `${list === "qc" ? "QC" : "Inspection"} check ${checked ? "completed" : "cleared"}: ${item}`, now), ...data.jobActivity] },
  };
}

export function setRoadTestResult(data:WorkshopPrototypeData, job:WorkshopJob, result:RoadTestResult, actor:string, now:string):JobMutation {
  if (job.roadTest === result) return { ok:false, message:`Road test is already recorded as ${result}.` };
  if (job.status === "Ready" && result !== "Passed") return { ok:false, message:"Move the job out of Ready before changing a passed road test." };
  return {
    ok:true, message:`Road test recorded as ${result} on ${job.reference}`,
    data:{ ...data,
      jobProgress:upsertProgress(data.jobProgress, job.id, { roadTest:result }),
      jobActivity:[activity(job.id, actor, `Road test recorded: ${result}`, now), ...data.jobActivity] },
  };
}

export function addJobNote(data:WorkshopPrototypeData, job:WorkshopJob, text:string, author:string, now:string):JobMutation {
  const trimmed = text.trim();
  if (trimmed.length < 3) return { ok:false, message:"Write a note of at least 3 characters before saving." };
  if (trimmed.length > 2000) return { ok:false, message:"Keep the note under 2,000 characters." };
  const note:JobNote = { id:createFeatureId("note"), jobId:job.id, createdAt:now, author, text:trimmed };
  return {
    ok:true, message:`Note saved to ${job.reference} in this browser`,
    data:{ ...data, jobNotes:[note, ...data.jobNotes], jobActivity:[activity(job.id, author, "Note added", now), ...data.jobActivity] },
  };
}

export const getJobNotes = (data:Pick<WorkshopPrototypeData,"jobNotes">, jobId:string) => data.jobNotes.filter((note) => note.jobId === jobId);
export const getJobActivity = (data:Pick<WorkshopPrototypeData,"jobActivity">, jobId:string) => data.jobActivity.filter((entry) => entry.jobId === jobId);
export const findJobBySource = (jobs:WorkshopJob[], sourceReference:string) => jobs.find((job) => job.sourceReference === sourceReference);

export type EstimateConversionSource = { reference:string; customerId:string; vehicleId:string; customerName:string; vehicleLabel:string; registration:string; odometer:number; scope:string[] };

/** Idempotent: a second conversion of the same estimate returns the job that already exists. */
export function convertEstimateToJob(data:WorkshopPrototypeData, jobs:WorkshopJob[], source:EstimateConversionSource, actor:string, now:string):{ok:true;data:WorkshopPrototypeData;jobId:string;created:boolean;message:string} {
  const existing = findJobBySource(jobs, source.reference);
  if (existing) return { ok:true, data, jobId:existing.id, created:false, message:`${source.reference} is already linked to ${existing.reference}; opened that job card` };
  const id = createFeatureId("job");
  const job:JobCardDraft = {
    id, reference:`DRAFT-${id.slice(-6).toUpperCase()}`, createdAt:now, customerId:source.customerId, vehicleId:source.vehicleId,
    customerNameSnapshot:source.customerName, vehicleSnapshot:source.vehicleLabel, registrationSnapshot:source.registration,
    complaint:`Approved estimate ${source.reference}: ${source.scope.join("; ")}.`, odometer:source.odometer,
    assignee:"Unassigned", priority:"Routine", initialStatus:"Scheduled", status:"Draft", sourceReference:source.reference,
  };
  return {
    ok:true, jobId:id, created:true, message:`${source.reference} converted to draft job card ${job.reference}`,
    data:{ ...data, jobCards:[job, ...data.jobCards], jobActivity:[activity(id, actor, `Created from approved estimate ${source.reference}`, now), ...data.jobActivity] },
  };
}
