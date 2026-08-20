"use client";

import { FormEvent, useMemo, useState } from "react";

type WorkshopView =
  | "dashboard"
  | "customers"
  | "vehicle"
  | "estimate"
  | "job-card"
  | "inventory"
  | "suppliers"
  | "invoice"
  | "payments"
  | "warranties"
  | "requests"
  | "follow-ups"
  | "reports"
  | "settings"
  | "technician";

type StaffRole = "Owner / Administrator" | "Service Advisor" | "Technician" | "Store / Parts" | "Finance / Accounts";
type CustomerView = "home" | "vehicles" | "service" | "problem" | "history" | "profile" | "kilometres";

const navItems: Array<{ label: string; code: string; view: WorkshopView; roles: StaffRole[] }> = [
  { label: "Dashboard", code: "DB", view: "dashboard", roles: ["Owner / Administrator", "Service Advisor", "Finance / Accounts"] },
  { label: "Customers", code: "CU", view: "customers", roles: ["Owner / Administrator", "Service Advisor", "Finance / Accounts"] },
  { label: "Vehicles", code: "VH", view: "vehicle", roles: ["Owner / Administrator", "Service Advisor", "Technician"] },
  { label: "Estimates", code: "ES", view: "estimate", roles: ["Owner / Administrator", "Service Advisor"] },
  { label: "Job Cards", code: "JC", view: "job-card", roles: ["Owner / Administrator", "Service Advisor", "Technician", "Store / Parts"] },
  { label: "Inventory", code: "IN", view: "inventory", roles: ["Owner / Administrator", "Store / Parts"] },
  { label: "Suppliers", code: "SU", view: "suppliers", roles: ["Owner / Administrator", "Store / Parts"] },
  { label: "Invoices", code: "IV", view: "invoice", roles: ["Owner / Administrator", "Service Advisor", "Finance / Accounts"] },
  { label: "Payments", code: "PY", view: "payments", roles: ["Owner / Administrator", "Finance / Accounts"] },
  { label: "Warranties", code: "WA", view: "warranties", roles: ["Owner / Administrator", "Service Advisor", "Technician"] },
  { label: "Customer Requests", code: "CR", view: "requests", roles: ["Owner / Administrator", "Service Advisor"] },
  { label: "Follow-ups", code: "FU", view: "follow-ups", roles: ["Owner / Administrator", "Service Advisor"] },
  { label: "Reports", code: "RP", view: "reports", roles: ["Owner / Administrator", "Finance / Accounts"] },
];

const customers = [
  { name: "Thabo Mokoena", phone: "082 555 0148", vehicles: "2", last: "14 Aug 2026", next: "1,760 km", balance: "R0.00", contact: "Today", status: "Active" },
  { name: "Naledi Khumalo", phone: "076 224 9180", vehicles: "1", last: "02 Aug 2026", next: "Overdue 420 km", balance: "R1,850.00", contact: "18 Aug", status: "Follow-up" },
  { name: "Sipho Dlamini", phone: "083 771 0925", vehicles: "3", last: "20 Aug 2026", next: "6,200 km", balance: "R8,450.00", contact: "Today", status: "In workshop" },
  { name: "Anika van Wyk", phone: "072 604 3319", vehicles: "1", last: "28 Jul 2026", next: "820 km", balance: "R0.00", contact: "12 Aug", status: "Due soon" },
  { name: "Kabelo Ndlovu", phone: "079 441 8802", vehicles: "2", last: "11 Jul 2026", next: "9,450 km", balance: "R0.00", contact: "11 Jul", status: "Active" },
];

const inventoryRows = [
  ["BRK-1042", "ATE Front Brake Pads", "Brakes", "AutoZone", "3", "4", "R685.00", "R1,020.00", "Low stock"],
  ["FLT-2208", "GUD Oil Filter Z260", "Filters", "Midas", "18", "8", "R96.50", "R165.00", "In stock"],
  ["OIL-5W30", "Shell Helix HX8 5W-30 5L", "Lubricants", "Shell", "7", "6", "R620.00", "R890.00", "In stock"],
  ["BAT-646", "Willard 646 Battery", "Electrical", "Battery Centre", "0", "2", "R1,340.00", "R1,895.00", "Out of stock"],
  ["SPK-NGK6", "NGK BKR6E Spark Plug", "Ignition", "Goldwagen", "24", "12", "R82.00", "R145.00", "In stock"],
  ["CLT-G12", "G12 Coolant 5L", "Cooling", "Goldwagen", "5", "5", "R275.00", "R420.00", "Reorder"],
];

function BrandLockup({ compact = false, dark = true }: { compact?: boolean; dark?: boolean }) {
  return (
    <div className={`brand-lockup ${compact ? "compact" : ""} ${dark ? "on-dark" : "on-light"}`} aria-label="JB Motors">
      <span className="brand-jb">JB</span>
      <span className="brand-motors">MOTORS</span>
      {!compact && <span className="brand-sub">DIGITAL WORKSHOP</span>}
    </div>
  );
}

function StatusPill({ children, tone = "grey" }: { children: React.ReactNode; tone?: string }) {
  return <span className={`status-pill tone-${tone}`}>{children}</span>;
}

function PageHeader({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <section className="page-header">
      <div><span className="section-kicker">{eyebrow}</span><h1>{title}</h1>{description && <p>{description}</p>}</div>
      {actions && <div className="page-actions">{actions}</div>}
    </section>
  );
}

function MetricCard({ value, label, note, tone = "steel" }: { value: string; label: string; note: string; tone?: string }) {
  return <article className={`metric-card metric-${tone}`}><strong>{value}</strong><h3>{label}</h3><p>{note}</p></article>;
}

function Dashboard({ onOpen, notify }: { onOpen: (view: WorkshopView) => void; notify: (message: string) => void }) {
  const kpis = [
    ["06", "Jobs in progress", "2 need status updates", "blue"], ["03", "Waiting for parts", "Oldest: 2 days", "amber"],
    ["04", "Vehicles ready", "R28,640 to collect", "green"], ["05", "Service requests", "2 received today", "blue"],
    ["07", "Customers to contact", "3 high priority", "orange"], ["09", "Overdue services", "4 over 1,000 km", "red"],
    ["R32k", "Outstanding invoices", "5 open balances", "amber"], ["06", "Low stock items", "1 item out of stock", "red"],
  ];
  const attention = [
    { type: "SERVICE DUE", title: "Toyota Corolla 1.8 Prestige", meta: "GP 123-456 · Thabo Mokoena", detail: "143,240 km / Service at 145,000 km", tone: "orange", action: "Call customer", view: "vehicle" as WorkshopView },
    { type: "NEW PROBLEM REPORT", title: "VW Polo 1.0 TSI", meta: "Warning light and loss of power", detail: "Submitted 38 minutes ago", tone: "red", action: "Review report", view: "requests" as WorkshopView },
    { type: "WAITING FOR PARTS", title: "Ford Ranger 2.2 TDCi", meta: "JB-JOB-0248 · Sipho Dlamini", detail: "Waiting 2 days · Brake master cylinder", tone: "amber", action: "Open job", view: "job-card" as WorkshopView },
    { type: "PAYMENT OVERDUE", title: "Naledi Khumalo", meta: "JB-INV-0189 · Hyundai i20", detail: "R1,850.00 outstanding · 9 days", tone: "red", action: "View invoice", view: "invoice" as WorkshopView },
  ];
  return (
    <>
      <PageHeader eyebrow="WORKSHOP DASHBOARD" title="What needs your attention today?" description="A live operational view of jobs, customers and workshop follow-ups." actions={<div className="open-status"><span /> Workshop open <strong>07:30–17:00</strong></div>} />
      <section className="metrics-grid metrics-eight" aria-label="Workshop summary">
        {kpis.map(([value, label, note, tone]) => <MetricCard key={label} value={value} label={label} note={note} tone={tone} />)}
      </section>
      <div className="dashboard-grid">
        <section className="panel attention-panel">
          <div className="panel-heading"><div><span className="section-kicker">ACTION CENTRE</span><h2>Needs attention</h2></div><button className="text-button" onClick={() => onOpen("follow-ups")}>View all 12 →</button></div>
          <div className="attention-list">
            {attention.map((item) => (
              <article className="attention-item" key={item.title + item.type}>
                <span className={`attention-line ${item.tone}`} />
                <div className="attention-copy"><StatusPill tone={item.tone}>{item.type}</StatusPill><h3>{item.title}</h3><p>{item.meta}</p><small>{item.detail}</small></div>
                <div className="row-actions"><button className="compact-button" onClick={() => item.action.startsWith("Call") ? notify("Ready to call Thabo on 082 555 0148") : onOpen(item.view)}>{item.action}</button><button className="icon-button" aria-label={`Open ${item.title}`} onClick={() => onOpen(item.view)}>→</button></div>
              </article>
            ))}
          </div>
        </section>
        <aside className="panel today-panel">
          <div className="panel-heading"><div><span className="section-kicker">WORKSHOP LOAD</span><h2>Today’s jobs</h2></div><StatusPill tone="blue">8 jobs</StatusPill></div>
          <div className="today-jobs">
            {[
              ["07:30", "Toyota Corolla", "GP 123-456 · Minor service", "In progress", "blue"],
              ["08:15", "VW Polo", "CA 459-882 · Diagnostics", "Inspection", "blue"],
              ["09:00", "Ford Ranger", "NW 81 LM GP · Brake repair", "Waiting parts", "amber"],
              ["10:30", "BMW 320i", "GP 776-302 · Cooling system", "Scheduled", "grey"],
              ["13:00", "Isuzu D-Max", "MP 28 TK GP · Clutch", "Scheduled", "grey"],
            ].map(([time, vehicle, detail, status, tone]) => <button className="today-job" key={time} onClick={() => onOpen("job-card")}><time>{time}</time><span><strong>{vehicle}</strong><small>{detail}</small></span><StatusPill tone={tone}>{status}</StatusPill></button>)}
          </div>
          <button className="wide-button" onClick={() => onOpen("job-card")}>Open workshop schedule</button>
        </aside>
      </div>
      <div className="support-grid">
        <section className="panel"><div className="panel-heading"><div><span className="section-kicker">RECENT CUSTOMER ACTIVITY</span><h2>Portal updates</h2></div><button className="text-button" onClick={() => onOpen("requests")}>View requests →</button></div>
          <div className="activity-feed">
            <div className="activity-item"><span className="activity-dot orange" /><div><strong>Thabo Mokoena updated kilometres</strong><p>Toyota Corolla · 143,240 km · Service due at 145,000 km</p></div><time>22 min</time></div>
            <div className="activity-item"><span className="activity-dot red" /><div><strong>Naledi Khumalo reported a problem</strong><p>Hyundai i20 · Grinding noise when braking</p></div><time>1 hr</time></div>
            <div className="activity-item"><span className="activity-dot blue" /><div><strong>Anika van Wyk requested a service</strong><p>VW Polo · Preferred date 25 Aug 2026</p></div><time>2 hrs</time></div>
          </div>
        </section>
        <section className="panel revenue-card"><div className="panel-heading"><div><span className="section-kicker">AUGUST PERFORMANCE</span><h2>Revenue trend</h2></div><strong className="revenue-total">R184,620</strong></div>
          <div className="bar-chart" aria-label="Six week revenue trend">{[42,58,51,76,68,88].map((height, index) => <div key={index}><span style={{height: `${height}%`}} /><small>W{index + 1}</small></div>)}</div>
          <div className="revenue-footer"><span>Jobs completed <strong>38</strong></span><span>Avg. job value <strong>R4,858</strong></span><span>Target <strong>92%</strong></span></div>
        </section>
      </div>
    </>
  );
}

function CustomerDirectory({ onOpen }: { onOpen: (view: WorkshopView) => void }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => customers.filter((customer) => `${customer.name} ${customer.phone}`.toLowerCase().includes(query.toLowerCase())), [query]);
  return (
    <>
      <PageHeader eyebrow="CUSTOMER MANAGEMENT" title="Customers" description="Search the complete customer relationship, not only a contact list." actions={<button className="primary-button">+ Add customer</button>} />
      <section className="metrics-grid metrics-four"><MetricCard value="486" label="Active customers" note="31 added this quarter" tone="steel" /><MetricCard value="68%" label="Repeat customers" note="Up 4.2% from Q2" tone="green" /><MetricCard value="47" label="Due for service" note="12 need contact" tone="orange" /><MetricCard value="R32,480" label="Outstanding balance" note="Across 5 customers" tone="amber" /></section>
      <section className="panel table-panel">
        <div className="filter-bar"><label className="search-field"><span>SEARCH</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, mobile number or vehicle…" /></label><div className="filter-actions"><button className="filter-chip active">All customers</button><button className="filter-chip">Due soon</button><button className="filter-chip">Outstanding</button><button className="filter-chip">Inactive</button></div></div>
        <div className="responsive-table customer-table">
          <div className="table-head"><span>Customer</span><span>Mobile number</span><span>Vehicles</span><span>Last visit</span><span>Next service</span><span>Outstanding</span><span>Last contact</span><span>Status</span></div>
          {filtered.map((customer) => <button className="table-row" key={customer.name} onClick={() => onOpen("vehicle")}><span className="customer-cell"><b>{customer.name.split(" ").map((part) => part[0]).join("")}</b><strong>{customer.name}</strong></span><span data-label="Mobile">{customer.phone}</span><span data-label="Vehicles">{customer.vehicles}</span><span data-label="Last visit">{customer.last}</span><span data-label="Next service" className={customer.next.includes("Overdue") ? "danger-text" : ""}>{customer.next}</span><span data-label="Outstanding">{customer.balance}</span><span data-label="Last contact">{customer.contact}</span><span data-label="Status"><StatusPill tone={customer.status === "Active" ? "green" : customer.status === "Follow-up" ? "red" : "orange"}>{customer.status}</StatusPill></span></button>)}
        </div>
      </section>
    </>
  );
}

function VehicleProfile({ notify }: { notify: (message: string) => void }) {
  const [tab, setTab] = useState("Overview");
  const tabs = ["Overview", "Service History", "Job Cards", "Estimates", "Invoices", "Problems", "Warranty", "Attachments", "Kilometres"];
  return (
    <>
      <PageHeader eyebrow="VEHICLE PROFILE / CUSTOMER 360" title="2020 Toyota Corolla 1.8 Prestige" description="GP 123-456 · VIN AHTBB3JE0LJ081624" actions={<><button className="secondary-button" onClick={() => notify("Vehicle summary prepared for sharing")}>Share summary</button><button className="primary-button">+ New job card</button></>} />
      <section className="vehicle-hero panel">
        <div className="vehicle-identity"><div className="vehicle-mark">TY</div><div><StatusPill tone="orange">SERVICE DUE SOON</StatusPill><h2>Toyota Corolla</h2><p>1.8 Prestige · 2020 · Silver</p><div className="vehicle-owner"><span>OWNER</span><button>Thabo Mokoena →</button><small>082 555 0148</small></div></div></div>
        <div className="vehicle-metrics"><div><span>CURRENT KM</span><strong>143,240</strong><small>Updated by customer today</small></div><div><span>LAST SERVICE</span><strong>135,000</strong><small>14 February 2026</small></div><div><span>NEXT SERVICE</span><strong>145,000</strong><small>10,000 km interval</small></div><div className="highlight"><span>KM REMAINING</span><strong>1,760</strong><small>Contact customer soon</small></div></div>
      </section>
      <nav className="tab-bar" aria-label="Vehicle sections">{tabs.map((item) => <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item}</button>)}</nav>
      {tab === "Kilometres" ? <KilometreHistory /> : tab === "Service History" ? <ServiceHistory /> : (
        <div className="vehicle-content-grid">
          <section className="panel detail-panel"><div className="panel-heading"><div><span className="section-kicker">VEHICLE OVERVIEW</span><h2>Current workshop picture</h2></div><button className="text-button">Edit vehicle</button></div>
            <div className="detail-grid"><div><span>Registration</span><strong>GP 123-456</strong></div><div><span>VIN</span><strong>AHTBB3JE0LJ081624</strong></div><div><span>Engine</span><strong>1.8L Petrol</strong></div><div><span>Transmission</span><strong>CVT Automatic</strong></div><div><span>Colour</span><strong>Silver</strong></div><div><span>Customer since</span><strong>18 March 2022</strong></div></div>
            <div className="service-alert"><span className="alert-gauge"><i style={{width:"82%"}} /></span><div><StatusPill tone="orange">DUE IN 1,760 KM</StatusPill><h3>Next routine service at 145,000 km</h3><p>Based on JB Motors’ 10,000 km service interval. Last odometer update was submitted manually by the customer.</p></div><button className="compact-button" onClick={() => notify("Ready to call Thabo Mokoena on 082 555 0148")}>Call customer</button></div>
          </section>
          <aside className="panel relationship-panel"><div className="panel-heading"><div><span className="section-kicker">RELATIONSHIP TIMELINE</span><h2>Vehicle activity</h2></div></div>
            <div className="timeline"><div><time>20 Aug 2026</time><strong>Kilometres updated to 143,240</strong><p>Submitted by Thabo through the customer portal.</p></div><div><time>03 Aug 2026</time><strong>Problem report resolved</strong><p>Intermittent starting issue · Battery terminal cleaned.</p></div><div><time>14 Feb 2026</time><strong>Major service completed</strong><p>JB-JOB-0211 · R6,840.00 · 135,000 km</p></div><div><time>02 Feb 2026</time><strong>Estimate approved</strong><p>JB-EST-0196 approved by customer.</p></div></div>
          </aside>
        </div>
      )}
    </>
  );
}

function KilometreHistory() {
  const points = [
    ["118,420", "18 Mar 2025", "Workshop"], ["125,000", "02 Jul 2025", "Workshop"], ["135,000", "14 Feb 2026", "Workshop"], ["142,100", "03 Aug 2026", "Manual"], ["142,760", "12 Aug 2026", "Manual"], ["143,240", "20 Aug 2026", "Manual"],
  ];
  return <div className="history-grid"><section className="panel mileage-panel"><div className="panel-heading"><div><span className="section-kicker">STRUCTURED ODOMETER RECORDS</span><h2>Kilometre history</h2></div><StatusPill tone="grey">Source tracked per entry</StatusPill></div><div className="mileage-chart"><div className="chart-scale"><span>145k</span><span>135k</span><span>125k</span><span>115k</span></div><div className="chart-track">{points.map(([km, date], index) => <div className="chart-point" style={{left:`${8 + index * 17}%`, bottom:`${14 + index * 13}%`}} key={date}><i /><span>{km} km</span></div>)}</div></div></section><section className="panel"><div className="panel-heading"><div><span className="section-kicker">LATEST FIRST</span><h2>Recorded entries</h2></div></div><div className="record-list">{[...points].reverse().map(([km,date,source]) => <div key={date}><span className="record-dot" /><strong>{km} km</strong><span>{date}</span><StatusPill tone={source === "Manual" ? "orange" : "blue"}>{source}</StatusPill></div>)}</div></section></div>;
}

function ServiceHistory() {
  return <section className="panel service-history"><div className="panel-heading"><div><span className="section-kicker">COMPLETE VEHICLE RECORD</span><h2>Service history</h2></div><button className="secondary-button">Download history PDF</button></div>{[
    ["14 Feb 2026","135,000 km","Major service","JB-JOB-0211","R6,840.00"], ["23 Aug 2025","125,000 km","Minor service + front brakes","JB-JOB-0175","R8,220.00"], ["08 Jan 2025","115,000 km","Routine service","JB-JOB-0138","R3,480.00"],
  ].map((row) => <div className="service-record" key={row[0]}><time>{row[0]}</time><strong>{row[2]}</strong><span>{row[1]}</span><span>{row[3]}</span><b>{row[4]}</b><button>Open record →</button></div>)}</section>;
}

function JobCardDetail({ notify }: { notify: (message: string) => void }) {
  const [view, setView] = useState<"detail" | "board">("detail");
  const [status, setStatus] = useState("In Progress");
  if (view === "board") return <JobBoard onOpen={() => setView("detail")} />;
  return (
    <>
      <PageHeader eyebrow="JOB CARDS / OPERATIONAL WORK" title="JB-JOB-0248" description="Ford Ranger 2.2 TDCi · NW 81 LM GP · Sipho Dlamini" actions={<><button className="secondary-button" onClick={() => setView("board")}>Board view</button><button className="secondary-button">Print job card</button><button className="primary-button" onClick={() => notify("Job card changes saved")}>Save changes</button></>} />
      <section className="status-control panel"><div><span className="section-kicker">JOB STATUS</span><strong>{status}</strong><small>Last changed today at 09:42 by Johan Meyer</small></div><div className="status-steps">{["Scheduled","In Progress","Waiting Parts","QC","Ready"].map((step) => <button className={status === step ? "active" : ""} key={step} onClick={() => {setStatus(step);notify(`Job moved to ${step}`);}}><span />{step}</button>)}</div><button className="compact-button">More actions</button></section>
      <div className="job-layout">
        <div className="job-main">
          <section className="panel job-summary"><div className="job-summary-grid"><div><span>CUSTOMER</span><strong>Sipho Dlamini</strong><small>083 771 0925</small></div><div><span>VEHICLE</span><strong>2019 Ford Ranger 2.2 TDCi</strong><small>NW 81 LM GP</small></div><div><span>ODOMETER IN</span><strong>186,420 km</strong><small>Fuel level: ½ tank</small></div><div><span>ASSIGNED TO</span><strong>Petrus Nkosi</strong><small>Senior technician</small></div></div></section>
          <section className="panel work-section"><div className="section-heading"><span className="section-number">01</span><div><h2>Customer complaint</h2><p>The customer’s words are preserved before diagnosis.</p></div><button className="text-button">Edit</button></div><blockquote>“Brake pedal feels soft and the vehicle pulls slightly to the left when braking. A warning light came on yesterday.”</blockquote></section>
          <section className="panel work-section"><div className="section-heading"><span className="section-number">02</span><div><h2>Inspection & diagnostic findings</h2><p>Technician findings linked to the original complaint.</p></div><StatusPill tone="blue">INSPECTION COMPLETE</StatusPill></div><div className="finding-list"><div><StatusPill tone="red">CRITICAL</StatusPill><span><strong>Brake fluid leak at master cylinder</strong><p>Visible seepage and pressure loss confirmed during pedal hold test.</p></span></div><div><StatusPill tone="amber">ATTENTION</StatusPill><span><strong>Front left pads unevenly worn</strong><p>Inner pad at 2 mm; right side at 5 mm.</p></span></div><div><StatusPill tone="grey">OBSERVED</StatusPill><span><strong>ABS warning stored</strong><p>C1234 historic low-voltage fault; cleared and retested.</p></span></div></div><button className="inline-add">+ Add diagnostic finding</button></section>
          <section className="panel work-section"><div className="section-heading"><span className="section-number">03</span><div><h2>Labour & parts</h2><p>Actual work and parts consumed on this job.</p></div><button className="secondary-button">+ Add line</button></div><div className="line-table"><div className="line-head"><span>Description</span><span>Qty / hrs</span><span>Rate</span><span>Total</span><span /></div><div><span><b>Replace brake master cylinder</b><small>Labour · Petrus Nkosi</small></span><span>2.5 hrs</span><span>R650.00</span><strong>R1,625.00</strong><button>•••</button></div><div><span><b>Brake master cylinder</b><small>Part · BRK-MC-228</small></span><span>1</span><span>R2,480.00</span><strong>R2,480.00</strong><button>•••</button></div><div><span><b>ATE front brake pad set</b><small>Part · BRK-1042</small></span><span>1</span><span>R1,020.00</span><strong>R1,020.00</strong><button>•••</button></div><div><span><b>DOT 4 brake fluid</b><small>Consumable · FLD-DOT4</small></span><span>1</span><span>R185.00</span><strong>R185.00</strong><button>•••</button></div></div><div className="job-total"><span>Current job value</span><strong>R6,106.50 <small>incl. VAT</small></strong></div></section>
          <section className="panel work-section"><div className="section-heading"><span className="section-number">04</span><div><h2>Technician notes & attachments</h2><p>Workshop evidence stays with the vehicle record.</p></div><button className="secondary-button">+ Add photo</button></div><div className="note-box"><span className="avatar">PN</span><div><strong>Petrus Nkosi <small>Today, 10:18</small></strong><p>Master cylinder removed. Replacement supplied has a different rear port angle; stores contacted supplier to confirm correct variant before fitment.</p></div></div><div className="attachment-grid"><button><span>PHOTO 01</span><strong>Master cylinder leak</strong><small>2.4 MB · Today</small></button><button><span>PHOTO 02</span><strong>Front left pad wear</strong><small>1.8 MB · Today</small></button><button className="add-attachment">+ Add attachment</button></div></section>
        </div>
        <aside className="job-aside">
          <section className="panel qc-card"><div className="panel-heading"><div><span className="section-kicker">QUALITY CONTROL</span><h2>Release checklist</h2></div><span className="progress-ring">3/6</span></div><label><input type="checkbox" defaultChecked /> Work completed against authorisation</label><label><input type="checkbox" defaultChecked /> No warning lights present</label><label><input type="checkbox" defaultChecked /> Fluid levels checked</label><label><input type="checkbox" /> Brake pedal pressure confirmed</label><label><input type="checkbox" /> Road test completed</label><label><input type="checkbox" /> Vehicle ready notification approved</label><div className="road-test"><span>ROAD-TEST RESULT</span><select defaultValue="pending"><option value="pending">Pending</option><option>Passed</option><option>Requires attention</option></select></div></section>
          <section className="panel authorisation-card"><div className="panel-heading"><div><span className="section-kicker">CUSTOMER AUTHORISATION</span><h2>Approved work</h2></div></div><StatusPill tone="green">APPROVED</StatusPill><strong>R6,106.50 incl. VAT</strong><p>Approved by Sipho Dlamini by telephone on 20 Aug 2026 at 09:26.</p><button className="wide-button">View approval record</button></section>
          <section className="panel activity-card"><div className="panel-heading"><div><span className="section-kicker">ACTIVITY HISTORY</span><h2>Job timeline</h2></div></div><div className="timeline compact-timeline"><div><time>10:18</time><strong>Technician note added</strong><p>Petrus Nkosi</p></div><div><time>09:42</time><strong>Moved to In Progress</strong><p>Johan Meyer</p></div><div><time>09:26</time><strong>Customer authorised work</strong><p>Telephone approval</p></div><div><time>08:11</time><strong>Initial inspection completed</strong><p>Petrus Nkosi</p></div></div></section>
        </aside>
      </div>
    </>
  );
}

function JobBoard({ onOpen }: { onOpen: () => void }) {
  const columns = [
    { name:"Scheduled", tone:"grey", jobs:[["JB-JOB-0251","BMW 320i","GP 776-302","Cooling system"],["JB-JOB-0252","Isuzu D-Max","MP 28 TK GP","Clutch inspection"]]},
    { name:"In Progress", tone:"blue", jobs:[["JB-JOB-0248","Ford Ranger","NW 81 LM GP","Brake repair"],["JB-JOB-0249","Toyota Corolla","GP 123-456","Minor service"]]},
    { name:"Waiting Parts", tone:"amber", jobs:[["JB-JOB-0246","VW Polo","CA 459-882","Turbo actuator"]]},
    { name:"QC", tone:"orange", jobs:[["JB-JOB-0244","Hyundai i20","GP 663-814","Front brakes"]]},
    { name:"Ready", tone:"green", jobs:[["JB-JOB-0243","Kia Picanto","GP 901-212","Major service"]]},
  ];
  return <><PageHeader eyebrow="JOB CARDS / WORKSHOP BOARD" title="Workshop flow" description="Move work through the workshop while keeping blocked jobs visible." actions={<><button className="secondary-button">Table view</button><button className="primary-button">+ New job card</button></>} /><div className="board">{columns.map((column) => <section key={column.name} className="board-column"><header><StatusPill tone={column.tone}>{column.name}</StatusPill><strong>{column.jobs.length}</strong></header>{column.jobs.map((job) => <button key={job[0]} className="job-tile" onClick={onOpen}><span>{job[0]}</span><strong>{job[1]}</strong><p>{job[2]}</p><small>{job[3]}</small><div><span className="mini-avatar">PN</span><time>Today</time></div></button>)}</section>)}</div></>;
}

function FollowUpCentre({ notify, onOpen }: { notify: (message: string) => void; onOpen: (view: WorkshopView) => void }) {
  const [filter, setFilter] = useState("All");
  const followups = [
    {priority:"High", reason:"Kilometres updated · Service due soon", customer:"Thabo Mokoena", vehicle:"Toyota Corolla · GP 123-456", phone:"082 555 0148", last:"Customer update · 22 min ago", due:"1,760 km remaining", tone:"orange"},
    {priority:"Urgent", reason:"Service overdue", customer:"Naledi Khumalo", vehicle:"Hyundai i20 · GP 663-814", phone:"076 224 9180", last:"WhatsApp sent · 8 days ago", due:"Overdue by 1,250 km", tone:"red"},
    {priority:"High", reason:"New problem report", customer:"Kabelo Ndlovu", vehicle:"VW Polo · CA 459-882", phone:"079 441 8802", last:"Report submitted · 1 hr ago", due:"Warning light / power loss", tone:"red"},
    {priority:"Medium", reason:"Estimate follow-up", customer:"Anika van Wyk", vehicle:"Ford EcoSport · GP 334-981", phone:"072 604 3319", last:"Estimate sent · Yesterday", due:"JB-EST-0226 · R8,450", tone:"amber"},
    {priority:"Medium", reason:"Service request", customer:"Lerato Molefe", vehicle:"Kia Picanto · GP 901-212", phone:"081 632 1470", last:"Request submitted · 2 hrs ago", due:"Preferred date 25 Aug", tone:"blue"},
  ];
  const visible = filter === "All" ? followups : followups.filter((item) => item.priority === filter || item.reason.includes(filter));
  return <><PageHeader eyebrow="RETENTION HEART OF THE WORKSHOP" title="Customer Follow-ups" description="A practical queue for human contact, service retention and unresolved customer needs." actions={<button className="primary-button">+ Schedule follow-up</button>} /><section className="metrics-grid metrics-four"><MetricCard value="12" label="Needs contact" note="3 high priority today" tone="orange" /><MetricCard value="06" label="Service due" note="Within 2,000 km" tone="amber" /><MetricCard value="03" label="Problem reports" note="Awaiting workshop review" tone="red" /><MetricCard value="74%" label="Contacted this week" note="23 of 31 completed" tone="green" /></section><section className="panel followup-panel"><div className="filter-bar"><div className="filter-actions">{["All","Urgent","High","Service","Estimate"].map((item) => <button key={item} className={`filter-chip ${filter===item?"active":""}`} onClick={() => setFilter(item)}>{item}</button>)}</div><label className="search-field compact-search"><span>SEARCH</span><input placeholder="Search customer or vehicle…" /></label></div><div className="followup-list">{visible.map((item) => <article className="followup-row" key={item.customer+item.reason}><span className={`priority-rail ${item.tone}`} /><div className="followup-reason"><StatusPill tone={item.tone}>{item.priority}</StatusPill><strong>{item.reason}</strong><small>{item.due}</small></div><div><strong>{item.customer}</strong><span>{item.vehicle}</span></div><div><a href={`tel:${item.phone.replaceAll(" ","")}`}>{item.phone}</a><span>{item.last}</span></div><div className="followup-actions"><button className="primary-button small" onClick={() => notify(`Ready to call ${item.customer} on ${item.phone}`)}>Call</button><button className="secondary-button small" onClick={() => notify(`WhatsApp follow-up prepared for ${item.customer}`)}>WhatsApp</button><button className="secondary-button small" onClick={() => notify(`${item.customer} marked as contacted`)}>Mark contacted</button><button className="icon-button" aria-label="Open customer" onClick={() => onOpen("vehicle")}>→</button></div></article>)}</div></section></>;
}

function EstimateDetail({ onConvert, notify }: { onConvert: () => void; notify: (message: string) => void }) {
  return <><PageHeader eyebrow="ESTIMATES / JB-EST-0226" title="Estimate detail" description="Prepared for Anika van Wyk · Ford EcoSport · GP 334-981" actions={<><button className="secondary-button" onClick={() => notify("Estimate preview opened")}>Preview</button><button className="secondary-button" onClick={() => notify("Estimate PDF prepared")}>Download PDF</button><button className="primary-button" onClick={onConvert}>Convert to job card</button></>} /><div className="document-layout"><section className="panel document-sheet"><div className="document-brand"><BrandLockup dark={false} /><div><StatusPill tone="green">APPROVED</StatusPill><h2>ESTIMATE</h2><span>JB-EST-0226</span></div></div><div className="document-parties"><div><span>PREPARED FOR</span><strong>Anika van Wyk</strong><p>072 604 3319<br />anika.vw@email.co.za</p></div><div><span>VEHICLE</span><strong>2018 Ford EcoSport 1.0 EcoBoost</strong><p>GP 334-981<br />96,420 km</p></div><div><span>DETAILS</span><strong>Created 19 Aug 2026</strong><p>Valid until 26 Aug 2026<br />Prepared by Johan Meyer</p></div></div><div className="document-lines"><div className="doc-line-head"><span>Description</span><span>Qty</span><span>Unit price</span><span>Total</span></div><div><span><strong>Cooling system pressure test</strong><small>Labour</small></span><span>1.0 hr</span><span>R650.00</span><strong>R650.00</strong></div><div><span><strong>Replace thermostat housing</strong><small>Labour</small></span><span>2.0 hrs</span><span>R650.00</span><strong>R1,300.00</strong></div><div><span><strong>Thermostat housing assembly</strong><small>Part · FOR-TH-184</small></span><span>1</span><span>R3,980.00</span><strong>R3,980.00</strong></div><div><span><strong>Coolant concentrate 5L</strong><small>Part · CLT-G12</small></span><span>2</span><span>R420.00</span><strong>R840.00</strong></div><div><span><strong>Workshop consumables</strong><small>Consumables</small></span><span>1</span><span>R220.00</span><strong>R220.00</strong></div></div><div className="document-bottom"><div className="document-notes"><span>NOTES</span><p>Estimate based on inspection findings. Any additional work will require customer authorisation before proceeding.</p><span>VALIDITY</span><p>Valid for 7 days. Parts pricing and availability subject to supplier confirmation.</p></div><div className="document-totals"><div><span>Subtotal</span><strong>R6,990.00</strong></div><div><span>VAT (15%)</span><strong>R1,048.50</strong></div><div><span>Discount</span><strong>−R0.00</strong></div><div className="grand-total"><span>TOTAL</span><strong>R8,038.50</strong></div></div></div></section><aside className="document-aside"><section className="panel approval-card"><span className="section-kicker">APPROVAL STATUS</span><StatusPill tone="green">APPROVED</StatusPill><h3>Approved by customer</h3><p>Anika van Wyk approved this estimate by WhatsApp confirmation.</p><dl><div><dt>Date</dt><dd>20 Aug 2026</dd></div><div><dt>Time</dt><dd>08:46</dd></div><div><dt>Recorded by</dt><dd>Johan Meyer</dd></div></dl><button className="wide-button">View approval evidence</button></section><section className="panel"><div className="panel-heading"><div><span className="section-kicker">ACTIVITY</span><h2>Estimate timeline</h2></div></div><div className="timeline compact-timeline"><div><time>Today 08:46</time><strong>Estimate approved</strong><p>Customer confirmation recorded</p></div><div><time>Yesterday 15:14</time><strong>Estimate shared</strong><p>Sent by WhatsApp</p></div><div><time>Yesterday 14:52</time><strong>Estimate created</strong><p>Johan Meyer</p></div></div></section></aside></div></>;
}

function InvoiceDetail({ notify }: { notify: (message: string) => void }) {
  return <><PageHeader eyebrow="INVOICES / JB-INV-0194" title="Invoice detail" description="Issued to Sipho Dlamini · Linked to JB-JOB-0248" actions={<><button className="secondary-button" onClick={() => notify("Invoice PDF prepared")}>Download PDF</button><button className="secondary-button" onClick={() => notify("Invoice share link copied")}>Share</button><button className="primary-button" onClick={() => notify("Payment capture opened for JB-INV-0194")}>Record payment</button></>} /><div className="document-layout"><section className="panel document-sheet"><div className="document-brand"><BrandLockup dark={false} /><div><StatusPill tone="amber">PARTIALLY PAID</StatusPill><h2>TAX INVOICE</h2><span>JB-INV-0194</span></div></div><div className="document-parties"><div><span>BILL TO</span><strong>Sipho Dlamini</strong><p>083 771 0925<br />VAT: Not registered</p></div><div><span>VEHICLE</span><strong>2019 Ford Ranger 2.2 TDCi</strong><p>NW 81 LM GP<br />186,420 km</p></div><div><span>INVOICE DETAILS</span><strong>20 Aug 2026</strong><p>Job: JB-JOB-0248<br />Payment due on collection</p></div></div><div className="document-lines"><div className="doc-line-head"><span>Description</span><span>Qty</span><span>Unit price</span><span>Total</span></div><div><span><strong>Replace brake master cylinder</strong><small>Labour</small></span><span>2.5</span><span>R650.00</span><strong>R1,625.00</strong></div><div><span><strong>Brake master cylinder</strong><small>Part</small></span><span>1</span><span>R2,480.00</span><strong>R2,480.00</strong></div><div><span><strong>ATE front brake pad set</strong><small>Part</small></span><span>1</span><span>R1,020.00</span><strong>R1,020.00</strong></div><div><span><strong>DOT 4 brake fluid</strong><small>Consumable</small></span><span>1</span><span>R185.00</span><strong>R185.00</strong></div></div><div className="document-bottom"><div className="payment-history"><span>PAYMENTS RECEIVED</span><div><strong>R2,500.00</strong><p>EFT · Ref SIPHO-2008<br />20 Aug 2026</p></div></div><div className="document-totals"><div><span>Subtotal</span><strong>R5,310.00</strong></div><div><span>VAT (15%)</span><strong>R796.50</strong></div><div><span>Total</span><strong>R6,106.50</strong></div><div><span>Paid</span><strong>−R2,500.00</strong></div><div className="grand-total"><span>BALANCE DUE</span><strong>R3,606.50</strong></div></div></div></section><aside className="document-aside"><section className="panel balance-card"><span className="section-kicker">PAYMENT POSITION</span><strong>R3,606.50</strong><p>Outstanding balance due on vehicle collection.</p><div className="payment-progress"><span style={{width:"41%"}} /></div><small>41% paid</small><button className="primary-button wide-primary" onClick={() => notify("Payment capture opened")}>Record payment</button></section><section className="panel"><div className="panel-heading"><div><span className="section-kicker">PAYMENT METHODS</span><h2>Accepted</h2></div></div><div className="method-list"><span>EFT</span><span>Card</span><span>Cash</span></div></section></aside></div></>;
}

function Inventory({ notify }: { notify: (message: string) => void }) {
  const [query, setQuery] = useState("");
  const rows = inventoryRows.filter((row) => row.join(" ").toLowerCase().includes(query.toLowerCase()));
  return <><PageHeader eyebrow="PARTS & STOCK CONTROL" title="Inventory" description="Practical stock visibility tied to workshop usage and supplier follow-up." actions={<><button className="secondary-button" onClick={() => notify("Stock movement form opened")}>Record stock movement</button><button className="primary-button">+ Add stock item</button></>} /><section className="metrics-grid metrics-four"><MetricCard value="248" label="Total stock items" note="Across 18 categories" tone="steel" /><MetricCard value="06" label="Low stock" note="Reorder action needed" tone="amber" /><MetricCard value="01" label="Out of stock" note="Willard 646 battery" tone="red" /><MetricCard value="R186,420" label="Stock value" note="At average cost" tone="green" /></section><section className="panel table-panel"><div className="filter-bar"><label className="search-field"><span>SEARCH STOCK</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="SKU, part, supplier or category…" /></label><div className="filter-actions"><button className="filter-chip active">All stock</button><button className="filter-chip">Low stock</button><button className="filter-chip">Out of stock</button><button className="filter-chip">Fast moving</button></div></div><div className="responsive-table inventory-table"><div className="table-head"><span>SKU</span><span>Part</span><span>Category</span><span>Supplier</span><span>Qty</span><span>Reorder</span><span>Cost</span><span>Selling</span><span>Status</span></div>{rows.map((row) => <button className="table-row" key={row[0]}>{row.map((cell,index) => <span key={index} data-label={["SKU","Part","Category","Supplier","Qty","Reorder","Cost","Selling","Status"][index]} className={index === 1 ? "part-cell" : ""}>{index === 8 ? <StatusPill tone={cell === "In stock" ? "green" : cell === "Out of stock" ? "red" : "amber"}>{cell}</StatusPill> : cell}</span>)}</button>)}</div></section></>;
}

function Requests({ notify }: { notify: (message: string) => void }) {
  return <><PageHeader eyebrow="CUSTOMER PORTAL INBOX" title="Customer Requests" description="Review customer submissions, then contact them to confirm the next step." actions={<button className="primary-button">+ Record phone request</button>} /><section className="metrics-grid metrics-four"><MetricCard value="05" label="New requests" note="2 received today" tone="blue" /><MetricCard value="03" label="Problem reports" note="1 high severity" tone="red" /><MetricCard value="04" label="Awaiting contact" note="Oldest 4 hours" tone="amber" /><MetricCard value="09" label="Booked this week" note="From portal requests" tone="green" /></section><section className="request-grid"><article className="panel request-card urgent"><div className="request-card-top"><StatusPill tone="red">NEW PROBLEM REPORT</StatusPill><time>38 min ago</time></div><h2>Warning light and loss of power</h2><p className="request-vehicle">2021 VW Polo 1.0 TSI · CA 459-882</p><div className="request-customer"><span className="avatar">KN</span><div><strong>Kabelo Ndlovu</strong><small>079 441 8802</small></div></div><dl><div><dt>Category</dt><dd>Engine / Warning light</dd></div><div><dt>Occurs</dt><dd>Under acceleration</dd></div><div><dt>Severity</dt><dd><StatusPill tone="red">High</StatusPill></dd></div><div><dt>Media</dt><dd>2 photos · 1 video</dd></div></dl><blockquote>“The engine light comes on when I accelerate onto the highway and the car suddenly feels weak.”</blockquote><div className="card-actions"><button className="primary-button" onClick={() => notify("Problem report assigned for workshop review")}>Review</button><button className="secondary-button" onClick={() => notify("Ready to call Kabelo on 079 441 8802")}>Call customer</button></div></article><article className="panel request-card"><div className="request-card-top"><StatusPill tone="blue">SERVICE REQUEST</StatusPill><time>2 hrs ago</time></div><h2>Routine service request</h2><p className="request-vehicle">2017 Kia Picanto 1.0 · GP 901-212</p><div className="request-customer"><span className="avatar">LM</span><div><strong>Lerato Molefe</strong><small>081 632 1470</small></div></div><dl><div><dt>Preferred date</dt><dd>25 Aug 2026</dd></div><div><dt>Service</dt><dd>Routine service</dd></div><div><dt>Current km</dt><dd>88,540 km</dd></div><div><dt>Status</dt><dd><StatusPill tone="amber">Awaiting contact</StatusPill></dd></div></dl><p className="request-note">Customer requested a morning drop-off and needs the vehicle before 16:00.</p><div className="card-actions"><button className="primary-button" onClick={() => notify("Booking confirmation workflow opened")}>Contact & confirm</button><button className="secondary-button">View vehicle</button></div></article></section></>;
}

function Reports() {
  const groups = [
    {title:"Workshop performance", stats:[["R184,620","Revenue"],["38","Jobs completed"],["R4,858","Average job value"],["2.8 days","Turnaround time"]], bars:[72,52,84,66]},
    {title:"Customer retention", stats:[["68%","Repeat customers"],["47","Due for service"],["74%","Contact rate"],["R32,480","Outstanding"]], bars:[68,47,74,32]},
    {title:"Workshop quality", stats:[["3.2%","Comeback rate"],["1.8%","Warranty rate"],["94%","First-time fix"],["6","QC holds"]], bars:[18,10,94,28]},
    {title:"Inventory health", stats:[["06","Low stock items"],["01","Out of stock"],["R48,200","Parts used"],["4.1x","Stock turn"]], bars:[30,8,76,58]},
  ];
  return <><PageHeader eyebrow="REPORTING / OPERATIONAL DECISIONS" title="Workshop Reports" description="Use performance, customer, quality and stock signals to decide what to do next." actions={<><button className="secondary-button">Export Excel</button><button className="primary-button">Download monthly report</button></>} /><div className="report-grid">{groups.map((group) => <section className="panel report-card" key={group.title}><div className="panel-heading"><div><span className="section-kicker">AUGUST 2026</span><h2>{group.title}</h2></div><button className="text-button">Open report →</button></div><div className="report-stats">{group.stats.map(([value,label],index) => <div key={label}><strong>{value}</strong><span>{label}</span><i><b style={{width:`${group.bars[index]}%`}} /></i></div>)}</div><div className="report-insight"><StatusPill tone={group.title === "Workshop quality" ? "amber" : "green"}>INSIGHT</StatusPill><p>{group.title === "Customer retention" ? "12 customers due within 2,000 km have not yet been contacted." : group.title === "Inventory health" ? "Brake parts are moving 22% faster than the prior month." : "Performance remains within the workshop’s current operating target."}</p></div></section>)}</div></>;
}

function Settings() {
  return <><PageHeader eyebrow="WORKSHOP CONFIGURATION" title="Settings" description="Control JB Motors’ identity, workshop rules, numbering and staff access." actions={<button className="primary-button">Save settings</button>} /><div className="settings-layout"><nav className="panel settings-nav">{["Workshop profile","Workshop rules","Numbering","Service catalogue","Payment methods","Staff & roles","Notifications"].map((item,index) => <button className={index===0?"active":""} key={item}>{item}<span>→</span></button>)}</nav><section className="panel settings-form"><div className="panel-heading"><div><span className="section-kicker">BUSINESS IDENTITY</span><h2>Workshop profile</h2></div></div><div className="logo-setting"><BrandLockup dark={false} /><div><strong>JB Motors logo</strong><p>Primary workshop identity used across the platform and documents.</p><button className="secondary-button">Replace logo asset</button></div></div><div className="form-grid"><label><span>Workshop name</span><input defaultValue="JB Motors" /></label><label><span>Telephone</span><input defaultValue="011 555 0184" /></label><label><span>WhatsApp</span><input defaultValue="082 555 0184" /></label><label><span>Email</span><input defaultValue="workshop@jbmotors.co.za" /></label><label className="full"><span>Workshop address</span><input defaultValue="18 Main Reef Road, Johannesburg, Gauteng, 2001" /></label><label><span>VAT number</span><input defaultValue="4123456789" /></label><label><span>Default labour rate</span><input defaultValue="R650.00 / hour" /></label></div><div className="settings-rule-preview"><span className="section-kicker">CURRENT WORKSHOP RULES</span><div><p>Default service interval</p><strong>10,000 km</strong></div><div><p>Reminder threshold</p><strong>2,000 km</strong></div><div><p>VAT</p><strong>15%</strong></div><div><p>Estimate validity</p><strong>7 days</strong></div></div></section></div></>;
}

function OperationalModule({ view, notify }: { view: WorkshopView; notify: (message: string) => void }) {
  const content: Record<string, {eyebrow:string; title:string; description:string; headers:string[]; rows:string[][]; action:string}> = {
    suppliers:{eyebrow:"PARTS SUPPLY NETWORK",title:"Suppliers",description:"Contacts, supplied categories and outstanding orders without accounting overhead.",headers:["Supplier","Contact","Categories","Last order","Outstanding","Status"],rows:[["AutoZone Johannesburg","011 402 1158","Brakes, filters","18 Aug 2026","2 orders","Active"],["Goldwagen Randburg","011 781 4471","VW, cooling","20 Aug 2026","1 order","Active"],["Midas Crown Mines","011 837 4902","General service parts","16 Aug 2026","None","Active"],["Battery Centre","011 493 7720","Batteries, electrical","08 Aug 2026","1 backorder","Follow-up"]],action:"+ Add supplier"},
    payments:{eyebrow:"PAYMENTS & RECEIPTS",title:"Payments",description:"Record EFT, card and cash payments against invoices with clear balances.",headers:["Date","Reference","Customer","Invoice","Method","Amount","Recorded by"],rows:[["20 Aug 2026","SIPHO-2008","Sipho Dlamini","JB-INV-0194","EFT","R2,500.00","Lindiwe Maseko"],["20 Aug 2026","CARD-8841","Lerato Molefe","JB-INV-0192","Card","R3,680.00","Lindiwe Maseko"],["19 Aug 2026","CASH-0191","Kabelo Ndlovu","JB-INV-0191","Cash","R1,450.00","Johan Meyer"]],action:"+ Record payment"},
    warranties:{eyebrow:"QUALITY / COMEBACK CONTROL",title:"Warranties & Comebacks",description:"Track returns against original work and protect workshop quality.",headers:["Case","Customer","Vehicle","Original job","Reason","Opened","Cost","Status"],rows:[["JB-WAR-0018","Naledi Khumalo","Hyundai i20","JB-JOB-0227","Brake noise returned","18 Aug 2026","R420.00","Investigating"],["JB-WAR-0017","Pieter Botha","Toyota Hilux","JB-JOB-0208","Oil leak at filter housing","02 Aug 2026","R185.00","Resolved"]],action:"+ Open warranty case"},
  };
  const item = content[view] ?? content.suppliers;
  return <><PageHeader eyebrow={item.eyebrow} title={item.title} description={item.description} actions={<button className="primary-button" onClick={() => notify(`${item.action.replace("+ ","")} form opened`)}>{item.action}</button>} /><section className="panel table-panel generic-table"><div className="filter-bar"><label className="search-field"><span>SEARCH</span><input placeholder={`Search ${item.title.toLowerCase()}…`} /></label><div className="filter-actions"><button className="filter-chip active">All</button><button className="filter-chip">Active</button><button className="filter-chip">Needs attention</button></div></div><div className="responsive-table"><div className="table-head" style={{gridTemplateColumns:`repeat(${item.headers.length}, minmax(110px, 1fr))`}}>{item.headers.map((header) => <span key={header}>{header}</span>)}</div>{item.rows.map((row) => <button className="table-row" style={{gridTemplateColumns:`repeat(${row.length}, minmax(110px, 1fr))`}} key={row.join("")}>{row.map((cell,index) => <span data-label={item.headers[index]} key={index}>{index===row.length-1?<StatusPill tone={cell==="Resolved"||cell==="Active"?"green":"amber"}>{cell}</StatusPill>:cell}</span>)}</button>)}</div></section></>;
}

function TechnicianView({ notify }: { notify: (message: string) => void }) {
  const [jobStatus, setJobStatus] = useState("In Progress");
  const [note, setNote] = useState("");
  return <div className="technician-view"><PageHeader eyebrow="TECHNICIAN MOBILE WORKSPACE" title="My assigned jobs" description="Petrus Nkosi · 3 jobs today" actions={<StatusPill tone="blue">ON DUTY</StatusPill>} /><section className="tech-job-card"><div className="tech-job-top"><div><span>ACTIVE JOB</span><strong>JB-JOB-0248</strong></div><StatusPill tone="blue">{jobStatus}</StatusPill></div><h2>2019 Ford Ranger 2.2 TDCi</h2><p>NW 81 LM GP · 186,420 km</p><blockquote>Soft brake pedal, pulls left under braking and warning light appeared.</blockquote><div className="tech-status-actions"><button onClick={() => {setJobStatus("Waiting Parts");notify("Job moved to Waiting Parts");}}>Waiting parts</button><button onClick={() => {setJobStatus("QC");notify("Job moved to QC");}}>Send to QC</button></div></section><section className="tech-tools"><article className="panel"><div className="panel-heading"><div><span className="section-kicker">INITIAL INSPECTION</span><h2>Quick checks</h2></div><span className="progress-ring">4/6</span></div>{["Customer complaint confirmed","Vehicle condition photographed","Warning lights scanned","Fluid levels checked","Road test before work","Parts requirement confirmed"].map((item,index) => <label key={item}><input type="checkbox" defaultChecked={index<4} />{item}</label>)}</article><article className="panel"><div className="panel-heading"><div><span className="section-kicker">WORK NOTES</span><h2>Add technician update</h2></div></div><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Record findings, work completed or what is blocking the job…" /><div className="tech-upload"><label><input type="file" accept="image/*" capture="environment" />Capture photo</label><button className="primary-button" onClick={() => {if(note.trim()){notify("Technician note saved");setNote("");}}}>Save note</button></div></article><article className="panel parts-used"><div className="panel-heading"><div><span className="section-kicker">PARTS USED</span><h2>Job stock</h2></div><button className="text-button">+ Add part</button></div><div><strong>Brake master cylinder</strong><span>1 × R2,480.00</span></div><div><strong>ATE front brake pads</strong><span>1 × R1,020.00</span></div><div><strong>DOT 4 brake fluid</strong><span>1 × R185.00</span></div></article></section></div>;
}

function CustomerPortal({ onExit }: { onExit: () => void }) {
  const [view, setView] = useState<CustomerView>("home");
  return <div className="portal-stage"><aside className="portal-context"><BrandLockup /><span className="section-kicker">CUSTOMER CARE PORTAL</span><h1>Your vehicle, professionally managed from arrival to its next service.</h1><p>View service needs, update kilometres and contact the workshop without navigating workshop complexity.</p><button className="secondary-dark" onClick={onExit}>← Return to workshop platform</button><div className="portal-help"><span>Need help?</span><strong>Call JB Motors</strong><a href="tel:+27115550184">011 555 0184</a></div></aside><main className="customer-app"><header className="customer-header"><BrandLockup compact /><button onClick={onExit}>Workshop view</button></header><div className="customer-content">{view === "home" && <CustomerHome onNavigate={setView} />}{view === "vehicles" && <CustomerVehicle onNavigate={setView} />}{view === "service" && <ServiceRequest onDone={() => setView("home")} />}{view === "problem" && <ProblemReport onDone={() => setView("home")} />}{view === "kilometres" && <UpdateKilometres onDone={() => setView("home")} />}{view === "history" && <CustomerHistory />}{view === "profile" && <CustomerProfile />}</div><nav className="customer-bottom-nav" aria-label="Customer portal navigation">{[
    ["home","HM","Home"],["vehicles","VH","My vehicles"],["service","SV","Service"],["problem","RP","Report"],["history","HS","History"],["profile","PF","Profile"],
  ].map(([target,code,label]) => <button key={target} className={view===target?"active":""} onClick={() => setView(target as CustomerView)}><span>{code}</span><small>{label}</small></button>)}</nav></main></div>;
}

function CustomerHome({ onNavigate }: { onNavigate: (view: CustomerView) => void }) {
  return <><section className="customer-greeting"><span>THURSDAY, 20 AUGUST</span><h1>Hello, Thabo</h1><p>Here’s what your Toyota needs next.</p></section><section className="customer-vehicle-card"><div className="vehicle-card-header"><span className="vehicle-mark light">TY</span><div><small>PRIMARY VEHICLE</small><h2>2020 Toyota Corolla</h2><p>1.8 Prestige · GP 123-456</p></div><button onClick={() => onNavigate("vehicles")}>→</button></div><div className="service-state due-soon"><div className="service-state-copy"><StatusPill tone="orange">SERVICE DUE SOON</StatusPill><strong>1,760 km</strong><span>remaining until your next service</span></div><div className="service-gauge"><span style={{width:"82%"}} /></div><div className="service-values"><span><small>Current</small><strong>143,240 km</strong></span><span><small>Next service</small><strong>145,000 km</strong></span></div></div><div className="last-service"><span>LAST SERVICE</span><strong>14 February 2026 · 135,000 km</strong><small>Major service · JB Motors</small></div></section><section className="customer-primary-actions"><button onClick={() => onNavigate("kilometres")}><span>KM</span><strong>Update kilometres</strong><small>Keep reminders accurate</small></button><button onClick={() => onNavigate("service")}><span>SV</span><strong>Request a service</strong><small>We’ll call to confirm</small></button><button onClick={() => onNavigate("problem")}><span>!</span><strong>Report a problem</strong><small>Tell us what the car is doing</small></button></section><section className="customer-notices"><div className="customer-section-heading"><span className="section-kicker">YOUR VEHICLE</span><h2>Needs attention</h2></div><article className="customer-notice orange"><span className="notice-mark">01</span><div><StatusPill tone="orange">SERVICE REMINDER</StatusPill><h3>Your service is approaching</h3><p>At your current kilometres, it is a good time to plan your next visit.</p></div><button onClick={() => onNavigate("service")}>Request service</button></article><article className="customer-notice blue"><span className="notice-mark">02</span><div><StatusPill tone="blue">OPEN REQUEST</StatusPill><h3>Routine service request received</h3><p>Submitted today. JB Motors will contact you to confirm availability.</p></div><button onClick={() => onNavigate("service")}>View request</button></article></section><a className="contact-workshop" href="tel:+27115550184"><span>JB</span><div><strong>Contact JB Motors</strong><small>011 555 0184 · Workshop hours 07:30–17:00</small></div><b>Call now</b></a></>;
}

function CustomerVehicle({ onNavigate }: { onNavigate: (view: CustomerView) => void }) {
  return <><section className="mobile-page-heading"><button onClick={() => onNavigate("home")}>←</button><div><span className="section-kicker">MY VEHICLE</span><h1>2020 Toyota Corolla</h1><p>1.8 Prestige · GP 123-456</p></div></section><section className="mobile-vehicle-profile"><div className="vehicle-mark large">TY</div><StatusPill tone="orange">SERVICE DUE SOON</StatusPill><div className="mobile-vehicle-stats"><div><span>Current km</span><strong>143,240</strong></div><div><span>Next service</span><strong>145,000</strong></div><div><span>Last service</span><strong>135,000</strong></div><div><span>Remaining</span><strong>1,760 km</strong></div></div><button className="primary-button wide-primary" onClick={() => onNavigate("kilometres")}>Update kilometres</button></section><section className="customer-detail-list"><h2>Vehicle information</h2><div><span>Year</span><strong>2020</strong></div><div><span>Registration</span><strong>GP 123-456</strong></div><div><span>VIN</span><strong>AHTBB3JE0LJ081624</strong></div><div><span>Engine</span><strong>1.8L Petrol</strong></div><div><span>Transmission</span><strong>CVT Automatic</strong></div></section></>;
}

function UpdateKilometres({ onDone }: { onDone: () => void }) {
  const [value, setValue] = useState("143240");
  const [submitted, setSubmitted] = useState(false);
  const current = Number(value || 0);
  const remaining = 145000 - current;
  const submit = (event: FormEvent) => {event.preventDefault();setSubmitted(true);};
  if (submitted) return <section className="mobile-success"><span className="success-check">✓</span><StatusPill tone="green">UPDATE COMPLETE</StatusPill><h1>Kilometres updated successfully.</h1><p>JB Motors will let you know when your vehicle is approaching its next service.</p><div className="success-summary"><span><small>Recorded kilometres</small><strong>{current.toLocaleString("en-ZA")} km</strong></span><span><small>Next service</small><strong>145,000 km</strong></span></div><button className="primary-button wide-primary" onClick={onDone}>Back to home</button></section>;
  return <><section className="mobile-page-heading"><button onClick={onDone}>←</button><div><span className="section-kicker">TOYOTA COROLLA · GP 123-456</span><h1>Update kilometres</h1><p>Keep your service reminders accurate.</p></div></section><form className="mobile-form" onSubmit={submit}><div className="previous-reading"><span>PREVIOUS READING</span><strong>142,760 km</strong><small>12 August 2026 · Manual update</small></div><label className="odometer-input"><span>Current odometer reading</span><div><input type="number" min="142760" max="999999" required value={value} onChange={(event) => setValue(event.target.value)} /><b>km</b></div><small>Enter the number shown on your vehicle’s dashboard.</small></label><section className={`km-result ${remaining < 0 ? "overdue" : remaining <= 2000 ? "due" : "ok"}`}><StatusPill tone={remaining < 0 ? "red" : remaining <= 2000 ? "orange" : "green"}>{remaining < 0 ? "SERVICE OVERDUE" : remaining <= 2000 ? "SERVICE DUE SOON" : "SERVICE OK"}</StatusPill><span>{remaining < 0 ? "Overdue by" : "Kilometres remaining"}</span><strong>{Math.abs(remaining).toLocaleString("en-ZA")} km</strong><small>Next service due at 145,000 km</small></section><button className="primary-button wide-primary" type="submit">Update kilometres</button><p className="form-reassurance">This reading is sent to JB Motors. A staff member may contact you when your service is approaching.</p></form></>;
}

function ServiceRequest({ onDone }: { onDone: () => void }) {
  const [submitted, setSubmitted] = useState(false);
  if (submitted) return <section className="mobile-success"><span className="success-check">✓</span><StatusPill tone="green">REQUEST RECEIVED</StatusPill><h1>JB Motors will contact you to confirm your booking.</h1><p>Your preferred date is a request, not a confirmed appointment yet.</p><div className="success-summary column"><span><small>Vehicle</small><strong>2020 Toyota Corolla · GP 123-456</strong></span><span><small>Service</small><strong>Routine Service</strong></span><span><small>Preferred date</small><strong>25 August 2026</strong></span></div><button className="primary-button wide-primary" onClick={onDone}>Back to home</button></section>;
  return <><section className="mobile-page-heading"><button onClick={onDone}>←</button><div><span className="section-kicker">SERVICE REQUEST</span><h1>How can we help?</h1><p>Tell us what your vehicle needs. We’ll call to confirm availability.</p></div></section><form className="mobile-form" onSubmit={(event) => {event.preventDefault();setSubmitted(true);}}><label><span>Vehicle</span><select defaultValue="corolla"><option value="corolla">2020 Toyota Corolla · GP 123-456</option><option>2016 Nissan NP200 · GP 442-197</option></select></label><fieldset><legend>Service type</legend><div className="choice-grid">{["Routine Service","Vehicle Inspection","Mechanical Repair","Electrical Fault","Brake Service","Suspension","Diagnostic Check","Other"].map((item,index) => <label key={item} className={index===0?"selected":""}><input type="radio" name="service" defaultChecked={index===0} />{item}</label>)}</div></fieldset><label><span>Preferred date</span><input type="date" defaultValue="2026-08-25" min="2026-08-21" required /></label><label><span>Description / notes <small>Optional</small></span><textarea placeholder="Anything JB Motors should know before calling you…" /></label><button className="primary-button wide-primary" type="submit">Send service request</button><p className="form-reassurance">Submitting this request does not create an instant booking. JB Motors will contact you to confirm.</p></form></>;
}

function ProblemReport({ onDone }: { onDone: () => void }) {
  const [category, setCategory] = useState("Warning Light");
  const [severity, setSeverity] = useState("Medium");
  const [submitted, setSubmitted] = useState(false);
  const categories = ["Engine","Electrical","Brakes","Suspension","Steering","Transmission","Cooling","Starting / Battery","Noise / Vibration","Warning Light","Other"];
  if (submitted) return <section className="mobile-success"><span className="success-check">✓</span><StatusPill tone="green">PROBLEM SUBMITTED</StatusPill><h1>JB Motors has received your report.</h1><p>A workshop staff member will review the information and contact you about the next step.</p><div className="success-summary column"><span><small>Category</small><strong>{category}</strong></span><span><small>Severity</small><strong>{severity}</strong></span><span><small>Status</small><strong>Submitted</strong></span></div><button className="primary-button wide-primary" onClick={onDone}>Back to home</button></section>;
  return <><section className="mobile-page-heading"><button onClick={onDone}>←</button><div><span className="section-kicker">REPORT A VEHICLE PROBLEM</span><h1>What is your vehicle doing?</h1><p>Describe the problem in your own words. You don’t need to know the technical cause.</p></div></section><form className="mobile-form problem-form" onSubmit={(event) => {event.preventDefault();setSubmitted(true);}}><label><span>Vehicle</span><select defaultValue="corolla"><option value="corolla">2020 Toyota Corolla · GP 123-456</option></select></label><fieldset><legend>What does this relate to?</legend><div className="category-grid">{categories.map((item) => <button type="button" className={category===item?"selected":""} key={item} onClick={() => setCategory(item)}>{item}</button>)}</div></fieldset><label><span>What is your vehicle doing?</span><textarea required minLength={12} placeholder="For example: The engine warning light appears when I accelerate and the car loses power…" /></label><label><span>When does it happen?</span><select defaultValue="driving"><option value="driving">While driving</option><option>When starting</option><option>When braking</option><option>When turning</option><option>At idle</option><option>Intermittently / unsure</option></select></label><fieldset><legend>How serious does it feel?</legend><div className="severity-options">{["Low","Medium","High","Vehicle cannot drive"].map((item) => <button type="button" className={`${severity===item?"selected":""} severity-${item.toLowerCase().replaceAll(" ","-")}`} key={item} onClick={() => setSeverity(item)}>{item}</button>)}</div></fieldset><div className="media-upload"><label><input type="file" accept="image/*" multiple /><strong>Add photos</strong><small>Optional · Up to 5 images</small></label><label><input type="file" accept="video/*" /><strong>Add video</strong><small>Optional · Up to 30 seconds</small></label></div><button className="primary-button wide-primary" type="submit">Submit problem report</button><p className="form-reassurance">If the vehicle is unsafe to drive, stop in a safe place and call JB Motors.</p></form></>;
}

function CustomerHistory() {
  return <><section className="mobile-page-heading no-back"><div><span className="section-kicker">VEHICLE RECORD</span><h1>Service history</h1><p>Work completed by JB Motors.</p></div></section><div className="mobile-history">{[["14 Feb 2026","135,000 km","Major service","R6,840.00"],["23 Aug 2025","125,000 km","Minor service + front brakes","R8,220.00"],["08 Jan 2025","115,000 km","Routine service","R3,480.00"]].map((item) => <article key={item[0]}><time>{item[0]}</time><StatusPill tone="green">COMPLETED</StatusPill><h2>{item[2]}</h2><p>{item[1]} · Toyota Corolla</p><strong>{item[3]}</strong><button>View details →</button></article>)}</div></>;
}

function CustomerProfile() {
  return <><section className="mobile-page-heading no-back"><div><span className="section-kicker">MY DETAILS</span><h1>Profile</h1><p>Keep your contact information up to date.</p></div></section><section className="customer-profile-card"><span className="large-avatar">TM</span><h2>Thabo Mokoena</h2><p>JB Motors customer since March 2022</p></section><form className="mobile-form profile-form"><label><span>Mobile number</span><input defaultValue="082 555 0148" /></label><label><span>Email address</span><input defaultValue="thabo.mokoena@email.co.za" /></label><label><span>Preferred contact method</span><select defaultValue="whatsapp"><option value="whatsapp">WhatsApp</option><option>Phone call</option><option>SMS</option><option>Email</option></select></label><label className="toggle-label"><input type="checkbox" aria-label="Enable service reminders" defaultChecked /><span><strong>Service reminders</strong><small>Allow JB Motors to contact me about approaching services.</small></span></label><button className="primary-button wide-primary" type="button">Save profile</button></form></>;
}

export default function Home() {
  const [activeView, setActiveView] = useState<WorkshopView>("dashboard");
  const [role, setRole] = useState<StaffRole>("Owner / Administrator");
  const [portalOpen, setPortalOpen] = useState(false);
  const [toast, setToast] = useState("");
  const visibleNav = navItems.filter((item) => item.roles.includes(role));
  const notify = (message: string) => setToast(message);
  const changeRole = (nextRole: StaffRole) => {setRole(nextRole); if (nextRole === "Technician") setActiveView("technician"); else if (nextRole === "Store / Parts") setActiveView("inventory"); else if (nextRole === "Finance / Accounts") setActiveView("invoice"); else setActiveView("dashboard");};
  const renderView = () => {
    if (activeView === "dashboard") return <Dashboard onOpen={setActiveView} notify={notify} />;
    if (activeView === "customers") return <CustomerDirectory onOpen={setActiveView} />;
    if (activeView === "vehicle") return <VehicleProfile notify={notify} />;
    if (activeView === "job-card") return <JobCardDetail notify={notify} />;
    if (activeView === "follow-ups") return <FollowUpCentre notify={notify} onOpen={setActiveView} />;
    if (activeView === "estimate") return <EstimateDetail notify={notify} onConvert={() => {setActiveView("job-card");notify("Estimate JB-EST-0226 converted to a draft job card");}} />;
    if (activeView === "invoice") return <InvoiceDetail notify={notify} />;
    if (activeView === "inventory") return <Inventory notify={notify} />;
    if (activeView === "requests") return <Requests notify={notify} />;
    if (activeView === "reports") return <Reports />;
    if (activeView === "settings") return <Settings />;
    if (activeView === "technician") return <TechnicianView notify={notify} />;
    return <OperationalModule view={activeView} notify={notify} />;
  };
  if (portalOpen) return <CustomerPortal onExit={() => setPortalOpen(false)} />;
  return <main className="app-shell"><aside className="sidebar"><BrandLockup /><nav className="side-nav" aria-label="Workshop navigation">{visibleNav.map((item) => <button className={`nav-item ${activeView===item.view?"active":""}`} key={item.view} onClick={() => setActiveView(item.view)}><span className="nav-code">{item.code}</span>{item.label}{item.view==="follow-ups"&&<b className="nav-count">7</b>}</button>)}</nav>{role === "Owner / Administrator" && <button className={`nav-item settings ${activeView==="settings"?"active":""}`} onClick={() => setActiveView("settings")}><span className="nav-code">ST</span>Settings</button>}<div className="user-card"><span className="avatar">JM</span><span><strong>Johan Meyer</strong><small>{role}</small></span></div></aside><section className="workspace"><header className="topbar"><button className="mobile-brand" onClick={() => setActiveView("dashboard")}><BrandLockup compact /></button><div className="desktop-greeting"><span className="eyebrow">THURSDAY · 20 AUGUST 2026</span><strong>JB Motors Workshop</strong></div><div className="top-actions"><label className="role-select"><span>VIEW AS</span><select value={role} onChange={(event) => changeRole(event.target.value as StaffRole)}>{["Owner / Administrator","Service Advisor","Technician","Store / Parts","Finance / Accounts"].map((item) => <option key={item}>{item}</option>)}</select></label><button className="secondary-button portal-button" onClick={() => setPortalOpen(true)}>Customer portal</button><button className="primary-button" onClick={() => {setActiveView("job-card");notify("New draft job card opened");}}>+ New job card</button></div></header><div className="content">{renderView()}</div><nav className="staff-mobile-nav">{visibleNav.slice(0,5).map((item) => <button className={activeView===item.view?"active":""} key={item.view} onClick={() => setActiveView(item.view)}><span>{item.code}</span><small>{item.label}</small></button>)}</nav></section>{toast && <div className="toast" role="status"><span>✓</span><p>{toast}</p><button aria-label="Dismiss notification" onClick={() => setToast("")}>×</button></div>}</main>;
}
