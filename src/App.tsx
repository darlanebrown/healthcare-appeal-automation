import { useState } from "react";
import type { Records, DenialReason } from "./types";
import { getMissingDocuments } from "./utils/getMissingDocuments";
import { generateAppealDocket } from "./utils/generateAppealDocket";
import "./App.css";

const initialRecord: Records = {
  patientName: "",
  dateOfBirth: "",
  medicalRecordNumber: "",
  accountNumber: "",
  memberId: "",
  insuranceCompany: "",

  claimNumber: "",
  dateOfService: "",
  billedAmount: "",
  deniedAmount: "",
  icdCode: "",
  cptCode: "",
  revenueCode: "",
  authorizationNumber: "",
  denialReason: "Medical Necessity",

  doctorSummary: "",
  progressNotes: "",
  nurseNotes: "",
  consultNotes: "",
  historyAndPhysical: "",
  labs: "",
};

export default function App() {
  const [record, setRecord] = useState<Records>(initialRecord);
  const [appealDocket, setAppealDocket] = useState("");

  function updateField(field: keyof Records, value: string) {
    setRecord((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleGenerateAppeal() {
    setAppealDocket(generateAppealDocket(record));
  }

  const missingDocuments = getMissingDocuments(record);

  return (
    <main className="app">
      <header className="hero">
        <p className="eyebrow">Appeal Automation</p>
        <h1>Healthcare Appeal Automation</h1>
        <p>
          Billing and clinical evidence are collected across intake forms and
          automatically forwarded into the final Appeal Docket/Form.
        </p>
      </header>

      <section className="layout">
        <div className="forms">
          <section className="card">
            <h2>Patient / Encounter Information</h2>

            <input placeholder="Patient Name" value={record.patientName} onChange={(e) => updateField("patientName", e.target.value)} />
            <input type="date" value={record.dateOfBirth} onChange={(e) => updateField("dateOfBirth", e.target.value)} />
            <input placeholder="Medical Record Number (MRN)" value={record.medicalRecordNumber} onChange={(e) => updateField("medicalRecordNumber", e.target.value)} />
            <input placeholder="Account Number / Visit Number" value={record.accountNumber} onChange={(e) => updateField("accountNumber", e.target.value)} />
            <input placeholder="Member ID" value={record.memberId} onChange={(e) => updateField("memberId", e.target.value)} />
            <input placeholder="Insurance Company" value={record.insuranceCompany} onChange={(e) => updateField("insuranceCompany", e.target.value)} />
          </section>

          <section className="card">
            <h2>Real-Time Billing Form</h2>

            <input placeholder="Claim Number" value={record.claimNumber} onChange={(e) => updateField("claimNumber", e.target.value)} />
            <input type="date" value={record.dateOfService} onChange={(e) => updateField("dateOfService", e.target.value)} />
            <input placeholder="Billed Amount" value={record.billedAmount} onChange={(e) => updateField("billedAmount", e.target.value)} />
            <input placeholder="Denied Amount" value={record.deniedAmount} onChange={(e) => updateField("deniedAmount", e.target.value)} />
            <input placeholder="ICD-9 / ICD-10 Code" value={record.icdCode} onChange={(e) => updateField("icdCode", e.target.value)} />
            <input placeholder="CPT / HCPCS Code" value={record.cptCode} onChange={(e) => updateField("cptCode", e.target.value)} />
            <input placeholder="Revenue Code" value={record.revenueCode} onChange={(e) => updateField("revenueCode", e.target.value)} />
            <input placeholder="Authorization Number" value={record.authorizationNumber} onChange={(e) => updateField("authorizationNumber", e.target.value)} />

            <select
              value={record.denialReason}
              onChange={(e) => updateField("denialReason", e.target.value as DenialReason)}
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

          <section className="card">
            <h2>Doctor Summary</h2>
            <textarea value={record.doctorSummary} onChange={(e) => updateField("doctorSummary", e.target.value)} placeholder="Physician summary and medical necessity..." />
          </section>

          <section className="card">
            <h2>Progress Notes & Nurse Notes</h2>
            <textarea value={record.progressNotes} onChange={(e) => updateField("progressNotes", e.target.value)} placeholder="Progress notes..." />
            <textarea value={record.nurseNotes} onChange={(e) => updateField("nurseNotes", e.target.value)} placeholder="Nurse notes..." />
          </section>

          <section className="card">
            <h2>Consult Notes</h2>
            <textarea value={record.consultNotes} onChange={(e) => updateField("consultNotes", e.target.value)} placeholder="Specialist consult notes..." />
          </section>

          <section className="card">
            <h2>History & Physical</h2>
            <textarea value={record.historyAndPhysical} onChange={(e) => updateField("historyAndPhysical", e.target.value)} placeholder="H&P documentation..." />
          </section>

          <section className="card">
            <h2>Labs</h2>
            <textarea value={record.labs} onChange={(e) => updateField("labs", e.target.value)} placeholder="Lab results and diagnostic evidence..." />
          </section>
        </div>

        <aside className="card docket">
          <h2>Appeal Docket/Form</h2>

          <h3>Missing Evidence Checklist</h3>
          {missingDocuments.length === 0 ? (
            <p className="success">All required evidence is included.</p>
          ) : (
            <ul>
              {missingDocuments.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}

          <button type="button" onClick={handleGenerateAppeal}>
            Forward Evidence to Appeal Form
          </button>

          {appealDocket ? (
            <pre>{appealDocket}</pre>
          ) : (
            <p className="muted">
              Complete the forms, then click the button to generate the appeal docket.
            </p>
          )}
        </aside>
      </section>
    </main>
  );
}
