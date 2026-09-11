import type {
  OntologyAttribute,
  OntologyEntity,
  OntologyModel,
  OntologyRelationship,
  ProjectSSOT,
  Provenance,
} from "./types";
import { emptyProvenance } from "./types";
import { suggestedRelationships } from "./canonical";
import { enqueueImpact, recordChange } from "./domain-registry";
import { id, nowIso } from "./util";
import { applyValidation } from "./validate-owl";

function inferProv(confidence: number): Provenance {
  return {
    ...emptyProvenance("ai_generated", "INFERENCE"),
    confidence,
  };
}

const LOCKED = new Set(["USER_MODIFIED", "APPROVED", "VALIDATED"]);

function makeAttribute(entityId: string, entName: string, attr: { name: string; description: string; dataType: string; required: boolean; confidence: number }): OntologyAttribute {
  return {
    id: id("oattr"),
    entityId,
    name: attr.name,
    label: attr.name,
    description: attr.description,
    dataType: attr.dataType,
    required: attr.required,
    nullable: !attr.required,
    sourceRefs: [],
    canonicalRef: `${entName}.${attr.name}`,
    synonyms: [],
    confidence: attr.confidence,
    provenance: inferProv(attr.confidence),
    status: "AI_GENERATED",
  };
}

export function generateOntologyFromSSOT(ssot: ProjectSSOT, actor = "system"): ProjectSSOT {
  const prev = ssot.ontology;
  const prevByName = new Map(prev.entities.map((e) => [e.name.toLowerCase(), e]));

  const entities: OntologyEntity[] = ssot.canonical.entities.map((ent) => {
    const existing = prevByName.get(ent.name.toLowerCase());
    const entityId = existing?.id ?? id("ent");
    const proposed = ent.attributes.map((attr) => makeAttribute(entityId, ent.name, attr));

    if (existing && LOCKED.has(existing.status)) {
      const known = new Set(existing.attributes.map((a) => a.name.toLowerCase()));
      const merged = [
        ...existing.attributes,
        ...proposed.filter((a) => !known.has(a.name.toLowerCase())),
      ];
      return {
        ...existing,
        id: entityId,
        attributes: merged,
        canonicalRefs: [...new Set([...existing.canonicalRefs, ent.id])],
        description: existing.description || ent.description,
      };
    }

    return {
      id: entityId,
      name: ent.name,
      label: existing?.label ?? ent.name,
      description: existing?.description || ent.description,
      type: "class" as const,
      parentEntityId: existing?.parentEntityId,
      attributes: proposed.map((a) => {
        const prior = existing?.attributes.find((x) => x.name.toLowerCase() === a.name.toLowerCase());
        if (prior && LOCKED.has(prior.status)) return { ...prior, entityId };
        return a;
      }),
      sourceRefs: existing?.sourceRefs ?? [],
      canonicalRefs: [ent.id],
      synonyms: existing?.synonyms ?? [],
      status: "AI_GENERATED" as const,
      metadata: { origin: "canonical_model" },
    };
  });

  for (const leftover of prev.entities) {
    if (LOCKED.has(leftover.status) && !entities.some((e) => e.id === leftover.id)) {
      entities.push(leftover);
    }
  }

  const byName = new Map(entities.map((e) => [e.name, e]));
  const relationships: OntologyRelationship[] = prev.relationships.filter((r) => {
    const src = entities.some((e) => e.id === r.sourceEntityId);
    const tgt = entities.some((e) => e.id === r.targetEntityId);
    return src && tgt && LOCKED.has(r.status);
  });

  for (const rel of suggestedRelationships(ssot)) {
    const source = byName.get(rel.from);
    const target = byName.get(rel.to);
    if (!source || !target) continue;
    const dup = relationships.some(
      (r) => r.sourceEntityId === source.id && r.targetEntityId === target.id && r.name === rel.name,
    );
    if (dup) continue;
    relationships.push({
      id: id("rel"),
      name: rel.name,
      label: rel.name.replace(/([A-Z])/g, " $1").trim(),
      description: `${rel.from} relates to ${rel.to} (inferred from foreign-key style fields).`,
      sourceEntityId: source.id,
      targetEntityId: target.id,
      relationshipType: "object_property",
      direction: "forward",
      cardinality: "0..*",
      sourceRefs: [],
      confidence: rel.confidence,
      provenance: inferProv(rel.confidence),
      status: "AI_GENERATED",
      metadata: {},
    });
  }

  const model: OntologyModel = {
    entities,
    relationships,
    metadata: {
      ontologyId: prev.metadata.ontologyId,
      version: prev.metadata.version + 1,
      status: "PENDING_REVIEW",
      createdAt: prev.metadata.createdAt,
      updatedAt: nowIso(),
      provenance: emptyProvenance("ai_generated", "INFERENCE", actor),
    },
    validationIssues: [],
  };

  recordChange(ssot, "ontology", model.metadata.ontologyId, actor, ssot.ontology, model, "generate");
  ssot.ontology = model;
  enqueueImpact(ssot, "Ontology regenerated", "06_ONTOLOGY", [
    "OWL",
    "Graph",
    "07_DATA_CONTRACT",
    "Ontology Documentation",
  ]);
  return ssot;
}

export function upsertEntity(ssot: ProjectSSOT, entity: Partial<OntologyEntity> & { id?: string }, actor: string) {
  const list = ssot.ontology.entities;
  if (entity.id) {
    const i = list.findIndex((e) => e.id === entity.id);
    if (i >= 0) {
      const prev = list[i];
      list[i] = {
        ...prev,
        ...entity,
        status: entity.status ?? "USER_MODIFIED",
        attributes: entity.attributes ?? prev.attributes,
      };
      recordChange(ssot, "ontology_entity", prev.id, actor, prev, list[i]);
    }
  } else {
    const created: OntologyEntity = {
      id: id("ent"),
      name: entity.name ?? "NewEntity",
      label: entity.label ?? entity.name ?? "New Entity",
      description: entity.description ?? "",
      type: entity.type ?? "class",
      parentEntityId: entity.parentEntityId,
      attributes: entity.attributes ?? [],
      sourceRefs: [],
      canonicalRefs: [],
      synonyms: entity.synonyms ?? [],
      status: "USER_MODIFIED",
      metadata: {},
    };
    list.push(created);
    recordChange(ssot, "ontology_entity", created.id, actor, undefined, created, "add");
  }
  bumpOntology(ssot);
  return ssot;
}

export function deleteEntity(ssot: ProjectSSOT, entityId: string, actor: string) {
  const prev = ssot.ontology.entities.find((e) => e.id === entityId);
  ssot.ontology.entities = ssot.ontology.entities.filter((e) => e.id !== entityId);
  ssot.ontology.relationships = ssot.ontology.relationships.filter(
    (r) => r.sourceEntityId !== entityId && r.targetEntityId !== entityId,
  );
  recordChange(ssot, "ontology_entity", entityId, actor, prev, undefined, "delete");
  bumpOntology(ssot);
  return ssot;
}

export function upsertRelationship(
  ssot: ProjectSSOT,
  rel: Partial<OntologyRelationship> & { id?: string },
  actor: string,
) {
  const list = ssot.ontology.relationships;
  if (rel.id) {
    const i = list.findIndex((r) => r.id === rel.id);
    if (i >= 0) {
      const prev = list[i];
      list[i] = { ...prev, ...rel, status: rel.status ?? "USER_MODIFIED" };
      recordChange(ssot, "ontology_relationship", prev.id, actor, prev, list[i]);
    }
  } else if (rel.sourceEntityId && rel.targetEntityId) {
    const created: OntologyRelationship = {
      id: id("rel"),
      name: rel.name ?? "relatedTo",
      label: rel.label ?? rel.name ?? "related to",
      description: rel.description ?? "",
      sourceEntityId: rel.sourceEntityId,
      targetEntityId: rel.targetEntityId,
      relationshipType: rel.relationshipType ?? "object_property",
      direction: rel.direction ?? "forward",
      cardinality: rel.cardinality ?? "0..*",
      sourceRefs: [],
      confidence: 1,
      provenance: emptyProvenance("user_entered", "FACT", actor),
      status: "USER_MODIFIED",
      metadata: {},
    };
    list.push(created);
    recordChange(ssot, "ontology_relationship", created.id, actor, undefined, created, "add");
  }
  bumpOntology(ssot);
  return ssot;
}

export function deleteRelationship(ssot: ProjectSSOT, relationshipId: string, actor: string) {
  const prev = ssot.ontology.relationships.find((r) => r.id === relationshipId);
  ssot.ontology.relationships = ssot.ontology.relationships.filter((r) => r.id !== relationshipId);
  recordChange(ssot, "ontology_relationship", relationshipId, actor, prev, undefined, "delete");
  bumpOntology(ssot);
  return ssot;
}

export function upsertOntologyAttribute(
  ssot: ProjectSSOT,
  entityId: string,
  attr: Partial<OntologyAttribute> & { name?: string },
  actor: string,
) {
  const entity = ssot.ontology.entities.find((e) => e.id === entityId);
  if (!entity) return ssot;
  if (attr.id) {
    const i = entity.attributes.findIndex((a) => a.id === attr.id);
    if (i >= 0) {
      const prev = entity.attributes[i];
      entity.attributes[i] = { ...prev, ...attr, status: attr.status ?? "USER_MODIFIED" };
      recordChange(ssot, "ontology_attribute", prev.id, actor, prev, entity.attributes[i]);
    }
  } else if (attr.name) {
    const created: OntologyAttribute = {
      id: id("oattr"),
      entityId,
      name: attr.name,
      label: attr.label ?? attr.name,
      description: attr.description ?? "",
      dataType: attr.dataType ?? "String",
      required: Boolean(attr.required),
      nullable: attr.nullable ?? true,
      sourceRefs: [],
      synonyms: attr.synonyms ?? [],
      confidence: 1,
      provenance: emptyProvenance("user_entered", "FACT", actor),
      status: "USER_MODIFIED",
    };
    entity.attributes.push(created);
    recordChange(ssot, "ontology_attribute", created.id, actor, undefined, created, "add");
  }
  bumpOntology(ssot);
  return ssot;
}

export function deleteOntologyAttribute(ssot: ProjectSSOT, entityId: string, attributeId: string, actor: string) {
  const entity = ssot.ontology.entities.find((e) => e.id === entityId);
  if (!entity) return ssot;
  const prev = entity.attributes.find((a) => a.id === attributeId);
  entity.attributes = entity.attributes.filter((a) => a.id !== attributeId);
  recordChange(ssot, "ontology_attribute", attributeId, actor, prev, undefined, "delete");
  bumpOntology(ssot);
  return ssot;
}

function bumpOntology(ssot: ProjectSSOT) {
  ssot.ontology.metadata.version += 1;
  ssot.ontology.metadata.updatedAt = nowIso();
  ssot.ontology.metadata.status = "USER_MODIFIED";
  applyValidation(ssot);
  enqueueImpact(ssot, "Ontology model changed", "Ontology Model", [
    "Graph",
    "OWL",
    "07_DATA_CONTRACT",
    "Ontology Documentation",
  ]);
}
