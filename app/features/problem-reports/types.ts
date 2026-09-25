export const ISSUE_CATEGORIES = [
  "Engine",
  "Electrical",
  "Brakes",
  "Suspension",
  "Steering",
  "Transmission",
  "Cooling",
  "Starting / Battery",
  "Noise / Vibration",
  "Warning Light",
  "Other",
] as const;

export const ISSUE_OCCURRENCES = [
  "While driving",
  "When starting",
  "When braking",
  "When turning",
  "At idle",
  "Intermittently / unsure",
] as const;

export const ISSUE_SEVERITIES = ["Low", "Medium", "High", "Vehicle cannot drive"] as const;
export const REPORT_STATUSES = ["Submitted", "Under review", "Resolved"] as const;

export type IssueCategory = (typeof ISSUE_CATEGORIES)[number];
export type IssueOccurrence = (typeof ISSUE_OCCURRENCES)[number];
export type IssueSeverity = (typeof ISSUE_SEVERITIES)[number];
export type ProblemReportStatus = (typeof REPORT_STATUSES)[number];

export type ProblemIssue = {
  id: string;
  categories: IssueCategory[];
  description: string;
  occurrence: IssueOccurrence;
  severity: IssueSeverity;
};

export type ProblemReport = {
  id: string;
  reference: string;
  customer: {
    id: string;
    name: string;
    mobile: string;
  };
  vehicle: {
    id: string;
    label: string;
    registration: string;
  };
  submittedAt: string;
  updatedAt: string;
  status: ProblemReportStatus;
  issues: ProblemIssue[];
};

export type ReportMutationResult = { ok: true } | { ok: false; message: string };

export function createFeatureId(prefix: string): string {
  const randomId = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${randomId}`;
}

export function getReportUrgency(report: ProblemReport): IssueSeverity {
  const rank: Record<IssueSeverity, number> = {
    Low: 0,
    Medium: 1,
    High: 2,
    "Vehicle cannot drive": 3,
  };
  return report.issues.reduce<IssueSeverity>(
    (highest, issue) => rank[issue.severity] > rank[highest] ? issue.severity : highest,
    "Low",
  );
}

