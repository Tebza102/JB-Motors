import type { ReactNode } from "react";

export function StatusPill({ children, tone = "grey" }: { children: ReactNode; tone?: string }) {
  return <span className={`status-pill tone-${tone}`}>{children}</span>;
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description?: string; actions?: ReactNode }) {
  return (
    <section className="page-header">
      <div><span className="section-kicker">{eyebrow}</span><h1>{title}</h1>{description && <p>{description}</p>}</div>
      {actions && <div className="page-actions">{actions}</div>}
    </section>
  );
}

export function MetricCard({ value, label, note, tone = "steel" }: { value: string; label: string; note: string; tone?: string }) {
  return <article className={`metric-card metric-${tone}`}><strong>{value}</strong><h3>{label}</h3><p>{note}</p></article>;
}

/** A visible control for work that is deliberately not built yet; it never pretends to act. */
export function PlannedButton({ label, reason, className = "secondary-button" }: { label: string; reason: string; className?: string }) {
  return <button type="button" className={className} disabled title={reason}>{label} · planned</button>;
}

export const padCount = (value: number) => String(value).padStart(2, "0");
