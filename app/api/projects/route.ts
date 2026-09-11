import { NextResponse } from "next/server";
import { createProject, listProjects } from "@/lib/ssot/store";

export async function GET() {
  const projects = await listProjects();
  return NextResponse.json(
    projects.map((p) => ({
      id: p.id,
      name: p.project.name,
      code: p.project.code,
      customer: p.project.customer,
      updatedAt: p.updatedAt,
      version: p.version,
      domains: p.domainRegistry.domains.filter((d) => d.status === "ACTIVE").map((d) => d.name),
      status: p.project.status,
    })),
  );
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const project = await createProject(body);
  return NextResponse.json(project);
}
