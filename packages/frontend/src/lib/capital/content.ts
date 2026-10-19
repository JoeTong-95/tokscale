import companiesJson from "@/content/capital/companies.json";
import pershingSquareFilings from "@/content/capital/filings/pershing-square.json";
import thielMacroFilings from "@/content/capital/filings/thiel-macro.json";
import fundsJson from "@/content/capital/funds.json";
import seriesJson from "@/content/capital/series.json";
import pershingSquare2026Q2 from "@/content/capital/stories/pershing-square-2026-q2.json";
import thielMacro2026Q2 from "@/content/capital/stories/thiel-macro-2026-q2.json";
import themesJson from "@/content/capital/themes.json";
import {
  companiesFileSchema,
  filingsFileSchema,
  fundsFileSchema,
  seriesFileSchema,
  storySchema,
  themesFileSchema,
  type CompanyRecord,
  type FilingsFile,
  type FundRecord,
  type SeriesRecord,
  type StoryRecord,
  type ThemeRecord,
} from "./schema";

/**
 * The validated capital dataset.
 *
 * Adding a fund or a story means adding its JSON import here. Validation runs
 * once at module load: a schema error or a broken cross-reference throws, so
 * `next build` and the test suite both fail before a wrong page can render.
 */
export interface CapitalContent {
  funds: FundRecord[];
  filings: Map<string, FilingsFile>;
  companies: Map<string, CompanyRecord>;
  stories: StoryRecord[];
  themes: ThemeRecord[];
  series: SeriesRecord[];
}

const RAW_FILINGS: unknown[] = [thielMacroFilings, pershingSquareFilings];
const RAW_STORIES: unknown[] = [thielMacro2026Q2, pershingSquare2026Q2];

export class CapitalContentError extends Error {
  constructor(message: string) {
    super(`[capital content] ${message}`);
    this.name = "CapitalContentError";
  }
}

function check(condition: boolean, message: string): asserts condition {
  if (!condition) throw new CapitalContentError(message);
}

export function validateCapitalContent(raw: {
  funds: unknown;
  filings: unknown[];
  companies: unknown;
  stories: unknown[];
  themes: unknown;
  series: unknown;
}): CapitalContent {
  const funds = fundsFileSchema.parse(raw.funds).funds;
  const filings = new Map(raw.filings.map((file) => {
    const parsed = filingsFileSchema.parse(file);
    return [parsed.slug, parsed] as const;
  }));
  const companies = new Map(companiesFileSchema.parse(raw.companies).companies.map((c) => [c.slug, c] as const));
  const stories = raw.stories.map((story) => storySchema.parse(story));
  const themes = themesFileSchema.parse(raw.themes).themes;
  const series = seriesFileSchema.parse(raw.series).series;

  const fundSlugs = new Set<string>();
  for (const fund of funds) {
    check(!fundSlugs.has(fund.slug), `duplicate fund slug ${fund.slug}`);
    fundSlugs.add(fund.slug);
    if (fund.status === "published") {
      check(filings.has(fund.filings), `fund ${fund.slug} points to missing filings file ${fund.filings}`);
    }
  }

  for (const file of filings.values()) {
    const seen = new Set<string>();
    for (const quarter of file.quarters) {
      check(!seen.has(quarter.quarter), `${file.slug}: duplicate quarter ${quarter.quarter}`);
      seen.add(quarter.quarter);
      const declared = quarter.reports.reduce((sum, r) => sum + r.declaredTotalUsd, 0);
      const held = quarter.holdings.reduce((sum, h) => sum + h.valueUsd, 0);
      // Holdings exclude only placeholder rows, which are $0, so the sums must agree exactly.
      check(declared === held, `${file.slug} ${quarter.quarter}: holdings sum to ${held}, cover pages declare ${declared}`);
      const rows = quarter.holdings.reduce((sum, h) => sum + h.rows, 0) + quarter.placeholderRows;
      const entries = quarter.reports.reduce((sum, r) => sum + r.declaredEntries, 0);
      check(rows === entries, `${file.slug} ${quarter.quarter}: ${rows} rows, cover pages declare ${entries}`);
      for (const report of [...quarter.reports, ...quarter.notices]) {
        check(report.periodOfReport === quarter.periodOfReport, `${report.accession} is not for ${quarter.periodOfReport}`);
      }
      const issuers = new Set<string>();
      for (const holding of quarter.holdings) {
        check(companies.has(holding.company), `${file.slug} ${quarter.quarter}: unknown company ${holding.company}`);
        check(companies.get(holding.company)?.cusip6 === holding.cusip6, `${holding.company}: CUSIP issuer mismatch`);
        check(!issuers.has(holding.cusip6), `${file.slug} ${quarter.quarter}: issuer ${holding.cusip6} listed twice`);
        issuers.add(holding.cusip6);
        const classValue = holding.classes.reduce((sum, c) => sum + c.valueUsd, 0);
        const classShares = holding.classes.reduce((sum, c) => sum + c.shares, 0);
        check(classValue === holding.valueUsd && classShares === holding.shares, `${holding.company}: share classes do not add up`);
      }
    }
  }

  for (const story of stories) {
    const fund = funds.find((f) => f.slug === story.fund);
    check(fund?.status === "published", `story ${story.slug}: fund ${story.fund} is not published`);
    const quarter = filings.get(fund.filings)?.quarters.find((q) => q.quarter === story.quarter);
    check(Boolean(quarter && quarter.holdings.length > 0), `story ${story.slug}: no holdings for ${story.quarter}`);
    const held = new Set(quarter?.holdings.map((h) => h.company));
    for (const slug of [...story.visual.holdings, ...story.visual.spotlight, ...Object.keys(story.holdingNotes)]) {
      check(held.has(slug), `story ${story.slug}: ${slug} is not a holding in ${story.quarter}`);
    }
    for (const match of story.sections.flatMap((s) => s.paragraphs).join(" ").matchAll(/\]\(company:([a-z0-9-]+)\)/g)) {
      check(companies.has(match[1]), `story ${story.slug}: link to unknown company ${match[1]}`);
    }
  }

  for (const theme of themes) {
    for (const slug of theme.companies) check(companies.has(slug), `theme ${theme.slug}: unknown company ${slug}`);
  }

  for (const entry of series.flatMap((s) => [...s.entries, ...s.inReview])) {
    check(fundSlugs.has(entry.fund), `series entry points to unknown fund ${entry.fund}`);
  }
  for (const entry of series.flatMap((s) => s.entries)) {
    check(stories.some((s) => s.slug === entry.story), `series entry points to unknown story ${entry.story}`);
  }

  return { funds, filings, companies, stories, themes, series };
}

export const capitalContent: CapitalContent = validateCapitalContent({
  funds: fundsJson,
  filings: RAW_FILINGS,
  companies: companiesJson,
  stories: RAW_STORIES,
  themes: themesJson,
  series: seriesJson,
});
