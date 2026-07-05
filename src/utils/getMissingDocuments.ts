import type { Records } from "../types";

export function getMissingDocuments(record: Records): string[] {
  const missing: string[] = [];

  if (!record.doctorSummary.trim()) missing.push("Doctor Summary");
  if (!record.progressNotes.trim()) missing.push("Progress Notes");
  if (!record.nurseNotes.trim()) missing.push("Nurse Notes");
  if (!record.consultNotes.trim()) missing.push("Consult Notes");
  if (!record.historyAndPhysical.trim()) missing.push("History & Physical");
  if (!record.labs.trim()) missing.push("Labs / Diagnostic Evidence");
  if (!record.icdCode.trim()) missing.push("ICD-9 / ICD-10 Code");
  if (!record.cptCode.trim()) missing.push("CPT / HCPCS Code");

  if (record.denialReason === "Prior Authorization" && !record.authorizationNumber.trim()) {
    missing.push("Authorization Number");
  }

  return missing;
}
