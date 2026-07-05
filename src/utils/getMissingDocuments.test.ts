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
    supplies: [{ id: "1", name: "Splint", quantity: "1", code: "A123" }],
    claimNumber: "CLM001",
    dateOfService: "2026-01-15",
    procedure: "Outpatient MRI",
    billedAmount: "1000.00",
    deniedAmount: "1000.00",
    icdCode: "E11.9",
    cptCode: "99213",
    revenueCode: "0450",
    authorizationNumber: "AUTH001",
    denialReason: "Coding Error",
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

describe("getMissingDocuments", () => {
  it("returns an empty list when all evidence is present and denial reason needs no extra documentation", () => {
    expect(getMissingDocuments(makeRecord())).toEqual([]);
  });

  it("flags a missing doctor's summary", () => {
    expect(getMissingDocuments(makeRecord({ doctorSummary: "  " }))).toContain(
      "Doctor's summary",
    );
  });

  it("flags missing progress notes", () => {
    expect(getMissingDocuments(makeRecord({ progressNotes: "" }))).toContain(
      "Progress notes",
    );
  });

  it("flags missing labs", () => {
    expect(getMissingDocuments(makeRecord({ labs: "" }))).toContain(
      "Lab results or diagnostic evidence",
    );
  });

  it("flags missing supplies when none have been recorded", () => {
    expect(getMissingDocuments(makeRecord({ supplies: [] }))).toContain(
      "Supplies Used",
    );
  });

  it("does not flag supplies when at least one has been recorded", () => {
    const missing = getMissingDocuments(
      makeRecord({ supplies: [{ id: "1", name: "Brace", quantity: "1", code: "B456" }] }),
    );
    expect(missing).not.toContain("Supplies Used");
  });

  it("requires a medical necessity statement when denial reason is Medical Necessity", () => {
    const missing = getMissingDocuments(makeRecord({ denialReason: "Medical Necessity" }));
    expect(missing).toContain("Medical necessity statement");
  });

  it("requires prior authorization documentation when denial reason is Prior Authorization", () => {
    const missing = getMissingDocuments(makeRecord({ denialReason: "Prior Authorization" }));
    expect(missing).toContain("Prior authorization documentation");
  });

  it("does not require denial-reason-specific documentation for other reasons", () => {
    const missing = getMissingDocuments(makeRecord({ denialReason: "Coding Error" }));
    expect(missing).not.toContain("Medical necessity statement");
    expect(missing).not.toContain("Prior authorization documentation");
  });
});
