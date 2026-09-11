"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ProjectSSOT } from "@/lib/ssot/types";

type Ctx = {
  ssot: ProjectSSOT | null;
  loading: boolean;
  error: string;
  reload: () => Promise<void>;
  save: (patch: Partial<ProjectSSOT>) => Promise<void>;
  act: (action: string, extra?: Record<string, unknown>) => Promise<ProjectSSOT | null>;
};

const C = createContext<Ctx | null>(null);

export function SSOTProvider({ id, children }: { id: string; children: React.ReactNode }) {
  const [ssot, setSsot] = useState<ProjectSSOT | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/projects/${id}`);
    if (!res.ok) setError("Project not found");
    else setSsot(await res.json());
    setLoading(false);
  }, [id]);

  useEffect(() => {
    reload();
  }, [reload]);

  const save = async (patch: Partial<ProjectSSOT>) => {
    const res = await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setSsot(await res.json());
  };

  const act = async (action: string, extra: Record<string, unknown> = {}) => {
    const res = await fetch(`/api/projects/${id}/actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, actor: "user", ...extra }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Action failed");
      return null;
    }
    if (data.id) setSsot(data);
    return data as ProjectSSOT;
  };

  return <C.Provider value={{ ssot, loading, error, reload, save, act }}>{children}</C.Provider>;
}

export function useSSOT() {
  const ctx = useContext(C);
  if (!ctx) throw new Error("useSSOT outside provider");
  return ctx;
}
