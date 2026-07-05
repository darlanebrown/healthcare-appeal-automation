import type { Supply } from "./supply";

export type DenialReason =
  | "Medical Necessity"
  | "Prior Authorization"
  | "Coding Error"
  | "Timely Filing"
  | "Eligibility"
  | "Missing Documentation"
  | "Other";

export type Records = {
  patientName: string;
  dateOfBirth: string;
  medicalRecordNumber: string;
  accountNumber: string;
  memberId: string;
  insuranceCompany: string;

  supplies: Supply[];

  claimNumber: string;
  dateOfService: string;
  procedure: string;
  billedAmount: string;
  deniedAmount: string;
  icdCode: string;
  cptCode: string;
  revenueCode: string;
  authorizationNumber: string;
  denialReason: DenialReason;

  doctorSummary: string;
  progressNotes: string;
  nurseNotes: string;
  consultNotes: string;
  historyAndPhysical: string;
  labs: string;

  requestedOutcome: string;
};
