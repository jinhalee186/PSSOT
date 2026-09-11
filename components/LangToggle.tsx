"use client";

import { useI18n, type Locale } from "@/lib/i18n/LocaleProvider";

export function LangToggle({ tone = "light" }: { tone?: "light" | "dark" }) {
  const { locale, setLocale, t } = useI18n();
  const base =
    tone === "dark"
      ? "border-white/20 text-white/80"
      : "border-[var(--rule)] text-[var(--ink-soft)] bg-white";
  const on =
    tone === "dark" ? "bg-white/15 text-white" : "bg-[var(--ink)] text-[var(--paper)]";

  return (
    <div className={`inline-flex overflow-hidden rounded-lg border text-xs ${base}`} role="group" aria-label={t("lang.switch")}>
      {(["en", "ko"] as Locale[]).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code)}
          className={`px-2.5 py-1.5 ${locale === code ? on : "hover:bg-black/5"}`}
        >
          {code === "en" ? t("lang.en") : t("lang.ko")}
        </button>
      ))}
    </div>
  );
}
