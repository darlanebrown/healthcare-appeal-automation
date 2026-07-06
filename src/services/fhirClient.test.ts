import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchDocumentReferences,
  fetchFhirPatientData,
  fetchLabObservations,
  fetchPatient,
  fetchPatientConditions,
} from "./fhirClient";

const FHIR_BASE = "https://fhir-open.cerner.com/r4/ec2458f2-1e24-41c8-b71b-0e701af7583d";
const TOKEN = "token-abc";

function mockFetchOnce(body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(body) });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchPatient", () => {
  it("GETs Patient/{id} with a bearer token and returns the resource", async () => {
    const patient = { resourceType: "Patient", id: "pt-1" };
    const fetchMock = mockFetchOnce(patient);

    const result = await fetchPatient(FHIR_BASE, TOKEN, "pt-1");

    expect(fetchMock).toHaveBeenCalledWith(
      `${FHIR_BASE}/Patient/pt-1`,
      { headers: { Authorization: `Bearer ${TOKEN}`, Accept: "application/fhir+json" } },
    );
    expect(result).toEqual(patient);
  });

  it("throws when the response is not ok", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 404, statusText: "Not Found" });
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchPatient(FHIR_BASE, TOKEN, "missing")).rejects.toThrow(
      "Failed to fetch Patient/missing: 404 Not Found",
    );
  });

  it("omits the Authorization header when no access token is given (open sandbox)", async () => {
    const patient = { resourceType: "Patient", id: "pt-1" };
    const fetchMock = mockFetchOnce(patient);

    await fetchPatient(FHIR_BASE, undefined, "pt-1");

    expect(fetchMock).toHaveBeenCalledWith(
      `${FHIR_BASE}/Patient/pt-1`,
      { headers: { Accept: "application/fhir+json" } },
    );
  });
});

describe("fetchPatientConditions", () => {
  it("searches Condition?patient={id} and extracts resources from the bundle", async () => {
    const bundle = {
      resourceType: "Bundle",
      entry: [{ resource: { resourceType: "Condition", id: "c1" } }],
    };
    const fetchMock = mockFetchOnce(bundle);

    const result = await fetchPatientConditions(FHIR_BASE, TOKEN, "pt-1");

    expect(fetchMock).toHaveBeenCalledWith(
      `${FHIR_BASE}/Condition?patient=pt-1`,
      { headers: { Authorization: `Bearer ${TOKEN}`, Accept: "application/fhir+json" } },
    );
    expect(result).toEqual([{ resourceType: "Condition", id: "c1" }]);
  });

  it("returns an empty array when the bundle has no entries", async () => {
    mockFetchOnce({ resourceType: "Bundle" });
    const result = await fetchPatientConditions(FHIR_BASE, TOKEN, "pt-1");
    expect(result).toEqual([]);
  });
});

describe("fetchDocumentReferences", () => {
  it("searches DocumentReference?patient={id} and extracts resources", async () => {
    const bundle = {
      resourceType: "Bundle",
      entry: [{ resource: { resourceType: "DocumentReference", id: "d1" } }],
    };
    const fetchMock = mockFetchOnce(bundle);

    const result = await fetchDocumentReferences(FHIR_BASE, TOKEN, "pt-1");

    expect(fetchMock).toHaveBeenCalledWith(
      `${FHIR_BASE}/DocumentReference?patient=pt-1`,
      { headers: { Authorization: `Bearer ${TOKEN}`, Accept: "application/fhir+json" } },
    );
    expect(result).toEqual([{ resourceType: "DocumentReference", id: "d1" }]);
  });
});

describe("fetchLabObservations", () => {
  it("searches Observation?patient={id}&category=laboratory and extracts resources", async () => {
    const bundle = {
      resourceType: "Bundle",
      entry: [{ resource: { resourceType: "Observation", id: "o1" } }],
    };
    const fetchMock = mockFetchOnce(bundle);

    const result = await fetchLabObservations(FHIR_BASE, TOKEN, "pt-1");

    expect(fetchMock).toHaveBeenCalledWith(
      `${FHIR_BASE}/Observation?patient=pt-1&category=laboratory`,
      { headers: { Authorization: `Bearer ${TOKEN}`, Accept: "application/fhir+json" } },
    );
    expect(result).toEqual([{ resourceType: "Observation", id: "o1" }]);
  });
});

describe("fetchFhirPatientData", () => {
  it("fetches the patient, conditions, documents, and labs together", async () => {
    const patient = { resourceType: "Patient", id: "pt-1" };
    const responsesByUrl: Record<string, unknown> = {
      [`${FHIR_BASE}/Patient/pt-1`]: patient,
      [`${FHIR_BASE}/Condition?patient=pt-1`]: {
        resourceType: "Bundle",
        entry: [{ resource: { resourceType: "Condition", id: "c1" } }],
      },
      [`${FHIR_BASE}/DocumentReference?patient=pt-1`]: {
        resourceType: "Bundle",
        entry: [{ resource: { resourceType: "DocumentReference", id: "d1" } }],
      },
      [`${FHIR_BASE}/Observation?patient=pt-1&category=laboratory`]: {
        resourceType: "Bundle",
        entry: [{ resource: { resourceType: "Observation", id: "o1" } }],
      },
    };
    const fetchMock = vi.fn((url: string) =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(responsesByUrl[url]) }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchFhirPatientData(FHIR_BASE, TOKEN, "pt-1");

    expect(result).toEqual({
      data: {
        patient,
        conditions: [{ resourceType: "Condition", id: "c1" }],
        documents: [{ resourceType: "DocumentReference", id: "d1" }],
        labs: [{ resourceType: "Observation", id: "o1" }],
      },
      failures: [],
    });
  });

  it("keeps the patient and succeeding resources when one resource fetch fails", async () => {
    const patient = { resourceType: "Patient", id: "pt-1" };
    const fetchMock = vi.fn((url: string) => {
      if (url.startsWith(`${FHIR_BASE}/Condition`)) {
        return Promise.resolve({ ok: false, status: 504, statusText: "Gateway Time-out" });
      }
      if (url === `${FHIR_BASE}/Patient/pt-1`) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(patient) });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ resourceType: "Bundle", entry: [] }),
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchFhirPatientData(FHIR_BASE, TOKEN, "pt-1");

    expect(result).toEqual({
      data: { patient, conditions: [], documents: [], labs: [] },
      failures: ["Condition"],
    });
  });

  it("throws when the patient fetch itself fails, since there's nothing useful without it", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 404, statusText: "Not Found" });
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchFhirPatientData(FHIR_BASE, TOKEN, "missing")).rejects.toThrow(
      "Failed to fetch Patient/missing: 404 Not Found",
    );
  });
});
