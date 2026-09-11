import { readFile } from "fs/promises";
import path from "path";
import { createProject, saveProject, saveUpload } from "../lib/ssot/store";
import { parseUploadedFile, guessDomainFromFile } from "../lib/ssot/intake";
import { runDownstreamPipeline } from "../lib/ssot/pipeline";
import type { InventoryAsset } from "../lib/ssot/types";

async function main() {
  const project = await createProject({
    name: "Commerce intelligence SSOT",
    customer: "Harbor Labs",
    description: "Demo project using Customer / Product / Order domains discovered from inventory.",
    owner: "seed",
  });
  project.business.objective = "Stand up a governed SSOT so downstream PM and engineering artifacts stay aligned.";
  project.business.background = "Source files arrive from the customer warehouse with inconsistent naming.";
  project.business.painPoints = ["Documents drift from source data", "Domains were previously hard-coded"];
  project.business.mvp = "Inventory → registry → dictionary verification → ontology validation → package export";
  project.business.primaryUser = "Project manager";
  project.business.secondaryUser = "Data architect";
  project.business.kpis = ["Approved dictionary coverage", "Ontology validation errors = 0"];
  project.architecture.overview = "Metadata-driven SSOT. Graph and OWL consume the same ontology model.";
  project.architecture.patterns = ["Dynamic domain registry", "Human-in-the-loop dictionary", "Generated views"];

  const files = ["customer.csv", "product.csv", "order.csv"];
  for (const fileName of files) {
    const buf = await readFile(path.join(process.cwd(), "fixtures", fileName));
    const saved = await saveUpload(project.id, fileName, buf);
    const tables = parseUploadedFile(saved.fileName, buf);
    for (const table of tables) {
      const domain = guessDomainFromFile(fileName, table.sheetName);
      const asset: InventoryAsset = {
        id: crypto.randomUUID(),
        domain,
        dataAsset: saved.fileName,
        description: `Seed ${domain} extract`,
        sourceSystem: "seed_fixtures",
        dataOwner: "Harbor Labs",
        format: "CSV",
        volume: `${table.rows.length} rows`,
        frequency: "snapshot",
        accessMethod: "file",
        apiAvailability: "no",
        required: true,
        status: "ACTIVE",
        notes: "Demo only",
        fileName: saved.fileName,
        uploadedAt: new Date().toISOString(),
        rowCount: table.rows.length,
        columns: table.columns,
      };
      project.inventory.assets.push(asset);
    }
  }

  await runDownstreamPipeline(project, "seed");
  const saved = await saveProject(project);
  console.log(`Seeded project ${saved.project.name} (${saved.id})`);
  console.log(`Domains: ${saved.domainRegistry.domains.map((d) => d.name).join(", ")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
