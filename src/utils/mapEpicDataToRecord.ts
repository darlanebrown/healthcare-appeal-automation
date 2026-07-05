import type { Records } from "../types";
import type { EpicPatientData, FhirDocumentReference } from "../types/epic";

const NOTE_TYPE_FIELDS: { match: RegExp; field: "progressNotes" | "historyAndPhysical" | "consultNotes" | "doctorSummary" | "nurseNotes" }[] = [
  { match: /history and physical/i, field: "historyAndPhysical" },
  { match: /consult/i, field: "consultNotes" },
  { match: /progress/i, field: "progressNotes" },
  { match: /nurs/i, field: "nurseNotes" },
  { match: /summary|attending|physician/i, field: "doctorSummary" },
];

function decodeAttachment(document: FhirDocumentReference): string | null {
  const data = document.content?.[0]?.attachment?.data;
  return data ? atob(data) : null;
}

function matchNoteField(document: FhirDocumentReference) {
  const label = document.type?.text ?? document.type?.coding?.[0]?.display ?? "";
  return NOTE_TYPE_FIELDS.find(({ match }) => match.test(label))?.field ?? null;
}

function formatPatientName(patient: EpicPatientData["patient"]): string | undefined {
  const name = patient.name?.[0];
  if (!name) return undefined;
  if (name.text) return name.text;
  return [...(name.given ?? []), name.family].filter(Boolean).join(" ") || undefined;
}

function formatObservation(observation: EpicPatientData["labs"][number]): string {
  const label = observation.code?.text ?? observation.code?.coding?.[0]?.display ?? "Lab result";
  const value = observation.valueString
    ?? (observation.valueQuantity ? `${observation.valueQuantity.value} ${observation.valueQuantity.unit ?? ""}`.trim() : "");
  return `${label}: ${value}`;
}

export function mapEpicDataToRecord(data: EpicPatientData): Partial<Records> {
  const result: Partial<Records> = {};

  const patientName = formatPatientName(data.patient);
  if (patientName) result.patientName = patientName;
  if (data.patient.birthDate) result.dateOfBirth = data.patient.birthDate;

  const icdCode = data.conditions[0]?.code?.coding?.[0]?.code;
  if (icdCode) result.icdCode = icdCode;

  const notesByField = new Map<string, string[]>();
  for (const document of data.documents) {
    const field = matchNoteField(document);
    const text = field ? decodeAttachment(document) : null;
    if (!field || !text) continue;
    notesByField.set(field, [...(notesByField.get(field) ?? []), text]);
  }
  for (const [field, texts] of notesByField) {
    (result as Record<string, string>)[field] = texts.join("\n\n");
  }

  if (data.labs.length > 0) {
    result.labs = data.labs.map(formatObservation).join("\n");
  }

  return result;
}
