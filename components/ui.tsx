export function StatusBadge({ status }: { status: string }) {
  const tone: Record<string, string> = {
    APPROVED: "bg-emerald-100 text-emerald-900",
    VALIDATED: "bg-teal-100 text-teal-900",
    ACTIVE: "bg-emerald-100 text-emerald-900",
    AI_GENERATED: "bg-amber-100 text-amber-950",
    PENDING_REVIEW: "bg-orange-100 text-orange-950",
    USER_MODIFIED: "bg-sky-100 text-sky-950",
    REJECTED: "bg-rose-100 text-rose-950",
    DEPRECATED: "bg-stone-200 text-stone-700",
    ARCHIVED: "bg-stone-200 text-stone-600",
    DRAFT: "bg-stone-100 text-stone-700",
  };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide ${tone[status] ?? "bg-stone-100"}`}>
      {status}
    </span>
  );
}

export function KindBadge({ kind }: { kind: string }) {
  return (
    <span className="rounded border border-[var(--rule)] px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-[var(--ink-soft)]">
      {kind}
    </span>
  );
}

export function Panel({ title, kicker, children, action }: { title: string; kicker?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[var(--rule)] bg-white/75 p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          {kicker && <div className="text-[10px] uppercase tracking-[0.22em] text-[var(--rust)]">{kicker}</div>}
          <h2 className="text-2xl">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Btn({
  children,
  onClick,
  tone = "rust",
  disabled,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  tone?: "rust" | "ink" | "ghost";
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  const cls =
    tone === "ghost"
      ? "border border-[var(--rule)] bg-white"
      : tone === "ink"
        ? "bg-[var(--ink)] text-[var(--paper)]"
        : "bg-[var(--rust)] text-white";
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-sm disabled:opacity-50 ${cls}`}
    >
      {children}
    </button>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="text-[11px] uppercase tracking-widest text-[var(--ink-soft)]">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

export const inputCls =
  "w-full rounded-lg border border-[var(--rule)] bg-white px-3 py-2 text-sm text-[var(--ink)]";
