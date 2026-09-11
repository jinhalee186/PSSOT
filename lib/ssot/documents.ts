import type { GeneratedDocument, ProjectSSOT } from "./types";
import { KNOWLEDGE_DOMAINS } from "./types";
import { id, nowIso } from "./util";
import { generateOwl, generateTurtle } from "./validate-owl";

function doc(kind: string, title: string, markdown: string, ssot: ProjectSSOT): GeneratedDocument {
  return { id: id("doc"), kind, title, markdown, generatedAt: nowIso(), ssotVersion: ssot.version };
}

export function documentFileMeta(doc: GeneratedDocument, projectCode: string) {
  if (doc.kind === "owl") {
    return { filename: "ontology.owl", contentType: "application/rdf+xml; charset=utf-8" };
  }
  if (doc.kind === "ttl") {
    return { filename: "ontology.ttl", contentType: "text/turtle; charset=utf-8" };
  }
  const safeTitle = doc.title.replace(/[^\w.\-]+/g, "_").replace(/^_|_$/g, "") || doc.kind;
  return {
    filename: `${projectCode}_${safeTitle}.md`,
    contentType: "text/markdown; charset=utf-8",
  };
}

export function findGeneratedDocument(ssot: ProjectSSOT, kind: string): GeneratedDocument | undefined {
  if (!ssot.documents.some((d) => d.kind === kind)) {
    regenerateDocuments(ssot);
  }
  return ssot.documents.find((d) => d.kind === kind);
}

export function regenerateDocuments(ssot: ProjectSSOT): ProjectSSOT {
  const iri = `urn:pssot:${ssot.project.code.toLowerCase()}`;
  ssot.documents = [
    doc("readme", "Project README", readme(ssot), ssot),
    doc("prd", "Product Requirements Document", prd(ssot), ssot),
    doc("brd", "Business Requirement Document", brd(ssot), ssot),
    doc("proposal", "Customer Proposal", proposal(ssot), ssot),
    doc("exec", "Executive Summary", exec(ssot), ssot),
    doc("data_spec", "Data Specification", dataSpec(ssot), ssot),
    doc("tech_spec", "Technical Specification", techSpec(ssot), ssot),
    doc("architecture", "Architecture Document", architecture(ssot), ssot),
    doc("handoff", "Developer Handoff", handoff(ssot), ssot),
    doc("api", "API Specification", apiSpec(ssot), ssot),
    doc("ontology_docs", "Ontology Documentation", ontologyDocs(ssot), ssot),
    doc("dictionary", "Data Dictionary", dictionaryMd(ssot), ssot),
    doc("contract", "Data Contracts", contractsMd(ssot), ssot),
    doc("owl", "ontology.owl", generateOwl(ssot.ontology, iri), ssot),
    doc("ttl", "ontology.ttl", generateTurtle(ssot.ontology, iri), ssot),
  ];
  return ssot;
}

function header(ssot: ProjectSSOT, title: string) {
  return `# ${title}

> Generated view of Project SSOT \`${ssot.project.code}\` v${ssot.version}. Not an independent source of truth.

- Customer: ${ssot.project.customer || "—"}
- Project: ${ssot.project.name}
- Generated: ${nowIso()}

`;
}

function readme(ssot: ProjectSSOT) {
  const domains = ssot.domainRegistry.domains
    .filter((d) => d.status === "ACTIVE")
    .map((d) => `- ${d.name} (${d.status})`)
    .join("\n");
  return `${header(ssot, ssot.project.name + " — Project README")}
${ssot.project.description}

## Knowledge domains

${KNOWLEDGE_DOMAINS.map((d) => `- \`${d.code}\` ${d.label}`).join("\n")}

## Active customer data domains

${domains || "_No domains yet. Add assets to Data Inventory._"}

## Pipeline

Customer data → Data Inventory → Dynamic Domain Registry → Data Dictionary → Profiling → Mapping → Canonical Model → Ontology Model → Contracts / API / Documents
`;
}

function prd(ssot: ProjectSSOT) {
  const b = ssot.business;
  return `${header(ssot, "Product Requirements Document")}
## 1. Project Overview
${ssot.project.description}

## 2. Problem / Background
${b.background}

## 3. Project Goal
${b.objective}

## 4. Scope
**MVP:** ${b.mvp}

**In scope:** ${b.inScope.join("; ") || "—"}

**Out of scope:** ${b.outOfScope.join("; ") || "—"}

**Future:** ${b.futureScope.join("; ") || "—"}

## 5. Success Metrics
${b.kpis.map((k) => `- ${k}`).join("\n") || "—"}

## 6. Target Audience
${b.targetAudience}

## 7. Primary User
${b.primaryUser}

## 8. Secondary User
${b.secondaryUser}

## 9. User Persona
${b.personas.map((p) => `- ${p}`).join("\n") || "—"}

## 10. Key Pain Points
${b.painPoints.map((p) => `- ${p}`).join("\n") || "—"}

## 11. Core Features – MVP
${b.mvp}

## 12. Functional Requirements
${b.requirements
  .filter((r) => r.category === "functional" || r.category === "business")
  .map((r) => `- [${r.priority}] ${r.statement}`)
  .join("\n") || "—"}

## 13. Acceptance Criteria
${b.requirements.map((r) => `- ${r.statement}: ${r.acceptanceCriteria}`).join("\n") || "—"}

## 14. User Flow
${b.userFlow}

## 15. UI/UX
${b.uxRequirements}

${b.screenRequirements}

Figma: ${b.figmaRefs.join(", ") || "—"}

## 16. Technical / System Requirements
See Technical Specification (generated from Architecture + Canonical Model + Contracts).

## 17. Constraints & Limitations
${[...b.businessConstraints, ...b.technicalConstraints, ...b.dataConstraints].map((c) => `- ${c}`).join("\n") || "—"}

## 18. Dependencies & Risks
Dependencies: ${b.dependencies.join("; ") || "—"}

Risks: ${b.risks.map((r) => `- ${r}`).join("\n") || "—"}

## 19. Success Metrics / Acceptance Criteria
Value: ${b.businessValue}
`;
}

function brd(ssot: ProjectSSOT) {
  const b = ssot.business;
  return `${header(ssot, "Business Requirement Document")}
## Business Context
- Objective: ${b.objective}
- Background: ${b.background}
- Current workflow: ${b.currentWorkflow}
- Target workflow: ${b.targetWorkflow}
- Value: ${b.businessValue}

## Users & Stakeholders
${b.stakeholders.map((s) => `- ${s.name} (${s.role} / ${s.type}): ${s.responsibilities}`).join("\n") || "—"}

## Requirements
${b.requirements.map((r) => `- [${r.category}] ${r.statement}`).join("\n") || "—"}

## Assumptions
${b.assumptions.map((a) => `- ${a}`).join("\n") || "—"}
`;
}

function proposal(ssot: ProjectSSOT) {
  return `${header(ssot, "Customer Proposal")}
Dear ${ssot.project.customer || "customer"},

We propose delivering **${ssot.project.name}** as a governed Project Single Source of Truth. Customer-provided data is inventoried, domains are registered dynamically, and all PM / data / architecture artifacts are generated views of that SSOT.

**Business outcome:** ${ssot.business.businessValue || ssot.business.objective || "To be confirmed."}

**Active data domains:** ${ssot.domainRegistry.domains.filter((d) => d.status === "ACTIVE").map((d) => d.name).join(", ") || "pending intake"}

**MVP:** ${ssot.business.mvp || "To be confirmed."}
`;
}

function exec(ssot: ProjectSSOT) {
  return `${header(ssot, "Executive Summary")}
${ssot.project.name} establishes a project SSOT for ${ssot.project.customer || "the customer"}.

- Goal: ${ssot.business.objective || "—"}
- Domains in inventory: ${ssot.domainRegistry.domains.filter((d) => d.status === "ACTIVE").length}
- Dictionary attributes: ${ssot.dictionary.tables.reduce((n, t) => n + t.attributes.length, 0)}
- Ontology entities: ${ssot.ontology.entities.length}
- Open gaps: ${ssot.gapLog.filter((g) => g.status === "open").length}
`;
}

function dataSpec(ssot: ProjectSSOT) {
  return `${header(ssot, "Data Specification")}
## Inventory
${ssot.inventory.assets.map((a) => `- **${a.domain} / ${a.dataAsset}** (${a.format}) — ${a.description}`).join("\n") || "—"}

## Dictionary
${dictionaryMd(ssot)}

## Mapping
${ssot.mapping.map((m) => `- ${m.sourceDomain}.${m.sourceField} → ${m.canonicalEntity}.${m.canonicalAttribute} (${m.transform})`).join("\n") || "—"}

## Canonical
${ssot.canonical.entities.map((e) => `### ${e.name}\n${e.attributes.map((a) => `- ${a.name}: ${a.dataType}`).join("\n")}`).join("\n\n") || "—"}
`;
}

function dictionaryMd(ssot: ProjectSSOT) {
  const parts = ssot.dictionary.tables.map((t) => {
    const rows = t.attributes
      .map(
        (a) =>
          `| ${a.name} | ${a.dataType} | ${a.description} | ${a.required ? "required" : "optional"} | ${a.status} | ${a.provenance.confidence} | ${a.provenance.source} |`,
      )
      .join("\n");
    return `### ${t.domainName}\n\n| Attribute | Type | Description | Nullability | Status | Confidence | Provenance |\n|---|---|---|---|---|---|---|\n${rows}`;
  });
  return `${header(ssot, "Data Dictionary")}${parts.join("\n\n") || "_No dictionary tables. Sync domains from inventory first._"}`;
}

function techSpec(ssot: ProjectSSOT) {
  return `${header(ssot, "Technical Specification")}
${ssot.architecture.overview}

## Components
${ssot.architecture.components.map((c) => `- ${c}`).join("\n") || "Derived from canonical entities and generated API."}

## Integrations
${ssot.architecture.integrations.map((c) => `- ${c}`).join("\n") || ssot.inventory.assets.map((a) => `- ${a.sourceSystem}`).join("\n")}

## NFRs
${ssot.architecture.nfrs.map((c) => `- ${c}`).join("\n") || ssot.business.technicalConstraints.map((c) => `- ${c}`).join("\n") || "—"}

Canonical entities: ${ssot.canonical.entities.map((e) => e.name).join(", ") || "—"}
`;
}

function architecture(ssot: ProjectSSOT) {
  return `${header(ssot, "Architecture Document")}
## Principle
Structure is fixed; project knowledge is dynamic. Documents, Graph, and OWL are generated views of SSOT.

## Flow
Customer Information → Intake → Normalize / Validate / Profile → Project SSOT → Generated Views

## Patterns
${ssot.architecture.patterns.map((p) => `- ${p}`).join("\n") || "- Metadata-driven domain registry\n- Human-in-the-loop verification\n- Ontology internal model as semantic SSOT"}

${ssot.architecture.overview}
`;
}

function handoff(ssot: ProjectSSOT) {
  return `${header(ssot, "Developer Handoff")}
## What to implement
Use the Canonical Model and Data Contracts. Do not treat generated markdown as schema.

## API
${ssot.systems.flatMap((s) => s.endpoints.map((e) => `- ${e.method} ${e.path} — ${e.description}`)).join("\n") || "—"}

## Ontology
${ssot.ontology.entities.map((e) => `- ${e.name} (${e.status})`).join("\n") || "—"}

## Open decisions
${ssot.gapLog.map((g) => `- [${g.status}] ${g.title}: ${g.description}`).join("\n") || "—"}
`;
}

function apiSpec(ssot: ProjectSSOT) {
  return `${header(ssot, "API Specification")}
${ssot.systems
  .map(
    (s) => `## ${s.name}\n${s.description}\n\n${s.endpoints.map((e) => `### ${e.method} ${e.path}\n${e.description}`).join("\n\n")}`,
  )
  .join("\n\n") || "Generate contracts first."}
`;
}

function ontologyDocs(ssot: ProjectSSOT) {
  const ents = ssot.ontology.entities
    .map((e) => `### ${e.name}\n${e.description}\n\nAttributes:\n${e.attributes.map((a) => `- ${a.name} (${a.dataType})`).join("\n")}`)
    .join("\n\n");
  const rels = ssot.ontology.relationships
    .map((r) => {
      const s = ssot.ontology.entities.find((e) => e.id === r.sourceEntityId)?.name;
      const t = ssot.ontology.entities.find((e) => e.id === r.targetEntityId)?.name;
      return `- ${s} —${r.name}→ ${t} [${r.cardinality}] (${r.status})`;
    })
    .join("\n");
  return `${header(ssot, "Ontology Documentation")}
Internal ontology model version ${ssot.ontology.metadata.version}, status ${ssot.ontology.metadata.status}.

## Entities
${ents || "—"}

## Relationships
${rels || "—"}

## Validation
${ssot.ontology.validationIssues.map((i) => `- [${i.severity}] ${i.rule}: ${i.message}`).join("\n") || "No issues recorded."}
`;
}

function contractsMd(ssot: ProjectSSOT) {
  return `${header(ssot, "Data Contracts")}
${ssot.contracts
  .map(
    (c) =>
      `## ${c.name} v${c.version}\nOwner: ${c.owner}\nCompatibility: ${c.compatibility}\n\n| Field | Type | Required | Nullable |\n|---|---|---|---|\n${c.fields.map((f) => `| ${f.name} | ${f.dataType} | ${f.required} | ${f.nullable} |`).join("\n")}`,
  )
  .join("\n\n") || "Generate from canonical model."}
`;
}
