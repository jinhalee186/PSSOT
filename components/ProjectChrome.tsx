"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SECTIONS } from "@/lib/nav";
import { useI18n } from "@/lib/i18n/LocaleProvider";
import type { MessageKey } from "@/lib/i18n/messages";
import { LangToggle } from "./LangToggle";
import { useSSOT } from "./SSOTProvider";
import { Btn, StatusBadge } from "./ui";

const NAV_KEYS: Record<string, MessageKey> = {
  "": "nav.overview",
  intake: "nav.intake",
  business: "nav.business",
  inventory: "nav.inventory",
  domains: "nav.domains",
  dictionary: "nav.dictionary",
  profiling: "nav.profiling",
  mapping: "nav.mapping",
  canonical: "nav.canonical",
  ontology: "nav.ontology",
  contracts: "nav.contracts",
  systems: "nav.systems",
  workflows: "nav.workflows",
  samples: "nav.samples",
  security: "nav.security",
  gaps: "nav.gaps",
  architecture: "nav.architecture",
  documents: "nav.documents",
  impact: "nav.impact",
  lineage: "nav.lineage",
  package: "nav.package",
};

export function ProjectChrome({ children }: { children: React.ReactNode }) {
  const { ssot, loading, error, act } = useSSOT();
  const { t } = useI18n();
  const pathname = usePathname();
  if (loading) return <p className="p-10 text-[var(--ink-soft)]">{t("chrome.loading")}</p>;
  if (!ssot) return <p className="p-10">{error || t("chrome.missing")}</p>;
  const base = `/projects/${ssot.id}`;

  return (
    <div className="min-h-screen grid grid-cols-[260px_1fr]">
      <aside className="border-r border-[var(--rule)] bg-[var(--ink)] text-[var(--paper)]">
        <div className="p-5">
          <Link href="/" className="text-[10px] uppercase tracking-[0.25em] text-[var(--gold)]">
            PSSOT
          </Link>
          <h1 className="mt-2 text-xl leading-tight">{ssot.project.name}</h1>
          <p className="mt-1 text-xs text-white/60">
            {ssot.project.code} · v{ssot.version}
          </p>
          <div className="mt-2">
            <StatusBadge status={ssot.project.status} />
          </div>
          <Link
            href="/"
            title={t("chrome.dashboardHint")}
            className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-[var(--paper)] hover:bg-white/10"
          >
            ← {t("chrome.dashboard")}
          </Link>
          <div className="mt-3">
            <LangToggle tone="dark" />
          </div>
        </div>
        <nav className="px-2 pb-8">
          {SECTIONS.map((s) => {
            const href = s.slug ? `${base}/${s.slug}` : base;
            const active = pathname === href;
            return (
              <Link
                key={s.code}
                href={href}
                className={`mb-0.5 block rounded-lg px-3 py-1.5 text-[13px] ${active ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5"}`}
              >
                <span className="mr-2 font-mono text-[10px] text-[var(--gold)]">{s.code.split("_")[0]}</span>
                {t(NAV_KEYS[s.slug] ?? "nav.overview")}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="min-w-0">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--rule)] px-6 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="rounded-lg border border-[var(--rule)] bg-white px-3 py-1.5 text-sm hover:border-[var(--rust)]"
            >
              ← {t("chrome.dashboard")}
            </Link>
            <div className="text-sm text-[var(--ink-soft)]">
              {t("chrome.stats", {
                domains: ssot.domainRegistry.domains.filter((d) => d.status === "ACTIVE").length,
                attrs: ssot.dictionary.tables.reduce((n, t) => n + t.attributes.length, 0),
                status: ssot.ontology.metadata.status,
              })}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <LangToggle />
            <Btn tone="ghost" onClick={() => act("sync-domains")}>
              {t("chrome.sync")}
            </Btn>
            <Btn onClick={() => act("pipeline")}>{t("chrome.regen")}</Btn>
          </div>
        </header>
        {error && <div className="mx-6 mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-900">{error}</div>}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
