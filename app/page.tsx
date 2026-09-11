"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LangToggle } from "@/components/LangToggle";
import { useI18n } from "@/lib/i18n/LocaleProvider";

type Summary = {
  id: string;
  name: string;
  code: string;
  customer: string;
  updatedAt: string;
  version: number;
  domains: string[];
  status: string;
};

export default function HomePage() {
  const { t } = useI18n();
  const [projects, setProjects] = useState<Summary[]>([]);
  const [name, setName] = useState("");
  const [customer, setCustomer] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const res = await fetch("/api/projects");
    setProjects(await res.json());
  }

  useEffect(() => {
    refresh();
  }, []);

  async function createProject(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, customer, description, owner: "project-manager" }),
    });
    const project = await res.json();
    setBusy(false);
    window.location.href = `/projects/${project.id}/intake`;
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs tracking-[0.25em] uppercase text-[var(--rust)]">{t("home.kicker")}</p>
        <LangToggle />
      </div>
      <h1 className="mt-3 max-w-3xl text-5xl leading-[1.1] text-[var(--ink)]">{t("home.title")}</h1>
      <p className="mt-5 max-w-2xl text-[var(--ink-soft)] leading-relaxed">{t("home.lead")}</p>

      <div className="mt-10 grid gap-8 md:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-2xl border border-[var(--rule)] bg-white/70 p-6 shadow-sm">
          <h2 className="text-2xl">{t("home.projects")}</h2>
          <div className="mt-4 space-y-3">
            {projects.length === 0 && (
              <p className="text-sm text-[var(--ink-soft)]">{t("home.empty")}</p>
            )}
            {projects.map((p) => (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="block rounded-xl border border-[var(--rule)] bg-[var(--paper)] px-4 py-3 hover:border-[var(--rust)]"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <strong>{p.name}</strong>
                  <span className="text-xs text-[var(--ink-soft)]">v{p.version}</span>
                </div>
                <div className="mt-1 text-sm text-[var(--ink-soft)]">
                  {p.code} · {p.customer || t("home.noCustomer")} · {t("home.domainsCount", { n: p.domains.length })}
                </div>
                {p.domains.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {p.domains.map((d) => (
                      <span key={d} className="rounded-full bg-white px-2 py-0.5 text-[11px] tracking-wide">
                        {d}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </section>

        <form onSubmit={createProject} className="rounded-2xl border border-[var(--rule)] bg-[var(--ink)] p-6 text-[var(--paper)]">
          <h2 className="text-2xl text-[var(--paper)]">{t("home.newProject")}</h2>
          <p className="mt-1 text-sm text-[var(--gold)]">{t("home.newHint")}</p>
          <label className="mt-5 block text-xs uppercase tracking-widest text-[var(--gold)]">{t("home.projectName")}</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm"
            placeholder={t("home.namePlaceholder")}
          />
          <label className="mt-4 block text-xs uppercase tracking-widest text-[var(--gold)]">{t("home.customer")}</label>
          <input
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm"
            placeholder={t("home.customerPlaceholder")}
          />
          <label className="mt-4 block text-xs uppercase tracking-widest text-[var(--gold)]">{t("home.description")}</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 min-h-24 w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm"
            placeholder={t("home.descPlaceholder")}
          />
          <button
            disabled={busy}
            className="mt-5 w-full rounded-lg bg-[var(--rust)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--rust-deep)] disabled:opacity-60"
          >
            {busy ? t("home.creating") : t("home.create")}
          </button>
        </form>
      </div>
    </main>
  );
}
