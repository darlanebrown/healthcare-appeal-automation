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

  claimNumber: string;
  dateOfService: string;
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
};
