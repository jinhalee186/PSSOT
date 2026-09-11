import { generateMappingAndCanonical } from "./canonical";
import { generateContracts } from "./contracts";
import { generateDictionary } from "./dictionary";
import { syncDomainRegistry } from "./domain-registry";
import { regenerateDocuments } from "./documents";
import { generateOntologyFromSSOT } from "./ontology";
import { generateProfiling } from "./profiling";
import type { ProjectSSOT } from "./types";
import { applyValidation } from "./validate-owl";

function wants(targets: string[], tokens: string[]) {
  if (!targets.length || targets.some((t) => t.toLowerCase() === "all")) return true;
  const hay = targets.map((t) => t.toLowerCase());
  return tokens.some((token) => hay.some((t) => t.includes(token)));
}

export async function runDownstreamPipeline(
  ssot: ProjectSSOT,
  actor = "system",
  targets: string[] = ["all"],
): Promise<ProjectSSOT> {
  syncDomainRegistry(ssot, actor);
  if (wants(targets, ["dictionary", "03_data"])) await generateDictionary(ssot, actor);
  if (wants(targets, ["profil", "11_data", "sample"])) await generateProfiling(ssot);
  if (wants(targets, ["mapping", "canonical", "04_data", "05_canon"])) generateMappingAndCanonical(ssot, actor);
  if (wants(targets, ["ontology", "owl", "graph", "06_onto"])) {
    generateOntologyFromSSOT(ssot, actor);
    applyValidation(ssot);
  }
  if (wants(targets, ["contract", "07_data", "system", "08_system", "api"])) generateContracts(ssot);
  if (
    wants(targets, [
      "document",
      "prd",
      "spec",
      "readme",
      "architecture",
      "handoff",
      "proposal",
      "exec",
      "package",
      "view",
    ])
  ) {
    regenerateDocuments(ssot);
  }
  for (const item of ssot.impactQueue) {
    if (!item.regenerated && wants(targets, item.affected.map((a) => a.toLowerCase()))) {
      item.regenerated = true;
    }
    if (wants(targets, ["all"])) item.regenerated = true;
  }
  return ssot;
}

export function lineageForAttribute(ssot: ProjectSSOT, attributeId: string) {
  const attr = ssot.dictionary.tables.flatMap((t) => t.attributes).find((a) => a.id === attributeId);
  if (!attr) return [];
  const table = ssot.dictionary.tables.find((t) => t.attributes.some((a) => a.id === attributeId));
  const maps = ssot.mapping.filter((m) => m.sourceField === attr.sourceField && m.sourceDomain === table?.domainName);
  const canonical = ssot.canonical.entities.flatMap((e) =>
    e.attributes.filter((a) => maps.some((m) => m.canonicalEntity === e.name && m.canonicalAttribute === a.name)),
  );
  const onto = ssot.ontology.entities.flatMap((e) =>
    e.attributes.filter((a) => a.canonicalRef && canonical.some((c) => a.canonicalRef?.endsWith(`.${c.name}`))),
  );
  const contracts = ssot.contracts.flatMap((c) =>
    c.fields.filter((f) => f.dictionaryAttributeId === attr.id || onto.some((o) => o.name === f.name)),
  );
  return [
    { stage: "Customer Source Field", value: attr.sourceField, refs: attr.sourceRefs },
    { stage: "Data Inventory", value: table?.domainName, refs: attr.sourceRefs },
    { stage: "Data Dictionary Attribute", value: `${table?.domainName}.${attr.name}`, refs: [{ note: attr.status }] },
    { stage: "Mapping", value: maps.map((m) => `${m.canonicalEntity}.${m.canonicalAttribute}`).join(", ") },
    { stage: "Canonical Attribute", value: canonical.map((c) => c.name).join(", ") },
    { stage: "Ontology Attribute", value: onto.map((o) => o.name).join(", ") },
    { stage: "OWL Property", value: onto.map((o) => o.name).join(", ") },
    { stage: "API / Contract Field", value: contracts.map((c) => c.name).join(", ") },
  ];
}
