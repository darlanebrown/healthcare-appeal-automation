import { useState } from "react";
import type { Records } from "../types";
import { getMissingDocuments } from "../utils/getMissingDocuments";
import { generateAppealDocket } from "../utils/generateAppealDocket";
import { PatientInfoCard } from "../components/PatientInfoCard";
import { BillingCard } from "../components/BillingCard";
import { ClinicalEvidenceForm } from "../components/ClinicalEvidenceForm";
import { AppealDocketSidebar } from "../components/AppealDocketSidebar";
import "../styles/App.css";

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

export function AppealPage() {
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
          <PatientInfoCard record={record} onChange={updateField} />
          <BillingCard record={record} onChange={updateField} />
          <ClinicalEvidenceForm record={record} onChange={updateField} />
        </div>

        <AppealDocketSidebar
          missingDocuments={missingDocuments}
          appealDocket={appealDocket}
          onGenerate={handleGenerateAppeal}
        />
      </section>
    </main>
  );
}
