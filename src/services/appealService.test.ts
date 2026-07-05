import { afterEach, describe, expect, it, vi } from "vitest";
import { submitAppeal } from "./appealService";
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

describe("submitAppeal", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("POSTs the record and docket as JSON and returns the appeal id", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      json: () => Promise.resolve({ appealId: "APPEAL-1" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const record = makeRecord();
    const result = await submitAppeal(record, "docket text");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/appeals$/);
    expect(options.method).toBe("POST");
    expect(options.headers).toEqual({ "Content-Type": "application/json" });
    expect(JSON.parse(options.body)).toEqual({ record, docket: "docket text" });

    expect(result).toEqual({ submitted: true, appealId: "APPEAL-1" });
  });

  it("throws when the response is not ok", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: () => Promise.resolve({}),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(submitAppeal(makeRecord(), "docket text")).rejects.toThrow(
      "Failed to submit appeal: 500 Internal Server Error",
    );
  });
});
