import {
  ISSUE_CATEGORIES,
  ISSUE_OCCURRENCES,
  ISSUE_SEVERITIES,
  REPORT_STATUSES,
} from "./types.ts";
import type { ProblemReport, ReportMutationResult } from "./types.ts";

export const PROBLEM_REPORT_STORAGE_KEY = "jb-motors.problem-reports.v1";
const STORAGE_VERSION = 1;

type StoredReports = {
  version: typeof STORAGE_VERSION;
  reports: ProblemReport[];
};

function isString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isProblemReport(value: unknown): value is ProblemReport {
  if (!value || typeof value !== "object") return false;
  const report = value as Partial<ProblemReport>;
  if (
    !isString(report.id) || !isString(report.reference) || !isString(report.submittedAt) ||
    !isString(report.updatedAt) || !REPORT_STATUSES.includes(report.status as never) ||
    !report.customer || !isString(report.customer.id) || !isString(report.customer.name) ||
    !isString(report.customer.mobile) || !report.vehicle || !isString(report.vehicle.id) ||
    !isString(report.vehicle.label) || !isString(report.vehicle.registration) ||
    !Array.isArray(report.issues) || report.issues.length === 0
  ) return false;

  return report.issues.every((issue) =>
    Boolean(issue) &&
    isString(issue.id) &&
    Array.isArray(issue.categories) &&
    issue.categories.length > 0 &&
    issue.categories.every((category) => ISSUE_CATEGORIES.includes(category as never)) &&
    isString(issue.description) &&
    ISSUE_OCCURRENCES.includes(issue.occurrence as never) &&
    ISSUE_SEVERITIES.includes(issue.severity as never),
  );
}

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    const storage = window.localStorage;
    const probe = `${PROBLEM_REPORT_STORAGE_KEY}.probe`;
    storage.setItem(probe, "1");
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
}

export function loadProblemReports(): { reports: ProblemReport[]; warning: string | null } {
  const storage = getStorage();
  if (!storage) {
    return { reports: [], warning: "Browser storage is unavailable. Reports cannot be saved on this device." };
  }

  try {
    const raw = storage.getItem(PROBLEM_REPORT_STORAGE_KEY);
    if (!raw) return { reports: [], warning: null };
    const parsed = JSON.parse(raw) as Partial<StoredReports>;
    if (parsed.version !== STORAGE_VERSION || !Array.isArray(parsed.reports) || !parsed.reports.every(isProblemReport)) {
      return { reports: [], warning: "Saved report data is invalid or from an unsupported version. It was not loaded." };
    }
    return { reports: parsed.reports, warning: null };
  } catch {
    return { reports: [], warning: "Saved report data could not be read. It was not overwritten." };
  }
}

export function saveProblemReports(reports: ProblemReport[]): ReportMutationResult {
  const storage = getStorage();
  if (!storage) return { ok: false, message: "Browser storage is unavailable, so the report was not submitted." };
  try {
    const existing = loadProblemReports();
    if (existing.warning) return { ok: false, message: `${existing.warning} Reset demo reports before saving new reports.` };
    if (!reports.every(isProblemReport)) return { ok: false, message: "The report contains invalid details and was not saved." };
    const payload: StoredReports = { version: STORAGE_VERSION, reports };
    storage.setItem(PROBLEM_REPORT_STORAGE_KEY, JSON.stringify(payload));
    return { ok: true };
  } catch {
    return { ok: false, message: "The report could not be saved on this device. Free browser storage and try again." };
  }
}

export function clearProblemReports(): ReportMutationResult {
  const storage = getStorage();
  if (!storage) return { ok: false, message: "Browser storage is unavailable, so demo reports could not be reset." };
  try {
    storage.removeItem(PROBLEM_REPORT_STORAGE_KEY);
    return { ok: true };
  } catch {
    return { ok: false, message: "Demo reports could not be reset on this device." };
  }
}
