import { mkdir, readdir, readFile, writeFile, rm } from "fs/promises";
import path from "path";
import { createEmptySSOT, type ProjectSSOT } from "./types";

const ROOT = path.join(process.cwd(), "data", "projects");

export function projectDir(id: string) {
  return path.join(ROOT, id);
}

export function ssotPath(id: string) {
  return path.join(projectDir(id), "ssot.json");
}

export function uploadsDir(id: string) {
  return path.join(projectDir(id), "uploads");
}

export async function ensureRoots() {
  await mkdir(ROOT, { recursive: true });
}

export async function listProjects(): Promise<ProjectSSOT[]> {
  await ensureRoots();
  const entries = await readdir(ROOT, { withFileTypes: true }).catch(() => []);
  const projects: ProjectSSOT[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    try {
      const raw = await readFile(ssotPath(entry.name), "utf8");
      projects.push(JSON.parse(raw) as ProjectSSOT);
    } catch {
      /* skip incomplete folders */
    }
  }
  return projects.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function loadProject(id: string): Promise<ProjectSSOT | null> {
  try {
    const raw = await readFile(ssotPath(id), "utf8");
    return JSON.parse(raw) as ProjectSSOT;
  } catch {
    return null;
  }
}

export async function persistProject(ssot: ProjectSSOT, bumpVersion = true): Promise<ProjectSSOT> {
  ssot.updatedAt = new Date().toISOString();
  if (bumpVersion) ssot.version += 1;
  await mkdir(uploadsDir(ssot.id), { recursive: true });
  await writeFile(ssotPath(ssot.id), JSON.stringify(ssot, null, 2), "utf8");
  return ssot;
}

export async function saveProject(ssot: ProjectSSOT): Promise<ProjectSSOT> {
  return persistProject(ssot, true);
}

export async function createProject(input: {
  name?: string;
  customer?: string;
  description?: string;
  owner?: string;
}): Promise<ProjectSSOT> {
  const ssot = createEmptySSOT(input);
  ssot.version = 0;
  return saveProject(ssot);
}

export async function deleteProject(id: string) {
  await rm(projectDir(id), { recursive: true, force: true });
}

export async function saveUpload(projectId: string, fileName: string, bytes: Buffer) {
  const dir = uploadsDir(projectId);
  await mkdir(dir, { recursive: true });
  const safe = fileName.replace(/[^\w.\-]+/g, "_");
  const dest = path.join(dir, safe);
  await writeFile(dest, bytes);
  return { fileName: safe, path: dest };
}
