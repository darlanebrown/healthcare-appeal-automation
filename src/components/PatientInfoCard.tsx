import type { Records } from "../types";

type Props = {
  record: Records;
  onChange: (field: keyof Records, value: string) => void;
};

export function PatientInfoCard({ record, onChange }: Props) {
  return (
    <section className="card">
      <h2>Patient / Encounter Information</h2>

      <input placeholder="Patient Name" value={record.patientName} onChange={(e) => onChange("patientName", e.target.value)} />
      <input type="date" value={record.dateOfBirth} onChange={(e) => onChange("dateOfBirth", e.target.value)} />
      <input placeholder="Medical Record Number (MRN)" value={record.medicalRecordNumber} onChange={(e) => onChange("medicalRecordNumber", e.target.value)} />
      <input placeholder="Account Number / Visit Number" value={record.accountNumber} onChange={(e) => onChange("accountNumber", e.target.value)} />
      <input placeholder="Member ID" value={record.memberId} onChange={(e) => onChange("memberId", e.target.value)} />
      <input placeholder="Insurance Company" value={record.insuranceCompany} onChange={(e) => onChange("insuranceCompany", e.target.value)} />
    </section>
  );
}
