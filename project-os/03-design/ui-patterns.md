# UI Patterns

## Layout Principles
- Put the day’s required actions before analytics.
- Use a persistent compact desktop sidebar and contextual top header.
- Keep vehicle, customer, status, and money information visible near primary actions.
- Use split operational layouts for rich records and focused mobile flows for technicians and customers.
- Use cards only for meaningful grouping; rely on typography, separators, rails, tables, and timelines for hierarchy.

## Common Components
- Exact-logo brand rail
- Page header and action group
- Metric blocks with restrained status rails
- Status pills and priority rails
- Search/filter bars and high-density data tables
- Mobile record cards
- Vehicle identity header and service gauge
- Job workflow board and sticky status control
- Document layouts for estimates, invoices, and receipts
- Timelines, activity feeds, alerts, QC checklists, and follow-up actions
- Loading, empty, error, confirmation, and success states
- Customer bottom navigation and staff-mobile action bar

## Interaction Rules
- Primary actions must state the outcome.
- Prototype actions must confirm locally and must not imply data was sent to a live service.
- Service requests say that JB Motors will contact the customer to confirm availability.
- Media inputs remain local demo controls.
- Dangerous or destructive actions are not part of this prototype.

## Accessibility Rules
- Use labelled inputs and semantic headings.
- Preserve keyboard focus visibility.
- Maintain readable contrast and minimum practical touch targets.
- Never communicate status through colour alone.
- Use table-to-card transformations on narrow screens.

## Responsive Rules
- Desktop: persistent sidebar, dense tables, split detail panels, contextual actions.
- Tablet: collapsed navigation, single-column rich details, workshop-floor touch targets.
- Staff mobile: assigned jobs, inspections, notes, photos, parts, status, and QC first.
- Customer mobile: vehicle-first summary, three primary actions, minimal typing, six-item bottom navigation.
