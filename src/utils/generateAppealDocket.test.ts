import { describe, expect, it } from "vitest";
import { generateAppealDocket } from "./generateAppealDocket";
import type { Records } from "../types";

function makeRecord(overrides: Partial<Records> = {}): Records {
  return {
    patientName: "Jane Doe",
    dateOfBirth: "1980-01-01",
    medicalRecordNumber: "MRN123",
    accountNumber: "ACC456",
    memberId: "MEM789",
    insuranceCompany: "Acme Health",
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
    doctorSummary: "Doctor summary text",
    progressNotes: "Progress notes text",
    nurseNotes: "Nurse notes text",
    consultNotes: "Consult notes text",
    historyAndPhysical: "H&P text",
    labs: "Labs text",
    requestedOutcome: "Reprocess and pay the claim in full",
    ...overrides,
  };
}

describe("generateAppealDocket", () => {
  it("addresses the letter to the appeals department and states the claim/patient details", () => {
    const docket = generateAppealDocket(makeRecord());

    expect(docket).toContain("RE: Appeal of Claim Denial");
    expect(docket).toContain("Dear Appeals Department,");
    expect(docket).toContain("Jane Doe");
    expect(docket).toContain("MEM789");
    expect(docket).toContain("Acme Health");
    expect(docket).toContain("CLM001");
    expect(docket).toContain("2026-01-15");
    expect(docket).toContain("Outpatient MRI");
    expect(docket).toContain("Medical Necessity");
  });

  it("includes the clinical evidence sections", () => {
    const docket = generateAppealDocket(makeRecord());

    expect(docket).toContain("Doctor summary text");
    expect(docket).toContain("Progress notes text");
    expect(docket).toContain("Labs text");
  });

  it("includes the requested outcome", () => {
    const docket = generateAppealDocket(
      makeRecord({ requestedOutcome: "Approve and process payment" }),
    );

    expect(docket).toContain("Requested Outcome:");
    expect(docket).toContain("Approve and process payment");
  });
});
