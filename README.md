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
- `Records` — patient, claim, and clinical documentation fields (patient/member identifiers, supplies used, claim/billing details, procedure, ICD/CPT/revenue codes, denial reason, supporting clinical notes, and the requested outcome) used throughout the appeal workflow.
- `Supply` (in `src/types/supply.ts`) — a single supply/implant item used during the procedure: `name`, `quantity`, and a supply/HCPCS `code`. Deliberately has **no cost field** — supplies are logged in real time during the procedure, before coding/billing happens; cost is attached later on the claim via `BillingCard`'s billed/denied amounts.

## Pages & Components

`App.tsx` is a thin shell that renders `pages/AppealPage.tsx`, which owns the `Records` state and composes the form:

- `components/PatientInfoCard.tsx` — patient/encounter identifier fields
- `components/SuppliesCard.tsx` — add/remove/edit the real-time supplies list (`AppealPage` wires this to `utils/supplies.ts`); sits before billing since supplies are recorded during the procedure, ahead of coding/billing
- `components/BillingCard.tsx` — claim/billing fields, procedure, and the denial reason select
- `components/ClinicalEvidenceForm.tsx` — doctor summary, progress/nurse notes, consult notes, H&P, labs, and requested outcome cards
- `components/AppealDocketSidebar.tsx` — missing-evidence checklist, generate button, and rendered docket

Each form component takes `{ record, onChange }` and calls `onChange(field, value)`, keeping state lifted in `AppealPage`.

## Utilities

All utilities in `src/utils/` are TDD'd (test file written and confirmed failing before implementation):

- `validateRecord(record: Records): ValidationResult` — checks that all required fields are populated and that `denialReason` is one of the valid `DenialReason` values.
- `getMissingDocuments(record: Records): string[]` — flags a missing doctor's summary, progress notes, labs, or supplies used (empty `supplies` list), plus a denial-reason-specific requirement: a medical necessity statement when `denialReason` is `"Medical Necessity"`, or prior authorization documentation when it's `"Prior Authorization"`. Drives the Missing Evidence Checklist in `AppealDocketSidebar`.
- `generateAppealDocket(record: Records): string` — renders an appeal letter (addressed to the Appeals Department) covering patient/claim details, clinical evidence, supplies used (name/quantity/code, no cost), and the requested outcome, used in `AppealPage`.
- `createEmptySupply`, `addSupply`, `removeSupply`, `updateSupplyField` (in `utils/supplies.ts`) — pure array helpers backing the real-time supplies list; each returns a new `Supply[]` rather than mutating in place.

## Services

`src/services/appealService.ts` provides `submitAppeal(record: Records, docket: string): Promise<SubmitAppealResult>`, which `POST`s the record and generated docket text as JSON to `${VITE_API_BASE_URL}/appeals` and returns `{ submitted: true, appealId }`, throwing if the response is not `ok`. TDD'd against a mocked `fetch` (test written and confirmed failing before implementation).

`VITE_API_BASE_URL` is read from the environment (see `.env.example`); no real backend is wired up yet, so this defaults to a placeholder URL. Not yet called from the UI — currently only available as a service function.

## Epic Integration (Scaffold)

Toward automating data entry from Epic instead of typing it in by hand. Two SMART on FHIR launch flows are supported:

- **EHR launch** — for real production use: the app is opened *from inside* a live Epic session (e.g. a clinician's chart in Hyperspace), which hands it `iss` (the FHIR base URL) and a `launch` token via the URL. Auth reuses that session context.
- **Standalone launch** — for testing against [Epic's free public sandbox](https://fhir.epic.com) (no live Epic instance required): the app already knows its FHIR base URL (`VITE_EPIC_FHIR_BASE_URL`) and kicks off the OAuth redirect itself, using `scope=launch/patient` instead of a `launch` token, since there's no EHR session to hand one over.

No Epic App Orchard registration exists yet, so this is a working scaffold behind placeholder env vars (`VITE_EPIC_CLIENT_ID`, `VITE_EPIC_REDIRECT_URI`, `VITE_EPIC_SCOPES`, `VITE_EPIC_FHIR_BASE_URL` in `.env.example`) — not yet wired into the UI.

- `services/epicAuth.ts`:
  - `parseLaunchParams` — reads `iss`/`launch` off an EHR launch URL
  - `generatePkcePair` — PKCE verifier + SHA-256 challenge
  - `buildAuthorizationUrl` — builds the OAuth authorize URL (`launch` is optional, per the standalone case above)
  - `discoverSmartEndpoints` — reads `/.well-known/smart-configuration` for the authorization/token endpoints
  - `exchangeCodeForToken` — trades an authorization code + PKCE verifier for an access token
  - `startStandaloneLaunch` / `completeStandaloneLaunch` — the full standalone flow: discovers endpoints, generates and stores the PKCE verifier/state/FHIR base URL in `sessionStorage`, redirects to Epic (`start`), then on callback validates `state`, exchanges the code, and clears the stored state (`complete`)
- `services/epicFhirClient.ts` — `fetchPatient`, `fetchPatientConditions`, `fetchDocumentReferences`, `fetchLabObservations`, and `fetchEpicPatientData` (fetches all four together) against the FHIR REST API with a bearer token.
- `utils/mapEpicDataToRecord.ts` — pure mapping from fetched FHIR data to `Partial<Records>`: patient name/DOB, first ICD-coded condition, `DocumentReference`s routed to `progressNotes`/`historyAndPhysical`/`consultNotes`/`doctorSummary`/`nurseNotes` by matching their `type` text (multiple documents of the same type are joined), and lab `Observation`s joined into `labs`. Only pulls clinical data — Epic isn't a payer system, so claim/billing/denial fields still need a separate source.

All of this is TDD'd (test file written and confirmed failing before implementation) against mocked `fetch`/`sessionStorage`/`location`/pure inputs — no network or real Epic sandbox required to verify the logic. Next steps to make this real: register a free non-production app at fhir.epic.com to get a real client ID, sandbox FHIR base URL, and test patients; swap the placeholder env vars for those real values; call `startStandaloneLaunch` (sandbox) or handle an EHR launch URL with `parseLaunchParams` (production) plus a callback route calling `completeStandaloneLaunch`/`exchangeCodeForToken`; and add an "Import from Epic" action in the UI that calls `fetchEpicPatientData` → `mapEpicDataToRecord` and merges the result into the form state.

## Styling

`src/styles/App.css` styles the appeal intake layout: a gradient hero header, a two-column grid (`.forms` for input cards, `.docket` as a sticky sidebar showing the missing-evidence checklist and generated docket), collapsing to a single column below 900px. Plain CSS has no runtime logic to unit test, so this is verified visually via `npm run dev` rather than with Vitest.

## Testing

Every module in `src/utils/` and `src/services/` was built TDD-style: its test file was written and confirmed failing (red) before the implementation existed, then the implementation was added until the suite passed (green). Current suite: 8 test files, 52 tests.

- `utils/validateRecord.test.ts` — required-field and `denialReason` validation
- `utils/getMissingDocuments.test.ts` — missing-evidence checklist rules
- `utils/generateAppealDocket.test.ts` — appeal letter content, including the supplies-used section
- `utils/supplies.test.ts` — create/add/remove/update helpers for the real-time supplies list
- `utils/mapEpicDataToRecord.test.ts` — FHIR data → `Records` field mapping
- `services/appealService.test.ts` — `submitAppeal` against a mocked `fetch`
- `services/epicAuth.test.ts` — SMART launch parsing, PKCE, authorization URL, discovery, token exchange, and the standalone launch start/complete flow against mocked `fetch`/`sessionStorage`/`location`
- `services/epicFhirClient.test.ts` — Patient/Condition/DocumentReference/Observation fetches against a mocked `fetch`

Run the suite with `npm run test`.

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
