export const JOB_STATUSES = ["Draft", "Scheduled", "In Progress", "Waiting Parts", "QC", "Ready"] as const;
export const ROAD_TEST_RESULTS = ["Pending", "Passed", "Requires attention"] as const;
export const SERVICE_REQUEST_STATUSES = ["Submitted", "Contacted", "Booked", "Closed"] as const;
export const CONTACT_PREFERENCES = ["WhatsApp", "Phone call", "SMS", "Email"] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];
export type RoadTestResult = (typeof ROAD_TEST_RESULTS)[number];
export type ServiceRequestStatus = (typeof SERVICE_REQUEST_STATUSES)[number];
export type ContactPreference = (typeof CONTACT_PREFERENCES)[number];
export type JobPriority = "Routine"|"High"|"Urgent";

export type VehicleRecord = { id:string; label:string; registration:string; vin?:string; colour?:string; odometer?:number; status:"active"|"archived" };
export type CustomerRecord = { id:string; createdAt:string; name:string; mobile:string; email?:string; vehicles:VehicleRecord[]; source:"seeded"|"local"; preferredContact?:ContactPreference; serviceReminders?:boolean };
export type JobCardDraft = { id:string; reference:string; createdAt:string; customerId:string; vehicleId:string; customerNameSnapshot?:string; vehicleSnapshot?:string; registrationSnapshot?:string; complaint:string; odometer:number; assignee:string; priority:JobPriority; initialStatus:"Scheduled"|"In Progress"|"Waiting Parts"; status:"Draft"; sourceReference?:string };
/** Field-level overlay for any job (seeded or local); absent fields fall back to the job's own values. */
export type JobProgress = { jobId:string; status?:JobStatus; statusChangedAt?:string; statusChangedBy?:string; qcChecks?:string[]; inspectionChecks?:string[]; roadTest?:RoadTestResult };
export type JobNote = { id:string; jobId:string; createdAt:string; author:string; text:string };
export type JobActivity = { id:string; jobId:string; at:string; actor:string; summary:string };
export type DiagnosticFinding = { id:string; jobId:string; createdAt:string; severity:"Critical"|"Attention"|"Observed"; title:string; details:string; technicianNote?:string };
export type FollowUpMethod = "call"|"whatsapp"|"manual";
export type FollowUpRecord = { id:string; priority:"Urgent"|"High"|"Medium"; reason:string; customerId:string; customerName:string; vehicle:string; vehicleId?:string; phone:string; last:string; due:string; tone:string; status:"active"|"completed"; lastOpenedMethod?:Exclude<FollowUpMethod,"manual">; completedAt?:string };
export type FollowUpActivity = { id:string; followUpId:string; customerName:string; method:FollowUpMethod; note:string; completedAt:string };
export type OdometerReading = { id:string; customerId:string; vehicleId:string; kilometres:number; recordedAt:string; source:"Customer portal"|"Workshop" };
export type ServiceRequestRecord = { id:string; reference:string; channel:"Customer portal"|"Phone"; customerId:string; vehicleId:string; customerName:string; customerMobile:string; vehicleLabel:string; registration:string; serviceType:string; preferredDate:string; notes?:string; submittedAt:string; updatedAt:string; status:ServiceRequestStatus };
export type CreationDialogState = {kind:"customer"}|{kind:"job";customerId?:string;vehicleId?:string;complaint?:string;sourceReference?:string}|{kind:"finding";jobId:string}|{kind:"service-request"}|null;
export type CustomerDialogState = {kind:"edit-customer";customerId:string}|{kind:"add-vehicle";customerId:string}|{kind:"edit-vehicle";customerId:string;vehicleId:string}|null;
export type WorkshopPrototypeData = { customers:CustomerRecord[]; jobCards:JobCardDraft[]; findings:DiagnosticFinding[]; followUps:FollowUpRecord[]; followUpActivities:FollowUpActivity[]; jobProgress:JobProgress[]; jobNotes:JobNote[]; jobActivity:JobActivity[]; odometerReadings:OdometerReading[]; serviceRequests:ServiceRequestRecord[] };
export type PrototypeMutationResult = {ok:true}|{ok:false;message:string};
