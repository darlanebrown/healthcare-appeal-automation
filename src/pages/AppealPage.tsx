import { useState } from "react";
import type { Records } from "../types";
import { getMissingDocuments } from "../utils/getMissingDocuments";
import { generateAppealDocket } from "../utils/generateAppealDocket";
import { addSupply, removeSupply, updateSupplyField } from "../utils/supplies";
import { getFhirImportConfig, importPatientData } from "../services/fhirImport";
import { PatientInfoCard } from "../components/PatientInfoCard";
import { SuppliesCard } from "../components/SuppliesCard";
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

  supplies: [],

  claimNumber: "",
  dateOfService: "",
  procedure: "",
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

  requestedOutcome: "",
};

type FhirImportStatus = "idle" | "importing" | "error";

export function AppealPage() {
  const [record, setRecord] = useState<Records>(initialRecord);
  const [appealDocket, setAppealDocket] = useState("");
  const [patientId, setPatientId] = useState(() => import.meta.env.VITE_FHIR_DEFAULT_PATIENT_ID ?? "");
  const [fhirImportStatus, setFhirImportStatus] = useState<FhirImportStatus>("idle");
  const [fhirImportError, setFhirImportError] = useState("");

  function updateField(field: keyof Records, value: string) {
    setRecord((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleImportFromFhir() {
    const { fhirBaseUrl } = getFhirImportConfig(import.meta.env);
    setFhirImportStatus("importing");

    importPatientData(fhirBaseUrl, patientId)
      .then((imported) => {
        setRecord((current) => ({ ...current, ...imported }));
        setFhirImportStatus("idle");
      })
      .catch((error: Error) => {
        setFhirImportError(error.message);
        setFhirImportStatus("error");
      });
  }

  function handleGenerateAppeal() {
    setAppealDocket(generateAppealDocket(record));
  }

  function handleAddSupply() {
    setRecord((current) => ({ ...current, supplies: addSupply(current.supplies) }));
  }

  function handleRemoveSupply(id: string) {
    setRecord((current) => ({ ...current, supplies: removeSupply(current.supplies, id) }));
  }

  function handleUpdateSupply(id: string, field: "name" | "quantity" | "code", value: string) {
    setRecord((current) => ({
      ...current,
      supplies: updateSupplyField(current.supplies, id, field, value),
    }));
  }

  const missingDocuments = getMissingDocuments(record);

  return (
    <main className="app">
      <header className="hero">
        <p className="eyebrow">Appeal Automation</p>
        <h1>Healthcare Appeal Automation</h1>
        <p className="hero-description">
          Billing and clinical evidence are collected across intake forms and
          automatically forwarded into the final Appeal Docket/Form.
        </p>
        <div className="fhir-import">
          <input
            placeholder="Patient ID"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
          />
          <button type="button" onClick={handleImportFromFhir} disabled={fhirImportStatus === "importing"}>
            {fhirImportStatus === "importing" ? "Importing…" : "Import from Oracle Health"}
          </button>
        </div>
        {fhirImportStatus === "error" && <p className="error">{fhirImportError}</p>}
      </header>

      <section className="layout">
        <div className="forms">
          <PatientInfoCard record={record} onChange={updateField} />
          <SuppliesCard
            supplies={record.supplies}
            onAdd={handleAddSupply}
            onRemove={handleRemoveSupply}
            onUpdate={handleUpdateSupply}
          />
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
