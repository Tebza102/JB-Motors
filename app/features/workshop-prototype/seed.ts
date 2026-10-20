import { ESTIMATE_DOCUMENT } from "../documents/data.ts";
import type { SeedJob } from "./jobs.ts";
import type { ServicePlan } from "./service.ts";
import type { CustomerRecord, FollowUpRecord, ServiceRequestRecord } from "./types";

// Synthetic demonstration records. Local browser edits overlay these by id; they are never current workshop facts.

export const SAMPLE_PERIOD_LABEL = "Sample data · August 2026";
/** The customer portal has no sign-in; it always shows this demo customer. */
export const DEMO_PORTAL_CUSTOMER_ID = "customer-thabo";

export const SEED_CUSTOMERS:CustomerRecord[] = [
  {id:"customer-thabo",createdAt:"2022-03-18T00:00:00.000Z",name:"Thabo Mokoena",mobile:"082 555 0148",email:"thabo.mokoena@email.co.za",source:"seeded",preferredContact:"WhatsApp",serviceReminders:true,vehicles:[{id:"vehicle-corolla",label:"2020 Toyota Corolla 1.8 Prestige",registration:"GP 123-456",vin:"AHTBB3JE0LJ081624",colour:"Silver",odometer:143240,status:"active"}]},
  {id:"customer-naledi",createdAt:"2026-01-01T00:00:00.000Z",name:"Naledi Khumalo",mobile:"076 224 9180",source:"seeded",vehicles:[{id:"vehicle-i20",label:"Hyundai i20",registration:"GP 663-814",status:"active"}]},
  {id:"customer-sipho",createdAt:"2026-01-01T00:00:00.000Z",name:"Sipho Dlamini",mobile:"083 771 0925",source:"seeded",vehicles:[{id:"vehicle-ranger",label:"2019 Ford Ranger 2.2 TDCi",registration:"NW 81 LM GP",odometer:186420,status:"active"}]},
  {id:"customer-anika",createdAt:"2026-01-01T00:00:00.000Z",name:"Anika van Wyk",mobile:"072 604 3319",email:"anika.vw@email.co.za",source:"seeded",vehicles:[{id:"vehicle-ecosport",label:"2018 Ford EcoSport 1.0 EcoBoost",registration:"GP 334-981",odometer:96420,status:"active"}]},
  {id:"customer-kabelo",createdAt:"2026-01-01T00:00:00.000Z",name:"Kabelo Ndlovu",mobile:"079 441 8802",source:"seeded",vehicles:[{id:"vehicle-polo",label:"2021 VW Polo 1.0 TSI",registration:"CA 459-882",status:"active"}]},
  {id:"customer-lerato",createdAt:"2026-01-01T00:00:00.000Z",name:"Lerato Molefe",mobile:"081 632 1470",source:"seeded",vehicles:[{id:"vehicle-picanto",label:"2017 Kia Picanto 1.0",registration:"GP 901-212",status:"active"}]},
];

/** Earlier problem-report builds used different ids for the demo customer and vehicle. */
export const LEGACY_ID_ALIASES:Record<string,string> = { "customer-thabo-mokoena":"customer-thabo", "vehicle-toyota-corolla":"vehicle-corolla" };
export const resolveLegacyId = (id:string) => LEGACY_ID_ALIASES[id] ?? id;

export const SEED_FOLLOW_UPS:FollowUpRecord[] = [
  {id:"followup-thabo-service",priority:"High",reason:"Kilometres updated · Service due soon",customerId:"customer-thabo",customerName:"Thabo Mokoena",vehicle:"Toyota Corolla · GP 123-456",vehicleId:"vehicle-corolla",phone:"082 555 0148",last:"Customer update · 20 Aug 2026 (sample)",due:"1,760 km remaining",tone:"orange",status:"active"},
  {id:"followup-naledi-overdue",priority:"Urgent",reason:"Service overdue",customerId:"customer-naledi",customerName:"Naledi Khumalo",vehicle:"Hyundai i20 · GP 663-814",vehicleId:"vehicle-i20",phone:"076 224 9180",last:"WhatsApp sent · 12 Aug 2026 (sample)",due:"Overdue by 1,250 km",tone:"red",status:"active"},
  {id:"followup-kabelo-problem",priority:"High",reason:"New problem report",customerId:"customer-kabelo",customerName:"Kabelo Ndlovu",vehicle:"VW Polo · CA 459-882",vehicleId:"vehicle-polo",phone:"079 441 8802",last:"Report submitted · 20 Aug 2026 (sample)",due:"Warning light / power loss",tone:"red",status:"active"},
  {id:"followup-anika-estimate",priority:"Medium",reason:"Estimate follow-up",customerId:"customer-anika",customerName:"Anika van Wyk",vehicle:"Ford EcoSport · GP 334-981",vehicleId:"vehicle-ecosport",phone:"072 604 3319",last:"Estimate sent · 19 Aug 2026 (sample)",due:"JB-EST-0226 · R8,038.50",tone:"amber",status:"active"},
  {id:"followup-lerato-request",priority:"Medium",reason:"Service request",customerId:"customer-lerato",customerName:"Lerato Molefe",vehicle:"Kia Picanto · GP 901-212",vehicleId:"vehicle-picanto",phone:"081 632 1470",last:"Request submitted · 20 Aug 2026 (sample)",due:"Preferred date 25 Aug 2026",tone:"blue",status:"active"},
];

export const QC_CHECKLIST = ["Work completed against authorisation","Repair verified against complaint","No warning lights present","Fluid levels checked","Road test completed","Vehicle ready notification approved"];
export const INSPECTION_CHECKLIST = ["Customer complaint confirmed","Vehicle condition photographed","Warning lights scanned","Fluid levels checked","Road test before work","Parts requirement confirmed"];

/** One coherent seeded job list shared by the dashboard, table, board, detail and technician views. */
export const SEED_JOBS:SeedJob[] = [
  {id:"JB-JOB-0248",reference:"JB-JOB-0248",customerId:"customer-sipho",vehicleId:"vehicle-ranger",assignee:"Petrus Nkosi",priority:"High",status:"In Progress",due:"Today 16:00",work:"Brake repair",odometer:186420,hasFullDetail:true,complaint:"Brake pedal feels soft and the vehicle pulls slightly to the left when braking. A warning light came on yesterday.",statusChangedAt:"2026-08-20T09:42:00+02:00",statusChangedBy:"Jabulani (sample)",qcChecks:[QC_CHECKLIST[0],QC_CHECKLIST[2],QC_CHECKLIST[3]],inspectionChecks:INSPECTION_CHECKLIST.slice(0,4)},
  {id:"JB-JOB-0249",reference:"JB-JOB-0249",customerId:"customer-thabo",vehicleId:"vehicle-corolla",assignee:"Petrus Nkosi",priority:"Routine",status:"Scheduled",due:"Today 14:30",work:"Minor service"},
  {id:"JB-JOB-0246",reference:"JB-JOB-0246",customerId:"customer-kabelo",vehicleId:"vehicle-polo",assignee:"Mandla Dube",priority:"High",status:"Waiting Parts",due:"2 days",work:"Turbo actuator replacement"},
  {id:"JB-JOB-0244",reference:"JB-JOB-0244",customerId:"customer-naledi",vehicleId:"vehicle-i20",assignee:"Mandla Dube",priority:"Routine",status:"QC",due:"Today 12:15",work:"Front brakes"},
  {id:"JB-JOB-0243",reference:"JB-JOB-0243",customerId:"customer-lerato",vehicleId:"vehicle-picanto",assignee:"Petrus Nkosi",priority:"Routine",status:"Ready",due:"Today 10:40",work:"Battery and charging check",qcChecks:[...QC_CHECKLIST],roadTest:"Passed"},
];

export const SERVICE_PLANS:ServicePlan[] = [
  { vehicleId:"vehicle-corolla", intervalKm:10000, lastServiceKm:135000, lastServiceDate:"2026-02-14", lastServiceLabel:"Major service" },
];

/** Sample odometer history; browser-saved readings are appended to it. */
export const SEED_ODOMETER_HISTORY:Array<{vehicleId:string;kilometres:number;day:string;source:"Workshop"|"Customer portal"}> = [
  { vehicleId:"vehicle-corolla", kilometres:115000, day:"2025-01-08", source:"Workshop" },
  { vehicleId:"vehicle-corolla", kilometres:125000, day:"2025-08-23", source:"Workshop" },
  { vehicleId:"vehicle-corolla", kilometres:135000, day:"2026-02-14", source:"Workshop" },
  { vehicleId:"vehicle-corolla", kilometres:142100, day:"2026-08-03", source:"Customer portal" },
  { vehicleId:"vehicle-corolla", kilometres:142760, day:"2026-08-12", source:"Customer portal" },
  { vehicleId:"vehicle-corolla", kilometres:143240, day:"2026-08-20", source:"Customer portal" },
];

export const SEED_SERVICE_REQUESTS:ServiceRequestRecord[] = [
  {id:"request-lerato-service",reference:"JB-SR-0001",channel:"Customer portal",customerId:"customer-lerato",vehicleId:"vehicle-picanto",customerName:"Lerato Molefe",customerMobile:"081 632 1470",vehicleLabel:"2017 Kia Picanto 1.0",registration:"GP 901-212",serviceType:"Routine Service",preferredDate:"2026-08-25",notes:"Customer requested a morning drop-off and needs the vehicle before 16:00.",submittedAt:"2026-08-20T08:05:00+02:00",updatedAt:"2026-08-20T08:05:00+02:00",status:"Submitted"},
];

/** Amounts in integer cents. Only JB-INV-0194 has a full document in this prototype. */
export const SAMPLE_INVOICES = [
  { reference:"JB-INV-0194", customerId:"customer-sipho", jobReference:"JB-JOB-0248", totalCents:610650, paidCents:250000 },
  { reference:"JB-INV-0189", customerId:"customer-naledi", jobReference:"JB-JOB-0227", totalCents:185000, paidCents:0 },
];

export type InventoryItem = { sku:string; part:string; category:string; supplier:string; quantity:number; reorderLevel:number; costCents:number; sellCents:number };
export const INVENTORY_ITEMS:InventoryItem[] = [
  { sku:"BRK-1042", part:"ATE Front Brake Pads", category:"Brakes", supplier:"AutoZone", quantity:3, reorderLevel:4, costCents:68500, sellCents:102000 },
  { sku:"FLT-2208", part:"GUD Oil Filter Z260", category:"Filters", supplier:"Midas", quantity:18, reorderLevel:8, costCents:9650, sellCents:16500 },
  { sku:"OIL-5W30", part:"Shell Helix HX8 5W-30 5L", category:"Lubricants", supplier:"Shell", quantity:7, reorderLevel:6, costCents:62000, sellCents:89000 },
  { sku:"BAT-646", part:"Willard 646 Battery", category:"Electrical", supplier:"Battery Centre", quantity:0, reorderLevel:2, costCents:134000, sellCents:189500 },
  { sku:"SPK-NGK6", part:"NGK BKR6E Spark Plug", category:"Ignition", supplier:"Goldwagen", quantity:24, reorderLevel:12, costCents:8200, sellCents:14500 },
  { sku:"CLT-G12", part:"G12 Coolant 5L", category:"Cooling", supplier:"Goldwagen", quantity:5, reorderLevel:5, costCents:27500, sellCents:42000 },
];
export function getStockStatus(item:InventoryItem):"In stock"|"Low stock"|"Reorder"|"Out of stock" {
  if (item.quantity === 0) return "Out of stock";
  if (item.quantity < item.reorderLevel) return "Low stock";
  if (item.quantity === item.reorderLevel) return "Reorder";
  return "In stock";
}

/** Links the sample approved estimate to its customer and vehicle records for conversion. */
export const ESTIMATE_CONVERSION_SOURCE = {
  reference: ESTIMATE_DOCUMENT.reference,
  customerId: "customer-anika",
  vehicleId: "vehicle-ecosport",
  customerName: ESTIMATE_DOCUMENT.customer.name,
  vehicleLabel: ESTIMATE_DOCUMENT.vehicle.label,
  registration: ESTIMATE_DOCUMENT.vehicle.registration,
  odometer: 96420,
  scope: ESTIMATE_DOCUMENT.lines.filter((line) => line.detail === "Labour").map((line) => line.description),
  total: ESTIMATE_DOCUMENT.totals[ESTIMATE_DOCUMENT.totals.length - 1][1],
};
