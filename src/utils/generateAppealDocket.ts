import type { Records } from "../types";

function formatSuppliesSection(record: Records): string {
  if (record.supplies.length === 0) {
    return "";
  }

  const lines = record.supplies
    .map((supply) => `- ${supply.name} (Qty: ${supply.quantity}, Code: ${supply.code})`)
    .join("\n");

  return `\nSupplies Used:\n${lines}\n`;
}

export function generateAppealDocket(record: Records): string {
  return `
RE: Appeal of Claim Denial

Patient: ${record.patientName}
Member ID: ${record.memberId}
Insurance Company: ${record.insuranceCompany}
Claim Number: ${record.claimNumber}
Date of Service: ${record.dateOfService}
Procedure/Service: ${record.procedure}

Dear Appeals Department,

I am writing to request reconsideration of the denied claim listed above. The claim was denied for the following reason: ${record.denialReason}.

Based on the clinical documentation, the service was medically appropriate and supported by the patient's condition, provider assessment, and available documentation.

Doctor's Summary:
${record.doctorSummary}

Progress Notes:
${record.progressNotes}

Labs / Diagnostic Evidence:
${record.labs}
${formatSuppliesSection(record)}
Requested Outcome:
${record.requestedOutcome}

Please review the attached documentation and reconsider this denial for payment.

Sincerely,

Appeals Coordinator
`;
}
