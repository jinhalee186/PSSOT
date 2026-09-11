import type {
  CanonicalAttribute,
  CanonicalEntity,
  DataMappingRow,
  ProjectSSOT,
} from "./types";
import { camel, fkTarget, toPascal } from "./infer";
import { enqueueImpact, recordChange } from "./domain-registry";
import { id } from "./util";

export function generateMappingAndCanonical(ssot: ProjectSSOT, actor = "system"): ProjectSSOT {
  const mappings: DataMappingRow[] = [];
  const entities: CanonicalEntity[] = [];

  for (const table of ssot.dictionary.tables) {
    const domain = ssot.domainRegistry.domains.find((d) => d.id === table.domainId);
    if (!domain || domain.status !== "ACTIVE") continue;
    const entityName = toPascal(domain.name);
    const entityId = id("can");
    const attributes: CanonicalAttribute[] = [];

    for (const attr of table.attributes.filter((a) => a.status !== "REJECTED" && a.status !== "SUPERSEDED")) {
      const canonicalName = camel(attr.name.replace(new RegExp(`^${domain.slug}_`, "i"), ""));
      const mapId = id("map");
      mappings.push({
        id: mapId,
        sourceDomain: domain.name,
        sourceField: attr.sourceField || attr.name,
        canonicalEntity: entityName,
        canonicalAttribute: canonicalName,
        transform: attr.dataType === "Date" ? "parse_datetime" : "direct",
        confidence: attr.provenance.confidence,
        status: attr.status === "APPROVED" ? "VALIDATED" : "AI_GENERATED",
        sourceRefs: attr.sourceRefs,
      });
      attributes.push({
        id: id("cattr"),
        entityId,
        name: canonicalName,
        dataType: attr.dataType,
        description: attr.description,
        required: attr.required,
        sourceMappings: [mapId],
        confidence: attr.provenance.confidence,
        status: attr.status === "APPROVED" ? "VALIDATED" : "AI_GENERATED",
      });
    }

    entities.push({
      id: entityId,
      name: entityName,
      description: domain.description,
      attributes,
      status: "AI_GENERATED",
    });
  }

  recordChange(ssot, "canonical", ssot.id, actor, ssot.canonical, { entities });
  ssot.mapping = mappings;
  ssot.canonical = { entities };
  enqueueImpact(ssot, "Canonical model regenerated", "05_CANONICAL_MODEL", [
    "06_ONTOLOGY",
    "07_DATA_CONTRACT",
    "08_SYSTEM_INVENTORY",
  ]);
  return ssot;
}

export function suggestedRelationships(ssot: ProjectSSOT) {
  const suggestions: { from: string; to: string; name: string; confidence: number }[] = [];
  const domains = ssot.domainRegistry.domains.filter((d) => d.status === "ACTIVE");
  for (const table of ssot.dictionary.tables) {
    const from = domains.find((d) => d.id === table.domainId);
    if (!from) continue;
    for (const attr of table.attributes) {
      const target = fkTarget(attr.name, domains);
      if (target && target !== from.name) {
        suggestions.push({
          from: toPascal(from.name),
          to: toPascal(target),
          name: `has${toPascal(target)}`,
          confidence: 0.72,
        });
      }
    }
  }
  return suggestions;
}
