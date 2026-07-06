import { afterEach, describe, expect, it, vi } from "vitest";

const startStandaloneLaunchMock = vi.fn();
const completeStandaloneLaunchMock = vi.fn();
const fetchFhirPatientDataMock = vi.fn();
const mapFhirDataToRecordMock = vi.fn();

vi.mock("./smartAuth", () => ({
  startStandaloneLaunch: (...args: unknown[]) => startStandaloneLaunchMock(...args),
  completeStandaloneLaunch: (...args: unknown[]) => completeStandaloneLaunchMock(...args),
}));

vi.mock("./fhirClient", () => ({
  fetchFhirPatientData: (...args: unknown[]) => fetchFhirPatientDataMock(...args),
}));

vi.mock("../utils/mapFhirDataToRecord", () => ({
  mapFhirDataToRecord: (...args: unknown[]) => mapFhirDataToRecordMock(...args),
}));

import {
  completeFhirImport,
  getFhirImportConfig,
  importPatientData,
  isFhirCallback,
  startFhirImport,
} from "./fhirImport";

afterEach(() => {
  vi.clearAllMocks();
});

describe("getFhirImportConfig", () => {
  it("reads the OAuth tenant config out of an env-like object", () => {
    const config = getFhirImportConfig({
      VITE_FHIR_TENANT_BASE_URL: "https://fhir-myrecord.cerner.com/r4/some-tenant-id",
      VITE_FHIR_CLIENT_ID: "client-123",
      VITE_FHIR_REDIRECT_URI: "https://app.example.com/callback",
      VITE_FHIR_SCOPES: "launch/patient openid fhirUser patient/*.read",
    });

    expect(config).toEqual({
      fhirBaseUrl: "https://fhir-myrecord.cerner.com/r4/some-tenant-id",
      clientId: "client-123",
      redirectUri: "https://app.example.com/callback",
      scope: "launch/patient openid fhirUser patient/*.read",
    });
  });

  it("defaults missing values to empty strings", () => {
    expect(getFhirImportConfig({})).toEqual({
      fhirBaseUrl: "",
      clientId: "",
      redirectUri: "",
      scope: "",
    });
  });
});

describe("isFhirCallback", () => {
  it("is true when both code and state are present", () => {
    expect(isFhirCallback("?code=abc&state=xyz")).toBe(true);
  });

  it("is false when code or state is missing", () => {
    expect(isFhirCallback("?code=abc")).toBe(false);
    expect(isFhirCallback("?state=xyz")).toBe(false);
    expect(isFhirCallback("")).toBe(false);
  });
});

describe("startFhirImport", () => {
  it("delegates to startStandaloneLaunch with the given config", async () => {
    const config = {
      fhirBaseUrl: "https://fhir-open.cerner.com/r4/ec2458f2-1e24-41c8-b71b-0e701af7583d",
      clientId: "client-123",
      redirectUri: "https://app.example.com/callback",
      scope: "launch/patient openid fhirUser patient/*.read",
    };
    startStandaloneLaunchMock.mockResolvedValue(undefined);

    await startFhirImport(config);

    expect(startStandaloneLaunchMock).toHaveBeenCalledWith(config);
  });
});

describe("completeFhirImport", () => {
  it("completes the launch, fetches patient data, and maps it to a partial record with any failures", async () => {
    completeStandaloneLaunchMock.mockResolvedValue({
      accessToken: "token-abc",
      patientId: "pt-1",
      fhirBaseUrl: "https://fhir-open.cerner.com/r4/ec2458f2-1e24-41c8-b71b-0e701af7583d",
    });
    const patientData = { patient: { resourceType: "Patient", id: "pt-1" }, conditions: [], documents: [], labs: [] };
    fetchFhirPatientDataMock.mockResolvedValue({ data: patientData, failures: ["Condition"] });
    mapFhirDataToRecordMock.mockReturnValue({ patientName: "Jane Doe" });

    const result = await completeFhirImport("?code=auth-code&state=state-abc", {
      clientId: "client-123",
      redirectUri: "https://app.example.com/callback",
    });

    expect(completeStandaloneLaunchMock).toHaveBeenCalledWith("?code=auth-code&state=state-abc", {
      clientId: "client-123",
      redirectUri: "https://app.example.com/callback",
    });
    expect(fetchFhirPatientDataMock).toHaveBeenCalledWith(
      "https://fhir-open.cerner.com/r4/ec2458f2-1e24-41c8-b71b-0e701af7583d",
      "token-abc",
      "pt-1",
    );
    expect(mapFhirDataToRecordMock).toHaveBeenCalledWith(patientData);
    expect(result).toEqual({ record: { patientName: "Jane Doe" }, failures: ["Condition"] });
  });

  it("throws when the launch does not return a patient context", async () => {
    completeStandaloneLaunchMock.mockResolvedValue({
      accessToken: "token-abc",
      fhirBaseUrl: "https://fhir-open.cerner.com/r4/ec2458f2-1e24-41c8-b71b-0e701af7583d",
    });

    await expect(
      completeFhirImport("?code=auth-code&state=state-abc", {
        clientId: "client-123",
        redirectUri: "https://app.example.com/callback",
      }),
    ).rejects.toThrow("The launch did not return a patient context");

    expect(fetchFhirPatientDataMock).not.toHaveBeenCalled();
  });
});

describe("importPatientData", () => {
  it("fetches patient data with no access token and maps it to a partial record with any failures", async () => {
    const patientData = { patient: { resourceType: "Patient", id: "pt-1" }, conditions: [], documents: [], labs: [] };
    fetchFhirPatientDataMock.mockResolvedValue({ data: patientData, failures: [] });
    mapFhirDataToRecordMock.mockReturnValue({ patientName: "Tim Peters" });

    const result = await importPatientData(
      "https://fhir-open.cerner.com/r4/ec2458f2-1e24-41c8-b71b-0e701af7583d",
      "12742400",
    );

    expect(fetchFhirPatientDataMock).toHaveBeenCalledWith(
      "https://fhir-open.cerner.com/r4/ec2458f2-1e24-41c8-b71b-0e701af7583d",
      undefined,
      "12742400",
    );
    expect(mapFhirDataToRecordMock).toHaveBeenCalledWith(patientData);
    expect(result).toEqual({ record: { patientName: "Tim Peters" }, failures: [] });
  });

  it("passes an access token through when given one (authenticated FHIR servers)", async () => {
    fetchFhirPatientDataMock.mockResolvedValue({
      data: { patient: {}, conditions: [], documents: [], labs: [] },
      failures: [],
    });
    mapFhirDataToRecordMock.mockReturnValue({});

    await importPatientData("https://fhir.example.org", "pt-1", "token-abc");

    expect(fetchFhirPatientDataMock).toHaveBeenCalledWith("https://fhir.example.org", "token-abc", "pt-1");
  });

  it("surfaces which resources failed alongside whatever mapped successfully", async () => {
    fetchFhirPatientDataMock.mockResolvedValue({
      data: { patient: { resourceType: "Patient", id: "pt-1" }, conditions: [], documents: [], labs: [] },
      failures: ["Condition", "Observation"],
    });
    mapFhirDataToRecordMock.mockReturnValue({ patientName: "Nancy Smart" });

    const result = await importPatientData("https://fhir-open.cerner.com/r4/tenant", "12724066");

    expect(result).toEqual({ record: { patientName: "Nancy Smart" }, failures: ["Condition", "Observation"] });
  });
});
