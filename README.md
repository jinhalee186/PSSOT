# PSSOT — Project Management Package Generating System

Transforms customer-provided information into a **Project Single Source of Truth (SSOT)** and generates PM, business, data, technical, architecture, and AI artifacts as **views** of that SSOT.

## Principle

**Structure is fixed; project knowledge is dynamic.**

- Knowledge domains (`00_PROJECT` … `14_ARCHITECTURE`) are the system framework.
- Customer data domains are **never hard-coded**. They are derived from `02_DATA_INVENTORY` into the **Dynamic Domain Registry**.
- The **Ontology Internal Model** (entities, attributes, relationships) is the semantic SSOT. Graph UI and OWL are generated views of that model.

```text
Customer Information / Data
        ↓
Customer Data Intake
        ↓
Normalize / Validate / Profile
        ↓
Project SSOT
        ↓
Generated Views / Artifacts
```

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Optional demo seed (commerce domains: Customer / Product / Order — not Brand/Campaign):

```bash
npm run seed
```

## Typical flow

1. Create a project.
2. **Intake** CSV/XLSX/JSON (or add inventory rows by hand).
3. Confirm **Data Inventory** domain names.
4. **Sync domains** → Dynamic Domain Registry.
5. Propose **Data Dictionary**, review/approve/reject attributes (human-in-the-loop).
6. Run **Regenerate downstream** for profiling, mapping, canonical model, ontology, contracts, and documents.
7. Verify **Ontology** in the graph; validate; approve only when errors are clear.
8. Download the **Customer Data Package** ZIP (`DATA/<dynamic domain>/` folders).

## Persistence

Project SSOT is stored at `data/projects/<id>/ssot.json` with uploads under `uploads/`.
