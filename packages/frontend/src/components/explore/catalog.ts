/**
 * Pure helpers for the /models catalog: grouping by lab and search matching.
 */
import type { ExploreSort, ModelUsageRow } from "@/lib/explore";

export const UNKNOWN_LAB_KEY = "unknown";
export const UNKNOWN_LAB_NAME = "Lab unknown";

export interface LabGroup {
  /** labSlug, or UNKNOWN_LAB_KEY when the lab is not identified. */
  key: string;
  name: string;
  /** Slug for /capital/companies/[slug], or null. */
  slug: string | null;
  models: ModelUsageRow[];
}

function metric(row: ModelUsageRow, sort: ExploreSort): number {
  return sort === "tokens" ? row.tokens : row.activeUsers;
}

/**
 * Group models by lab. Models inside a lab follow the sort; labs are ordered
 * by their strongest model on the same metric, with the unknown lab last.
 */
export function groupModelsByLab(rows: readonly ModelUsageRow[], sort: ExploreSort): LabGroup[] {
  const groups = new Map<string, LabGroup>();
  for (const row of rows) {
    const key = row.labSlug ?? (row.lab ? row.lab.toLowerCase().replace(/[^a-z0-9]+/g, "-") : UNKNOWN_LAB_KEY);
    const existing = groups.get(key);
    if (existing) {
      existing.models.push(row);
    } else {
      groups.set(key, { key, name: row.lab ?? UNKNOWN_LAB_NAME, slug: row.labSlug, models: [row] });
    }
  }

  const list = [...groups.values()];
  for (const group of list) {
    group.models.sort((a, b) => metric(b, sort) - metric(a, sort) || a.name.localeCompare(b.name));
  }
  return list.sort((a, b) => {
    if (a.key === UNKNOWN_LAB_KEY) return 1;
    if (b.key === UNKNOWN_LAB_KEY) return -1;
    return metric(b.models[0], sort) - metric(a.models[0], sort) || a.name.localeCompare(b.name);
  });
}

/** Case-insensitive match on model name, key and lab. Every word must match. */
export function matchesModelQuery(row: Pick<ModelUsageRow, "name" | "key" | "lab">, query: string): boolean {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = `${row.name} ${row.key} ${row.lab ?? UNKNOWN_LAB_NAME}`.toLowerCase();
  return words.every((word) => haystack.includes(word));
}
