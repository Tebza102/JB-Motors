# Smoke Test Checklist

## Local Setup
- [x] Dependencies install from the committed lockfile.
- [x] Development server starts from `C:\Users\appri\JB Motors`.
- [x] Root route returns HTTP 200.
- [x] No blocking terminal or browser-console errors.

## Identity and Brand
- [x] Supplied logo is loaded from `/brand/jb-motors-logo.png`.
- [x] Logo is not stretched, cropped, recoloured, regenerated, or reinterpreted.
- [x] Owner identity is Jabulani.
- [x] Location is Ratanda, Heidelberg, Gauteng (GP).
- [x] Unknown business details are marked for confirmation instead of invented.

## Workshop Navigation
- [ ] Dashboard
- [ ] Customers and customer detail
- [ ] Vehicles and vehicle profile/history
- [ ] Estimates list/detail
- [ ] Job-card table/board/detail
- [ ] Inventory and stock movement/item detail
- [ ] Suppliers
- [ ] Invoices list/detail
- [ ] Payments and receipt
- [ ] Warranties/comebacks
- [ ] Customer requests
- [ ] Customer follow-ups
- [ ] Reports
- [ ] Settings sections

## Role and Workflow
- [x] Role navigation changes correctly.
- [x] Estimate conversion confirmation appears.
- [x] Job status changes and QC controls work.
- [ ] Follow-up filters and contact confirmations work.
- [ ] Demo loading, empty, error, and ready states work.

## Mobile
- [x] Technician job, inspection, notes, photo control, parts, and status views are usable.
- [x] Customer home, vehicle, service, problem, kilometre, history, and profile views are usable.
- [x] Kilometre calculation shows okay, due-soon, and overdue states correctly.
- [x] Service request does not imply an instant booking.
- [x] Problem report does not require customer diagnosis.

## Quality and Scope
- [x] `npm run lint` passes.
- [x] `npm run build` passes.
- [x] No real customer data or secrets are included.
- [x] No backend, authentication, integration, source upload, or deployment was added.
