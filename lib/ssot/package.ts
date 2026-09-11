import { readFile } from "fs/promises";
import path from "path";
import JSZip from "jszip";
import type { ProjectSSOT } from "./types";
import { generateOwl, generateTurtle } from "./validate-owl";
import { regenerateDocuments } from "./documents";
import { uploadsDir } from "./store";

export async function buildCustomerDataPackage(ssot: ProjectSSOT): Promise<Buffer> {
  regenerateDocuments(ssot);
  const zip = new JSZip();
  const root = `${ssot.project.code}_Customer_Data_Package`;

  zip.file(`${root}/00_README/README.md`, doc(ssot, "readme"));
  zip.file(`${root}/01_DATA_INVENTORY/inventory.json`, JSON.stringify(ssot.inventory, null, 2));
  zip.file(`${root}/02_DATA_DICTIONARY/dictionary.json`, JSON.stringify(ssot.dictionary, null, 2));
  zip.file(`${root}/02_DATA_DICTIONARY/dictionary.md`, doc(ssot, "dictionary"));

  const active = ssot.domainRegistry.domains.filter((d) => d.status === "ACTIVE");
  for (const domain of active) {
    const assets = ssot.inventory.assets.filter((a) => domain.sourceAssetIds.includes(a.id));
    zip.file(
      `${root}/DATA/${safe(domain.name)}/README.md`,
      `# ${domain.name}\n\nStatus: ${domain.status}\n\n${domain.description}\n\nAssets:\n${assets.map((a) => `- ${a.dataAsset} (${a.fileName ?? "no file"})`).join("\n")}\n`,
    );
    for (const asset of assets) {
      if (!asset.fileName) continue;
      try {
        const bytes = await readFile(path.join(uploadsDir(ssot.id), asset.fileName));
        zip.file(`${root}/DATA/${safe(domain.name)}/${asset.fileName}`, bytes);
        zip.file(`${root}/09_SAMPLE_DATA/${safe(domain.name)}/${asset.fileName}`, bytes);
      } catch {
        /* upload may have been removed */
      }
    }
  }

  zip.file(`${root}/03_MAPPING/mapping.json`, JSON.stringify(ssot.mapping, null, 2));
  zip.file(`${root}/04_CANONICAL_MODEL/canonical.json`, JSON.stringify(ssot.canonical, null, 2));
  zip.file(`${root}/05_ONTOLOGY/ontology.json`, JSON.stringify(ssot.ontology, null, 2));
  zip.file(
    `${root}/05_ONTOLOGY/ontology.owl`,
    generateOwl(ssot.ontology, `urn:pssot:${ssot.project.code.toLowerCase()}`),
  );
  zip.file(
    `${root}/05_ONTOLOGY/ontology.ttl`,
    generateTurtle(ssot.ontology, `urn:pssot:${ssot.project.code.toLowerCase()}`),
  );
  zip.file(
    `${root}/05_ONTOLOGY/ontology.rdf`,
    generateOwl(ssot.ontology, `urn:pssot:${ssot.project.code.toLowerCase()}`),
  );
  zip.file(`${root}/05_ONTOLOGY/documentation.md`, doc(ssot, "ontology_docs"));
  zip.file(`${root}/06_DATA_CONTRACT/contracts.json`, JSON.stringify(ssot.contracts, null, 2));
  zip.file(`${root}/06_DATA_CONTRACT/contracts.md`, doc(ssot, "contract"));
  zip.file(`${root}/07_SYSTEM/systems.json`, JSON.stringify(ssot.systems, null, 2));
  zip.file(`${root}/07_SYSTEM/api.md`, doc(ssot, "api"));
  zip.file(`${root}/08_WORKFLOW/workflows.json`, JSON.stringify(ssot.workflows, null, 2));
  zip.file(`${root}/09_SAMPLE_DATA/index.json`, JSON.stringify(ssot.inventory.assets.map((a) => ({ asset: a.dataAsset, file: a.fileName, rows: a.rowCount })), null, 2));
  zip.file(`${root}/10_PROFILING/profiling.json`, JSON.stringify(ssot.profiling, null, 2));
  zip.file(`${root}/11_SECURITY/security.json`, JSON.stringify(ssot.security, null, 2));
  zip.file(`${root}/12_GAP_AND_DECISION_LOG/log.json`, JSON.stringify(ssot.gapLog, null, 2));
  zip.file(`${root}/SSOT/ssot.json`, JSON.stringify(ssot, null, 2));
  zip.file(`${root}/DOCUMENTS/PRD.md`, doc(ssot, "prd"));
  zip.file(`${root}/DOCUMENTS/BRD.md`, doc(ssot, "brd"));
  zip.file(`${root}/DOCUMENTS/Architecture.md`, doc(ssot, "architecture"));
  zip.file(`${root}/DOCUMENTS/Technical_Specification.md`, doc(ssot, "tech_spec"));
  zip.file(`${root}/DOCUMENTS/Developer_Handoff.md`, doc(ssot, "handoff"));
  zip.file(`${root}/DOCUMENTS/Executive_Summary.md`, doc(ssot, "exec"));
  zip.file(`${root}/DOCUMENTS/Customer_Proposal.md`, doc(ssot, "proposal"));

  const buf = await zip.generateAsync({ type: "nodebuffer" });
  return buf;
}

function doc(ssot: ProjectSSOT, kind: string) {
  return ssot.documents.find((d) => d.kind === kind)?.markdown ?? "";
}

function safe(name: string) {
  return name.replace(/[^\w.-]+/g, "_");
}
