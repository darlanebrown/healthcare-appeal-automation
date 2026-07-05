# Healthcare Appeal Automation

A React + TypeScript + Vite application for automating healthcare insurance appeal workflows.

## Project Structure

```
src/
├── assets/       # Images, icons, and other static assets
├── components/   # Reusable UI components
├── pages/        # Top-level page/route components
├── services/     # API clients and external service integrations
├── types/        # Shared TypeScript types and interfaces
├── utils/        # Helper functions and utilities
└── styles/       # Global and shared stylesheets
```

## Core Types

`src/types/records.ts` defines the shape of an appeal record:

- `DenialReason` — the enumerated set of reasons a claim was denied (e.g. `"Medical Necessity"`, `"Prior Authorization"`, `"Coding Error"`, `"Timely Filing"`, `"Eligibility"`, `"Missing Documentation"`, `"Other"`).
- `Records` — patient, claim, and clinical documentation fields (patient/member identifiers, claim/billing details, ICD/CPT/revenue codes, denial reason, and supporting clinical notes) used throughout the appeal workflow.

## Pages & Components

`App.tsx` is a thin shell that renders `pages/AppealPage.tsx`, which owns the `Records` state and composes the form:

- `components/PatientInfoCard.tsx` — patient/encounter identifier fields
- `components/BillingCard.tsx` — claim/billing fields and the denial reason select
- `components/ClinicalEvidenceForm.tsx` — doctor summary, progress/nurse notes, consult notes, H&P, and labs cards
- `components/AppealDocketSidebar.tsx` — missing-evidence checklist, generate button, and rendered docket

Each form component takes `{ record, onChange }` and calls `onChange(field, value)`, keeping state lifted in `AppealPage`.

## Utilities

All utilities in `src/utils/` are TDD'd (test file written and confirmed failing before implementation):

- `validateRecord(record: Records): ValidationResult` — checks that all required fields are populated and that `denialReason` is one of the valid `DenialReason` values.
- `getMissingDocuments(record: Records): string[]` — returns a checklist of missing clinical evidence (doctor summary, notes, H&P, labs, ICD/CPT codes), plus the authorization number when `denialReason` is `"Prior Authorization"`.
- `generateAppealDocket(record: Records): string` — renders the patient, claim, and clinical evidence fields into the final Appeal Docket text used in `AppealPage`.

## Services

`src/services/appealService.ts` provides `submitAppeal(record: Records, docket: string): Promise<SubmitAppealResult>`, which `POST`s the record and generated docket text as JSON to `${VITE_API_BASE_URL}/appeals` and returns `{ submitted: true, appealId }`, throwing if the response is not `ok`. TDD'd against a mocked `fetch` (test written and confirmed failing before implementation).

`VITE_API_BASE_URL` is read from the environment (see `.env.example`); no real backend is wired up yet, so this defaults to a placeholder URL. Not yet called from the UI — currently only available as a service function.

## Styling

`src/styles/App.css` styles the appeal intake layout: a gradient hero header, a two-column grid (`.forms` for input cards, `.docket` as a sticky sidebar showing the missing-evidence checklist and generated docket), collapsing to a single column below 900px. Plain CSS has no runtime logic to unit test, so this is verified visually via `npm run dev` rather than with Vitest.

## Getting Started

Install dependencies:

```bash
npm install
```

Run the dev server:

```bash
npm run dev
```

## Scripts

- `npm run dev` — start the Vite dev server with HMR
- `npm run build` — type-check and build for production
- `npm run lint` — run ESLint
- `npm run preview` — preview the production build locally
- `npm run test` — run the Vitest test suite
