# Data Model

## Main Entities

| Entity | Purpose | Key Fields | Relationships |
|---|---|---|---|
| WorkshopProfile | Confirmed JB Motors identity and rules | businessName, ownerName, location, logoPath, contact confirmation fields | Referenced by documents and portals |
| User | Workshop staff identity and role | id, name, role, active | Assigned to jobs and activities |
| Customer | Customer profile and contact preferences | id, name, mobile, email, notes, status | Owns vehicles, requests, invoices, follow-ups |
| Vehicle | Vehicle identity and service position | id, registration, VIN, make, model, year, currentKm, nextServiceKm | Belongs to customer; has records |
| KilometreRecord | Structured odometer history | id, vehicleId, kilometres, recordedAt, source | Belongs to vehicle |
| ServiceRequest | Customer-requested work | id, customerId, vehicleId, type, preferredDate, notes, status | Can lead to booking/job |
| ProblemReport | Customer symptom report | id, vehicleId, category, description, occurrence, severity, media, status | Reviewed by workshop |
| Estimate | Proposed labour and parts | id, customerId, vehicleId, lines, totals, status, validity | Converts to job card |
| JobCard | Operational workshop record | id, vehicleId, complaint, status, technician, findings, labour, parts, QC | Produces invoice/history |
| InventoryItem | Workshop stock item | id, SKU, category, supplier, quantity, reorderLevel, cost, sellingPrice | Used on jobs and movements |
| StockMovement | Stock change audit | id, itemId, type, quantity, date, jobId, note | Updates inventory |
| Invoice | Bill for completed work | id, jobId, lines, totals, balance, status | Receives payments |
| Payment | Invoice settlement record | id, invoiceId, method, amount, reference, date | Reduces invoice balance |
| WarrantyCase | Return/comeback record | id, originalJobId, complaint, reason, resolution, cost, status | Links to vehicle/customer |
| FollowUp | Human contact queue item | id, customerId, vehicleId, reason, priority, dueAt, status | Tracks calls/messages |
| Activity | Relationship/audit timeline | id, entityType, entityId, actor, action, timestamp | Belongs to operational record |

## Validation Rules
- Kilometres must be numeric, non-negative, and not lower than the last accepted reading without an explicit correction workflow.
- Money uses ZAR and financial totals use consistent VAT treatment once owner rules are confirmed.
- Estimate, job, invoice, and payment statuses use controlled enums.
- Customer problem descriptions preserve customer language.
- `KilometreRecord.source` supports `Manual` now and reserves `GPS` / `Telematics` for future integrations.

## Data Lifecycle
The current prototype uses in-memory mock objects only. Production create/update/archive/export rules remain unimplemented.

## Security Considerations
Future production work must enforce role access server-side, protect customer/vehicle/financial data, validate uploads, verify payment events, and maintain audit logs.

## Migration Notes
Before backend work, move mock data into typed repositories, confirm owner rules and contact details, select Firebase/Firestore or another approved store, and define security rules and indexes.
