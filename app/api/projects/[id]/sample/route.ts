import { NextResponse } from "next/server";
import { loadParsedAssets } from "@/lib/ssot/dictionary";
import { loadProject } from "@/lib/ssot/store";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const project = await loadProject(id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const assetId = new URL(req.url).searchParams.get("assetId");
  const parsed = await loadParsedAssets(project);
  if (assetId) {
    const table = parsed.get(assetId);
    const asset = project.inventory.assets.find((a) => a.id === assetId);
    return NextResponse.json({
      asset,
      columns: table?.columns ?? asset?.columns ?? [],
      rows: (table?.rows ?? []).slice(0, 50),
    });
  }
  return NextResponse.json(
    project.inventory.assets.map((asset) => ({
      asset,
      previewRows: (parsed.get(asset.id)?.rows ?? []).slice(0, 5),
    })),
  );
}
