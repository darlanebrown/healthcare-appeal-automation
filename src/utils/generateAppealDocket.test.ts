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
    ...overrides,
  };
}

describe("generateAppealDocket", () => {
  it("includes all patient and claim fields", () => {
    const docket = generateAppealDocket(makeRecord());

    expect(docket).toContain("Jane Doe");
    expect(docket).toContain("MRN123");
    expect(docket).toContain("CLM001");
    expect(docket).toContain("Medical Necessity");
  });

  it("includes all clinical evidence sections", () => {
    const docket = generateAppealDocket(makeRecord());

    expect(docket).toContain("Doctor summary text");
    expect(docket).toContain("Progress notes text");
    expect(docket).toContain("Nurse notes text");
    expect(docket).toContain("Consult notes text");
    expect(docket).toContain("H&P text");
    expect(docket).toContain("Labs text");
  });

  it("formats billed and denied amounts with a dollar sign", () => {
    const docket = generateAppealDocket(
      makeRecord({ billedAmount: "500.00", deniedAmount: "500.00" }),
    );

    expect(docket).toContain("Billed Amount: $500.00");
    expect(docket).toContain("Denied Amount: $500.00");
  });
});
