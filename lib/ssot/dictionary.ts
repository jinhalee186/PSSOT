import type { DictionaryAttribute, DictionaryTable, ProjectSSOT } from "./types";
import { attributeFromColumn } from "./infer";
import { enqueueImpact, recordChange } from "./domain-registry";
import { id } from "./util";
import { parseUploadedFile, type ParsedTable } from "./intake";
import { readFile } from "fs/promises";
import { uploadsDir } from "./store";
import path from "path";

const AFFECTED = [
  "04_DATA_MAPPING",
  "05_CANONICAL_MODEL",
  "06_ONTOLOGY",
  "07_DATA_CONTRACT",
  "11_DATA_PROFILING",
];

export async function loadParsedAssets(ssot: ProjectSSOT): Promise<Map<string, ParsedTable>> {
  const map = new Map<string, ParsedTable>();
  for (const asset of ssot.inventory.assets) {
    if (!asset.fileName) continue;
    try {
      const buf = await readFile(path.join(uploadsDir(ssot.id), asset.fileName));
      const tables = parseUploadedFile(asset.fileName, buf);
      const match =
        tables.find((t) => t.sheetName && asset.dataAsset.includes(t.sheetName)) ?? tables[0];
      if (match) map.set(asset.id, match);
    } catch {
      /* missing upload is acceptable */
    }
  }
  return map;
}

export async function generateDictionary(ssot: ProjectSSOT, actor = "system"): Promise<ProjectSSOT> {
  const parsed = await loadParsedAssets(ssot);
  const tables: DictionaryTable[] = [];

  for (const domain of ssot.domainRegistry.domains.filter((d) => d.status === "ACTIVE")) {
    const existing = ssot.dictionary.tables.find((t) => t.domainId === domain.id);
    const attrs: DictionaryAttribute[] = existing ? [...existing.attributes] : [];
    const known = new Set(attrs.map((a) => a.name.toLowerCase()));

    for (const asset of ssot.inventory.assets.filter((a) => domain.sourceAssetIds.includes(a.id))) {
      const table = parsed.get(asset.id);
      const columns = table?.columns ?? asset.columns ?? [];
      for (const col of columns) {
        if (known.has(col.toLowerCase())) continue;
        const values = table ? table.rows.map((r) => r[col] ?? "") : [];
        const proposed = attributeFromColumn(domain, asset, col, values);
        attrs.push({ id: id("attr"), ...proposed });
        known.add(col.toLowerCase());
      }
    }

    tables.push({ domainId: domain.id, domainName: domain.name, attributes: attrs });
  }

  recordChange(ssot, "dictionary", ssot.id, actor, ssot.dictionary, tables, "regenerate dictionary");
  ssot.dictionary = { tables };
  enqueueImpact(ssot, "Data Dictionary regenerated", "03_DATA_DICTIONARY", AFFECTED);
  return ssot;
}

export function patchAttribute(
  ssot: ProjectSSOT,
  attributeId: string,
  patch: Partial<DictionaryAttribute>,
  actor: string,
): ProjectSSOT {
  for (const table of ssot.dictionary.tables) {
    const idx = table.attributes.findIndex((a) => a.id === attributeId);
    if (idx === -1) continue;
    const prev = table.attributes[idx];
    const next: DictionaryAttribute = {
      ...prev,
      ...patch,
      provenance: {
        ...prev.provenance,
        ...patch.provenance,
        source: actor === "system" ? prev.provenance.source : "user_modified",
        lastModifiedBy: actor,
        lastModifiedAt: new Date().toISOString(),
        userApproved: patch.status === "APPROVED" ? true : prev.provenance.userApproved,
        aiSuggestion: prev.provenance.aiSuggestion,
      },
    };
    table.attributes[idx] = next;
    recordChange(ssot, "dictionary_attribute", attributeId, actor, prev, next);
    enqueueImpact(ssot, "Dictionary attribute changed", `${table.domainName}.${next.name}`, AFFECTED);
  }
  return ssot;
}

export function addAttribute(
  ssot: ProjectSSOT,
  domainId: string,
  attr: Omit<DictionaryAttribute, "id" | "domainId" | "provenance" | "status" | "sourceRefs"> & {
    sourceRefs?: DictionaryAttribute["sourceRefs"];
  },
  actor: string,
) {
  const table = ssot.dictionary.tables.find((t) => t.domainId === domainId);
  if (!table) return ssot;
  const created: DictionaryAttribute = {
    ...attr,
    id: id("attr"),
    domainId,
    synonyms: attr.synonyms ?? [],
    sampleValues: attr.sampleValues ?? [],
    sourceRefs: attr.sourceRefs ?? [],
    provenance: {
      source: "user_entered",
      kind: "FACT",
      confidence: 1,
      aiSuggestion: false,
      userApproved: true,
      lastModifiedBy: actor,
      lastModifiedAt: new Date().toISOString(),
    },
    status: "USER_MODIFIED",
  };
  table.attributes.push(created);
  recordChange(ssot, "dictionary_attribute", created.id, actor, undefined, created, "add");
  enqueueImpact(ssot, "Dictionary attribute added", `${table.domainName}.${created.name}`, AFFECTED);
  return ssot;
}

export function deleteAttribute(ssot: ProjectSSOT, attributeId: string, actor: string) {
  for (const table of ssot.dictionary.tables) {
    const prev = table.attributes.find((a) => a.id === attributeId);
    if (!prev) continue;
    table.attributes = table.attributes.filter((a) => a.id !== attributeId);
    recordChange(ssot, "dictionary_attribute", attributeId, actor, prev, undefined, "delete");
    enqueueImpact(ssot, "Dictionary attribute deleted", `${table.domainName}.${prev.name}`, AFFECTED);
  }
  return ssot;
}
