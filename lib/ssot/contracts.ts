import type { DataContract, ProjectSSOT } from "./types";
import { enqueueImpact } from "./domain-registry";
import { id } from "./util";

export function generateContracts(ssot: ProjectSSOT): ProjectSSOT {
  const contracts: DataContract[] = ssot.canonical.entities.map((ent) => {
    const dictAttrs = ssot.dictionary.tables.flatMap((t) => t.attributes);
    return {
      id: id("ctr"),
      name: `${ent.name}Contract`,
      version: `1.${ssot.version}`,
      owner: ssot.project.owner || "unassigned",
      canonicalEntityId: ent.id,
      compatibility: "backward",
      qualityExpectations: "Fields must match approved Data Dictionary types and nullability.",
      status: "AI_GENERATED",
      fields: ent.attributes.map((a) => {
        const dict = dictAttrs.find((d) => d.canonicalMapping?.endsWith(`.${a.name}`) || d.name === a.name);
        return {
          name: a.name,
          dataType: a.dataType,
          required: a.required,
          nullable: !a.required,
          format: dict?.format,
          allowedValues: dict?.sampleValues?.length && dict.sampleValues.length <= 8 ? dict.sampleValues : undefined,
          constraints: a.required ? "required" : undefined,
          dictionaryAttributeId: dict?.id,
        };
      }),
    };
  });
  ssot.contracts = contracts;
  generateSystems(ssot);
  enqueueImpact(ssot, "Data contracts regenerated", "07_DATA_CONTRACT", ["08_SYSTEM_INVENTORY", "API Specification"]);
  return ssot;
}

function generateSystems(ssot: ProjectSSOT) {
  ssot.systems = [
    {
      id: id("sys"),
      name: `${ssot.project.code} Canonical API`,
      type: "generated_view",
      description: "API surface derived from canonical entities and data contracts. Not an independent schema.",
      owner: ssot.project.owner,
      endpoints: ssot.canonical.entities.map((e) => ({
        id: id("api"),
        method: "GET",
        path: `/api/v1/${e.name.toLowerCase()}`,
        description: `List ${e.name} records as defined by ${e.name}Contract.`,
        entityRef: e.id,
      })),
    },
  ];
}
