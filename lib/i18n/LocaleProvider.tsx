"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { en, ko, type MessageKey } from "./messages";

export type Locale = "en" | "ko";

const STORAGE_KEY = "pssot-locale";
const catalogs: Record<Locale, Record<MessageKey, string>> = { en, ko };

type Ctx = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
};

const C = createContext<Ctx | null>(null);

function detectLocale(): Locale {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "en" || stored === "ko") return stored;
  return navigator.language.toLowerCase().startsWith("ko") ? "ko" : "en";
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    setLocaleState(detectLocale());
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const t = useCallback(
    (key: MessageKey, vars?: Record<string, string | number>) => {
      let out = catalogs[locale][key] ?? catalogs.en[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          out = out.replaceAll(`{${k}}`, String(v));
        }
      }
      return out;
    },
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);
  return <C.Provider value={value}>{children}</C.Provider>;
}

export function useI18n() {
  const ctx = useContext(C);
  if (!ctx) throw new Error("useI18n outside LocaleProvider");
  return ctx;
}
