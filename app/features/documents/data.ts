export type DocumentLine = {
  description: string;
  detail: string;
  quantity: string;
  unitPrice: string;
  total: string;
};

export type ServiceHistoryEntry = {
  date: string;
  kilometres: string;
  service: string;
  jobReference: string;
  total: string;
};

export type ReportGroup = {
  title: string;
  stats: Array<[value: string, label: string]>;
  bars: number[];
  insight: string;
};

export const DOCUMENT_PROFILE = {
  businessName: "JB Motors",
  ownerName: "Jabulani",
  location: "Ratanda, Heidelberg, Gauteng (GP)",
  logoPath: "/brand/jb-motors-logo.png",
  contactNote: "Telephone, email, street address and VAT details pending owner confirmation.",
} as const;

export const ESTIMATE_DOCUMENT = {
  type: "ESTIMATE",
  reference: "JB-EST-0226",
  status: "APPROVED",
  customer: { name: "Anika van Wyk", phone: "072 604 3319", email: "anika.vw@email.co.za" },
  vehicle: { label: "2018 Ford EcoSport 1.0 EcoBoost", registration: "GP 334-981", kilometres: "96,420 km" },
  created: "19 Aug 2026",
  validUntil: "26 Aug 2026",
  preparedBy: "Jabulani",
  lines: [
    { description: "Cooling system pressure test", detail: "Labour", quantity: "1.0 hr", unitPrice: "R650.00", total: "R650.00" },
    { description: "Replace thermostat housing", detail: "Labour", quantity: "2.0 hrs", unitPrice: "R650.00", total: "R1,300.00" },
    { description: "Thermostat housing assembly", detail: "Part - FOR-TH-184", quantity: "1", unitPrice: "R3,980.00", total: "R3,980.00" },
    { description: "Coolant concentrate 5L", detail: "Part - CLT-G12", quantity: "2", unitPrice: "R420.00", total: "R840.00" },
    { description: "Workshop consumables", detail: "Consumables", quantity: "1", unitPrice: "R220.00", total: "R220.00" },
  ] satisfies DocumentLine[],
  totals: [
    ["Subtotal", "R6,990.00"],
    ["VAT (15%)", "R1,048.50"],
    ["Discount", "R0.00"],
    ["TOTAL", "R8,038.50"],
  ] as Array<[string, string]>,
  notes: "Estimate based on inspection findings. Any additional work requires customer authorisation before proceeding.",
  terms: "Valid for 7 days. Parts pricing and availability are subject to supplier confirmation.",
} as const;

export const INVOICE_DOCUMENT = {
  type: "INVOICE",
  reference: "JB-INV-0194",
  status: "PARTIALLY PAID",
  customer: { name: "Sipho Dlamini", phone: "083 771 0925", vatStatus: "Customer VAT status: not registered" },
  vehicle: { label: "2019 Ford Ranger 2.2 TDCi", registration: "NW 81 LM GP", kilometres: "186,420 km" },
  issued: "20 Aug 2026",
  jobReference: "JB-JOB-0248",
  paymentTerms: "Payment due on collection",
  lines: [
    { description: "Replace brake master cylinder", detail: "Labour", quantity: "2.5", unitPrice: "R650.00", total: "R1,625.00" },
    { description: "Brake master cylinder", detail: "Part", quantity: "1", unitPrice: "R2,480.00", total: "R2,480.00" },
    { description: "ATE front brake pad set", detail: "Part", quantity: "1", unitPrice: "R1,020.00", total: "R1,020.00" },
    { description: "DOT 4 brake fluid", detail: "Consumable", quantity: "1", unitPrice: "R185.00", total: "R185.00" },
  ] satisfies DocumentLine[],
  totals: [
    ["Subtotal", "R5,310.00"],
    ["VAT (15%)", "R796.50"],
    ["Total", "R6,106.50"],
    ["Paid", "R2,500.00"],
    ["BALANCE DUE", "R3,606.50"],
  ] as Array<[string, string]>,
  payment: "EFT - Ref SIPHO-2008 - 20 Aug 2026",
} as const;

export const SERVICE_HISTORY_DOCUMENT = {
  type: "VEHICLE SERVICE HISTORY",
  reference: "JB-HIST-GP-123-456",
  customer: { name: "Thabo Mokoena", phone: "082 555 0148" },
  vehicle: { label: "2020 Toyota Corolla 1.8 Prestige", registration: "GP 123-456", vin: "AHTBB3JE0LJ081624" },
  currentKilometres: "143,240 km",
  entries: [
    { date: "14 Feb 2026", kilometres: "135,000 km", service: "Major service", jobReference: "JB-JOB-0211", total: "R6,840.00" },
    { date: "23 Aug 2025", kilometres: "125,000 km", service: "Minor service + front brakes", jobReference: "JB-JOB-0175", total: "R8,220.00" },
    { date: "08 Jan 2025", kilometres: "115,000 km", service: "Routine service", jobReference: "JB-JOB-0138", total: "R3,480.00" },
  ] satisfies ServiceHistoryEntry[],
} as const;

export const MONTHLY_REPORT_DOCUMENT = {
  type: "MONTHLY WORKSHOP REPORT",
  reference: "JB-RPT-2026-08",
  period: "August 2026",
  groups: [
    { title: "Workshop performance", stats: [["R184,620", "Revenue"], ["38", "Jobs completed"], ["R4,858", "Average job value"], ["2.8 days", "Turnaround time"]], bars: [72, 52, 84, 66], insight: "Performance remains within the workshop's current operating target." },
    { title: "Customer retention", stats: [["68%", "Repeat customers"], ["47", "Due for service"], ["74%", "Contact rate"], ["R32,480", "Outstanding"]], bars: [68, 47, 74, 32], insight: "12 customers due within 2,000 km have not yet been contacted." },
    { title: "Workshop quality", stats: [["3.2%", "Comeback rate"], ["1.8%", "Warranty rate"], ["94%", "First-time fix"], ["6", "QC holds"]], bars: [18, 10, 94, 28], insight: "Performance remains within the workshop's current operating target." },
    { title: "Inventory health", stats: [["06", "Low stock items"], ["01", "Out of stock"], ["R48,200", "Parts used"], ["4.1x", "Stock turn"]], bars: [30, 8, 76, 58], insight: "Brake parts are moving 22% faster than the prior month." },
  ] satisfies ReportGroup[],
} as const;

export type PdfDocumentKind = "estimate" | "invoice" | "service-history" | "monthly-report";

export const PDF_FILENAMES: Record<PdfDocumentKind, string> = {
  estimate: "JB-Motors-Estimate-JB-EST-0226.pdf",
  invoice: "JB-Motors-Invoice-JB-INV-0194.pdf",
  "service-history": "JB-Motors-Service-History-GP-123-456.pdf",
  "monthly-report": "JB-Motors-Monthly-Report-August-2026.pdf",
};

