import { NextResponse } from "next/server";
import { buildCustomerDataPackage } from "@/lib/ssot/package";
import { loadProject, persistProject } from "@/lib/ssot/store";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const project = await loadProject(id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const zip = await buildCustomerDataPackage(project);
  await persistProject(project, false);
  return new NextResponse(new Uint8Array(zip), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${project.project.code}_Customer_Data_Package.zip"`,
    },
  });
}
