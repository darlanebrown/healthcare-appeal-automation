import { describe, expect, it } from "vitest";
import { validateRecord } from "./validateRecord";
import type { Records } from "../types/records";

function makeValidRecord(overrides: Partial<Records> = {}): Records {
  return {
    patientName: "Jane Doe",
    dateOfBirth: "1980-01-01",
    medicalRecordNumber: "MRN123",
    accountNumber: "ACC456",
    memberId: "MEM789",
    insuranceCompany: "Acme Health",
    supplies: [],
    claimNumber: "CLM001",
    dateOfService: "2026-01-15",
    procedure: "Outpatient MRI",
    billedAmount: "1000.00",
    deniedAmount: "1000.00",
    icdCode: "E11.9",
    cptCode: "99213",
    revenueCode: "0450",
    authorizationNumber: "AUTH001",
    denialReason: "Medical Necessity",
    doctorSummary: "Summary",
    progressNotes: "Notes",
    nurseNotes: "Notes",
    consultNotes: "Notes",
    historyAndPhysical: "H&P",
    labs: "Labs",
    requestedOutcome: "Reprocess and pay the claim in full",
    ...overrides,
  };
}

describe("validateRecord", () => {
  it("returns valid: true for a fully populated record", () => {
    const result = validateRecord(makeValidRecord());
    expect(result).toEqual({ valid: true, errors: [] });
  });

  it("flags missing required string fields", () => {
    const result = validateRecord(makeValidRecord({ patientName: "" }));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("patientName is required");
  });

  it("flags an invalid denialReason", () => {
    const record = makeValidRecord();
    const result = validateRecord({
      ...record,
      denialReason: "Not A Reason" as Records["denialReason"],
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("denialReason must be a valid DenialReason");
  });

  it("collects multiple errors at once", () => {
    const result = validateRecord(
      makeValidRecord({ patientName: "", claimNumber: "" }),
    );
    expect(result.errors).toEqual(
      expect.arrayContaining([
        "patientName is required",
        "claimNumber is required",
      ]),
    );
  });

  it("flags missing procedure and requestedOutcome", () => {
    const result = validateRecord(
      makeValidRecord({ procedure: "", requestedOutcome: "" }),
    );
    expect(result.errors).toEqual(
      expect.arrayContaining([
        "procedure is required",
        "requestedOutcome is required",
      ]),
    );
  });
});
