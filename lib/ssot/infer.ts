import type {
  DictionaryAttribute,
  DomainRecord,
  InventoryAsset,
  ProfileColumn,
} from "./types";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}/;
const INT = /^-?\d+$/;
const DECIMAL = /^-?\d+\.\d+$/;
const BOOL = /^(true|false|yes|no|0|1)$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const URL = /^https?:\/\//i;

export function inferType(values: string[]): { type: string; format?: string; confidence: number } {
  const nonEmpty = values.filter((v) => v !== "").slice(0, 200);
  if (!nonEmpty.length) return { type: "String", confidence: 0.3 };
  const ratio = (pred: (v: string) => boolean) =>
    nonEmpty.filter(pred).length / nonEmpty.length;

  if (ratio((v) => UUID.test(v)) > 0.8) return { type: "String", format: "uuid", confidence: 0.95 };
  if (ratio((v) => EMAIL.test(v)) > 0.8) return { type: "String", format: "email", confidence: 0.95 };
  if (ratio((v) => URL.test(v)) > 0.8) return { type: "String", format: "uri", confidence: 0.9 };
  if (ratio((v) => BOOL.test(v)) > 0.9) return { type: "Boolean", confidence: 0.9 };
  if (ratio((v) => ISO_DATE.test(v)) > 0.7) return { type: "Date", format: "ISO-8601", confidence: 0.88 };
  if (ratio((v) => DECIMAL.test(v)) > 0.8) return { type: "Decimal", confidence: 0.9 };
  if (ratio((v) => INT.test(v)) > 0.9) return { type: "Integer", confidence: 0.9 };
  return { type: "String", confidence: 0.7 };
}

export function inferRequired(values: string[]): boolean {
  if (!values.length) return false;
  const empty = values.filter((v) => v === "").length;
  return empty / values.length < 0.05;
}

export function profileColumn(name: string, values: string[]): ProfileColumn {
  const nonEmpty = values.filter((v) => v !== "");
  const inferred = inferType(values);
  const nums = nonEmpty.filter((v) => /^-?\d+(\.\d+)?$/.test(v)).map(Number);
  return {
    name,
    inferredType: inferred.type,
    nullRate: values.length ? (values.length - nonEmpty.length) / values.length : 1,
    distinctCount: new Set(nonEmpty).size,
    min: nums.length ? String(Math.min(...nums)) : nonEmpty.sort()[0],
    max: nums.length ? String(Math.max(...nums)) : nonEmpty.sort().at(-1),
    samples: [...new Set(nonEmpty)].slice(0, 8),
  };
}

export function describeField(name: string, domain: string, type: string): string {
  const pretty = name.replace(/[_-]+/g, " ");
  if (/_id$|^id$/i.test(name)) return `Identifier for ${domain.toLowerCase()} (${pretty}).`;
  if (/date|time|_at$/i.test(name)) return `Timestamp or date for ${pretty} on ${domain.toLowerCase()}.`;
  if (/email/i.test(name)) return `Email address associated with ${domain.toLowerCase()}.`;
  if (/name|title/i.test(name)) return `Display name for ${domain.toLowerCase()}.`;
  if (/price|amount|cost|revenue/i.test(name)) return `Numeric ${pretty} for ${domain.toLowerCase()}.`;
  if (/status|state/i.test(name)) return `Lifecycle or status value for ${domain.toLowerCase()}.`;
  return `${type} field ${pretty} belonging to ${domain}.`;
}

export function semanticMeaning(name: string): string {
  if (/_id$|^id$/i.test(name)) return "identifier";
  if (/email/i.test(name)) return "contact.email";
  if (/name/i.test(name)) return "label";
  if (/price|amount/i.test(name)) return "measure.money";
  if (/date|_at$/i.test(name)) return "time.instant";
  if (/status/i.test(name)) return "lifecycle.status";
  return "attribute";
}

export function possibleCanonical(name: string, domain: string): string {
  const n = name.toLowerCase();
  if (n === "id" || n === `${domain.toLowerCase()}_id` || n.endsWith("_id")) {
    return `${toPascal(domain)}.id`;
  }
  return `${toPascal(domain)}.${camel(name)}`;
}

export function possibleSynonyms(name: string): string[] {
  const synonyms: string[] = [];
  if (name.endsWith("_id") || name === "id") synonyms.push("identifier", "key");
  if (/name/i.test(name)) synonyms.push("title", "label");
  if (/created/i.test(name)) synonyms.push("create_date", "created_at");
  return synonyms;
}

export function toPascal(value: string): string {
  return value
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
}

export function camel(value: string): string {
  const p = toPascal(value);
  return p.charAt(0).toLowerCase() + p.slice(1);
}

export function fkTarget(field: string, domains: DomainRecord[]): string | undefined {
  const m = field.toLowerCase().match(/^(.+)_id$/);
  if (!m) return undefined;
  const stem = m[1].replace(/_/g, "");
  return domains.find((d) => d.slug.replace(/-/g, "") === stem || d.name.toLowerCase().replace(/\s+/g, "") === stem)
    ?.name;
}

export function assetDomainKey(asset: InventoryAsset): string {
  return asset.domain.trim() || "Unspecified";
}

export function attributeFromColumn(
  domain: DomainRecord,
  asset: InventoryAsset,
  column: string,
  values: string[],
): Omit<DictionaryAttribute, "id"> {
  const inferred = inferType(values);
  const samples = [...new Set(values.filter(Boolean))].slice(0, 6);
  const required = inferRequired(values);
  return {
    domainId: domain.id,
    name: column,
    label: column.replace(/[_-]+/g, " "),
    description: describeField(column, domain.name, inferred.type),
    dataType: inferred.type,
    sourceField: column,
    sourceSystem: asset.sourceSystem,
    sampleValues: samples,
    required,
    nullable: !required,
    format: inferred.format,
    semanticMeaning: semanticMeaning(column),
    canonicalMapping: possibleCanonical(column, domain.name),
    synonyms: possibleSynonyms(column),
    provenance: {
      source: "ai_inferred",
      kind: "INFERENCE",
      confidence: inferred.confidence,
      aiSuggestion: true,
      userApproved: false,
      lastModifiedBy: "system",
      lastModifiedAt: new Date().toISOString(),
    },
    status: "AI_GENERATED",
    sourceRefs: [
      {
        inventoryAssetId: asset.id,
        sourceSystem: asset.sourceSystem,
        sourceField: column,
        fileName: asset.fileName,
      },
    ],
  };
}
