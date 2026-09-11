"use client";

import { useMemo, useState } from "react";
import type { BusinessRequirement, InventoryAsset, ProjectSSOT } from "@/lib/ssot/types";
import { useI18n } from "@/lib/i18n/LocaleProvider";
import { OntologyGraph } from "./OntologyGraph";
import { MarkdownView } from "./MarkdownView";
import { useSSOT } from "./SSOTProvider";
import { Btn, Field, inputCls, KindBadge, Panel, StatusBadge } from "./ui";

export function OverviewView() {
  const { ssot, save } = useSSOT();
  const { t } = useI18n();
  if (!ssot) return null;
  const p = ssot.project;
  const steps = [
    t("overview.step1"),
    t("overview.step2"),
    t("overview.step3"),
    t("overview.step4"),
    t("overview.step5"),
    t("overview.step6"),
    t("overview.step7"),
    t("overview.step8"),
    t("overview.step9"),
    t("overview.step10"),
  ];
  return (
    <div className="space-y-5">
      <Panel kicker="00_PROJECT" title={t("overview.identity")}>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label={t("overview.name")}>
            <input className={inputCls} defaultValue={p.name} onBlur={(e) => save({ project: { ...p, name: e.target.value } })} />
          </Field>
          <Field label={t("overview.customer")}>
            <input className={inputCls} defaultValue={p.customer} onBlur={(e) => save({ project: { ...p, customer: e.target.value } })} />
          </Field>
          <Field label={t("overview.owner")}>
            <input className={inputCls} defaultValue={p.owner} onBlur={(e) => save({ project: { ...p, owner: e.target.value } })} />
          </Field>
          <Field label={t("overview.description")}>
            <textarea className={inputCls} defaultValue={p.description} onBlur={(e) => save({ project: { ...p, description: e.target.value } })} />
          </Field>
        </div>
      </Panel>
      <Panel title={t("overview.pipeline")} kicker={t("overview.framework")}>
        <ol className="grid gap-2 text-sm text-[var(--ink-soft)] md:grid-cols-2">
          {steps.map((step, i) => (
            <li key={i} className="rounded-lg border border-[var(--rule)] bg-[var(--paper)] px-3 py-2">
              <span className="mr-2 font-mono text-[11px] text-[var(--rust)]">{String(i + 1).padStart(2, "0")}</span>
              {step}
            </li>
          ))}
        </ol>
      </Panel>
    </div>
  );
}

export function IntakeView() {
  const { ssot, act, reload } = useSSOT();
  const { t } = useI18n();
  const [domain, setDomain] = useState("");
  const [busy, setBusy] = useState(false);
  const [fileNames, setFileNames] = useState<string[]>([]);
  if (!ssot) return null;
  const projectId = ssot.id;
  const fileHint = fileNames.length
    ? t("intake.filesSelected", { n: fileNames.length, names: fileNames.join(", ") })
    : t("intake.noFiles");

  async function onUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const files = data.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
    if (!files.length) return;
    setBusy(true);
    await fetch(`/api/projects/${projectId}/intake`, { method: "POST", body: data });
    setBusy(false);
    form.reset();
    setDomain("");
    setFileNames([]);
    await reload();
  }

  return (
    <div className="space-y-5">
      <Panel kicker={t("intake.kicker")} title={t("intake.title")}>
        <p className="text-sm leading-relaxed text-[var(--ink-soft)]">{t("intake.intro")}</p>
        <ol className="mt-4 grid gap-2 text-sm text-[var(--ink-soft)] md:grid-cols-3">
          {[
            { n: "1", t: t("intake.s1t"), d: t("intake.s1d") },
            { n: "2", t: t("intake.s2t"), d: t("intake.s2d") },
            { n: "3", t: t("intake.s3t"), d: t("intake.s3d") },
          ].map((s) => (
            <li key={s.n} className="rounded-xl border border-[var(--rule)] bg-[var(--paper)] px-3 py-3">
              <div className="font-mono text-[11px] text-[var(--rust)]">{t("intake.step", { n: s.n })}</div>
              <div className="mt-1 font-medium text-[var(--ink)]">{s.t}</div>
              <p className="mt-1 text-[13px]">{s.d}</p>
            </li>
          ))}
        </ol>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-[var(--rule)] bg-white/75 p-5 shadow-sm">
          <div className="text-[10px] uppercase tracking-[0.22em] text-[var(--rust)]">{t("intake.first")}</div>
          <h3 className="mt-1 text-xl">{t("intake.invTitle")}</h3>
          <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">{t("intake.invBody")}</p>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">{t("intake.invExample")}</p>
        </section>
        <section className="rounded-2xl border border-[var(--rule)] bg-white/75 p-5 shadow-sm">
          <div className="text-[10px] uppercase tracking-[0.22em] text-[var(--rust)]">{t("intake.then")}</div>
          <h3 className="mt-1 text-xl">{t("intake.srcTitle")}</h3>
          <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">{t("intake.srcBody")}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--ink-soft)]">
            <li><code>customer.csv</code>, <code>product.xlsx</code>, <code>orders.json</code></li>
            <li>{t("intake.srcExcel")}</li>
            <li>{t("intake.srcJson")}</li>
          </ul>
        </section>
      </div>

      <Panel
        kicker={t("intake.formats")}
        title={t("intake.upload")}
        action={<Btn tone="ghost" onClick={() => act("pipeline")}>{t("intake.pipeline")}</Btn>}
      >
        <div className="mb-4 flex flex-wrap gap-2 text-[13px]">
          {[
            { ext: "CSV / TSV", note: t("intake.csv") },
            { ext: "XLSX / XLS", note: t("intake.xlsx") },
            { ext: "JSON", note: t("intake.json") },
          ].map((f) => (
            <span key={f.ext} className="rounded-full border border-[var(--rule)] bg-[var(--paper)] px-3 py-1">
              <strong>{f.ext}</strong>
              <span className="text-[var(--ink-soft)]"> · {f.note}</span>
            </span>
          ))}
        </div>
        <p className="mb-4 text-sm text-[var(--ink-soft)]">{t("intake.domainHow")}</p>
        <form onSubmit={onUpload} className="grid gap-3 md:grid-cols-2">
          <Field label={t("intake.filesLabel")}>
            <input
              required
              name="files"
              type="file"
              multiple
              accept=".csv,.tsv,.xlsx,.xls,.json,text/csv,application/json,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="block w-full rounded-lg border border-dashed border-[var(--rule)] bg-[var(--paper)] px-3 py-4 text-sm"
              onChange={(e) => setFileNames(e.target.files ? Array.from(e.target.files).map((f) => f.name) : [])}
            />
            <p className="mt-1 text-xs text-[var(--ink-soft)]">{fileHint}</p>
          </Field>
          <Field label={t("intake.override")}>
            <input
              name="domain"
              className={inputCls}
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder={t("intake.overridePh")}
            />
            <p className="mt-1 text-xs text-[var(--ink-soft)]">{t("intake.overrideHelp")}</p>
          </Field>
          <Field label={t("intake.source")}>
            <input name="sourceSystem" className={inputCls} defaultValue="customer_upload" />
            <p className="mt-1 text-xs text-[var(--ink-soft)]">{t("intake.sourceHelp")}</p>
          </Field>
          <Field label={t("intake.owner")}>
            <input name="dataOwner" className={inputCls} defaultValue={ssot.project.customer} />
            <p className="mt-1 text-xs text-[var(--ink-soft)]">{t("intake.ownerHelp")}</p>
          </Field>
          <div className="md:col-span-2 flex flex-wrap items-center gap-3">
            <Btn type="submit" disabled={busy}>{busy ? t("intake.ingesting") : t("intake.ingest")}</Btn>
            <span className="text-xs text-[var(--ink-soft)]">{t("intake.stored")}</span>
          </div>
        </form>
      </Panel>

      <Panel kicker={t("intake.assetsKicker")} title={t("intake.assetsTitle")}>
        {ssot.inventory.assets.length === 0 ? (
          <p className="text-sm text-[var(--ink-soft)]">{t("intake.emptyAssets")}</p>
        ) : (
          <AssetTable assets={ssot.inventory.assets} />
        )}
      </Panel>
    </div>
  );
}

function AssetTable({ assets }: { assets: InventoryAsset[] }) {
  const { act } = useSSOT();
  const { t } = useI18n();
  if (!assets.length) return <p className="text-sm text-[var(--ink-soft)]">{t("intake.noAssets")}</p>;
  return (
    <div className="overflow-auto rounded-xl border border-[var(--rule)]">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-[var(--paper-2)] text-xs uppercase tracking-wider text-[var(--ink-soft)]">
          <tr>
            {[t("col.domain"), t("col.asset"), t("col.format"), t("col.rows"), t("col.source"), t("col.status"), ""].map((h) => (
              <th key={h} className="px-3 py-2">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {assets.map((a) => (
            <tr key={a.id} className="border-t border-[var(--rule)]">
              <td className="px-3 py-2 font-medium">{a.domain}</td>
              <td className="px-3 py-2">{a.dataAsset}</td>
              <td className="px-3 py-2">{a.format}</td>
              <td className="px-3 py-2">{a.rowCount ?? a.volume}</td>
              <td className="px-3 py-2">{a.sourceSystem}</td>
              <td className="px-3 py-2"><StatusBadge status={String(a.status)} /></td>
              <td className="px-3 py-2">
                <Btn tone="ghost" onClick={() => act("delete-inventory-asset", { assetId: a.id })}>{t("action.remove")}</Btn>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function InventoryView() {
  const { ssot, save, act } = useSSOT();
  const { t } = useI18n();
  const [draft, setDraft] = useState({ domain: "", dataAsset: "", description: "", sourceSystem: "", format: "CSV" });
  if (!ssot) return null;
  const current = ssot;

  function updateAsset(id: string, patch: Partial<InventoryAsset>) {
    save({
      inventory: {
        assets: current.inventory.assets.map((a) => (a.id === id ? { ...a, ...patch } : a)),
      },
    });
  }

  return (
    <div className="space-y-5">
      <Panel kicker="02_DATA_INVENTORY" title={t("inv.title")} action={<Btn onClick={() => act("sync-domains")}>{t("inv.derive")}</Btn>}>
        <p className="mb-4 text-sm text-[var(--ink-soft)]">{t("inv.help")}</p>
        <div className="overflow-auto">
          <table className="min-w-[900px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-[var(--ink-soft)]">
              <tr>
                {[t("col.domain"), t("col.dataAsset"), t("col.description"), t("col.sourceSystem"), t("col.owner"), t("col.format"), t("col.required")].map((h) => (
                  <th key={h} className="pb-2 pr-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ssot.inventory.assets.map((a) => (
                <tr key={a.id} className="border-t border-[var(--rule)] align-top">
                  <td className="py-2 pr-2"><input className={inputCls} defaultValue={a.domain} onBlur={(e) => updateAsset(a.id, { domain: e.target.value })} /></td>
                  <td className="py-2 pr-2"><input className={inputCls} defaultValue={a.dataAsset} onBlur={(e) => updateAsset(a.id, { dataAsset: e.target.value })} /></td>
                  <td className="py-2 pr-2"><input className={inputCls} defaultValue={a.description} onBlur={(e) => updateAsset(a.id, { description: e.target.value })} /></td>
                  <td className="py-2 pr-2"><input className={inputCls} defaultValue={a.sourceSystem} onBlur={(e) => updateAsset(a.id, { sourceSystem: e.target.value })} /></td>
                  <td className="py-2 pr-2"><input className={inputCls} defaultValue={a.dataOwner} onBlur={(e) => updateAsset(a.id, { dataOwner: e.target.value })} /></td>
                  <td className="py-2 pr-2"><input className={inputCls} defaultValue={a.format} onBlur={(e) => updateAsset(a.id, { format: e.target.value })} /></td>
                  <td className="py-2 pr-2">{a.required ? t("action.required") : t("action.optional")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel title={t("inv.addTitle")}>
        <div className="grid gap-3 md:grid-cols-3">
          <input className={inputCls} placeholder={t("inv.phDomain")} value={draft.domain} onChange={(e) => setDraft({ ...draft, domain: e.target.value })} />
          <input className={inputCls} placeholder={t("inv.phAsset")} value={draft.dataAsset} onChange={(e) => setDraft({ ...draft, dataAsset: e.target.value })} />
          <input className={inputCls} placeholder={t("inv.phDesc")} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
        </div>
        <div className="mt-3">
          <Btn onClick={() => act("add-inventory-asset", draft)}>{t("inv.add")}</Btn>
        </div>
      </Panel>
    </div>
  );
}

export function DomainsView() {
  const { ssot, act } = useSSOT();
  const { t } = useI18n();
  if (!ssot) return null;
  return (
    <Panel kicker="Dynamic Domain Registry" title={t("dom.title")}>
      <div className="grid gap-3">
        {ssot.domainRegistry.domains.map((d) => (
          <div key={d.id} className="rounded-xl border border-[var(--rule)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-xl">{d.name}</h3>
                <p className="text-sm text-[var(--ink-soft)]">{d.description}</p>
                <p className="mt-1 font-mono text-[11px] text-[var(--ink-soft)]">{d.lineage}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={d.status} />
                {d.status === "ACTIVE" && (
                  <Btn tone="ghost" onClick={() => {
                    if (confirm(t("dom.deprecateConfirm", { name: d.name }))) {
                      act("set-domain-status", { domainId: d.id, status: "DEPRECATED" });
                    }
                  }}>{t("dom.deprecate")}</Btn>
                )}
                {d.status === "DEPRECATED" && (
                  <Btn tone="ghost" onClick={() => act("set-domain-status", { domainId: d.id, status: "ARCHIVED" })}>{t("dom.archive")}</Btn>
                )}
              </div>
            </div>
            <p className="mt-2 text-xs text-[var(--ink-soft)]">{t("dom.affects", { list: d.affectedArtifacts.join(" · ") })}</p>
          </div>
        ))}
        {!ssot.domainRegistry.domains.length && <p className="text-sm text-[var(--ink-soft)]">{t("dom.empty")}</p>}
      </div>
    </Panel>
  );
}

export function DictionaryView() {
  const { ssot, act } = useSSOT();
  const { t } = useI18n();
  const [tab, setTab] = useState(0);
  const [newAttr, setNewAttr] = useState({ name: "", dataType: "String", description: "" });
  if (!ssot) return null;
  const table = ssot.dictionary.tables[tab];
  return (
    <div className="space-y-4">
      <Panel kicker="03_DATA_DICTIONARY" title={t("dict.title")} action={<Btn onClick={() => act("generate-dictionary")}>{t("dict.propose")}</Btn>}>
        <p className="mb-3 text-sm text-[var(--ink-soft)]">{t("dict.help")}</p>
        <div className="mb-4 flex flex-wrap gap-2">
          {ssot.dictionary.tables.map((tbl, i) => (
            <button key={tbl.domainId} onClick={() => setTab(i)} className={`rounded-full px-3 py-1 text-sm ${i === tab ? "bg-[var(--ink)] text-white" : "bg-[var(--paper-2)]"}`}>
              {tbl.domainName}
            </button>
          ))}
        </div>
        {!table && <p className="text-sm text-[var(--ink-soft)]">{t("dict.empty")}</p>}
        {table && (
          <>
          <div className="overflow-auto">
            <table className="min-w-[1100px] text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-[var(--ink-soft)]">
                <tr>
                  {[t("dict.attr"), t("dict.type"), t("dict.desc"), t("dict.req"), t("dict.kind"), t("dict.prov"), t("dict.conf"), t("col.status"), ""].map((h) => (
                    <th key={h} className="pb-2 pr-2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.attributes.map((a) => (
                  <tr key={a.id} className="border-t border-[var(--rule)] align-top">
                    <td className="py-2 pr-2 font-medium">{a.name}</td>
                    <td className="py-2 pr-2">
                      <select className={inputCls} defaultValue={a.dataType} onChange={(e) => act("patch-attribute", { attributeId: a.id, patch: { dataType: e.target.value, status: "USER_MODIFIED" } })}>
                        {["String", "Integer", "Decimal", "Boolean", "Date"].map((typ) => <option key={typ}>{typ}</option>)}
                      </select>
                    </td>
                    <td className="py-2 pr-2 w-[280px]">
                      <textarea className={inputCls} defaultValue={a.description} onBlur={(e) => act("patch-attribute", { attributeId: a.id, patch: { description: e.target.value, status: "USER_MODIFIED" } })} />
                    </td>
                    <td className="py-2 pr-2">
                      <input type="checkbox" defaultChecked={a.required} onChange={(e) => act("patch-attribute", { attributeId: a.id, patch: { required: e.target.checked, nullable: !e.target.checked, status: "USER_MODIFIED" } })} />
                    </td>
                    <td className="py-2 pr-2"><KindBadge kind={a.provenance.kind} /></td>
                    <td className="py-2 pr-2 text-xs">{a.provenance.source}</td>
                    <td className="py-2 pr-2">{Math.round(a.provenance.confidence * 100)}%</td>
                    <td className="py-2 pr-2"><StatusBadge status={a.status} /></td>
                    <td className="py-2 pr-2 whitespace-nowrap">
                      <Btn tone="ghost" onClick={() => act("patch-attribute", { attributeId: a.id, patch: { status: "APPROVED", provenance: { ...a.provenance, userApproved: true } } })}>{t("dict.approve")}</Btn>
                      <Btn tone="ghost" onClick={() => act("patch-attribute", { attributeId: a.id, patch: { status: "REJECTED" } })}>{t("dict.reject")}</Btn>
                      <Btn tone="ghost" onClick={() => act("delete-attribute", { attributeId: a.id })}>{t("dict.delete")}</Btn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 grid gap-2 md:grid-cols-4">
            <input className={inputCls} placeholder={t("dict.newAttr")} value={newAttr.name} onChange={(e) => setNewAttr({ ...newAttr, name: e.target.value })} />
            <select className={inputCls} value={newAttr.dataType} onChange={(e) => setNewAttr({ ...newAttr, dataType: e.target.value })}>
              {["String", "Integer", "Decimal", "Boolean", "Date"].map((typ) => <option key={typ}>{typ}</option>)}
            </select>
            <input className={inputCls} placeholder={t("dict.desc")} value={newAttr.description} onChange={(e) => setNewAttr({ ...newAttr, description: e.target.value })} />
            <Btn onClick={() => {
              if (!newAttr.name) return;
              act("add-attribute", {
                domainId: table.domainId,
                attribute: {
                  name: newAttr.name,
                  label: newAttr.name,
                  description: newAttr.description || newAttr.name,
                  dataType: newAttr.dataType,
                  sourceField: newAttr.name,
                  sourceSystem: "user_entered",
                  sampleValues: [],
                  required: false,
                  nullable: true,
                  synonyms: [],
                },
              });
              setNewAttr({ name: "", dataType: "String", description: "" });
            }}>{t("dict.addAttr")}</Btn>
          </div>
          </>
        )}
      </Panel>
    </div>
  );
}

export function ProfilingView() {
  const { ssot, act } = useSSOT();
  const { t } = useI18n();
  if (!ssot) return null;
  return (
    <Panel kicker="11_DATA_PROFILING" title={t("prof.title")} action={<Btn onClick={() => act("profile")}>{t("prof.refresh")}</Btn>}>
      {ssot.profiling.map((p) => (
        <div key={p.assetId} className="mb-6">
          <h3 className="text-lg">{p.domain} · {t("prof.rows", { n: p.rowCount })}</h3>
          <div className="mt-2 overflow-auto">
            <table className="min-w-[700px] text-sm">
              <thead className="text-xs uppercase text-[var(--ink-soft)]"><tr>{[t("prof.column"), t("prof.type"), t("prof.null"), t("prof.distinct"), t("prof.samples")].map((h) => <th key={h} className="pr-3 text-left">{h}</th>)}</tr></thead>
              <tbody>
                {p.columns.map((c) => (
                  <tr key={c.name} className="border-t border-[var(--rule)]">
                    <td className="py-1 pr-3">{c.name}</td>
                    <td>{c.inferredType}</td>
                    <td>{Math.round(c.nullRate * 100)}%</td>
                    <td>{c.distinctCount}</td>
                    <td className="text-[var(--ink-soft)]">{c.samples.join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
      {!ssot.profiling.length && <p className="text-sm text-[var(--ink-soft)]">{t("prof.empty")}</p>}
    </Panel>
  );
}

export function MappingView() {
  const { ssot, act } = useSSOT();
  const { t } = useI18n();
  if (!ssot) return null;
  return (
    <Panel kicker="04_DATA_MAPPING" title={t("map.title")} action={<Btn onClick={() => act("canonical")}>{t("map.rebuild")}</Btn>}>
      <table className="min-w-full text-sm">
        <thead className="text-xs uppercase text-[var(--ink-soft)]">
          <tr>{[t("map.source"), t("map.canonical"), t("map.transform"), t("map.conf"), t("map.status")].map((h) => <th key={h} className="pr-3 text-left">{h}</th>)}</tr>
        </thead>
        <tbody>
          {ssot.mapping.map((m) => (
            <tr key={m.id} className="border-t border-[var(--rule)]">
              <td className="py-1.5 pr-3">{m.sourceDomain}.{m.sourceField}</td>
              <td>{m.canonicalEntity}.{m.canonicalAttribute}</td>
              <td>{m.transform}</td>
              <td>{Math.round(m.confidence * 100)}%</td>
              <td><StatusBadge status={m.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}

export function CanonicalView() {
  const { ssot } = useSSOT();
  const { t } = useI18n();
  if (!ssot) return null;
  return (
    <Panel kicker="05_CANONICAL_MODEL" title={t("can.title")}>
      <div className="grid gap-3 md:grid-cols-2">
        {ssot.canonical.entities.map((e) => (
          <div key={e.id} className="rounded-xl border border-[var(--rule)] p-4">
            <div className="flex items-center justify-between"><h3 className="text-xl">{e.name}</h3><StatusBadge status={e.status} /></div>
            <ul className="mt-2 text-sm text-[var(--ink-soft)]">
              {e.attributes.map((a) => <li key={a.id}>{a.name}: {a.dataType} {a.required ? `· ${t("can.required")}` : ""}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function OntologyView() {
  const { ssot, act } = useSSOT();
  const { t } = useI18n();
  const [selectedEntity, setSelectedEntity] = useState<string>();
  const [selectedRel, setSelectedRel] = useState<string>();
  const [newName, setNewName] = useState("");
  if (!ssot) return null;
  const entity = ssot.ontology.entities.find((e) => e.id === selectedEntity);
  const rel = ssot.ontology.relationships.find((r) => r.id === selectedRel);

  return (
    <div className="space-y-4">
      <Panel kicker="06_ONTOLOGY · internal model SSOT" title={t("ont.title")} action={
        <div className="flex gap-2">
          <Btn tone="ghost" onClick={() => act("ontology")}>{t("ont.propose")}</Btn>
          <Btn tone="ghost" onClick={() => act("validate-ontology")}>{t("ont.validate")}</Btn>
          <Btn onClick={() => act("approve-ontology")}>{t("ont.approve")}</Btn>
        </div>
      }>
        <p className="mb-3 text-sm text-[var(--ink-soft)]">
          {t("ont.help", { status: ssot.ontology.metadata.status, version: ssot.ontology.metadata.version })}
        </p>
        <OntologyGraph
          model={ssot.ontology}
          onSelectEntity={(id) => { setSelectedEntity(id); setSelectedRel(undefined); }}
          onSelectRelationship={(id) => { setSelectedRel(id); setSelectedEntity(undefined); }}
          onConnectEntities={(sourceEntityId, targetEntityId) =>
            act("upsert-relationship", {
              relationship: { name: "relatedTo", sourceEntityId, targetEntityId, cardinality: "0..*" },
            })
          }
        />
        <div className="mt-4 flex flex-wrap gap-2">
          <input className={inputCls + " max-w-xs"} placeholder={t("ont.newEntity")} value={newName} onChange={(e) => setNewName(e.target.value)} />
          <Btn tone="ghost" onClick={() => { if (newName) { act("upsert-entity", { entity: { name: newName, label: newName } }); setNewName(""); } }}>{t("ont.addEntity")}</Btn>
          {ssot.ontology.entities.length >= 2 && (
            <Btn tone="ghost" onClick={() => act("upsert-relationship", { relationship: { name: "relatedTo", sourceEntityId: ssot.ontology.entities[0].id, targetEntityId: ssot.ontology.entities[1].id, cardinality: "0..*" } })}>
              {t("ont.sampleRel")}
            </Btn>
          )}
        </div>
      </Panel>
      {entity && (
        <Panel title={t("ont.entity", { name: entity.name })}>
          <Field label={t("ont.description")}>
            <textarea className={inputCls} defaultValue={entity.description} onBlur={(e) => act("upsert-entity", { entity: { id: entity.id, description: e.target.value } })} />
          </Field>
          <div className="mt-3 flex gap-2">
            <Btn tone="ghost" onClick={() => act("upsert-entity", { entity: { id: entity.id, status: "APPROVED" } })}>{t("ont.approveEntity")}</Btn>
            <Btn tone="ghost" onClick={() => act("delete-entity", { entityId: entity.id })}>{t("ont.delete")}</Btn>
          </div>
          <ul className="mt-3 text-sm">
            {entity.attributes.map((a) => (
              <li key={a.id} className="flex items-center justify-between border-t border-[var(--rule)] py-1">
                <span>{a.name} · {a.dataType} · {a.status} · conf {Math.round(a.confidence * 100)}%</span>
                <Btn tone="ghost" onClick={() => act("delete-ontology-attribute", { entityId: entity.id, attributeId: a.id })}>{t("ont.delete")}</Btn>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex gap-2">
            <input className={inputCls} placeholder={t("ont.newOattr")} id={`new-oattr-${entity.id}`} />
            <Btn tone="ghost" onClick={() => {
              const el = document.getElementById(`new-oattr-${entity.id}`) as HTMLInputElement | null;
              if (!el?.value) return;
              act("upsert-ontology-attribute", { entityId: entity.id, attribute: { name: el.value, dataType: "String" } });
              el.value = "";
            }}>{t("ont.addAttr")}</Btn>
          </div>
        </Panel>
      )}
      {rel && (
        <Panel title={t("ont.rel", { name: rel.name })}>
          <div className="grid gap-3 md:grid-cols-3">
            <Field label={t("ont.cardinality")}>
              <select className={inputCls} defaultValue={rel.cardinality} onChange={(e) => act("upsert-relationship", { relationship: { id: rel.id, cardinality: e.target.value } })}>
                {["0..1", "1..1", "0..*", "1..*"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label={t("ont.direction")}>
              <select className={inputCls} defaultValue={rel.direction} onChange={(e) => act("upsert-relationship", { relationship: { id: rel.id, direction: e.target.value } })}>
                <option value="forward">{t("ont.forward")}</option>
                <option value="bidirectional">{t("ont.bidirectional")}</option>
              </select>
            </Field>
          </div>
          <div className="mt-3 flex gap-2">
            <Btn tone="ghost" onClick={() => act("upsert-relationship", { relationship: { id: rel.id, status: "APPROVED" } })}>{t("ont.approve")}</Btn>
            <Btn tone="ghost" onClick={() => act("delete-relationship", { relationshipId: rel.id })}>{t("ont.delete")}</Btn>
          </div>
        </Panel>
      )}
      <Panel title={t("ont.issues")}>
        {ssot.ontology.validationIssues.map((i) => (
          <div key={i.id} className="border-t border-[var(--rule)] py-2 text-sm">
            <StatusBadge status={i.severity.toUpperCase()} /> <span className="font-mono text-xs">{i.rule}</span> — {i.message}
          </div>
        ))}
        {!ssot.ontology.validationIssues.length && <p className="text-sm text-[var(--ink-soft)]">{t("ont.noIssues")}</p>}
      </Panel>
    </div>
  );
}

export function ContractsView() {
  const { ssot, act } = useSSOT();
  const { t } = useI18n();
  if (!ssot) return null;
  return (
    <Panel kicker="07_DATA_CONTRACT" title={t("ctr.title")} action={<Btn onClick={() => act("contracts")}>{t("ctr.generate")}</Btn>}>
      {ssot.contracts.map((c) => (
        <div key={c.id} className="mb-4 rounded-xl border border-[var(--rule)] p-4">
          <div className="flex justify-between"><h3 className="text-xl">{c.name}</h3><span className="text-xs">v{c.version}</span></div>
          <p className="text-sm text-[var(--ink-soft)]">{c.qualityExpectations}</p>
          <table className="mt-2 w-full text-sm">
            <tbody>
              {c.fields.map((f) => (
                <tr key={f.name} className="border-t border-[var(--rule)]">
                  <td className="py-1">{f.name}</td>
                  <td>{f.dataType}</td>
                  <td>{f.required ? t("ctr.required") : t("ctr.optional")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </Panel>
  );
}

export function SystemsView() {
  const { ssot } = useSSOT();
  const { t } = useI18n();
  if (!ssot) return null;
  return (
    <Panel kicker="08_SYSTEM_INVENTORY" title={t("sys.title")}>
      {ssot.systems.map((s) => (
        <div key={s.id}>
          <h3 className="text-xl">{s.name}</h3>
          <p className="text-sm text-[var(--ink-soft)]">{s.description}</p>
          <ul className="mt-2 text-sm">
            {s.endpoints.map((e) => <li key={e.id} className="font-mono">{e.method} {e.path} — {e.description}</li>)}
          </ul>
        </div>
      ))}
    </Panel>
  );
}

export function BusinessView() {
  const { ssot, save } = useSSOT();
  const { t } = useI18n();
  if (!ssot) return null;
  const b = ssot.business;
  function patch(p: Partial<BusinessRequirement>) {
    save({ business: { ...b, ...p } });
  }
  return (
    <Panel kicker="01_BUSINESS_REQUIREMENT" title={t("biz.title")}>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label={t("biz.objective")}><textarea className={inputCls} defaultValue={b.objective} onBlur={(e) => patch({ objective: e.target.value })} /></Field>
        <Field label={t("biz.background")}><textarea className={inputCls} defaultValue={b.background} onBlur={(e) => patch({ background: e.target.value })} /></Field>
        <Field label={t("biz.current")}><textarea className={inputCls} defaultValue={b.currentWorkflow} onBlur={(e) => patch({ currentWorkflow: e.target.value })} /></Field>
        <Field label={t("biz.target")}><textarea className={inputCls} defaultValue={b.targetWorkflow} onBlur={(e) => patch({ targetWorkflow: e.target.value })} /></Field>
        <Field label={t("biz.value")}><textarea className={inputCls} defaultValue={b.businessValue} onBlur={(e) => patch({ businessValue: e.target.value })} /></Field>
        <Field label={t("biz.mvp")}><textarea className={inputCls} defaultValue={b.mvp} onBlur={(e) => patch({ mvp: e.target.value })} /></Field>
        <Field label={t("biz.primary")}><input className={inputCls} defaultValue={b.primaryUser} onBlur={(e) => patch({ primaryUser: e.target.value })} /></Field>
        <Field label={t("biz.secondary")}><input className={inputCls} defaultValue={b.secondaryUser} onBlur={(e) => patch({ secondaryUser: e.target.value })} /></Field>
        <Field label={t("biz.audience")}><input className={inputCls} defaultValue={b.targetAudience} onBlur={(e) => patch({ targetAudience: e.target.value })} /></Field>
        <Field label={t("biz.flow")}><textarea className={inputCls} defaultValue={b.userFlow} onBlur={(e) => patch({ userFlow: e.target.value })} /></Field>
        <Field label={t("biz.pain")}><textarea className={inputCls} defaultValue={b.painPoints.join("\n")} onBlur={(e) => patch({ painPoints: e.target.value.split("\n").filter(Boolean) })} /></Field>
        <Field label={t("biz.kpis")}><textarea className={inputCls} defaultValue={b.kpis.join("\n")} onBlur={(e) => patch({ kpis: e.target.value.split("\n").filter(Boolean) })} /></Field>
        <Field label={t("biz.personas")}><textarea className={inputCls} defaultValue={b.personas.join("\n")} onBlur={(e) => patch({ personas: e.target.value.split("\n").filter(Boolean) })} /></Field>
        <Field label={t("biz.in")}><textarea className={inputCls} defaultValue={b.inScope.join("\n")} onBlur={(e) => patch({ inScope: e.target.value.split("\n").filter(Boolean) })} /></Field>
        <Field label={t("biz.out")}><textarea className={inputCls} defaultValue={b.outOfScope.join("\n")} onBlur={(e) => patch({ outOfScope: e.target.value.split("\n").filter(Boolean) })} /></Field>
        <Field label={t("biz.future")}><textarea className={inputCls} defaultValue={b.futureScope.join("\n")} onBlur={(e) => patch({ futureScope: e.target.value.split("\n").filter(Boolean) })} /></Field>
        <Field label={t("biz.bconst")}><textarea className={inputCls} defaultValue={b.businessConstraints.join("\n")} onBlur={(e) => patch({ businessConstraints: e.target.value.split("\n").filter(Boolean) })} /></Field>
        <Field label={t("biz.tconst")}><textarea className={inputCls} defaultValue={b.technicalConstraints.join("\n")} onBlur={(e) => patch({ technicalConstraints: e.target.value.split("\n").filter(Boolean) })} /></Field>
        <Field label={t("biz.dconst")}><textarea className={inputCls} defaultValue={b.dataConstraints.join("\n")} onBlur={(e) => patch({ dataConstraints: e.target.value.split("\n").filter(Boolean) })} /></Field>
        <Field label={t("biz.deps")}><textarea className={inputCls} defaultValue={b.dependencies.join("\n")} onBlur={(e) => patch({ dependencies: e.target.value.split("\n").filter(Boolean) })} /></Field>
        <Field label={t("biz.legal")}><textarea className={inputCls} defaultValue={b.legalConstraints.join("\n")} onBlur={(e) => patch({ legalConstraints: e.target.value.split("\n").filter(Boolean) })} /></Field>
        <Field label={t("biz.risks")}><textarea className={inputCls} defaultValue={b.risks.join("\n")} onBlur={(e) => patch({ risks: e.target.value.split("\n").filter(Boolean) })} /></Field>
        <Field label={t("biz.assumptions")}><textarea className={inputCls} defaultValue={b.assumptions.join("\n")} onBlur={(e) => patch({ assumptions: e.target.value.split("\n").filter(Boolean) })} /></Field>
        <Field label={t("biz.ux")}><textarea className={inputCls} defaultValue={b.uxRequirements} onBlur={(e) => patch({ uxRequirements: e.target.value })} /></Field>
        <Field label={t("biz.screen")}><textarea className={inputCls} defaultValue={b.screenRequirements} onBlur={(e) => patch({ screenRequirements: e.target.value })} /></Field>
        <Field label={t("biz.figma")}><textarea className={inputCls} defaultValue={b.figmaRefs.join("\n")} onBlur={(e) => patch({ figmaRefs: e.target.value.split("\n").filter(Boolean) })} /></Field>
      </div>
    </Panel>
  );
}

export function ArchitectureView() {
  const { ssot, save } = useSSOT();
  const { t } = useI18n();
  if (!ssot) return null;
  const a = ssot.architecture;
  return (
    <Panel kicker="14_ARCHITECTURE" title={t("arch.title")}>
      <Field label={t("arch.overview")}><textarea className={inputCls + " min-h-32"} defaultValue={a.overview} onBlur={(e) => save({ architecture: { ...a, overview: e.target.value } })} /></Field>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <Field label={t("arch.patterns")}><textarea className={inputCls} defaultValue={a.patterns.join("\n")} onBlur={(e) => save({ architecture: { ...a, patterns: e.target.value.split("\n").filter(Boolean) } })} /></Field>
        <Field label={t("arch.components")}><textarea className={inputCls} defaultValue={a.components.join("\n")} onBlur={(e) => save({ architecture: { ...a, components: e.target.value.split("\n").filter(Boolean) } })} /></Field>
        <Field label={t("arch.integrations")}><textarea className={inputCls} defaultValue={a.integrations.join("\n")} onBlur={(e) => save({ architecture: { ...a, integrations: e.target.value.split("\n").filter(Boolean) } })} /></Field>
        <Field label={t("arch.nfrs")}><textarea className={inputCls} defaultValue={a.nfrs.join("\n")} onBlur={(e) => save({ architecture: { ...a, nfrs: e.target.value.split("\n").filter(Boolean) } })} /></Field>
      </div>
    </Panel>
  );
}

export function WorkflowsView() {
  const { ssot, save } = useSSOT();
  const { t } = useI18n();
  const [name, setName] = useState("");
  if (!ssot) return null;
  return (
    <Panel kicker="09_WORKFLOW" title={t("wf.title")}>
      {ssot.workflows.map((w) => (
        <div key={w.id} className="mb-3 rounded-lg border border-[var(--rule)] p-3">
          <strong>{w.name}</strong>
          <p className="text-sm text-[var(--ink-soft)]">{w.description}</p>
        </div>
      ))}
      <div className="mt-3 flex gap-2">
        <input className={inputCls} placeholder={t("wf.name")} value={name} onChange={(e) => setName(e.target.value)} />
        <Btn onClick={() => {
          if (!name) return;
          save({ workflows: [...ssot.workflows, { id: crypto.randomUUID(), name, description: "", steps: [] }] });
          setName("");
        }}>{t("wf.add")}</Btn>
      </div>
    </Panel>
  );
}

export function SecurityView() {
  const { ssot, save } = useSSOT();
  const { t } = useI18n();
  if (!ssot) return null;
  return (
    <Panel kicker="12_SECURITY" title={t("sec.title")}>
      {ssot.security.map((s) => (
        <div key={s.id} className="border-t border-[var(--rule)] py-2 text-sm"><strong>{s.topic}</strong> · {s.classification} — {s.note}</div>
      ))}
      <Btn tone="ghost" onClick={() => save({ security: [...ssot.security, { id: crypto.randomUUID(), topic: "PII", classification: "confidential", note: t("sec.piiNote") }] })}>{t("sec.add")}</Btn>
    </Panel>
  );
}

export function GapsView() {
  const { ssot, save } = useSSOT();
  const { t } = useI18n();
  const [title, setTitle] = useState("");
  if (!ssot) return null;
  return (
    <Panel kicker="13_GAP_AND_DECISION_LOG" title={t("gap.title")}>
      {ssot.gapLog.map((g) => (
        <div key={g.id} className="mb-2 rounded-lg border border-[var(--rule)] p-3 text-sm">
          <div className="flex justify-between"><strong>{g.title}</strong><StatusBadge status={g.status} /></div>
          <p className="text-[var(--ink-soft)]">{g.description}</p>
        </div>
      ))}
      <div className="mt-3 flex gap-2">
        <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("gap.ph")} />
        <Btn onClick={() => {
          if (!title) return;
          save({ gapLog: [...ssot.gapLog, { id: crypto.randomUUID(), title, description: "", status: "open", createdAt: new Date().toISOString() }] });
          setTitle("");
        }}>{t("gap.log")}</Btn>
      </div>
    </Panel>
  );
}

export function DocumentsView() {
  const { ssot, act } = useSSOT();
  const { t } = useI18n();
  const [kind, setKind] = useState("prd");
  const [copied, setCopied] = useState(false);
  if (!ssot) return null;
  const doc = ssot.documents.find((d) => d.kind === kind) ?? ssot.documents[0];
  const href = doc ? `/api/projects/${ssot.id}/documents/${doc.kind}` : "";

  async function copyDoc() {
    if (!doc) return;
    await navigator.clipboard.writeText(doc.markdown);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Panel kicker={t("doc.kicker")} title={t("doc.title")} action={<Btn onClick={() => act("documents")}>{t("doc.regen")}</Btn>}>
      <div className="mb-4 flex flex-wrap gap-2">
        {ssot.documents.map((d) => (
          <div key={d.id} className="flex overflow-hidden rounded-full border border-[var(--rule)]">
            <button
              onClick={() => setKind(d.kind)}
              className={`px-3 py-1 text-sm ${d.kind === doc?.kind ? "bg-[var(--ink)] text-white" : "bg-[var(--paper-2)]"}`}
            >
              {d.title}
            </button>
            <a
              href={`/api/projects/${ssot.id}/documents/${d.kind}`}
              download
              title={t("doc.download")}
              className={`border-l px-2 py-1 text-xs ${d.kind === doc?.kind ? "border-white/20 bg-[var(--ink)] text-white" : "border-[var(--rule)] bg-white text-[var(--ink-soft)]"}`}
            >
              {t("doc.download")}
            </a>
          </div>
        ))}
      </div>
      {doc ? (
        <>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
            <p className="text-[var(--ink-soft)]">
              {t("doc.generated", { when: new Date(doc.generatedAt).toLocaleString(), version: doc.ssotVersion })}
            </p>
            <div className="flex gap-2">
              <Btn tone="ghost" onClick={copyDoc}>{copied ? t("doc.copied") : t("doc.copy")}</Btn>
              <a className="rounded-lg bg-[var(--rust)] px-3 py-1.5 text-sm text-white" href={href} download>
                {t("doc.downloadThis")}
              </a>
            </div>
          </div>
          <MarkdownView markdown={doc.markdown} />
        </>
      ) : (
        <p className="text-sm">{t("doc.empty")}</p>
      )}
    </Panel>
  );
}

export function ImpactView() {
  const { ssot, act } = useSSOT();
  const { t } = useI18n();
  if (!ssot) return null;
  return (
    <Panel kicker="Change impact" title={t("imp.title")}>
      {ssot.impactQueue.map((i) => (
        <div key={i.id} className="mb-3 rounded-xl border border-[var(--rule)] p-4">
          <div className="text-xs text-[var(--ink-soft)]">{i.createdAt}</div>
          <h3 className="text-lg">{t("imp.changed", { label: i.changedLabel })}</h3>
          <p className="text-sm">{t("imp.affected")}</p>
          <ul className="text-sm">{i.affected.map((a) => <li key={a}>✓ {a}</li>)}</ul>
          <div className="mt-2 flex gap-2">
            <Btn tone="ghost" onClick={() => act("ack-impact", { impactId: i.id })}>{t("imp.ack")}</Btn>
            <Btn onClick={() => act("pipeline", { targets: i.affected })}>{t("imp.regen")}</Btn>
          </div>
        </div>
      ))}
      {!ssot.impactQueue.length && <p className="text-sm text-[var(--ink-soft)]">{t("imp.empty")}</p>}
    </Panel>
  );
}

export function LineageView() {
  const { ssot } = useSSOT();
  const { t } = useI18n();
  const [attributeId, setAttributeId] = useState("");
  const [chain, setChain] = useState<{ stage: string; value?: string }[]>([]);
  const attrs = useMemo(() => ssot?.dictionary.tables.flatMap((tbl) => tbl.attributes.map((a) => ({ ...a, domain: tbl.domainName }))) ?? [], [ssot]);
  if (!ssot) return null;
  return (
    <Panel kicker="Traceability" title={t("lin.title")}>
      <select className={inputCls} value={attributeId} onChange={async (e) => {
        setAttributeId(e.target.value);
        const res = await fetch(`/api/projects/${ssot.id}/actions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "lineage", attributeId: e.target.value }) });
        const data = await res.json();
        setChain(data.lineage ?? []);
      }}>
        <option value="">{t("lin.select")}</option>
        {attrs.map((a) => <option key={a.id} value={a.id}>{a.domain}.{a.name}</option>)}
      </select>
      <ol className="mt-4 space-y-2">
        {chain.map((c) => (
          <li key={c.stage} className="rounded-lg border border-[var(--rule)] px-3 py-2 text-sm">
            <div className="text-[11px] uppercase tracking-widest text-[var(--rust)]">{c.stage}</div>
            {c.value || "—"}
          </li>
        ))}
      </ol>
    </Panel>
  );
}

export function SamplesView() {
  const { ssot } = useSSOT();
  const { t } = useI18n();
  const [assetId, setAssetId] = useState("");
  const [preview, setPreview] = useState<{ columns: string[]; rows: Record<string, string>[] } | null>(null);
  if (!ssot) return null;
  const grouped = ssot.domainRegistry.domains.filter((d) => d.status === "ACTIVE");
  return (
    <Panel kicker="10_SAMPLE_DATA" title={t("sam.title")}>
      <p className="mb-3 text-sm text-[var(--ink-soft)]">{t("sam.help")}</p>
      {grouped.map((d) => {
        const assets = ssot.inventory.assets.filter((a) => d.sourceAssetIds.includes(a.id));
        return (
          <div key={d.id} className="mb-4 rounded-xl border border-[var(--rule)] p-3">
            <h3 className="text-lg">{d.name}</h3>
            {assets.map((a) => (
              <div key={a.id} className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                <span>{a.dataAsset} · {a.rowCount ?? a.volume} · {t("sam.columns", { n: a.columns?.length ?? 0 })}</span>
                <div className="flex gap-2">
                  {a.fileName && <a className="underline" href={`/api/projects/${ssot.id}/uploads/${a.fileName}`}>{t("sam.download")}</a>}
                  <Btn tone="ghost" onClick={async () => {
                    setAssetId(a.id);
                    const res = await fetch(`/api/projects/${ssot.id}/sample?assetId=${a.id}`);
                    const data = await res.json();
                    setPreview({ columns: data.columns ?? [], rows: data.rows ?? [] });
                  }}>{t("sam.preview")}</Btn>
                </div>
              </div>
            ))}
          </div>
        );
      })}
      {preview && (
        <div className="mt-4 overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr>{preview.columns.map((c) => <th key={c} className="pr-3 text-left">{c}</th>)}</tr>
            </thead>
            <tbody>
              {preview.rows.map((row, i) => (
                <tr key={`${assetId}-${i}`} className="border-t border-[var(--rule)]">
                  {preview.columns.map((c) => <td key={c} className="py-1 pr-3">{row[c]}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

export function PackageView() {
  const { ssot } = useSSOT();
  const { t } = useI18n();
  if (!ssot) return null;
  const domains = ssot.domainRegistry.domains.filter((d) => d.status === "ACTIVE");
  return (
    <Panel kicker="Customer Data Package" title={t("pkg.title")} action={
      <a className="rounded-lg bg-[var(--rust)] px-3 py-1.5 text-sm text-white" href={`/api/projects/${ssot.id}/package`}>{t("pkg.download")}</a>
    }>
      <p className="text-sm text-[var(--ink-soft)]">{t("pkg.help")}</p>
      <pre className="mt-4 overflow-auto rounded-xl bg-[var(--ink)] p-4 text-[12px] leading-relaxed text-[var(--paper)]">{`Customer_Data_Package/
├── 00_README/
├── 01_DATA_INVENTORY/
├── 02_DATA_DICTIONARY/
├── DATA/
${domains.map((d) => `│   ├── ${d.name}/`).join("\n") || `│   └── ${t("pkg.none")}`}
├── 03_MAPPING/
├── 04_CANONICAL_MODEL/
├── 05_ONTOLOGY/
├── 06_DATA_CONTRACT/
├── 07_SYSTEM/
├── 08_WORKFLOW/
├── 09_SAMPLE_DATA/
├── 10_PROFILING/
├── 11_SECURITY/
└── 12_GAP_AND_DECISION_LOG/`}</pre>
      <div className="mt-4 flex gap-3 text-sm">
        <a className="underline" href={`/api/projects/${ssot.id}/owl`}>ontology.owl</a>
        <a className="underline" href={`/api/projects/${ssot.id}/owl?format=ttl`}>ontology.ttl</a>
        <a className="underline" href={`/api/projects/${ssot.id}/owl?format=rdf`}>ontology.rdf</a>
      </div>
    </Panel>
  );
}

export function renderSection(section: string, ssot: ProjectSSOT | null) {
  void ssot;
  switch (section) {
    case "intake": return <IntakeView />;
    case "inventory": return <InventoryView />;
    case "domains": return <DomainsView />;
    case "dictionary": return <DictionaryView />;
    case "profiling": return <ProfilingView />;
    case "mapping": return <MappingView />;
    case "canonical": return <CanonicalView />;
    case "ontology": return <OntologyView />;
    case "contracts": return <ContractsView />;
    case "systems": return <SystemsView />;
    case "business": return <BusinessView />;
    case "architecture": return <ArchitectureView />;
    case "workflows": return <WorkflowsView />;
    case "samples": return <SamplesView />;
    case "security": return <SecurityView />;
    case "gaps": return <GapsView />;
    case "documents": return <DocumentsView />;
    case "impact": return <ImpactView />;
    case "lineage": return <LineageView />;
    case "package": return <PackageView />;
    default: return <OverviewView />;
  }
}
