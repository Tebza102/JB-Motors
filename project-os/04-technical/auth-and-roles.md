# Auth and Roles

## Auth Provider
None in the current frontend prototype.

## User Types
Workshop staff and customer portal users.

## Roles
| Role | Prototype Navigation | Production Limit Required Later |
|---|---|---|
| Owner / Administrator | All workshop modules and settings | Full administrative control with audit trail |
| Service Advisor | Customers, vehicles, estimates, jobs, requests, follow-ups, warranties | No staff/security configuration |
| Technician | Assigned vehicles and job workflow | No finance, customer exports, or global settings |
| Store / Parts | Inventory, suppliers, and job parts | No finance or staff administration |
| Finance / Accounts | Customers, invoices, payments, reports | No workshop diagnosis or stock adjustment without permission |
| Customer | Own vehicles, requests, problems, kilometres, history, and profile | Own records only |

## Protected Routes
None. The prototype is one local demonstration surface.

## Public Routes
The local root view only. Customer portal access is a demo mode switch.

## Role Enforcement
Client-side navigation filtering only. It demonstrates intended information architecture and must not be represented as security.

## Auth Risks
- All users can access client-rendered mock data.
- Refresh resets state.
- No session, route protection, server validation, or database rules exist.

## Production Gate
Do not add authentication until roles, customer onboarding, password recovery, data isolation, and Firebase/environment ownership are approved.
