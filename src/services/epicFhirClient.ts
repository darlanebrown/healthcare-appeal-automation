import type {
  EpicPatientData,
  FhirBundle,
  FhirCondition,
  FhirDocumentReference,
  FhirObservation,
  FhirPatient,
} from "../types/epic";

function authHeaders(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}`, Accept: "application/fhir+json" };
}

function extractResources<T>(bundle: FhirBundle<T>): T[] {
  return (bundle.entry ?? []).map((entry) => entry.resource);
}

export async function fetchPatient(
  fhirBaseUrl: string,
  accessToken: string,
  patientId: string,
): Promise<FhirPatient> {
  const response = await fetch(`${fhirBaseUrl}/Patient/${patientId}`, {
    headers: authHeaders(accessToken),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Patient/${patientId}: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function fetchPatientConditions(
  fhirBaseUrl: string,
  accessToken: string,
  patientId: string,
): Promise<FhirCondition[]> {
  const response = await fetch(`${fhirBaseUrl}/Condition?patient=${patientId}`, {
    headers: authHeaders(accessToken),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Condition for patient ${patientId}: ${response.status} ${response.statusText}`);
  }

  return extractResources(await response.json());
}

export async function fetchDocumentReferences(
  fhirBaseUrl: string,
  accessToken: string,
  patientId: string,
): Promise<FhirDocumentReference[]> {
  const response = await fetch(`${fhirBaseUrl}/DocumentReference?patient=${patientId}`, {
    headers: authHeaders(accessToken),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch DocumentReference for patient ${patientId}: ${response.status} ${response.statusText}`);
  }

  return extractResources(await response.json());
}

export async function fetchLabObservations(
  fhirBaseUrl: string,
  accessToken: string,
  patientId: string,
): Promise<FhirObservation[]> {
  const response = await fetch(`${fhirBaseUrl}/Observation?patient=${patientId}&category=laboratory`, {
    headers: authHeaders(accessToken),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Observation for patient ${patientId}: ${response.status} ${response.statusText}`);
  }

  return extractResources(await response.json());
}

export async function fetchEpicPatientData(
  fhirBaseUrl: string,
  accessToken: string,
  patientId: string,
): Promise<EpicPatientData> {
  const [patient, conditions, documents, labs] = await Promise.all([
    fetchPatient(fhirBaseUrl, accessToken, patientId),
    fetchPatientConditions(fhirBaseUrl, accessToken, patientId),
    fetchDocumentReferences(fhirBaseUrl, accessToken, patientId),
    fetchLabObservations(fhirBaseUrl, accessToken, patientId),
  ]);

  return { patient, conditions, documents, labs };
}
