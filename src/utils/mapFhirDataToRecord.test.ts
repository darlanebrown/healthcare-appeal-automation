import { describe, expect, it } from "vitest";
import { mapFhirDataToRecord } from "./mapFhirDataToRecord";
import type { FhirPatientData } from "../types/fhir";

function encode(text: string): string {
  return btoa(text);
}

function makeData(overrides: Partial<FhirPatientData> = {}): FhirPatientData {
  return {
    patient: {
      resourceType: "Patient",
      id: "pt-1",
      name: [{ family: "Gonzalez", given: ["Maria"] }],
      birthDate: "1975-03-22",
    },
    conditions: [],
    documents: [],
    labs: [],
    ...overrides,
  };
}

describe("mapFhirDataToRecord", () => {
  it("maps patient name and date of birth", () => {
    const result = mapFhirDataToRecord(makeData());

    expect(result.patientName).toBe("Maria Gonzalez");
    expect(result.dateOfBirth).toBe("1975-03-22");
  });

  it("maps the first ICD-coded condition to icdCode", () => {
    const result = mapFhirDataToRecord(
      makeData({
        conditions: [
          {
            resourceType: "Condition",
            id: "c1",
            code: {
              coding: [{ system: "http://hl7.org/fhir/sid/icd-10-cm", code: "M75.100", display: "Rotator cuff tear" }],
            },
          },
        ],
      }),
    );

    expect(result.icdCode).toBe("M75.100");
  });

  it("routes document references to the matching note field by type", () => {
    const result = mapFhirDataToRecord(
      makeData({
        documents: [
          {
            resourceType: "DocumentReference",
            id: "d1",
            type: { text: "Progress Note" },
            content: [{ attachment: { data: encode("Patient improving.") } }],
          },
          {
            resourceType: "DocumentReference",
            id: "d2",
            type: { text: "History and Physical Note" },
            content: [{ attachment: { data: encode("No prior surgeries.") } }],
          },
          {
            resourceType: "DocumentReference",
            id: "d3",
            type: { text: "Consultation Note" },
            content: [{ attachment: { data: encode("Ortho consult confirms tear.") } }],
          },
        ],
      }),
    );

    expect(result.progressNotes).toBe("Patient improving.");
    expect(result.historyAndPhysical).toBe("No prior surgeries.");
    expect(result.consultNotes).toBe("Ortho consult confirms tear.");
  });

  it("joins multiple documents of the same type with a blank line", () => {
    const result = mapFhirDataToRecord(
      makeData({
        documents: [
          {
            resourceType: "DocumentReference",
            id: "d1",
            type: { text: "Progress Note" },
            content: [{ attachment: { data: encode("Note one.") } }],
          },
          {
            resourceType: "DocumentReference",
            id: "d2",
            type: { text: "Progress Note" },
            content: [{ attachment: { data: encode("Note two.") } }],
          },
        ],
      }),
    );

    expect(result.progressNotes).toBe("Note one.\n\nNote two.");
  });

  it("maps lab observations into a single labs string", () => {
    const result = mapFhirDataToRecord(
      makeData({
        labs: [
          {
            resourceType: "Observation",
            id: "o1",
            code: { text: "MRI Shoulder" },
            valueString: "Full-thickness rotator cuff tear.",
          },
          {
            resourceType: "Observation",
            id: "o2",
            code: { text: "Hemoglobin A1c" },
            valueQuantity: { value: 6.1, unit: "%" },
          },
        ],
      }),
    );

    expect(result.labs).toBe("MRI Shoulder: Full-thickness rotator cuff tear.\nHemoglobin A1c: 6.1 %");
  });

  it("omits fields with no matching FHIR data", () => {
    const result = mapFhirDataToRecord(makeData());

    expect(result.icdCode).toBeUndefined();
    expect(result.progressNotes).toBeUndefined();
    expect(result.labs).toBeUndefined();
  });
});
