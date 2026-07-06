import type { Records } from "../types";
import { completeStandaloneLaunch, startStandaloneLaunch, type StandaloneLaunchConfig } from "./smartAuth";
import { fetchFhirPatientData } from "./fhirClient";
import { mapFhirDataToRecord } from "../utils/mapFhirDataToRecord";

export function getFhirImportConfig(env: Record<string, string | undefined>): StandaloneLaunchConfig {
  return {
    fhirBaseUrl: env.VITE_FHIR_TENANT_BASE_URL ?? "",
    clientId: env.VITE_FHIR_CLIENT_ID ?? "",
    redirectUri: env.VITE_FHIR_REDIRECT_URI ?? "",
    scope: env.VITE_FHIR_SCOPES ?? "",
  };
}

export function isFhirCallback(search: string): boolean {
  const params = new URLSearchParams(search);
  return params.has("code") && params.has("state");
}

export function startFhirImport(config: StandaloneLaunchConfig): Promise<void> {
  return startStandaloneLaunch(config);
}

export async function completeFhirImport(
  callbackSearch: string,
  config: { clientId: string; redirectUri: string },
): Promise<Partial<Records>> {
  const { accessToken, patientId, fhirBaseUrl } = await completeStandaloneLaunch(callbackSearch, config);

  if (!patientId) {
    throw new Error("The launch did not return a patient context");
  }

  return importPatientData(fhirBaseUrl, patientId, accessToken);
}

export async function importPatientData(
  fhirBaseUrl: string,
  patientId: string,
  accessToken?: string,
): Promise<Partial<Records>> {
  const data = await fetchFhirPatientData(fhirBaseUrl, accessToken, patientId);
  return mapFhirDataToRecord(data);
}
