import { NextResponse } from "next/server";
import { loadProject } from "@/lib/ssot/store";
import { generateOwl, generateTurtle } from "@/lib/ssot/validate-owl";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const project = await loadProject(id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const format = new URL(req.url).searchParams.get("format") ?? "owl";
  const iri = `urn:pssot:${project.project.code.toLowerCase()}`;
  if (format === "ttl") {
    return new NextResponse(generateTurtle(project.ontology, iri), {
      headers: { "Content-Type": "text/turtle" },
    });
  }
  return new NextResponse(generateOwl(project.ontology, iri), {
    headers: { "Content-Type": "application/rdf+xml" },
  });
}
