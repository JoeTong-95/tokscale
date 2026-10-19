/**
 * Explore data entry point. Pages import only from here.
 *
 * Currently fixture-backed. The data workstream replaces these bodies with
 * database rollups (same signatures, same types).
 */
import { fixtureAgents, fixtureHumans, fixtureModelDetail, fixtureModels, fixtureSnapshot, fixtureCoverage } from "./fixtures";
import type {
  AgentUsageRow,
  CommunitySnapshot,
  HumanRow,
  LeaderboardQuery,
  ModelDetail,
  ModelUsageRow,
  Ranked,
  ExplorePeriod,
} from "./types";

export * from "./types";

function page<T>(rows: T[], q: LeaderboardQuery): T[] {
  const offset = q.offset ?? 0;
  return rows.slice(offset, offset + (q.limit ?? 50));
}

function sortRows<T extends { activeUsers: number; tokens: number; rank: number }>(rows: T[], sort: LeaderboardQuery["sort"]): T[] {
  const sorted = [...rows].sort((a, b) => (sort === "tokens" ? b.tokens - a.tokens : b.activeUsers - a.activeUsers));
  return sorted.map((r, i) => ({ ...r, rank: i + 1 }));
}

export async function getModelLeaderboard(q: LeaderboardQuery = {}): Promise<Ranked<ModelUsageRow>> {
  const period = q.period ?? "30d";
  return { rows: page(sortRows(fixtureModels(period), q.sort), q), coverage: fixtureCoverage(period) };
}

export async function getAgentLeaderboard(q: LeaderboardQuery = {}): Promise<Ranked<AgentUsageRow>> {
  const period = q.period ?? "30d";
  return { rows: page(sortRows(fixtureAgents(period), q.sort), q), coverage: fixtureCoverage(period) };
}

export async function getHumansLeaderboard(q: LeaderboardQuery = {}): Promise<Ranked<HumanRow>> {
  const period = q.period ?? "30d";
  return { rows: page(fixtureHumans(period), q), coverage: fixtureCoverage(period) };
}

export async function getModelDetail(key: string, period: ExplorePeriod = "30d"): Promise<ModelDetail | null> {
  return fixtureModelDetail(key, period);
}

export async function getCommunitySnapshot(period: ExplorePeriod = "30d"): Promise<CommunitySnapshot> {
  return fixtureSnapshot(period);
}

/** Canonical keys of models with enough data for an indexable page. */
export async function listModelKeys(): Promise<string[]> {
  return fixtureModels("all").map((m) => m.key);
}
