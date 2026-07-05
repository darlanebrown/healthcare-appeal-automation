import type { Records } from "../types";

type Props = {
  record: Records;
  onChange: (field: keyof Records, value: string) => void;
};

export function ClinicalEvidenceForm({ record, onChange }: Props) {
  return (
    <>
      <section className="card">
        <h2>Doctor Summary</h2>
        <textarea value={record.doctorSummary} onChange={(e) => onChange("doctorSummary", e.target.value)} placeholder="Physician summary and medical necessity..." />
      </section>

      <section className="card">
        <h2>Progress Notes & Nurse Notes</h2>
        <textarea value={record.progressNotes} onChange={(e) => onChange("progressNotes", e.target.value)} placeholder="Progress notes..." />
        <textarea value={record.nurseNotes} onChange={(e) => onChange("nurseNotes", e.target.value)} placeholder="Nurse notes..." />
      </section>

      <section className="card">
        <h2>Consult Notes</h2>
        <textarea value={record.consultNotes} onChange={(e) => onChange("consultNotes", e.target.value)} placeholder="Specialist consult notes..." />
      </section>

      <section className="card">
        <h2>History & Physical</h2>
        <textarea value={record.historyAndPhysical} onChange={(e) => onChange("historyAndPhysical", e.target.value)} placeholder="H&P documentation..." />
      </section>

      <section className="card">
        <h2>Labs</h2>
        <textarea value={record.labs} onChange={(e) => onChange("labs", e.target.value)} placeholder="Lab results and diagnostic evidence..." />
      </section>
    </>
  );
}
