import { capitalContent, type CapitalContent } from "./content";
import { formatUsdCompact, formatWeight, previousQuarterKey, quarterLabel } from "./format";
import type {
  CompanyRecord,
  NoticeRecord,
  PublishedFundRecord,
  QuarterRecord,
  ReportRecord,
  StoryRecord,
  ThemeRecord,
} from "./schema";
import { readableSicDescription, sectorForSic } from "./sectors";
import { companyPath, fundPath, quarterOgImagePath, quarterPath } from "./urls";

/**
 * Derived views over the capital content. Pages import from "@/lib/capital".
 *
 * Definitions (kept in one place so every page says the same thing):
 * - Reported 13F value: the sum of the cover-page totals of the reports that make
 *   up a quarter. It is not assets under management.
 * - Weight: a position's value divided by the reported 13F value (0..1).
 * - Changes compare a quarter with the calendar quarter before it, only when that
 *   quarter is in the dataset. Share changes within 0.5% count as unchanged.
 *   A position missing last quarter but held in one of the three quarters before
 *   that is "returned", not "new". This matches the paracosm-studio 13F pipeline.
 */

const SHARE_CHANGE_TOLERANCE = 0.005;
const HISTORY_QUARTERS = 3;

export type ChangeKind = "new" | "returned" | "added" | "trimmed" | "unchanged" | "not-compared";

export interface HoldingChange {
  kind: ChangeKind;
  previousShares: number | null;
  previousValueUsd: number | null;
  /** Weight in the previous quarter (0..1); 0 for a new position. */
  previousWeight: number | null;
  /** Percent change in shares (14.58 means +14.58%); null when not comparable. */
  shareChangePct: number | null;
  shareChange: number | null;
  valueChangeUsd: number | null;
  /** Change in weight, in percentage points. */
  weightChangePp: number | null;
  lastHeld: { quarter: string; label: string; shares: number; valueUsd: number } | null;
}

export interface CompanyView extends CompanyRecord {
  sector: string;
  sicLabel: string | null;
  ticker: string;
  href: string;
}

export interface HoldingView {
  rank: number;
  company: CompanyView;
  issuer: string;
  cusip6: string;
  cusips: string[];
  titlesOfClass: string[];
  valueUsd: number;
  shares: number;
  weight: number;
  rows: number;
  change: HoldingChange;
}

export interface ExitView {
  company: CompanyView;
  previousShares: number;
  previousValueUsd: number;
  previousWeight: number;
}

export interface QuarterRef {
  fund: string;
  quarter: string;
  label: string;
  periodOfReport: string;
  href: string;
}

export interface QuarterView extends QuarterRef {
  fundRecord: PublishedFundRecord;
  /** Latest filing date among the quarter's reports. */
  filedAt: string;
  reports: ReportRecord[];
  notices: NoticeRecord[];
  placeholderRows: number;
  reportedValueUsd: number;
  rowCount: number;
  holdings: HoldingView[];
  exited: ExitView[];
  /** Share of the reported value in the five largest positions (0..1). */
  topFiveWeight: number;
  previous: (QuarterRef & { reportedValueUsd: number; positions: number; hasPage: boolean }) | null;
  reportedValueChangeUsd: number | null;
  /** Neighbouring quarters that have a page (at least one position). */
  older: QuarterRef | null;
  newer: QuarterRef | null;
  story: StoryRecord | null;
  secRetrievedAt: string;
}

export interface FundView {
  fund: PublishedFundRecord;
  href: string;
  /** Every quarter in the dataset, newest first, including quarters with no positions. */
  quarters: QuarterView[];
  latest: QuarterView;
}

function companyView(content: CapitalContent, slug: string): CompanyView {
  const company = content.companies.get(slug);
  if (!company) throw new Error(`unknown company ${slug}`);
  return {
    ...company,
    sector: sectorForSic(company.sic),
    sicLabel: readableSicDescription(company.sicDescription),
    ticker: company.tickers[0],
    href: companyPath(company.slug),
  };
}

function ref(fund: string, quarter: QuarterRecord): QuarterRef {
  return {
    fund,
    quarter: quarter.quarter,
    label: quarterLabel(quarter.quarter),
    periodOfReport: quarter.periodOfReport,
    href: quarterPath(fund, quarter.quarter),
  };
}

const reportedValue = (quarter: QuarterRecord) => quarter.reports.reduce((sum, r) => sum + r.declaredTotalUsd, 0);

function buildQuarter(content: CapitalContent, fund: PublishedFundRecord, quarter: QuarterRecord): QuarterView {
  const file = content.filings.get(fund.filings);
  if (!file) throw new Error(`missing filings for ${fund.slug}`);
  const byKey = new Map(file.quarters.map((q) => [q.quarter, q] as const));
  const total = reportedValue(quarter);
  const previousRecord = byKey.get(previousQuarterKey(quarter.quarter)) ?? null;
  const previousTotal = previousRecord ? reportedValue(previousRecord) : null;
  const previousByIssuer = new Map(previousRecord?.holdings.map((h) => [h.cusip6, h] as const));

  const older: QuarterRecord[] = [];
  let cursor = previousRecord ? previousQuarterKey(previousRecord.quarter) : null;
  for (let i = 0; cursor && i < HISTORY_QUARTERS; i += 1) {
    const found = byKey.get(cursor);
    if (found) older.push(found);
    cursor = previousQuarterKey(cursor);
  }

  const holdings: HoldingView[] = quarter.holdings.map((holding, index) => {
    const weight = total > 0 ? holding.valueUsd / total : 0;
    let change: HoldingChange = {
      kind: "not-compared",
      previousShares: null,
      previousValueUsd: null,
      previousWeight: null,
      shareChangePct: null,
      shareChange: null,
      valueChangeUsd: null,
      weightChangePp: null,
      lastHeld: null,
    };
    if (previousRecord && previousTotal !== null) {
      const prior = previousByIssuer.get(holding.cusip6);
      if (prior) {
        const previousWeight = previousTotal > 0 ? prior.valueUsd / previousTotal : 0;
        const shareChange = holding.shares - prior.shares;
        const pct = prior.shares > 0 ? (shareChange / prior.shares) * 100 : null;
        const kind: ChangeKind =
          pct !== null && Math.abs(pct) <= SHARE_CHANGE_TOLERANCE * 100 ? "unchanged" : shareChange > 0 ? "added" : "trimmed";
        change = {
          kind,
          previousShares: prior.shares,
          previousValueUsd: prior.valueUsd,
          previousWeight,
          shareChangePct: pct === null ? null : Math.round(pct * 100) / 100,
          shareChange,
          valueChangeUsd: holding.valueUsd - prior.valueUsd,
          weightChangePp: (weight - previousWeight) * 100,
          lastHeld: null,
        };
      } else {
        const heldBefore = older
          .map((q) => ({ q, h: q.holdings.find((h) => h.cusip6 === holding.cusip6) }))
          .find((entry) => entry.h && (entry.h.valueUsd > 0 || entry.h.shares > 0));
        change = {
          kind: heldBefore ? "returned" : "new",
          previousShares: 0,
          previousValueUsd: 0,
          previousWeight: 0,
          shareChangePct: null,
          shareChange: holding.shares,
          valueChangeUsd: holding.valueUsd,
          weightChangePp: weight * 100,
          lastHeld:
            heldBefore && heldBefore.h
              ? {
                  quarter: heldBefore.q.quarter,
                  label: quarterLabel(heldBefore.q.quarter),
                  shares: heldBefore.h.shares,
                  valueUsd: heldBefore.h.valueUsd,
                }
              : null,
        };
      }
    }
    return {
      rank: index + 1,
      company: companyView(content, holding.company),
      issuer: holding.issuer,
      cusip6: holding.cusip6,
      cusips: holding.classes.map((c) => c.cusip),
      titlesOfClass: holding.classes.map((c) => c.titleOfClass),
      valueUsd: holding.valueUsd,
      shares: holding.shares,
      weight,
      rows: holding.rows,
      change,
    };
  });

  const current = new Set(quarter.holdings.map((h) => h.cusip6));
  const exited: ExitView[] =
    previousRecord && previousTotal !== null
      ? previousRecord.holdings
          .filter((h) => !current.has(h.cusip6))
          .map((h) => ({
            company: companyView(content, h.company),
            previousShares: h.shares,
            previousValueUsd: h.valueUsd,
            previousWeight: previousTotal > 0 ? h.valueUsd / previousTotal : 0,
          }))
      : [];

  const withPositions = file.quarters.filter((q) => q.holdings.length > 0);
  const position = withPositions.findIndex((q) => q.quarter === quarter.quarter);
  const olderPage = position > 0 ? withPositions[position - 1] : null;
  const newerPage = position >= 0 && position < withPositions.length - 1 ? withPositions[position + 1] : null;

  return {
    ...ref(fund.slug, quarter),
    fundRecord: fund,
    filedAt: quarter.reports.map((r) => r.filedAt).sort().at(-1) ?? quarter.periodOfReport,
    reports: quarter.reports,
    notices: quarter.notices,
    placeholderRows: quarter.placeholderRows,
    reportedValueUsd: total,
    rowCount: quarter.holdings.reduce((sum, h) => sum + h.rows, 0),
    holdings,
    exited,
    topFiveWeight: holdings.slice(0, 5).reduce((sum, h) => sum + h.weight, 0),
    previous: previousRecord
      ? {
          ...ref(fund.slug, previousRecord),
          reportedValueUsd: previousTotal ?? 0,
          positions: previousRecord.holdings.length,
          hasPage: previousRecord.holdings.length > 0,
        }
      : null,
    reportedValueChangeUsd: previousTotal === null ? null : total - previousTotal,
    older: olderPage ? ref(fund.slug, olderPage) : null,
    newer: newerPage ? ref(fund.slug, newerPage) : null,
    story: content.stories.find((s) => s.fund === fund.slug && s.quarter === quarter.quarter) ?? null,
    secRetrievedAt: file.secRetrievedAt,
  };
}

export function createCapitalModel(content: CapitalContent) {
  const publishedFunds = content.funds.filter((f): f is PublishedFundRecord => f.status === "published");

  const fundViews = new Map<string, FundView>(
    publishedFunds.map((fund) => {
      const file = content.filings.get(fund.filings);
      if (!file) throw new Error(`missing filings for ${fund.slug}`);
      const quarters = file.quarters.map((q) => buildQuarter(content, fund, q)).reverse();
      const latest = quarters.find((q) => q.holdings.length > 0);
      if (!latest) throw new Error(`${fund.slug} has no quarter with positions`);
      return [fund.slug, { fund, href: fundPath(fund.slug), quarters, latest }] as const;
    })
  );

  const allQuarterPages = () =>
    [...fundViews.values()].flatMap((view) => view.quarters.filter((q) => q.holdings.length > 0));

  function companyPositions(slug: string) {
    return [...fundViews.values()].flatMap((view) =>
      view.quarters.flatMap((quarter) =>
        quarter.holdings
          .filter((h) => h.company.slug === slug)
          .map((holding) => ({ fund: view.fund, quarter, holding }))
      )
    );
  }

  /** The latest period any tracked fund reported. */
  const latestPeriod = () =>
    [...fundViews.values()].map((v) => v.latest.periodOfReport).sort().at(-1) ?? "";

  return {
    content,
    getPublishedFunds: () => [...fundViews.values()],
    getFund: (slug: string) => fundViews.get(slug) ?? null,
    getInReviewFunds: () => content.funds.filter((f) => f.status === "in-review"),
    getQuarter: (fund: string, quarter: string) =>
      fundViews.get(fund)?.quarters.find((q) => q.quarter === quarter && q.holdings.length > 0) ?? null,
    getQuarterPages: allQuarterPages,
    getLatestPeriod: latestPeriod,

    getCompanies: () => [...content.companies.keys()].map((slug) => companyView(content, slug)),
    /** Companies held by at least one tracked fund in at least one published quarter. */
    getCompaniesWithData: () =>
      [...content.companies.keys()]
        .filter((slug) => companyPositions(slug).length > 0)
        .map((slug) => companyView(content, slug)),
    getCompany(slug: string) {
      if (!content.companies.has(slug)) return null;
      const positions = companyPositions(slug);
      if (positions.length === 0) return null;
      const period = latestPeriod();
      const current = positions.filter((p) => p.quarter.periodOfReport === period);
      return {
        company: companyView(content, slug),
        positions,
        /** Positions in the latest period any tracked fund reported. */
        current,
        latestPeriod: period,
        trackedFunds: fundViews.size,
        themes: content.themes.filter((t) => t.companies.includes(slug)),
      };
    },

    getThemes() {
      const period = latestPeriod();
      return content.themes.map((theme: ThemeRecord) => {
        const companies = theme.companies.map((slug) => {
          const current = companyPositions(slug).filter((p) => p.quarter.periodOfReport === period);
          return {
            company: companyView(content, slug),
            valueUsd: current.reduce((sum, p) => sum + p.holding.valueUsd, 0),
            funds: current.map((p) => p.fund.shortName),
          };
        });
        return {
          ...theme,
          period,
          companies,
          valueUsd: companies.reduce((sum, c) => sum + c.valueUsd, 0),
          funds: [...new Set(companies.flatMap((c) => c.funds))],
        };
      });
    },

    /** Every report and notice, newest filing first. */
    getRecentFilings(limit = 6) {
      return [...fundViews.values()]
        .flatMap((view) =>
          view.quarters.flatMap((quarter) =>
            [...quarter.reports, ...quarter.notices].map((filing) => ({ fund: view.fund, quarter, filing }))
          )
        )
        .sort(
          (a, b) =>
            b.filing.filedAt.localeCompare(a.filing.filedAt) ||
            b.quarter.periodOfReport.localeCompare(a.quarter.periodOfReport) ||
            a.filing.accession.localeCompare(b.filing.accession)
        )
        .slice(0, limit);
    },

    getSeries() {
      return content.series.map((series) => ({
        ...series,
        entries: series.entries.flatMap((entry) => {
          const quarter = fundViews.get(entry.fund)?.quarters.find((q) => q.quarter === entry.quarter);
          return quarter?.story ? [{ quarter, story: quarter.story }] : [];
        }),
        inReview: series.inReview.map((entry) => ({
          fund: content.funds.find((f) => f.slug === entry.fund)!,
          quarter: entry.quarter,
          label: quarterLabel(entry.quarter),
        })),
      }));
    },
  };
}

export type CapitalModel = ReturnType<typeof createCapitalModel>;

export const capital: CapitalModel = createCapitalModel(capitalContent);

export interface FeaturedCapitalItem {
  title: string;
  fund: string;
  quarter: string;
  href: string;
  summary: string;
  imageUrl?: string;
}

/**
 * Inside the 13F entries for the homepage preview, newest period first.
 * `summary` is the story's one-line summary plus the snapshot numbers.
 * `imageUrl` is the quarter page's 1200x630 Open Graph card (a same-origin path).
 */
export function getFeaturedCapital(): FeaturedCapitalItem[] {
  return capital
    .getSeries()
    .flatMap((series) => series.entries)
    .sort((a, b) => b.quarter.periodOfReport.localeCompare(a.quarter.periodOfReport))
    .map(({ quarter, story }) => ({
      title: story.headline,
      fund: quarter.fundRecord.shortName,
      quarter: quarter.label,
      href: quarter.href,
      summary: `${story.cardSummary} ${formatUsdCompact(quarter.reportedValueUsd)} reported 13F value across ${quarter.holdings.length} holdings; largest ${quarter.holdings[0].company.name} at ${formatWeight(quarter.holdings[0].weight)}.`,
      imageUrl: quarterOgImagePath(quarter.fund, quarter.quarter),
    }));
}
