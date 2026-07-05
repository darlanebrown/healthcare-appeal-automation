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

## Utilities

All utilities in `src/utils/` are TDD'd (test file written and confirmed failing before implementation):

- `validateRecord(record: Records): ValidationResult` — checks that all required fields are populated and that `denialReason` is one of the valid `DenialReason` values.
- `getMissingDocuments(record: Records): string[]` — returns a checklist of missing clinical evidence (doctor summary, notes, H&P, labs, ICD/CPT codes), plus the authorization number when `denialReason` is `"Prior Authorization"`.
- `generateAppealDocket(record: Records): string` — renders the patient, claim, and clinical evidence fields into the final Appeal Docket text used in `App.tsx`.

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
