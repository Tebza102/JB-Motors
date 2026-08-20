# Product Requirements

## Product Summary
JB Motors Digital Workshop Management is a single-workshop operating interface connecting front desk, workshop floor, parts, accounts, customers, and vehicle history. This phase is a high-fidelity interactive prototype using mock data.

## Must-Have Features
- Attention-led workshop dashboard
- Searchable customer and vehicle records
- Service status and manual kilometre history with source tracking
- Estimate, job-card, invoice, and payment lifecycle views
- Job board, technician work view, QC, and activity history
- Inventory, supplier, warranty, request, follow-up, report, and settings views
- Customer service request, problem report, kilometre update, service history, and profile flows
- Role-aware navigation and responsive layouts
- Loading, empty, error, confirmation, and success states

## Should-Have Features
- Export-ready estimate/invoice layouts
- Demo state selector for review sessions
- Clear owner-confirmation flags for incomplete workshop settings

## Could-Have Features
- Saved local demo preferences
- Additional sample vehicles and jobs
- Print-specific styling

## Out-of-Scope Features
Production authentication, persistent data, real uploads, notifications, payments, API integrations, GPS/telematics, AI diagnosis, multi-tenancy, and deployment.

## Main Workflow
Customer → Vehicle → Diagnosis → Estimate → Approval → Job Card → Labour & Parts → Quality Control → Invoice → Payment → Service History → Future Service Reminder.

## Acceptance Criteria
- Every main navigation item opens a complete interface, not a placeholder.
- Jabulani sees Owner / Administrator information and only confirmed business facts.
- Service states correctly represent okay, due-soon, and overdue conditions.
- Customer kilometre submission recalculates remaining kilometres and shows confirmation.
- Problem reports preserve customer language and do not require diagnosis.
- Service requests clearly state that JB Motors will confirm availability.
- Estimate conversion, job status, payment, and follow-up actions provide visible confirmation.
- Mobile tables transform into readable cards or condensed lists.
- Keyboard focus, labels, contrast, and touch targets remain usable.
