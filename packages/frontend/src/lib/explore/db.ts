/**
 * Database rollups for the explore surfaces.
 *
 * Reads daily_breakdown.source_breakdown (the JSON the submit route writes:
 * client -> { tokens, cost, ..., models: { rawModelId -> {...} } }) and folds it
 * into facts that ./rollup.ts aggregates. Accounts with
 * users.leaderboard_hidden = true are excluded in every query.
 *
 * Every public loader is wrapped in unstable_cache (revalidate 600 s). The
 * compute* functions are exported uncached for scripts and measurements.
 */
import { unstable_cache } from "next/cache";
import { sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { isIdentifiedModelKey, modelKey } from "./modelKey";
import {
  buildModelCatalog,
  buildModelDetail,
  buildPeriodRollup,
  type CatalogEntry,
  type ModelCatalog,
  type ModelUserClientCell,
  type PeriodRollup,
  type UsageFact,
  type UserTotals,
} from "./rollup";
import type { ExplorePeriod, ModelDetail } from "./types";
import { maxAnchorDate, queryStart, resolveWindow, toIsoDate, type ExploreWindow } from "./window";

export const EXPLORE_REVALIDATE_SECONDS = 600;
// v2: ModelRef gained logoUrl and more families got a lab. v3: Muse models attributed to Meta. v4: QwQ name.
// v5: agent icons come from the README icons.
const CACHE_VERSION = "v5";
const TAGS = ["explore"];

/** Visible (not leaderboard-hidden) day rows. */
const VISIBLE_DAYS = sql`
  daily_breakdown d
  INNER JOIN submissions s ON s.id = d.submission_id
  INNER JOIN users u ON u.id = s.user_id
`;

/**
 * Model cells of one client entry. Rows written before per-model maps existed
 * carry a single legacy `modelId` (or nothing): treat the client entry itself
 * as that one model, so its tokens still count (as "unknown" when unnamed).
 */
const MODEL_CELLS = sql`
  jsonb_each(
    CASE
      WHEN jsonb_typeof(c.value->'models') = 'object' AND c.value->'models' <> '{}'::jsonb
        THEN c.value->'models'
      ELSE jsonb_build_object(COALESCE(NULLIF(c.value->>'modelId', ''), 'unknown'), c.value)
    END
  ) AS m(key, value)
`;

const CELL_TOKENS = sql`COALESCE((m.value->>'tokens')::float8, 0)`;

function num(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function parseJsonArray<T>(value: unknown): T[] {
  const parsed = typeof value === "string" ? JSON.parse(value) : value;
  return Array.isArray(parsed) ? (parsed as T[]) : [];
}

interface Bounds {
  firstDate: string | null;
  latestDate: string | null;
}

export async function computeBounds(now: Date = new Date()): Promise<Bounds> {
  const rows = await db.execute<{ first_date: string | null; latest_date: string | null }>(sql`
    SELECT to_char(MIN(d.date), 'YYYY-MM-DD') AS first_date, to_char(MAX(d.date), 'YYYY-MM-DD') AS latest_date
    FROM ${VISIBLE_DAYS}
    WHERE u.leaderboard_hidden = false AND d.tokens > 0 AND d.date <= ${maxAnchorDate(now)}
  `);
  return { firstDate: rows[0]?.first_date ?? null, latestDate: rows[0]?.latest_date ?? null };
}

export async function computeWindow(period: ExplorePeriod, now: Date = new Date()): Promise<ExploreWindow> {
  const bounds = await computeBounds(now);
  return resolveWindow(period, bounds, toIsoDate(now.getTime()));
}

export async function computeCatalogEntries(): Promise<CatalogEntry[]> {
  const rows = await db.execute<Record<string, unknown>>(sql`
    SELECT c.key AS client, m.key AS model, to_char(MIN(d.date), 'YYYY-MM-DD') AS first_seen, SUM(${CELL_TOKENS}) AS tokens
    FROM ${VISIBLE_DAYS}
    CROSS JOIN LATERAL jsonb_each(d.source_breakdown) AS c(key, value)
    CROSS JOIN LATERAL ${MODEL_CELLS}
    WHERE u.leaderboard_hidden = false
      AND jsonb_typeof(d.source_breakdown) = 'object'
      AND jsonb_typeof(c.value) = 'object'
      AND ${CELL_TOKENS} > 0
    GROUP BY 1, 2
  `);
  return rows.map((r) => ({ client: String(r.client), model: String(r.model), firstSeen: String(r.first_seen), tokens: num(r.tokens) }));
}

export async function computeCatalog(): Promise<ModelCatalog> {
  return buildModelCatalog(await computeCatalogEntries());
}

export async function computeFacts(window: ExploreWindow): Promise<UsageFact[]> {
  const rows = await db.execute<Record<string, unknown>>(sql`
    SELECT s.user_id::text AS user_id, c.key AS client, m.key AS model, (d.date >= ${window.start}) AS current,
      SUM(${CELL_TOKENS}) AS tokens,
      SUM(COALESCE((m.value->>'cost')::float8, 0)) AS cost,
      SUM(COALESCE((m.value->>'input')::float8, 0)) AS input,
      SUM(COALESCE((m.value->>'output')::float8, 0)) AS output,
      SUM(COALESCE((m.value->>'cacheRead')::float8, 0)) AS cache_read,
      SUM(COALESCE((m.value->>'cacheWrite')::float8, 0)) AS cache_write,
      SUM(COALESCE((m.value->>'reasoning')::float8, 0)) AS reasoning
    FROM ${VISIBLE_DAYS}
    CROSS JOIN LATERAL jsonb_each(d.source_breakdown) AS c(key, value)
    CROSS JOIN LATERAL ${MODEL_CELLS}
    WHERE u.leaderboard_hidden = false
      AND d.date >= ${queryStart(window)} AND d.date <= ${window.end}
      AND jsonb_typeof(d.source_breakdown) = 'object'
      AND jsonb_typeof(c.value) = 'object'
      AND ${CELL_TOKENS} > 0
    GROUP BY 1, 2, 3, 4
  `);
  return rows.map((r) => ({
    userId: String(r.user_id),
    client: String(r.client),
    model: String(r.model),
    current: r.current === true || r.current === "t",
    tokens: num(r.tokens),
    cost: num(r.cost),
    input: num(r.input),
    output: num(r.output),
    cacheRead: num(r.cache_read),
    cacheWrite: num(r.cache_write),
    reasoning: num(r.reasoning),
  }));
}

export async function computeUserTotals(window: ExploreWindow): Promise<UserTotals[]> {
  const rows = await db.execute<Record<string, unknown>>(sql`
    SELECT u.id::text AS user_id, u.username, u.display_name, u.avatar_url,
      SUM(d.tokens)::float8 AS tokens,
      SUM(d.cost)::float8 AS cost,
      (COUNT(DISTINCT d.date) FILTER (WHERE d.tokens > 0))::int AS active_days,
      to_char(MAX(s.updated_at) AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS last_submitted_at
    FROM ${VISIBLE_DAYS}
    WHERE u.leaderboard_hidden = false AND d.date >= ${window.start} AND d.date <= ${window.end}
    GROUP BY u.id, u.username, u.display_name, u.avatar_url
  `);
  return rows.map((r) => ({
    userId: String(r.user_id),
    username: String(r.username),
    displayName: (r.display_name as string | null) ?? null,
    avatarUrl: (r.avatar_url as string | null) ?? null,
    tokens: num(r.tokens),
    cost: num(r.cost),
    activeDays: num(r.active_days),
    lastSubmittedAt: (r.last_submitted_at as string | null) ?? null,
  }));
}

export async function computePeriodRollup(period: ExplorePeriod, catalog?: ModelCatalog, now: Date = new Date()): Promise<PeriodRollup> {
  const window = await computeWindow(period, now);
  const facts = await computeFacts(window);
  const users = await computeUserTotals(window);
  const resolvedCatalog = catalog ?? (await getModelCatalog());
  return buildPeriodRollup({ window, facts, users, catalog: resolvedCatalog });
}

type DetailQueryResult = {
  trend: unknown;
  cells: unknown;
  user_days: unknown;
};

function inList(values: string[]): SQL {
  return sql.join(
    values.map((v) => sql`${v}`),
    sql`, `,
  );
}

export async function computeModelDetail(
  rawKey: string,
  period: ExplorePeriod,
  deps?: { catalog?: ModelCatalog; rollup?: PeriodRollup; now?: Date },
): Promise<ModelDetail | null> {
  const key = modelKey(rawKey);
  if (!isIdentifiedModelKey(key)) return null;
  const catalog = deps?.catalog ?? (await getModelCatalog());
  const aliases = catalog.aliases[key];
  if (!aliases || aliases.length === 0) return null;
  const rollup = deps?.rollup ?? (await getPeriodRollup(period));
  // Same window as the rollup the summary comes from, even if that rollup is cached.
  const window = resolveWindow(period, { firstDate: rollup.coverage.start, latestDate: rollup.coverage.end }, rollup.coverage.end);

  const rows = await db.execute<DetailQueryResult>(sql`
    WITH cells AS MATERIALIZED (
      SELECT s.user_id, d.date, c.key AS client,
        ${CELL_TOKENS} AS tokens,
        COALESCE((m.value->>'cost')::float8, 0) AS cost,
        COALESCE((m.value->>'input')::float8, 0) AS input,
        COALESCE((m.value->>'output')::float8, 0) AS output,
        COALESCE((m.value->>'cacheRead')::float8, 0) AS cache_read,
        COALESCE((m.value->>'cacheWrite')::float8, 0) AS cache_write,
        COALESCE((m.value->>'reasoning')::float8, 0) AS reasoning
      FROM ${VISIBLE_DAYS}
      CROSS JOIN LATERAL jsonb_each(d.source_breakdown) AS c(key, value)
      CROSS JOIN LATERAL ${MODEL_CELLS}
      WHERE u.leaderboard_hidden = false
        AND d.date >= ${window.start} AND d.date <= ${window.end}
        AND jsonb_typeof(d.source_breakdown) = 'object'
        AND jsonb_typeof(c.value) = 'object'
        AND m.key IN (${inList(aliases)})
        AND ${CELL_TOKENS} > 0
    ),
    trend AS (
      SELECT to_char(date, 'YYYY-MM-DD') AS date, COUNT(DISTINCT user_id)::int AS "activeUsers", SUM(tokens) AS tokens
      FROM cells GROUP BY date
    ),
    user_client AS (
      SELECT u.username, u.display_name AS "displayName", u.avatar_url AS "avatarUrl", cells.client,
        SUM(tokens) AS tokens, SUM(cost) AS cost, SUM(input) AS input, SUM(output) AS output,
        SUM(cache_read) AS "cacheRead", SUM(cache_write) AS "cacheWrite", SUM(reasoning) AS reasoning
      FROM cells INNER JOIN users u ON u.id = cells.user_id
      GROUP BY u.id, u.username, u.display_name, u.avatar_url, cells.client
    ),
    user_days AS (
      SELECT u.username, COUNT(DISTINCT cells.date)::int AS days
      FROM cells INNER JOIN users u ON u.id = cells.user_id
      GROUP BY u.id, u.username
    )
    SELECT
      COALESCE((SELECT json_agg(trend) FROM trend), '[]'::json) AS trend,
      COALESCE((SELECT json_agg(user_client) FROM user_client), '[]'::json) AS cells,
      COALESCE((SELECT json_agg(user_days) FROM user_days), '[]'::json) AS user_days
  `);
  const result = rows[0];
  const trend = parseJsonArray<{ date: string; activeUsers: number; tokens: number }>(result?.trend).map((p) => ({
    date: p.date,
    activeUsers: num(p.activeUsers),
    tokens: num(p.tokens),
  }));
  const cells = parseJsonArray<ModelUserClientCell>(result?.cells).map((c) => ({
    username: String(c.username),
    displayName: c.displayName ?? null,
    avatarUrl: c.avatarUrl ?? null,
    client: String(c.client),
    tokens: num(c.tokens),
    cost: num(c.cost),
    input: num(c.input),
    output: num(c.output),
    cacheRead: num(c.cacheRead),
    cacheWrite: num(c.cacheWrite),
    reasoning: num(c.reasoning),
  }));
  const userDays: Record<string, number> = Object.create(null);
  for (const row of parseJsonArray<{ username: string; days: number }>(result?.user_days)) {
    userDays[String(row.username)] = num(row.days);
  }
  return buildModelDetail({ key, window, rollup, catalog, trend, cells, userDays });
}

export const getModelCatalog = unstable_cache(computeCatalog, ["explore", CACHE_VERSION, "catalog"], {
  revalidate: EXPLORE_REVALIDATE_SECONDS,
  tags: TAGS,
});

export function getPeriodRollup(period: ExplorePeriod): Promise<PeriodRollup> {
  return unstable_cache(() => computePeriodRollup(period), ["explore", CACHE_VERSION, "rollup", period], {
    revalidate: EXPLORE_REVALIDATE_SECONDS,
    tags: TAGS,
  })();
}

export function getModelDetailCached(key: string, period: ExplorePeriod): Promise<ModelDetail | null> {
  return unstable_cache(() => computeModelDetail(key, period), ["explore", CACHE_VERSION, "model", modelKey(key), period], {
    revalidate: EXPLORE_REVALIDATE_SECONDS,
    tags: TAGS,
  })();
}
