import type { OntologyModel, ProjectSSOT, ValidationIssue } from "./types";
import { id } from "./util";

export function validateOntology(model: OntologyModel): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const entities = model.entities;
  const byId = new Map(entities.map((e) => [e.id, e]));
  const names = new Map<string, string[]>();

  for (const e of entities) {
    const key = e.name.toLowerCase();
    names.set(key, [...(names.get(key) ?? []), e.id]);
    if (!e.description?.trim()) {
      issues.push(issue("warning", "missing_description", `Entity ${e.name} has no description.`, e.id));
    }
    if (e.parentEntityId && !byId.has(e.parentEntityId)) {
      issues.push(issue("error", "undefined_entity_ref", `${e.name} parent_entity_id is undefined.`, e.id));
    }
    for (const a of e.attributes) {
      if (a.entityId !== e.id) {
        issues.push(
          issue("error", "invalid_attribute_ref", `Attribute ${a.name} entityId does not match ${e.name}.`, e.id, undefined, a.id),
        );
      }
    }
  }

  for (const [name, ids] of names) {
    if (ids.length > 1) {
      issues.push(issue("error", "duplicate_entities", `Duplicate entity name "${name}".`, ids[0]));
    }
  }

  const relKeys = new Map<string, string[]>();
  for (const r of model.relationships) {
    if (!byId.has(r.sourceEntityId) || !byId.has(r.targetEntityId)) {
      issues.push(
        issue("error", "broken_relationship", `Relationship ${r.name} points to a missing entity.`, undefined, r.id),
      );
    }
    const key = `${r.sourceEntityId}|${r.name}|${r.targetEntityId}`;
    relKeys.set(key, [...(relKeys.get(key) ?? []), r.id]);
    if (!["0..1", "1", "1..1", "0..*", "1..*", "*"].includes(r.cardinality)) {
      issues.push(issue("warning", "invalid_cardinality", `Unusual cardinality "${r.cardinality}" on ${r.name}.`, undefined, r.id));
    }
    if (!["forward", "bidirectional"].includes(r.direction)) {
      issues.push(issue("error", "inconsistent_direction", `Invalid direction on ${r.name}.`, undefined, r.id));
    }
  }
  for (const [, ids] of relKeys) {
    if (ids.length > 1) {
      issues.push(issue("error", "duplicate_relationships", "Duplicate relationship detected.", undefined, ids[0]));
    }
  }

  const children = new Map<string, string[]>();
  for (const e of entities) {
    if (e.parentEntityId) {
      children.set(e.parentEntityId, [...(children.get(e.parentEntityId) ?? []), e.id]);
    }
  }
  for (const e of entities) {
    if (hasCycle(e.id, children, new Set())) {
      issues.push(issue("error", "circular_hierarchy", `Circular hierarchy involving ${e.name}.`, e.id));
      break;
    }
  }

  const related = new Set<string>();
  for (const r of model.relationships) {
    related.add(r.sourceEntityId);
    related.add(r.targetEntityId);
  }
  for (const e of entities) {
    if (entities.length > 1 && !related.has(e.id) && !e.parentEntityId) {
      issues.push(issue("info", "orphan_entities", `${e.name} has no relationships.`, e.id));
    }
  }

  const owl = generateOwl({ ...model, validationIssues: [] }, "urn:check");
  if (!owl.includes("<owl:Ontology") && entities.length) {
    issues.push(issue("error", "owl_syntax", "OWL generation produced an empty ontology."));
  }

  return issues;
}

function hasCycle(start: string, children: Map<string, string[]>, stack: Set<string>): boolean {
  if (stack.has(start)) return true;
  stack.add(start);
  for (const c of children.get(start) ?? []) {
    if (hasCycle(c, children, stack)) return true;
  }
  stack.delete(start);
  return false;
}

function issue(
  severity: ValidationIssue["severity"],
  rule: string,
  message: string,
  entityId?: string,
  relationshipId?: string,
  attributeId?: string,
): ValidationIssue {
  return {
    id: id("iss"),
    entityId,
    relationshipId,
    attributeId,
    severity,
    rule,
    message,
    resolutionStatus: "open",
  };
}

export function applyValidation(ssot: ProjectSSOT): ProjectSSOT {
  ssot.ontology.validationIssues = validateOntology(ssot.ontology);
  const blocking = ssot.ontology.validationIssues.filter((i) => i.severity === "error");
  if (blocking.length === 0 && ssot.ontology.entities.length) {
    if (ssot.ontology.metadata.status === "PENDING_REVIEW" || ssot.ontology.metadata.status === "USER_MODIFIED") {
      ssot.ontology.metadata.status = "VALIDATED";
    }
  }
  return ssot;
}

export function generateOwl(model: OntologyModel, baseIri: string): string {
  const iri = baseIri.replace(/\/$/, "");
  const classes = model.entities
    .map((e) => {
      const parent = e.parentEntityId
        ? model.entities.find((p) => p.id === e.parentEntityId)
        : undefined;
      const eq = e.synonyms
        .map((s) => `    <owl:equivalentClass rdf:resource="${iri}#${esc(s)}" />`)
        .join("\n");
      return `  <owl:Class rdf:about="${iri}#${esc(e.name)}">
    <rdfs:label>${xml(e.label)}</rdfs:label>
    <rdfs:comment>${xml(e.description)}</rdfs:comment>
    <skos:note>status=${e.status}</skos:note>
${parent ? `    <rdfs:subClassOf rdf:resource="${iri}#${esc(parent.name)}" />` : ""}
${eq}
  </owl:Class>`;
    })
    .join("\n\n");

  const objectProps = model.relationships
    .map((r) => {
      const src = model.entities.find((e) => e.id === r.sourceEntityId);
      const tgt = model.entities.find((e) => e.id === r.targetEntityId);
      if (!src || !tgt) return "";
      const card = cardinalityRestriction(iri, r.name, tgt.name, r.cardinality);
      return `  <owl:ObjectProperty rdf:about="${iri}#${esc(r.name)}">
    <rdfs:label>${xml(r.label)}</rdfs:label>
    <rdfs:comment>${xml(r.description)}</rdfs:comment>
    <rdfs:domain rdf:resource="${iri}#${esc(src.name)}" />
    <rdfs:range rdf:resource="${iri}#${esc(tgt.name)}" />
  </owl:ObjectProperty>${card}`;
    })
    .join("\n\n");

  const dataProps = model.entities
    .flatMap((e) =>
      e.attributes.map((a) => {
        return `  <owl:DatatypeProperty rdf:about="${iri}#${esc(e.name)}_${esc(a.name)}">
    <rdfs:label>${xml(a.label)}</rdfs:label>
    <rdfs:comment>${xml(a.description)}</rdfs:comment>
    <rdfs:domain rdf:resource="${iri}#${esc(e.name)}" />
    <rdfs:range rdf:resource="${xsd(a.dataType)}" />
  </owl:DatatypeProperty>`;
      }),
    )
    .join("\n\n");

  return `<?xml version="1.0"?>
<rdf:RDF
  xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
  xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#"
  xmlns:owl="http://www.w3.org/2002/07/owl#"
  xmlns:xsd="http://www.w3.org/2001/XMLSchema#"
  xmlns:skos="http://www.w3.org/2004/02/skos/core#"
  xmlns:dc="http://purl.org/dc/elements/1.1#"
  xml:base="${iri}">
  <owl:Ontology rdf:about="${iri}">
    <dc:title>${xml(model.metadata.ontologyId)}</dc:title>
    <owl:versionInfo>${model.metadata.version}</owl:versionInfo>
    <rdfs:comment>Generated view of the Ontology Internal Model. Not an independent source of truth.</rdfs:comment>
  </owl:Ontology>

${classes}

${objectProps}

${dataProps}
</rdf:RDF>
`;
}

function cardinalityRestriction(iri: string, prop: string, target: string, card: string): string {
  if (card === "1" || card === "1..1") {
    return `
  <owl:Class rdf:about="${iri}#${esc(target)}">
    <rdfs:subClassOf>
      <owl:Restriction>
        <owl:onProperty rdf:resource="${iri}#${esc(prop)}" />
        <owl:qualifiedCardinality rdf:datatype="http://www.w3.org/2001/XMLSchema#nonNegativeInteger">1</owl:qualifiedCardinality>
        <owl:onClass rdf:resource="${iri}#${esc(target)}" />
      </owl:Restriction>
    </rdfs:subClassOf>
  </owl:Class>`;
  }
  return "";
}

function esc(value: string) {
  return value.replace(/[^A-Za-z0-9_]/g, "_");
}

function xml(value: string) {
  return (value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function xsd(type: string) {
  switch (type) {
    case "Integer":
      return "http://www.w3.org/2001/XMLSchema#integer";
    case "Decimal":
      return "http://www.w3.org/2001/XMLSchema#decimal";
    case "Boolean":
      return "http://www.w3.org/2001/XMLSchema#boolean";
    case "Date":
      return "http://www.w3.org/2001/XMLSchema#dateTime";
    default:
      return "http://www.w3.org/2001/XMLSchema#string";
  }
}

export function generateTurtle(model: OntologyModel, baseIri: string): string {
  const iri = baseIri.replace(/\/$/, "");
  const lines = [
    `@prefix : <${iri}#> .`,
    `@prefix owl: <http://www.w3.org/2002/07/owl#> .`,
    `@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .`,
    `@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .`,
    "",
    `<${iri}> a owl:Ontology ; owl:versionInfo "${model.metadata.version}" .`,
    "",
  ];
  for (const e of model.entities) {
    lines.push(`:${esc(e.name)} a owl:Class ; rdfs:label "${e.label}" ; rdfs:comment "${e.description.replace(/"/g, "'")}" .`);
  }
  for (const r of model.relationships) {
    const src = model.entities.find((e) => e.id === r.sourceEntityId);
    const tgt = model.entities.find((e) => e.id === r.targetEntityId);
    if (!src || !tgt) continue;
    lines.push(
      `:${esc(r.name)} a owl:ObjectProperty ; rdfs:label "${r.label}" ; rdfs:domain :${esc(src.name)} ; rdfs:range :${esc(tgt.name)} .`,
    );
  }
  return lines.join("\n");
}
