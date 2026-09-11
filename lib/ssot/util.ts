export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "domain";
}

export function titleFromField(name: string): string {
  return name
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function id(prefix = ""): string {
  const raw = crypto.randomUUID();
  return prefix ? `${prefix}_${raw.slice(0, 8)}` : raw;
}

export function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}
