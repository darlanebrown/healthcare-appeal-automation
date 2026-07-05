export type FhirCoding = {
  system?: string;
  code?: string;
  display?: string;
};

export type FhirCodeableConcept = {
  coding?: FhirCoding[];
  text?: string;
};

export type FhirHumanName = {
  text?: string;
  family?: string;
  given?: string[];
};

export type FhirPatient = {
  resourceType: "Patient";
  id: string;
  name?: FhirHumanName[];
  birthDate?: string;
};

export type FhirCondition = {
  resourceType: "Condition";
  id: string;
  code?: FhirCodeableConcept;
};

export type FhirDocumentReference = {
  resourceType: "DocumentReference";
  id: string;
  type?: FhirCodeableConcept;
  content?: { attachment?: { data?: string; contentType?: string } }[];
};

export type FhirObservation = {
  resourceType: "Observation";
  id: string;
  code?: FhirCodeableConcept;
  valueString?: string;
  valueQuantity?: { value?: number; unit?: string };
};

export type FhirBundleEntry<T> = {
  resource: T;
};

export type FhirBundle<T> = {
  resourceType: "Bundle";
  entry?: FhirBundleEntry<T>[];
};

export type EpicPatientData = {
  patient: FhirPatient;
  conditions: FhirCondition[];
  documents: FhirDocumentReference[];
  labs: FhirObservation[];
};

export type SmartLaunchParams = {
  iss: string | null;
  launch: string | null;
};

export type SmartEndpoints = {
  authorizationEndpoint: string;
  tokenEndpoint: string;
};

export type PkcePair = {
  verifier: string;
  challenge: string;
};

export type EpicTokenResponse = {
  access_token: string;
  patient?: string;
  expires_in?: number;
};
