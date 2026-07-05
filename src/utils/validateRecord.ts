import type { DenialReason, Records } from "../types/records";

export type ValidationResult = {
  valid: boolean;
  errors: string[];
};

const DENIAL_REASONS: DenialReason[] = [
  "Medical Necessity",
  "Prior Authorization",
  "Coding Error",
  "Timely Filing",
  "Eligibility",
  "Missing Documentation",
  "Other",
];

const REQUIRED_STRING_FIELDS: (keyof Records)[] = [
  "patientName",
  "dateOfBirth",
  "medicalRecordNumber",
  "accountNumber",
  "memberId",
  "insuranceCompany",
  "claimNumber",
  "dateOfService",
  "procedure",
  "billedAmount",
  "deniedAmount",
  "icdCode",
  "cptCode",
  "revenueCode",
  "authorizationNumber",
  "doctorSummary",
  "progressNotes",
  "nurseNotes",
  "consultNotes",
  "historyAndPhysical",
  "labs",
  "requestedOutcome",
];

export function validateRecord(record: Records): ValidationResult {
  const errors: string[] = [];

  for (const field of REQUIRED_STRING_FIELDS) {
    if (!record[field] || record[field].trim() === "") {
      errors.push(`${field} is required`);
    }
  }

  if (!DENIAL_REASONS.includes(record.denialReason)) {
    errors.push("denialReason must be a valid DenialReason");
  }

  return { valid: errors.length === 0, errors };
}
