import { z } from "zod";

/**
 * Zod schemas for the capital research content in src/content/capital.
 *
 * The JSON is validated once at module load (see content.ts), so a malformed
 * edit fails the build and the tests instead of rendering a wrong number.
 */

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD");
const cik = z.string().regex(/^\d{10}$/, "expected a 10-digit zero-padded CIK");
const accession = z.string().regex(/^\d{10}-\d{2}-\d{6}$/, "expected an SEC accession number");
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "expected a lowercase slug");
const quarterKey = z.string().regex(/^\d{4}-q[1-4]$/, "expected a quarter key like 2026-q2");
const secUrl = z.string().url().startsWith("https://www.sec.gov/");
const usd = z.number().int().nonnegative();

export const shareClassSchema = z.object({
  cusip: z.string().regex(/^[0-9A-Z]{9}$/),
  titleOfClass: z.string().min(1),
  valueUsd: usd,
  shares: z.number().int().nonnegative(),
});

export const holdingSchema = z.object({
  /** Issuer key: the first six CUSIP characters. Share classes of one issuer are combined. */
  cusip6: z.string().regex(/^[0-9A-Z]{6}$/),
  /** Issuer name exactly as written in the SEC information table. */
  issuer: z.string().min(1),
  company: slug,
  valueUsd: usd,
  shares: z.number().int().nonnegative(),
  /** Information-table rows combined into this position. */
  rows: z.number().int().positive(),
  classes: z.array(shareClassSchema).min(1),
});

export const reportSchema = z.object({
  accession,
  form: z.literal("13F-HR"),
  reportType: z.enum(["13F HOLDINGS REPORT", "13F COMBINATION REPORT"]),
  filerName: z.string().min(1),
  cik,
  periodOfReport: isoDate,
  filedAt: isoDate,
  /** Cover-page total, in dollars. */
  declaredTotalUsd: usd,
  declaredEntries: z.number().int().nonnegative(),
  otherManagers: z.array(z.object({ sequence: z.number().int(), name: z.string(), cik: z.string().nullable() })),
  urls: z.object({ index: secUrl, primaryDoc: secUrl, infoTable: secUrl }),
});

export const noticeSchema = z.object({
  accession,
  form: z.literal("13F-NT"),
  filerName: z.string().min(1),
  cik,
  periodOfReport: isoDate,
  filedAt: isoDate,
  noticeManagers: z.array(z.object({ name: z.string(), cik: z.string().nullable() })),
  urls: z.object({ index: secUrl, primaryDoc: secUrl }),
});

export const quarterSchema = z.object({
  quarter: quarterKey,
  periodOfReport: isoDate,
  reports: z.array(reportSchema).min(1),
  notices: z.array(noticeSchema),
  /** Rows with a zero CUSIP and zero value that filers send for an empty table. */
  placeholderRows: z.number().int().nonnegative(),
  holdings: z.array(holdingSchema),
});

export const filingsFileSchema = z.object({
  slug,
  /** When the saved SEC responses were fetched (ISO timestamp, UTC). */
  secRetrievedAt: z.string().datetime(),
  quarters: z.array(quarterSchema).min(1),
});

export const fundSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("published"),
    slug,
    name: z.string().min(1),
    shortName: z.string().min(1),
    person: z.string().min(1),
    summary: z.string().min(1),
    scope: z.string().min(1),
    reporting: z.string().min(1),
    filings: slug,
  }),
  z.object({
    status: z.literal("in-review"),
    slug,
    name: z.string().min(1),
    shortName: z.string().min(1),
    person: z.string().min(1),
    summary: z.string().min(1),
    reviewNote: z.string().min(1),
  }),
]);

export const fundsFileSchema = z.object({ funds: z.array(fundSchema).min(1) });

const linkSchema = z.object({ label: z.string().min(1), url: z.string().url() });

export const companySchema = z.object({
  slug,
  name: z.string().min(1),
  tickers: z.array(z.string().regex(/^[A-Z.]{1,6}$/)).min(1),
  exchange: z.enum(["NASDAQ", "NYSE"]),
  cik,
  cusip6: z.string().regex(/^[0-9A-Z]{6}$/),
  sic: z.string().regex(/^\d{4}$/).optional(),
  sicDescription: z.string().optional(),
  description: z.string().optional(),
  descriptionSource: linkSchema.optional(),
  note: z.string().optional(),
});

export const companiesFileSchema = z.object({ source: z.string(), companies: z.array(companySchema).min(1) });

const claimSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("weightSum"), text: z.string(), companies: z.array(slug).min(2) }),
  z.object({ kind: z.literal("shares"), text: z.string(), company: slug, quarter: quarterKey }),
  z.object({ kind: z.literal("previousShares"), text: z.string(), company: slug }),
  z.object({ kind: z.literal("previousValue"), text: z.string(), company: slug }),
  z.object({ kind: z.literal("previousTotal"), text: z.string() }),
  z.object({ kind: z.literal("shareChange"), text: z.string(), company: slug }),
]);

const cardTextSchema = z.object({ eyebrow: z.string().optional(), title: z.string().optional(), headline: z.string().optional(), body: z.string() });

export const storySchema = z.object({
  slug,
  fund: slug,
  quarter: quarterKey,
  series: slug,
  headline: z.string().min(1),
  dek: z.string().min(1),
  cardSummary: z.string().min(1),
  publishedAt: isoDate,
  /** When the numbers were last checked against the raw SEC tables. */
  reviewedAt: isoDate,
  byline: z.string().min(1),
  sections: z.array(z.object({ heading: z.string().min(1), paragraphs: z.array(z.string().min(1)).min(1) })).min(1),
  /** Numbers in the copy that are not a single holding's weight or value, with how to recompute them. */
  claims: z.array(claimSchema),
  visual: z.object({
    cover: cardTextSchema,
    intro: cardTextSchema,
    holdings: z.array(slug).min(1),
    spotlight: z.array(slug),
    outro: cardTextSchema,
  }),
  holdingNotes: z.record(slug, z.string().min(1)),
  sources: z.array(linkSchema.extend({ kind: z.enum(["story", "company"]) })),
  corrections: z.array(z.object({ date: isoDate, text: z.string().min(1) })),
});

export const themesFileSchema = z.object({
  themes: z.array(z.object({ slug, name: z.string(), summary: z.string(), companies: z.array(slug).min(1) })),
});

export const seriesFileSchema = z.object({
  series: z.array(
    z.object({
      slug,
      name: z.string(),
      summary: z.string(),
      entries: z.array(z.object({ fund: slug, quarter: quarterKey, story: slug })),
      inReview: z.array(z.object({ fund: slug, quarter: quarterKey })),
    })
  ),
});

export type FilingsFile = z.infer<typeof filingsFileSchema>;
export type QuarterRecord = z.infer<typeof quarterSchema>;
export type HoldingRecord = z.infer<typeof holdingSchema>;
export type ReportRecord = z.infer<typeof reportSchema>;
export type NoticeRecord = z.infer<typeof noticeSchema>;
export type FundRecord = z.infer<typeof fundSchema>;
export type PublishedFundRecord = Extract<FundRecord, { status: "published" }>;
export type CompanyRecord = z.infer<typeof companySchema>;
export type StoryRecord = z.infer<typeof storySchema>;
export type StoryClaim = z.infer<typeof claimSchema>;
export type ThemeRecord = z.infer<typeof themesFileSchema>["themes"][number];
export type SeriesRecord = z.infer<typeof seriesFileSchema>["series"][number];
