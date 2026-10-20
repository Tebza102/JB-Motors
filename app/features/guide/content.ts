// Single help library for the JB Motors platform. Screens read from here; the production
// app is meant to reuse this file unchanged as its training manual. Describe only what
// actually works today and mark everything else "coming-soon".

export const STAFF_PAGES = ["dashboard","customers","vehicle","estimate","job-card","inventory","suppliers","invoice","payments","warranties","requests","follow-ups","reports","settings","technician"] as const;
export const CUSTOMER_PAGES = ["home","vehicles","service","problem","history","profile","kilometres"] as const;
export type StaffPageId = (typeof STAFF_PAGES)[number];
export type CustomerPageId = (typeof CUSTOMER_PAGES)[number];
export type GuideAudience = "staff" | "customer";
export type PageGuide = { title: string; summary: string; youCan: string[] };
export type HowToTopic = {
  id: string;
  audience: GuideAudience;
  title: string;
  keywords: string[];
  status: "available" | "coming-soon";
  steps: string[];
  page?: StaffPageId | CustomerPageId;
  /** Staff screens such as the technician workspace need a particular demo role. */
  role?: "Technician";
};
export type TourStep = { id: string; title: string; text: string; targets: string[] };

export const STAFF_PAGE_GUIDES: Record<StaffPageId, PageGuide> = {
  dashboard: { title: "Dashboard", summary: "Your starting point each day. It shows what needs attention now: jobs in progress, vehicles waiting for parts, customers to contact and new requests.", youCan: ["Open any item in “Needs attention”", "Jump to an open job", "See recent customer portal activity"] },
  customers: { title: "Customers", summary: "Every customer and their vehicles. Search by name, mobile number, vehicle or registration.", youCan: ["Add a new customer", "Filter by follow-up due or no active vehicle", "Open a customer to see their vehicles and jobs"] },
  vehicle: { title: "Vehicle profile", summary: "Everything about one vehicle and its owner: kilometres, service status, job cards and history.", youCan: ["Create a job card for this vehicle", "Edit the customer or vehicle", "See kilometre history", "Call the customer"] },
  estimate: { title: "Estimates", summary: "A quote for work, which the customer approves before work starts. This screen shows a sample approved estimate.", youCan: ["Download the estimate as a PDF", "Convert the approved estimate into a job card"] },
  "job-card": { title: "Job cards", summary: "The workshop's work orders. Each job card tracks the complaint, findings, notes, quality checks and status, from Scheduled to Ready.", youCan: ["Switch between job detail, table and board views", "Move a job to its next status", "Add findings and notes", "Complete the quality checklist"] },
  inventory: { title: "Inventory", summary: "Parts in stock, with low and out-of-stock items highlighted. Figures here are sample stock.", youCan: ["Search for a part", "Filter low or out-of-stock items"] },
  suppliers: { title: "Suppliers", summary: "Parts suppliers and their outstanding orders. This list is sample information.", youCan: ["Search suppliers", "Show suppliers that need attention"] },
  invoice: { title: "Invoices", summary: "What a customer owes for completed work. This screen shows a sample invoice and its payment position.", youCan: ["Download the invoice as a PDF", "Open the linked job card"] },
  payments: { title: "Payments", summary: "Money received against invoices. This list is sample information.", youCan: ["Search payments"] },
  warranties: { title: "Warranties & comebacks", summary: "Vehicles that came back after a repair, so quality problems are tracked. This list is sample information.", youCan: ["Search cases", "Show cases still being investigated"] },
  requests: { title: "Customer requests", summary: "Service requests and problem reports from customers, including phone bookings recorded by staff.", youCan: ["Record a phone request", "Update a request's status", "Call the customer", "Create a job card from a request"] },
  "follow-ups": { title: "Follow-ups", summary: "Customers who need a call or message, such as services due, open requests or estimates awaiting a reply.", youCan: ["Call or WhatsApp a customer", "Mark a follow-up complete once you have spoken", "See completed follow-ups"] },
  reports: { title: "Reports", summary: "Monthly workshop performance. The figures shown are a sample month.", youCan: ["Download the sample monthly report as a PDF"] },
  settings: { title: "Settings", summary: "Workshop details, rules and staff roles. Most settings await the owner's confirmation and are read-only for now.", youCan: ["Check which business details still need confirming", "Back up or reset the demo data on this device"] },
  technician: { title: "Technician workspace", summary: "A simple phone-friendly screen for technicians: their assigned jobs, quick checks, notes and status buttons.", youCan: ["Start work, mark waiting for parts or send to quality control", "Tick inspection checks", "Add a work note"] },
};

export const CUSTOMER_PAGE_GUIDES: Record<CustomerPageId, PageGuide> = {
  home: { title: "Home", summary: "Your vehicle at a glance: how many kilometres until the next service and anything that needs attention.", youCan: ["Update kilometres", "Request a service", "Report a problem"] },
  vehicles: { title: "My vehicle", summary: "Your vehicle's details and service status.", youCan: ["Check kilometres until the next service", "Update kilometres"] },
  service: { title: "Request a service", summary: "Ask JB Motors to book your vehicle in. The workshop contacts you to confirm the date.", youCan: ["Choose the type of service", "Pick a preferred date", "Add notes for the workshop"] },
  problem: { title: "Report a problem", summary: "Tell the workshop what your vehicle is doing. You can report several separate issues at once.", youCan: ["Choose what each issue relates to", "Describe when it happens and how serious it feels"] },
  history: { title: "History", summary: "Your service requests, problem reports and past services in one place.", youCan: ["Check the status of a request", "Review what you reported"] },
  profile: { title: "Profile", summary: "Your contact details and how JB Motors should contact you.", youCan: ["Update your mobile number or email", "Choose WhatsApp, phone, SMS or email", "Turn service reminders on or off"] },
  kilometres: { title: "Update kilometres", summary: "Enter the reading on your dashboard so service reminders stay accurate.", youCan: ["Record your current kilometres", "See how far you are from your next service"] },
};

const COMING_SOON = "This is not available yet. It is planned for the full version of the platform.";

export const HOW_TO_TOPICS: HowToTopic[] = [
  // Staff — available now
  { id: "find-customer", audience: "staff", status: "available", page: "customers", title: "Find a customer", keywords: ["search", "look up", "client", "phone number", "registration", "find"], steps: ["Open Customers from the menu.", "Type a name, mobile number, vehicle or registration in the search box.", "Click the customer to open their vehicle profile."] },
  { id: "add-customer", audience: "staff", status: "available", page: "customers", title: "Add a new customer", keywords: ["new client", "create customer", "register", "sign up customer"], steps: ["Open Customers from the menu.", "Click “+ Add customer”.", "Enter the name and a South African mobile number (email is optional).", "Enter their first vehicle and its registration.", "Click “Save local record”."] },
  { id: "add-vehicle", audience: "staff", status: "available", page: "customers", title: "Add, edit or archive a vehicle", keywords: ["car", "new vehicle", "change registration", "vin", "archive", "sold"], steps: ["Open the customer from Customers.", "Click “+ Add vehicle” to add one, or “Edit vehicle” to change details.", "To stop using a vehicle (for example it was sold), click “Archive vehicle”. Its history is kept."] },
  { id: "create-job", audience: "staff", status: "available", page: "job-card", title: "Create a job card", keywords: ["new job", "book in", "work order", "open job", "job card"], steps: ["Click “+ New job card” at the top of the screen, or on the vehicle's profile.","Choose the customer and the vehicle.", "Enter the odometer reading and the customer's complaint in their own words.", "Choose the technician, priority and intended start status.", "Click “Save local record”. The job opens as a Draft."] },
  { id: "move-job", audience: "staff", status: "available", page: "job-card", title: "Move a job to its next status", keywords: ["status", "start work", "waiting parts", "progress", "update job", "release draft"], steps: ["Open Job Cards and select the job (use Table view to find it).", "In “Job status”, click the next step: Scheduled, In Progress, Waiting Parts, QC or Ready.", "A Draft job is released to the workshop by choosing its first status.", "Changes save immediately and appear in the job timeline."] },
  { id: "mark-ready", audience: "staff", status: "available", page: "job-card", title: "Mark a vehicle ready for collection", keywords: ["ready", "finished", "complete job", "quality control", "qc", "road test", "collection"], steps: ["Open the job card.", "In “Quality control”, tick every check in the release checklist.", "Set the road-test result to “Passed”.", "Click “Ready” in the job status bar. Ready stays locked until every check is done."] },
  { id: "add-finding", audience: "staff", status: "available", page: "job-card", title: "Record a diagnostic finding", keywords: ["diagnosis", "fault", "inspection", "finding", "problem found"], steps: ["Open the job card.", "In section 02, click “+ Add diagnostic finding”.", "Choose the severity, then add a title and details.", "Click “Save local record”."] },
  { id: "add-note", audience: "staff", status: "available", page: "job-card", title: "Add a note to a job", keywords: ["note", "comment", "update", "blocked", "technician note"], steps: ["Open the job card (or the technician workspace).", "Type the note in the note box.", "Click “Save note”. It is saved with your name and the time."] },
  { id: "convert-estimate", audience: "staff", status: "available", page: "estimate", title: "Turn an approved estimate into a job card", keywords: ["estimate", "quote", "convert", "approved"], steps: ["Open Estimates from the menu.", "Check the estimate is approved.", "Click “Convert to job card”. A linked draft job opens.", "Converting again opens the same job, so nothing is duplicated."] },
  { id: "phone-request", audience: "staff", status: "available", page: "requests", title: "Record a booking request taken by phone", keywords: ["phone", "call", "booking", "service request", "appointment"], steps: ["Open Customer Requests from the menu.", "Click “+ Record phone request”.", "Choose the customer, vehicle, service type and preferred date.", "Add notes from the call and save. The customer is added to Follow-ups so someone confirms the booking."] },
  { id: "request-to-job", audience: "staff", status: "available", page: "requests", title: "Create a job card from a customer request", keywords: ["request", "problem report", "job from request", "book in"], steps: ["Open Customer Requests.", "On the request, click “Create job card”. The details are filled in for you.", "Check the details and save. The request then shows “Open” with the job number."] },
  { id: "review-report", audience: "staff", status: "available", page: "requests", title: "Review a customer's problem report", keywords: ["problem report", "issue", "review", "complaint"], steps: ["Open Customer Requests.", "Click “Review all issues” to read each issue.", "Change “Review status” to Under review or Resolved.", "Use “Call customer” to discuss it."] },
  { id: "follow-up", audience: "staff", status: "available", page: "follow-ups", title: "Contact a customer for a follow-up", keywords: ["follow up", "call", "whatsapp", "remind", "contact", "service due"], steps: ["Open Follow-ups from the menu.", "Click “Call” or “WhatsApp”. WhatsApp opens with a message drafted for you.", "Opening the call or chat does not count as contact.", "After you have actually spoken, click “Mark complete”."] },
  { id: "download-pdf", audience: "staff", status: "available", page: "estimate", title: "Download an estimate, invoice or report as a PDF", keywords: ["pdf", "download", "print", "document", "estimate pdf", "invoice pdf"], steps: ["Open Estimates, Invoices or Reports (or a vehicle's Service History tab).", "Click “Download PDF”.", "The file downloads to your device. These are sample documents in the demo."] },
  { id: "technician", audience: "staff", status: "available", page: "technician", role: "Technician", title: "Use the technician workspace", keywords: ["technician", "mechanic", "my jobs", "assigned", "workshop floor"], steps: ["Choose “Technician” in “Demo role” (on a phone: open the menu, then Demo role).", "Choose which technician you are.", "Use “Start work”, “Waiting parts” or “Send to QC” on the active job.", "Tick inspection checks and add work notes as you go."] },
  { id: "switch-role", audience: "staff", status: "available", title: "See another staff member's screens", keywords: ["role", "switch user", "advisor", "finance", "parts", "staff view"], steps: ["Use “Demo role” at the top (on a phone: open the menu).", "Choose Owner, Service Advisor, Technician, Store / Parts or Finance.", "In the demo this only changes the screens shown; real logins and permissions come later."] },
  { id: "customer-view", audience: "staff", status: "available", page: "home", title: "See what customers see", keywords: ["customer portal", "customer app", "client view", "help a customer"], steps: ["Click “Customer portal” at the top (on a phone: in the menu).", "Use the bottom menu to move between Home, Service, Report, History and Profile.", "Click “Workshop view” to return."] },
  { id: "backup-data", audience: "staff", status: "available", page: "settings", title: "Back up or reset the demo data", keywords: ["backup", "reset", "clear", "start over", "data"], steps: ["Open Settings (owner only), then “Local demo data”.", "Click “Download backup (JSON)” to keep a copy.", "Click “Back up and reset workshop records” to start fresh. Sample records always remain."] },
  // Staff — planned
  { id: "send-invoice", audience: "staff", status: "coming-soon", page: "invoice", title: "Create or send an invoice", keywords: ["invoice", "bill", "send invoice", "charge customer", "email invoice"], steps: [COMING_SOON, "For now you can view and download the sample invoice from Invoices."] },
  { id: "record-payment", audience: "staff", status: "coming-soon", page: "payments", title: "Record a payment", keywords: ["payment", "paid", "receipt", "cash", "eft", "card"], steps: [COMING_SOON] },
  { id: "stock", audience: "staff", status: "coming-soon", page: "inventory", title: "Add stock or record a stock movement", keywords: ["stock", "parts", "inventory", "receive parts", "issue parts"], steps: [COMING_SOON, "You can already search the sample stock list in Inventory."] },
  { id: "supplier", audience: "staff", status: "coming-soon", page: "suppliers", title: "Add a supplier or place an order", keywords: ["supplier", "order parts", "purchase order"], steps: [COMING_SOON] },
  { id: "warranty", audience: "staff", status: "coming-soon", page: "warranties", title: "Open a warranty or comeback case", keywords: ["warranty", "comeback", "returned", "redo"], steps: [COMING_SOON] },
  { id: "print-job", audience: "staff", status: "coming-soon", page: "job-card", title: "Print a job card", keywords: ["print", "job card pdf", "paper"], steps: [COMING_SOON] },
  { id: "photos", audience: "staff", status: "coming-soon", page: "job-card", title: "Add photos to a job", keywords: ["photo", "picture", "image", "attachment", "upload"], steps: [COMING_SOON] },
  { id: "staff-login", audience: "staff", status: "coming-soon", page: "settings", title: "Add staff and manage logins", keywords: ["login", "password", "staff", "employee", "access", "permissions"], steps: [COMING_SOON, "The demo has no logins; anyone with the link can view every screen."] },
  // Customer
  { id: "c-kilometres", audience: "customer", status: "available", page: "kilometres", title: "Update your kilometres", keywords: ["km", "kilometres", "mileage", "odometer", "reading"], steps: ["On Home, tap “Update kilometres”.", "Enter the number shown on your dashboard. It cannot be lower than your last reading.", "Tap “Save kilometres”. You will see how far you are from your next service."] },
  { id: "c-service", audience: "customer", status: "available", page: "service", title: "Request a service", keywords: ["service", "book", "booking", "appointment", "request"], steps: ["Tap “Service” in the bottom menu.", "Choose the vehicle and the type of service.", "Pick a preferred date (it must be after today) and add any notes.", "Tap “Save service request”. JB Motors confirms the actual date with you."] },
  { id: "c-problem", audience: "customer", status: "available", page: "problem", title: "Report a problem with your vehicle", keywords: ["problem", "issue", "noise", "warning light", "fault", "report"], steps: ["Tap “Report” in the bottom menu.", "Choose what the issue relates to (you can pick several).", "Describe what the vehicle is doing, when it happens and how serious it feels.", "Use “+ Add another issue” for a separate problem, then save the report.", "If the vehicle is unsafe to drive, stop in a safe place and get help first."] },
  { id: "c-history", audience: "customer", status: "available", page: "history", title: "Check the status of a request", keywords: ["status", "history", "my requests", "progress"], steps: ["Tap “History” in the bottom menu.", "Your service requests and problem reports show their current status."] },
  { id: "c-profile", audience: "customer", status: "available", page: "profile", title: "Update your contact details", keywords: ["phone", "email", "contact", "details", "reminders", "whatsapp"], steps: ["Tap “Profile” in the bottom menu.", "Update your mobile number or email and how you prefer to be contacted.", "Tap “Save profile”."] },
  { id: "c-photos", audience: "customer", status: "coming-soon", page: "problem", title: "Send photos or videos of a problem", keywords: ["photo", "video", "picture", "upload"], steps: [COMING_SOON, "Describe the problem in as much detail as you can in your report."] },
  { id: "c-contact", audience: "customer", status: "coming-soon", page: "profile", title: "Call or message JB Motors", keywords: ["call", "contact", "phone number", "whatsapp", "address"], steps: ["JB Motors' contact details will appear here once they are confirmed."] },
];

/** Shown once to new users; each step highlights the first visible target, or appears centred if none is visible. */
export const STAFF_TOUR: TourStep[] = [
  { id: "welcome", title: "Welcome to JB Motors", text: "This short tour shows where things are. It takes under a minute, and you can replay it from Help at any time.", targets: [] },
  { id: "menu", title: "The menu", text: "Every part of the workshop is here: customers, job cards, estimates, invoices, follow-ups and more. On a phone, tap the menu button.", targets: ["[data-tour='nav']", "[data-tour='menu-button']"] },
  { id: "attention", title: "Start each day here", text: "The dashboard shows what needs attention now. Click any item to deal with it.", targets: ["[data-tour='attention']"] },
  { id: "new-job", title: "Create a job card", text: "When a vehicle comes in, start here. The job card follows the vehicle until it is ready for collection.", targets: ["[data-tour='new-job']"] },
  { id: "role", title: "See each staff member's screens", text: "“Demo role” switches between owner, service advisor, technician, parts and finance screens. On a phone it is in the menu.", targets: ["[data-tour='role']", "[data-tour='menu-button']"] },
  { id: "portal", title: "See what customers see", text: "“Customer portal” shows the customer's app, so you can guide customers who get stuck.", targets: ["[data-tour='portal']", "[data-tour='portal-mobile']", "[data-tour='menu-button']"] },
  { id: "help", title: "Help is always here", text: "Open Help on any page for a short explanation of the page, and type a question in “Ask me how” for step-by-step instructions.", targets: ["[data-tour='help']"] },
];

export const CUSTOMER_TOUR: TourStep[] = [
  { id: "c-welcome", title: "Welcome to JB Motors", text: "This app keeps your vehicle's service on track. Here's a 20-second look around.", targets: [] },
  { id: "c-vehicle", title: "Your vehicle", text: "See how many kilometres are left until your next service.", targets: ["[data-tour='c-vehicle']"] },
  { id: "c-actions", title: "Quick actions", text: "Update your kilometres, request a service or report a problem.", targets: ["[data-tour='c-actions']"] },
  { id: "c-nav", title: "Get around", text: "Use the bottom menu to reach your history and profile.", targets: ["[data-tour='c-nav']"] },
  { id: "c-help", title: "Need help?", text: "Tap Help any time for step-by-step instructions.", targets: ["[data-tour='c-help']"] },
];
