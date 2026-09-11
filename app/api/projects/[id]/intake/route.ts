import { NextResponse } from "next/server";
import {
  guessDomainFromFile,
  inventoryDraftsFromTable,
  isInventoryTable,
  parseUploadedFile,
} from "@/lib/ssot/intake";
import { loadProject, saveProject, saveUpload } from "@/lib/ssot/store";
import type { InventoryAsset } from "@/lib/ssot/types";
import { id } from "@/lib/ssot/util";
import { enqueueImpact, syncDomainRegistry } from "@/lib/ssot/domain-registry";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const { id: projectId } = await ctx.params;
  const project = await loadProject(projectId);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const form = await req.formData();
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  const domainOverride = String(form.get("domain") ?? "");

  for (const file of files) {
    const buf = Buffer.from(await file.arrayBuffer());
    const saved = await saveUpload(projectId, file.name, buf);
    const tables = parseUploadedFile(saved.fileName, buf);
    for (const table of tables) {
      if (isInventoryTable(table.columns) && !domainOverride) {
        for (const draft of inventoryDraftsFromTable(table)) {
          const asset: InventoryAsset = {
            id: id("ast"),
            ...draft,
            fileName: saved.fileName,
            uploadedAt: new Date().toISOString(),
            rowCount: 0,
            columns: [],
            notes: `${draft.notes}${draft.notes ? " · " : ""}Imported from inventory sheet ${table.sheetName ?? saved.fileName}`,
          };
          project.inventory.assets.push(asset);
        }
        continue;
      }

      const domain = domainOverride || guessDomainFromFile(file.name, table.sheetName);
      const asset: InventoryAsset = {
        id: id("ast"),
        domain,
        dataAsset: table.sheetName ? `${saved.fileName} / ${table.sheetName}` : saved.fileName,
        description: "Customer-provided tabular asset.",
        sourceSystem: String(form.get("sourceSystem") ?? "customer_upload"),
        dataOwner: String(form.get("dataOwner") ?? project.project.customer ?? ""),
        format: saved.fileName.split(".").pop()?.toUpperCase() ?? "FILE",
        volume: `${table.rows.length} rows`,
        frequency: String(form.get("frequency") ?? "ad-hoc"),
        accessMethod: "file_upload",
        apiAvailability: "unknown",
        required: true,
        status: "ACTIVE",
        notes: "",
        fileName: saved.fileName,
        uploadedAt: new Date().toISOString(),
        rowCount: table.rows.length,
        columns: table.columns,
      };
      project.inventory.assets.push(asset);
    }
  }

  syncDomainRegistry(project, "user");
  enqueueImpact(project, "Intake files added", `${files.length} file(s)`, [
    "02_DATA_INVENTORY",
    "Dynamic Domain Registry",
    "03_DATA_DICTIONARY",
  ]);
  const savedProject = await saveProject(project);
  return NextResponse.json(savedProject);
}
