import { NextResponse } from "next/server";
import { deleteProject, loadProject, saveProject } from "@/lib/ssot/store";
import type { ProjectSSOT } from "@/lib/ssot/types";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const project = await loadProject(id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(project);
}

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const project = await loadProject(id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = (await req.json()) as Partial<ProjectSSOT> & { actor?: string };
  if (body.project) project.project = { ...project.project, ...body.project };
  if (body.business) project.business = { ...project.business, ...body.business };
  if (body.inventory) project.inventory = body.inventory;
  if (body.architecture) project.architecture = { ...project.architecture, ...body.architecture };
  if (body.security) project.security = body.security;
  if (body.gapLog) project.gapLog = body.gapLog;
  if (body.workflows) project.workflows = body.workflows;
  if (body.domainRegistry) project.domainRegistry = body.domainRegistry;
  if (body.dictionary) project.dictionary = body.dictionary;
  if (body.ontology) project.ontology = body.ontology;
  if (body.impactQueue) project.impactQueue = body.impactQueue;
  const saved = await saveProject(project);
  return NextResponse.json(saved);
}

export async function DELETE(_: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  await deleteProject(id);
  return NextResponse.json({ ok: true });
}
