import type { ProfileResult, ProjectSSOT } from "./types";
import { profileColumn } from "./infer";
import { loadParsedAssets } from "./dictionary";
import { enqueueImpact } from "./domain-registry";

export async function generateProfiling(ssot: ProjectSSOT): Promise<ProjectSSOT> {
  const parsed = await loadParsedAssets(ssot);
  const results: ProfileResult[] = [];
  for (const asset of ssot.inventory.assets) {
    const table = parsed.get(asset.id);
    if (!table) continue;
    results.push({
      assetId: asset.id,
      domain: asset.domain,
      rowCount: table.rows.length,
      columns: table.columns.map((c) => profileColumn(c, table.rows.map((r) => r[c] ?? ""))),
      generatedAt: new Date().toISOString(),
    });
  }
  ssot.profiling = results;
  enqueueImpact(ssot, "Profiling refreshed", "11_DATA_PROFILING", ["04_DATA_MAPPING", "05_CANONICAL_MODEL"]);
  return ssot;
}
