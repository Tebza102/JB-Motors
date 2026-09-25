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
- [x] Customer requests
- [ ] Customer follow-ups
- [x] Reports
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
- [x] One problem report supports multiple independent issues and multiple categories per issue.
- [x] Problem-report validation preserves entered issue data.
- [x] Submitted reports and workshop review status persist after refresh in the same browser.
- [x] Reset storage regression verifies only problem reports are cleared; confirmation guard verified in source (confirmation dialog not exercised).
- [x] Storage regression verifies malformed data cannot be overwritten and unavailable storage cannot report success.

## Documents
- [x] Estimate PDF downloads and reopens with matching reference and total.
- [x] Invoice PDF downloads and reopens with matching reference and balance.
- [x] Vehicle service-history PDF downloads and matches the screen records.
- [x] August 2026 monthly report downloads and preserves the displayed reporting period.
- [x] Every generated PDF page was rendered and visually checked for clipping and overlap.

## Quality and Scope
- [x] `npm run lint` passes.
- [x] `npm run build` passes.
- [x] No real customer data or secrets are included.
- [x] No backend, authentication, integration, source upload, or deployment was added.
