"use client";

import { FormEvent, useRef, useState } from "react";
import {
  createFeatureId,
  ISSUE_CATEGORIES,
  ISSUE_OCCURRENCES,
  ISSUE_SEVERITIES,
} from "./types.ts";
import type { IssueCategory, IssueOccurrence, IssueSeverity, ProblemIssue, ProblemReport, ReportMutationResult } from "./types.ts";

type IssueDraft = ProblemIssue;
type IssueErrors = Partial<Record<"categories" | "description" | "occurrence" | "severity", string>>;

const CUSTOMER = { id: "customer-thabo-mokoena", name: "Thabo Mokoena", mobile: "082 555 0148" };
const VEHICLE = { id: "vehicle-toyota-corolla", label: "2020 Toyota Corolla 1.8 Prestige", registration: "GP 123-456" };

function newIssue(): IssueDraft {
  return {
    id: createFeatureId("issue"),
    categories: [],
    description: "",
    occurrence: "While driving",
    severity: "Medium",
  };
}

function validateIssue(issue: IssueDraft): IssueErrors {
  const errors: IssueErrors = {};
  if (issue.categories.length === 0) errors.categories = "Select at least one area this issue relates to.";
  if (issue.description.trim().length < 12) errors.description = "Describe this issue in at least 12 characters.";
  if (!ISSUE_OCCURRENCES.includes(issue.occurrence)) errors.occurrence = "Select when this issue occurs.";
  if (!ISSUE_SEVERITIES.includes(issue.severity)) errors.severity = "Select how serious this issue feels.";
  return errors;
}

export function ProblemReportForm({
  onDone,
  onSubmit,
}: {
  onDone: () => void;
  onSubmit: (report: ProblemReport) => ReportMutationResult;
}) {
  const [issues, setIssues] = useState<IssueDraft[]>([newIssue()]);
  const [errors, setErrors] = useState<Record<string, IssueErrors>>({});
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState<ProblemReport | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const updateIssue = (id: string, update: Partial<IssueDraft>) => {
    setIssues((current) => current.map((issue) => issue.id === id ? { ...issue, ...update } : issue));
    setErrors((current) => ({ ...current, [id]: {} }));
    setSubmitError("");
  };

  const toggleCategory = (id: string, category: IssueCategory) => {
    const issue = issues.find((item) => item.id === id);
    if (!issue) return;
    updateIssue(id, {
      categories: issue.categories.includes(category)
        ? issue.categories.filter((item) => item !== category)
        : [...issue.categories, category],
    });
  };

  const removeIssue = (id: string) => {
    if (issues.length === 1) return;
    setIssues((current) => current.filter((issue) => issue.id !== id));
    setErrors((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submittingRef.current) return;
    const nextErrors = Object.fromEntries(issues.map((issue) => [issue.id, validateIssue(issue)]));
    setErrors(nextErrors);
    if (Object.values(nextErrors).some((entry) => Object.keys(entry).length > 0)) {
      setSubmitError("Complete the highlighted fields before submitting the report.");
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setSubmitError("");
    const timestamp = new Date().toISOString();
    const report: ProblemReport = {
      id: createFeatureId("report"),
      reference: `JB-PR-${Date.now().toString().slice(-6)}`,
      customer: CUSTOMER,
      vehicle: VEHICLE,
      submittedAt: timestamp,
      updatedAt: timestamp,
      status: "Submitted",
      issues: issues.map((issue) => ({ ...issue, description: issue.description.trim() })),
    };
    const result = onSubmit(report);
    if (result.ok) {
      setSubmitted(report);
      return;
    }
    submittingRef.current = false;
    setSubmitting(false);
    setSubmitError(result.message);
  };

  if (submitted) {
    return <section className="mobile-success problem-success">
      <span className="success-check">✓</span>
      <span className="status-pill tone-green">PROBLEM SUBMITTED</span>
      <h1>JB Motors has received your report.</h1>
      <p>A workshop staff member will review each issue and contact you about the next step.</p>
      <div className="success-summary column">
        <span><small>Reference</small><strong>{submitted.reference}</strong></span>
        <span><small>Issues reported</small><strong>{submitted.issues.length}</strong></span>
        {submitted.issues.map((issue, index) => <span key={issue.id}>
          <small>Issue {index + 1}</small>
          <strong>{issue.categories.join(" / ")} · {issue.severity}</strong>
          <em>{issue.description}</em>
        </span>)}
        <span><small>Status</small><strong>{submitted.status}</strong></span>
      </div>
      <button className="primary-button wide-primary" onClick={onDone}>Back to home</button>
    </section>;
  }

  return <>
    <section className="mobile-page-heading">
      <button type="button" onClick={onDone}>←</button>
      <div><span className="section-kicker">REPORT A VEHICLE PROBLEM</span><h1>What is your vehicle doing?</h1><p>Add each issue separately. One issue can relate to several vehicle areas.</p></div>
    </section>
    <form className="mobile-form problem-form" onSubmit={handleSubmit} noValidate>
      <label><span>Vehicle</span><select value="corolla" disabled><option value="corolla">{VEHICLE.label} · {VEHICLE.registration}</option></select></label>
      <div className="issue-card-list">
        {issues.map((issue, index) => {
          const issueErrors = errors[issue.id] ?? {};
          return <fieldset className="problem-issue-card" key={issue.id}>
            <div className="issue-card-heading"><div><span>ISSUE {String(index + 1).padStart(2, "0")}</span><h2>{issue.categories.length ? issue.categories.join(" / ") : "Describe another vehicle issue"}</h2></div>{issues.length > 1 && <button type="button" className="text-button danger-text" onClick={() => removeIssue(issue.id)}>Remove</button>}</div>
            <legend>What does this issue relate to?</legend>
            <div className="category-grid" aria-describedby={issueErrors.categories ? `${issue.id}-categories-error` : undefined}>{ISSUE_CATEGORIES.map((item) => <button type="button" aria-pressed={issue.categories.includes(item)} className={issue.categories.includes(item) ? "selected" : ""} key={item} onClick={() => toggleCategory(issue.id, item)}>{item}</button>)}</div>
            {issueErrors.categories && <p className="field-error" id={`${issue.id}-categories-error`}>{issueErrors.categories}</p>}
            <label><span>What is your vehicle doing?</span><textarea value={issue.description} aria-invalid={Boolean(issueErrors.description)} onChange={(event) => updateIssue(issue.id, { description: event.target.value })} placeholder="For example: The battery light appears when I start the car and the headlights become dim…" /></label>
            {issueErrors.description && <p className="field-error">{issueErrors.description}</p>}
            <label><span>When does it happen?</span><select value={issue.occurrence} onChange={(event) => updateIssue(issue.id, { occurrence: event.target.value as IssueOccurrence })}>{ISSUE_OCCURRENCES.map((item) => <option key={item}>{item}</option>)}</select></label>
            <fieldset className="severity-field"><legend>How serious does it feel?</legend><div className="severity-options">{ISSUE_SEVERITIES.map((item) => <button type="button" aria-pressed={issue.severity === item} className={`${issue.severity === item ? "selected" : ""} severity-${item.toLowerCase().replaceAll(" ", "-")}`} key={item} onClick={() => updateIssue(issue.id, { severity: item as IssueSeverity })}>{item}</button>)}</div></fieldset>
          </fieldset>;
        })}
      </div>
      <button type="button" className="secondary-button add-issue-button" onClick={() => setIssues((current) => [...current, newIssue()])}>+ Add another issue</button>
      <div className="media-disabled" aria-disabled="true"><strong>Photos and video</strong><p>Media upload is not available in this local prototype. Add all important details in the issue descriptions.</p></div>
      {submitError && <p className="submit-error" role="alert">{submitError}</p>}
      <button className="primary-button wide-primary" type="submit" disabled={submitting}>{submitting ? "Saving report…" : `Submit ${issues.length > 1 ? `${issues.length} issues` : "problem report"}`}</button>
      <p className="form-reassurance">If the vehicle is unsafe to drive, stop in a safe place and contact emergency assistance. JB Motors contact details still require owner confirmation.</p>
    </form>
  </>;
}
