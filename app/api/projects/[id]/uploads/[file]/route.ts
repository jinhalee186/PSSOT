import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { loadProject, uploadsDir } from "@/lib/ssot/store";

type Ctx = { params: Promise<{ id: string; file: string }> };

export async function GET(_: Request, ctx: Ctx) {
  const { id, file } = await ctx.params;
  const project = await loadProject(id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const safe = path.basename(file);
  if (!project.inventory.assets.some((a) => a.fileName === safe)) {
    return NextResponse.json({ error: "Unknown file" }, { status: 404 });
  }
  try {
    const bytes = await readFile(path.join(uploadsDir(id), safe));
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${safe}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Missing file" }, { status: 404 });
  }
}
