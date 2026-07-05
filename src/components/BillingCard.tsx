import type { DenialReason, Records } from "../types";

type Props = {
  record: Records;
  onChange: (field: keyof Records, value: string) => void;
};

export function BillingCard({ record, onChange }: Props) {
  return (
    <section className="card">
      <h2>Real-Time Billing Form</h2>

      <input placeholder="Claim Number" value={record.claimNumber} onChange={(e) => onChange("claimNumber", e.target.value)} />
      <input type="date" value={record.dateOfService} onChange={(e) => onChange("dateOfService", e.target.value)} />
      <input placeholder="Billed Amount" value={record.billedAmount} onChange={(e) => onChange("billedAmount", e.target.value)} />
      <input placeholder="Denied Amount" value={record.deniedAmount} onChange={(e) => onChange("deniedAmount", e.target.value)} />
      <input placeholder="ICD-9 / ICD-10 Code" value={record.icdCode} onChange={(e) => onChange("icdCode", e.target.value)} />
      <input placeholder="CPT / HCPCS Code" value={record.cptCode} onChange={(e) => onChange("cptCode", e.target.value)} />
      <input placeholder="Revenue Code" value={record.revenueCode} onChange={(e) => onChange("revenueCode", e.target.value)} />
      <input placeholder="Authorization Number" value={record.authorizationNumber} onChange={(e) => onChange("authorizationNumber", e.target.value)} />

      <select
        value={record.denialReason}
        onChange={(e) => onChange("denialReason", e.target.value as DenialReason)}
      >
        <option>Medical Necessity</option>
        <option>Prior Authorization</option>
        <option>Coding Error</option>
        <option>Timely Filing</option>
        <option>Eligibility</option>
        <option>Missing Documentation</option>
        <option>Other</option>
      </select>
    </section>
  );
}
