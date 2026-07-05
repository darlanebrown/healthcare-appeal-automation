import type { Records } from "../types";

export function getMissingDocuments(record: Records): string[] {
  const missing: string[] = [];

  if (!record.doctorSummary.trim()) {
    missing.push("Doctor's summary");
  }

  if (!record.progressNotes.trim()) {
    missing.push("Progress notes");
  }

  if (!record.labs.trim()) {
    missing.push("Lab results or diagnostic evidence");
  }

  if (record.denialReason === "Medical Necessity") {
    missing.push("Medical necessity statement");
  }

  if (record.denialReason === "Prior Authorization") {
    missing.push("Prior authorization documentation");
  }

  return missing;
}
