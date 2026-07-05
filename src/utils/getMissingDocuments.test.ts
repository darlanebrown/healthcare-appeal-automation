import { describe, expect, it } from "vitest";
import { getMissingDocuments } from "./getMissingDocuments";
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
    doctorSummary: "Summary",
    progressNotes: "Notes",
    nurseNotes: "Notes",
    consultNotes: "Notes",
    historyAndPhysical: "H&P",
    labs: "Labs",
    ...overrides,
  };
}

describe("getMissingDocuments", () => {
  it("returns an empty list when all evidence is present", () => {
    expect(getMissingDocuments(makeRecord())).toEqual([]);
  });

  it("flags a missing doctor summary", () => {
    expect(getMissingDocuments(makeRecord({ doctorSummary: "  " }))).toContain(
      "Doctor Summary",
    );
  });

  it("flags missing ICD and CPT codes", () => {
    const missing = getMissingDocuments(makeRecord({ icdCode: "", cptCode: "" }));
    expect(missing).toEqual(
      expect.arrayContaining(["ICD-9 / ICD-10 Code", "CPT / HCPCS Code"]),
    );
  });

  it("requires an authorization number only when denial reason is Prior Authorization", () => {
    const withoutAuth = makeRecord({
      denialReason: "Prior Authorization",
      authorizationNumber: "",
    });
    expect(getMissingDocuments(withoutAuth)).toContain("Authorization Number");

    const otherReason = makeRecord({
      denialReason: "Medical Necessity",
      authorizationNumber: "",
    });
    expect(getMissingDocuments(otherReason)).not.toContain("Authorization Number");
  });
});
