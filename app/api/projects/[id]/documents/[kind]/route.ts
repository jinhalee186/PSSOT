import { NextResponse } from "next/server";
import { documentFileMeta, findGeneratedDocument } from "@/lib/ssot/documents";
import { loadProject } from "@/lib/ssot/store";

type Ctx = { params: Promise<{ id: string; kind: string }> };

export async function GET(_: Request, ctx: Ctx) {
  const { id, kind } = await ctx.params;
  const project = await loadProject(id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const doc = findGeneratedDocument(project, kind);
  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });
  const meta = documentFileMeta(doc, project.project.code);
  return new NextResponse(doc.markdown, {
    headers: {
      "Content-Type": meta.contentType,
      "Content-Disposition": `attachment; filename="${meta.filename}"`,
    },
  });
}
