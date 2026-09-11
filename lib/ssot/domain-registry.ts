import type {
  DomainRecord,
  ImpactItem,
  ProjectSSOT,
  VersionEntry,
} from "./types";
import { id, nowIso, slugify, unique } from "./util";

const DOWNSTREAM = [
  "03_DATA_DICTIONARY",
  "04_DATA_MAPPING",
  "05_CANONICAL_MODEL",
  "06_ONTOLOGY",
  "07_DATA_CONTRACT",
  "08_SYSTEM_INVENTORY",
  "10_SAMPLE_DATA",
  "11_DATA_PROFILING",
  "Customer Data Package",
];

export function syncDomainRegistry(ssot: ProjectSSOT, actor = "system"): ProjectSSOT {
  const names = unique(ssot.inventory.assets.map((a) => a.domain.trim()).filter(Boolean));
  const existing = new Map(ssot.domainRegistry.domains.map((d) => [d.slug, d]));
  const next: DomainRecord[] = [];

  for (const name of names) {
    const slug = slugify(name);
    const assets = ssot.inventory.assets.filter((a) => slugify(a.domain) === slug);
    const prev = existing.get(slug);
    if (prev) {
      next.push({
        ...prev,
        name,
        description: prev.description || `${name} domain derived from Data Inventory.`,
        status: prev.status === "ARCHIVED" ? "ACTIVE" : prev.status === "DEPRECATED" ? "ACTIVE" : prev.status,
        sourceAssetIds: assets.map((a) => a.id),
        lineage: `DATA_INVENTORY → ${assets.map((a) => a.dataAsset).join(", ")}`,
        updatedAt: nowIso(),
        affectedArtifacts: DOWNSTREAM,
      });
      existing.delete(slug);
    } else {
      const record: DomainRecord = {
        id: id("dom"),
        name,
        slug,
        description: `${name} domain discovered from Data Inventory.`,
        status: "ACTIVE",
        version: 1,
        sourceAssetIds: assets.map((a) => a.id),
        lineage: `DATA_INVENTORY → ${assets.map((a) => a.dataAsset).join(", ")}`,
        createdAt: nowIso(),
        updatedAt: nowIso(),
        history: [],
        affectedArtifacts: DOWNSTREAM,
      };
      record.history.push(history("create", record, actor, undefined, { id: record.id, name: record.name, status: record.status }));
      next.push(record);
      enqueueImpact(ssot, "Domain added", record.name, DOWNSTREAM);
    }
  }

  for (const leftover of existing.values()) {
    if (leftover.status === "ARCHIVED") {
      next.push(leftover);
      continue;
    }
    leftover.status = "DEPRECATED";
    leftover.updatedAt = nowIso();
    leftover.version += 1;
    leftover.history.push(
      history("deprecate", leftover, actor, "ACTIVE", "DEPRECATED"),
    );
    leftover.affectedArtifacts = DOWNSTREAM;
    next.push(leftover);
    enqueueImpact(ssot, "Domain deprecated", leftover.name, DOWNSTREAM);
  }

  ssot.domainRegistry = {
    domains: next,
    derivedFromInventoryVersion: ssot.version,
  };
  return ssot;
}

function history(
  reason: string,
  domain: DomainRecord,
  actor: string,
  previous: unknown,
  next: unknown,
): VersionEntry {
  return {
    id: id("ver"),
    version: domain.version,
    timestamp: nowIso(),
    actor,
    changeSource: actor === "system" ? "system_generated" : "user_entered",
    targetType: "domain",
    targetId: domain.id,
    previousValue: previous,
    newValue: next,
    reason,
  };
}

export function enqueueImpact(
  ssot: ProjectSSOT,
  changedType: string,
  changedLabel: string,
  affected: string[],
) {
  const item: ImpactItem = {
    id: id("imp"),
    createdAt: nowIso(),
    changedType,
    changedId: changedLabel,
    changedLabel,
    affected,
    acknowledged: false,
    regenerated: false,
  };
  ssot.impactQueue.unshift(item);
  ssot.impactQueue = ssot.impactQueue.slice(0, 50);
}

export function recordChange(
  ssot: ProjectSSOT,
  targetType: string,
  targetId: string,
  actor: string,
  previous: unknown,
  next: unknown,
  reason?: string,
) {
  ssot.versions.unshift({
    id: id("ver"),
    version: ssot.version + 1,
    timestamp: nowIso(),
    actor,
    changeSource: actor === "system" ? "system_generated" : "user_modified",
    targetType,
    targetId,
    previousValue: previous,
    newValue: next,
    reason,
  });
  ssot.versions = ssot.versions.slice(0, 200);
}
