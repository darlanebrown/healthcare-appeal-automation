import type { Records } from "../types";

export function generateAppealDocket(record: Records): string {
  return `
APPEAL DOCKET

PATIENT / ENCOUNTER INFORMATION
Patient Name: ${record.patientName}
Date of Birth: ${record.dateOfBirth}
Medical Record Number: ${record.medicalRecordNumber}
Account Number: ${record.accountNumber}
Member ID: ${record.memberId}
Insurance Company: ${record.insuranceCompany}

BILLING / CLAIM INFORMATION
Claim Number: ${record.claimNumber}
Date of Service: ${record.dateOfService}
Billed Amount: $${record.billedAmount}
Denied Amount: $${record.deniedAmount}
ICD-9 / ICD-10 Code: ${record.icdCode}
CPT / HCPCS Code: ${record.cptCode}
Revenue Code: ${record.revenueCode}
Authorization Number: ${record.authorizationNumber}
Denial Reason: ${record.denialReason}

CLINICAL EVIDENCE

Doctor Summary:
${record.doctorSummary}

Progress Notes:
${record.progressNotes}

Nurse Notes:
${record.nurseNotes}

Consult Notes:
${record.consultNotes}

History & Physical:
${record.historyAndPhysical}

Labs / Diagnostic Evidence:
${record.labs}

APPEAL REQUEST

Based on the billing record, claim denial, diagnosis/procedure codes, and supporting clinical documentation, we respectfully request reconsideration of this denial and reprocessing of the claim for payment.

This appeal docket includes evidence from real-time billing, provider documentation, nursing documentation, consult notes, history and physical, and laboratory evidence.
`;
}
