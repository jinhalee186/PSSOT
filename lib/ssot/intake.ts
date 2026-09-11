import Papa from "papaparse";
import * as XLSX from "xlsx";

export interface ParsedTable {
  fileName: string;
  sheetName?: string;
  columns: string[];
  rows: Record<string, string>[];
}

function cellsToRows(matrix: unknown[][]): { columns: string[]; rows: Record<string, string>[] } {
  if (!matrix.length) return { columns: [], rows: [] };
  const header = matrix[0].map((h, i) => String(h ?? `column_${i + 1}`).trim() || `column_${i + 1}`);
  const rows = matrix.slice(1).map((line) => {
    const rec: Record<string, string> = {};
    header.forEach((col, i) => {
      const v = line[i];
      rec[col] = v == null ? "" : String(v);
    });
    return rec;
  });
  return { columns: header, rows };
}

export function parseCsv(fileName: string, text: string): ParsedTable {
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });
  const columns = parsed.meta.fields ?? [];
  return { fileName, columns, rows: parsed.data };
}

export function parseWorkbook(fileName: string, buffer: Buffer): ParsedTable[] {
  const wb = XLSX.read(buffer, { type: "buffer" });
  return wb.SheetNames.map((sheetName) => {
    const sheet = wb.Sheets[sheetName];
    const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });
    const { columns, rows } = cellsToRows(matrix);
    return { fileName, sheetName, columns, rows };
  });
}

export function parseUploadedFile(fileName: string, buffer: Buffer): ParsedTable[] {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".csv") || lower.endsWith(".tsv")) {
    const text = buffer.toString("utf8");
    return [parseCsv(fileName, text)];
  }
  if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
    return parseWorkbook(fileName, buffer);
  }
  if (lower.endsWith(".json")) {
    const data = JSON.parse(buffer.toString("utf8"));
    const arr = Array.isArray(data) ? data : data.records ?? data.rows ?? [];
    if (!Array.isArray(arr) || !arr.length) {
      return [{ fileName, columns: [], rows: [] }];
    }
    const columns = Object.keys(arr[0] as object);
    const rows = arr.map((row: Record<string, unknown>) => {
      const rec: Record<string, string> = {};
      columns.forEach((c) => {
        rec[c] = row[c] == null ? "" : String(row[c]);
      });
      return rec;
    });
    return [{ fileName, columns, rows }];
  }
  return [{ fileName, columns: [], rows: [] }];
}

export function guessDomainFromFile(fileName: string, sheetName?: string): string {
  const base = (sheetName || fileName).replace(/\.[^.]+$/, "");
  const cleaned = base.replace(/[_-]+/g, " ").trim();
  if (!cleaned) return "Unspecified";
  return cleaned.replace(/\b\w/g, (c) => c.toUpperCase());
}

function normalizeHeader(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

export function isInventoryTable(columns: string[]): boolean {
  const n = columns.map(normalizeHeader);
  const hasDomain = n.includes("domain");
  const hasAsset = n.some((c) =>
    ["data_asset", "dataasset", "asset", "asset_name", "dataset"].includes(c),
  );
  return hasDomain && hasAsset;
}

function cell(row: Record<string, string>, aliases: string[]): string {
  const map = new Map(Object.keys(row).map((k) => [normalizeHeader(k), row[k]]));
  for (const alias of aliases) {
    const v = map.get(alias);
    if (v != null && String(v).trim()) return String(v).trim();
  }
  return "";
}

export interface InventoryDraft {
  domain: string;
  dataAsset: string;
  description: string;
  sourceSystem: string;
  dataOwner: string;
  format: string;
  volume: string;
  frequency: string;
  accessMethod: string;
  apiAvailability: string;
  required: boolean;
  status: "ACTIVE" | "OPTIONAL" | "UNKNOWN";
  notes: string;
}

export function inventoryDraftsFromTable(table: ParsedTable): InventoryDraft[] {
  const drafts: InventoryDraft[] = [];
  for (const row of table.rows) {
    const domain = cell(row, ["domain"]);
    const dataAsset = cell(row, ["data_asset", "dataasset", "asset", "asset_name", "dataset"]);
    if (!domain && !dataAsset) continue;
    const requiredRaw = cell(row, ["required", "required_optional", "optional"]).toLowerCase();
    drafts.push({
      domain: domain || "Unspecified",
      dataAsset: dataAsset || domain,
      description: cell(row, ["description", "desc"]),
      sourceSystem: cell(row, ["source_system", "source", "system"]),
      dataOwner: cell(row, ["data_owner", "owner"]),
      format: cell(row, ["format", "type"]) || table.fileName.split(".").pop()?.toUpperCase() || "UNKNOWN",
      volume: cell(row, ["volume"]),
      frequency: cell(row, ["frequency"]),
      accessMethod: cell(row, ["access_method", "access"]),
      apiAvailability: cell(row, ["api_availability", "api"]),
      required: !["optional", "n", "no", "false", "0"].includes(requiredRaw),
      status: "ACTIVE",
      notes: cell(row, ["notes", "note"]),
    });
  }
  return drafts;
}
