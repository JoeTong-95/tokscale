import { describe, expect, it } from "vitest";
import companiesJson from "@/content/capital/companies.json";
import pershingFilings from "@/content/capital/filings/pershing-square.json";
import thielFilings from "@/content/capital/filings/thiel-macro.json";
import fundsJson from "@/content/capital/funds.json";
import seriesJson from "@/content/capital/series.json";
import pershingStory from "@/content/capital/stories/pershing-square-2026-q2.json";
import thielStory from "@/content/capital/stories/thiel-macro-2026-q2.json";
import themesJson from "@/content/capital/themes.json";
import {
  capital,
  formatDate,
  formatPp,
  formatSignedPercent,
  formatUsd,
  formatUsdCompact,
  formatWeight,
  getFeaturedCapital,
  previousQuarterKey,
  quarterLabel,
  sectorForSic,
  type QuarterView,
} from "@/lib/capital";
import { CapitalContentError, validateCapitalContent } from "@/lib/capital/content";
import { capitalSitemapEntries } from "@/lib/capital/sitemap";

const weights = (q: QuarterView) => Object.fromEntries(q.holdings.map((h) => [h.company.ticker, formatWeight(h.weight)]));

describe("Thiel Macro Q2 2026 (13F-HR 0001315863-26-000593)", () => {
  const q = capital.getQuarter("thiel-macro", "2026-q2")!;

  it("matches the raw SEC table", () => {
    expect(q.reports.map((r) => r.accession)).toEqual(["0001315863-26-000593"]);
    expect(q.reportedValueUsd).toBe(418_666_506);
    expect(q.holdings).toHaveLength(8);
    expect(q.filedAt).toBe("2026-08-14");
    expect(q.periodOfReport).toBe("2026-06-30");
    expect(q.holdings.map((h) => [h.company.ticker, h.valueUsd, h.shares])).toEqual([
      ["AMZN", 117_978_300, 495_000],
      ["VIST", 75_908_730, 1_189_792],
      ["VST", 59_130_126, 372_755],
      ["AEP", 42_221_892, 308_617],
      ["DTE", 40_294_247, 264_450],
      ["FE", 39_901_225, 839_319],
      ["CMS", 39_559_986, 517_124],
      ["XE", 3_672_000, 200_000],
    ]);
  });

  it("weights match the published Inside the 13F cards", () => {
    expect(weights(q)).toEqual({
      AMZN: "28.18%", VIST: "18.13%", VST: "14.12%", AEP: "10.08%",
      DTE: "9.62%", FE: "9.53%", CMS: "9.45%", XE: "0.88%",
    });
    expect(formatWeight(q.topFiveWeight)).toBe("80.14%");
  });

  it("compares with an empty Q1 2026 report and finds Vistra returning from Q2 2025", () => {
    expect(q.previous).toMatchObject({ quarter: "2026-q1", reportedValueUsd: 0, positions: 0, hasPage: false });
    expect(q.reportedValueChangeUsd).toBe(418_666_506);
    const kinds = Object.fromEntries(q.holdings.map((h) => [h.company.ticker, h.change.kind]));
    expect(kinds).toEqual({ AMZN: "new", VIST: "new", VST: "returned", AEP: "new", DTE: "new", FE: "new", CMS: "new", XE: "new" });
    const vistra = q.holdings.find((h) => h.company.ticker === "VST")!;
    expect(vistra.change.lastHeld).toEqual({ quarter: "2025-q2", label: "Q2 2025", shares: 208_747, valueUsd: 40_457_256 });
    expect(q.exited).toEqual([]);
    // The page for the previous position-bearing quarter skips the two empty reports.
    expect(q.older?.quarter).toBe("2025-q3");
    expect(q.newer).toBeNull();
  });
});

describe("Pershing Square Q2 2026 (13F-HR 0001172661-26-003790)", () => {
  const q = capital.getQuarter("pershing-square", "2026-q2")!;

  it("uses Pershing Square Inc.'s holdings report and records the PSCM notice", () => {
    expect(q.reports.map((r) => [r.accession, r.filerName, r.reportType])).toEqual([
      ["0001172661-26-003790", "PERSHING SQUARE INC.", "13F HOLDINGS REPORT"],
    ]);
    expect(q.notices.map((n) => [n.accession, n.filerName, n.form])).toEqual([
      ["0001172661-26-003777", "Pershing Square Capital Management, L.P.", "13F-NT"],
    ]);
    expect(q.reportedValueUsd).toBe(19_465_692_772);
    expect(q.rowCount).toBe(15);
    expect(q.holdings).toHaveLength(14);
  });

  it("weights match the raw table", () => {
    expect(weights(q)).toEqual({
      UBER: "12.72%", BN: "12.58%", MSFT: "11.89%", AMZN: "10.49%", HHH: "10.23%", QSR: "9.62%", META: "9.25%",
      V: "5.76%", MA: "5.61%", SPGI: "5.43%", NFLX: "4.80%", PSUS: "0.77%", SEG: "0.69%", HTZ: "0.17%",
    });
  });

  it("compares with both Q1 2026 reports combined, not a reporting-entity reset", () => {
    expect(q.previous?.reportedValueUsd).toBe(14_283_639_861);
    const changes = Object.fromEntries(q.holdings.map((h) => [h.company.ticker, [h.change.kind, h.change.shareChangePct]]));
    expect(changes).toEqual({
      UBER: ["added", 14.58], BN: ["trimmed", -3.71], MSFT: ["added", 9.77], AMZN: ["trimmed", -25.22],
      HHH: ["unchanged", 0], QSR: ["added", 14.02], META: ["added", 20.11], V: ["new", null], MA: ["new", null],
      SPGI: ["new", null], NFLX: ["new", null], PSUS: ["new", null], SEG: ["unchanged", 0], HTZ: ["trimmed", -1.64],
    });
    expect(q.exited.map((e) => [e.company.slug, e.previousShares, e.previousValueUsd])).toEqual([
      ["alphabet", 344_102, 98_731_763],
    ]);
  });

  it("keeps value, share and weight changes separate", () => {
    const uber = q.holdings.find((h) => h.company.ticker === "UBER")!;
    expect(uber.change.valueChangeUsd).toBe(2_476_978_592 - 2_154_934_398);
    expect(uber.change.shareChange).toBe(34_326_200 - 29_958_771);
    expect(formatPp(uber.change.weightChangePp!)).toBe(
      formatPp((2_476_978_592 / 19_465_692_772 - 2_154_934_398 / 14_283_639_861) * 100)
    );
  });
});

describe("story numbers", () => {
  const stories = capital.getQuarterPages().filter((q) => q.story);

  it("covers both published stories", () => {
    expect(stories.map((q) => q.story!.slug).sort()).toEqual(["pershing-square-2026-q2", "thiel-macro-2026-q2"]);
  });

  for (const q of stories) {
    const story = q.story!;
    it(`every number in ${story.slug} recomputes from the SEC data`, () => {
      const bySlug = new Map(q.holdings.map((h) => [h.company.slug, h]));
      const percents = new Set(q.holdings.map((h) => formatWeight(h.weight)));
      const dollars = new Set([formatUsdCompact(q.reportedValueUsd), ...q.holdings.map((h) => formatUsdCompact(h.valueUsd))]);
      const counts = new Set<string>();

      for (const claim of story.claims) {
        switch (claim.kind) {
          case "weightSum": {
            const sum = claim.companies.reduce((total, slug) => total + bySlug.get(slug)!.weight, 0);
            expect(formatWeight(sum), claim.text).toBe(claim.text);
            percents.add(claim.text);
            break;
          }
          case "shareChange": {
            const pct = bySlug.get(claim.company)!.change.shareChangePct!;
            const expected = claim.text.startsWith("+") ? formatSignedPercent(pct) : `${Math.abs(pct).toFixed(2)}%`;
            expect(expected, claim.text).toBe(claim.text);
            percents.add(claim.text.replace(/^\+/, ""));
            break;
          }
          case "shares": {
            const quarter = capital.getQuarter(q.fund, claim.quarter)!;
            const holding = quarter.holdings.find((h) => h.company.slug === claim.company)!;
            expect(holding.shares.toLocaleString("en-US")).toBe(claim.text);
            counts.add(claim.text);
            break;
          }
          case "previousShares": {
            const exit = q.exited.find((e) => e.company.slug === claim.company)!;
            expect(exit.previousShares.toLocaleString("en-US")).toBe(claim.text);
            counts.add(claim.text);
            break;
          }
          case "previousValue": {
            const exit = q.exited.find((e) => e.company.slug === claim.company)!;
            expect(formatUsdCompact(exit.previousValueUsd)).toBe(claim.text);
            dollars.add(claim.text);
            break;
          }
          case "previousTotal":
            expect(formatUsdCompact(q.previous!.reportedValueUsd)).toBe(claim.text);
            dollars.add(claim.text);
            break;
        }
      }

      const text = [
        story.headline,
        story.dek,
        story.cardSummary,
        ...story.sections.flatMap((s) => [s.heading, ...s.paragraphs]),
        ...[story.visual.cover, story.visual.intro, story.visual.outro].flatMap((c) => [c.title ?? "", c.headline ?? "", c.body]),
      ].join("\n");
      for (const token of text.match(/\d+\.\d+%/g) ?? []) expect(percents, `${story.slug}: ${token}`).toContain(token);
      for (const token of text.match(/\$\d[\d,]*(?:\.\d+)?[KMB]\b/g) ?? []) expect(dollars, `${story.slug}: ${token}`).toContain(token);
      for (const token of text.match(/\b\d{1,3}(?:,\d{3})+\b/g) ?? []) expect(counts, `${story.slug}: ${token}`).toContain(token);
    });
  }
});

describe("content validation", () => {
  const raw = () => ({
    funds: structuredClone(fundsJson),
    filings: [structuredClone(thielFilings), structuredClone(pershingFilings)],
    companies: structuredClone(companiesJson),
    stories: [structuredClone(thielStory), structuredClone(pershingStory)],
    themes: structuredClone(themesJson),
    series: structuredClone(seriesJson),
  });

  it("accepts the shipped content", () => {
    expect(() => validateCapitalContent(raw())).not.toThrow();
  });

  it("rejects a holding that no longer sums to the cover-page total", () => {
    const broken = raw();
    (broken.filings[0] as typeof thielFilings).quarters[4].holdings[0].valueUsd += 1;
    expect(() => validateCapitalContent(broken)).toThrow(CapitalContentError);
  });

  it("rejects a story that cites a company outside the filing", () => {
    const broken = raw();
    (broken.stories[0] as typeof thielStory).visual.holdings.push("netflix");
    expect(() => validateCapitalContent(broken)).toThrow(/netflix is not a holding/);
  });

  it("rejects a malformed accession number", () => {
    const broken = raw();
    (broken.filings[1] as typeof pershingFilings).quarters[0].reports[0].accession = "0001172661-25-35";
    expect(() => validateCapitalContent(broken)).toThrow();
  });
});

describe("pages and SEO", () => {
  it("only lists in-review funds without numbers", () => {
    expect(capital.getInReviewFunds().map((f) => f.slug)).toEqual(["tci", "atreides"]);
    expect(capital.getFund("tci")).toBeNull();
  });

  it("builds a quarter page only when the filing has positions", () => {
    expect(capital.getQuarter("thiel-macro", "2026-q1")).toBeNull();
    expect(capital.getQuarterPages().map((q) => q.href)).toEqual([
      "/capital/funds/thiel-macro/holdings/2026-q2",
      "/capital/funds/thiel-macro/holdings/2025-q3",
      "/capital/funds/thiel-macro/holdings/2025-q2",
      "/capital/funds/pershing-square/holdings/2026-q2",
      "/capital/funds/pershing-square/holdings/2026-q1",
      "/capital/funds/pershing-square/holdings/2025-q4",
      "/capital/funds/pershing-square/holdings/2025-q3",
      "/capital/funds/pershing-square/holdings/2025-q2",
    ]);
  });

  it("does not compare a quarter whose previous quarter is not loaded", () => {
    const first = capital.getQuarter("pershing-square", "2025-q2")!;
    expect(first.previous).toBeNull();
    expect(first.holdings.every((h) => h.change.kind === "not-compared")).toBe(true);
  });

  it("emits unique sitemap URLs with content dates", () => {
    const entries = capitalSitemapEntries();
    const urls = entries.map((e) => e.url);
    expect(new Set(urls).size).toBe(urls.length);
    expect(urls.some((u) => u.endsWith("/capital/funds/thiel-macro/holdings/2026-q2"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/companies/amazon"))).toBe(true);
    const quarter = entries.find((e) => e.url.endsWith("/thiel-macro/holdings/2026-q2"))!;
    expect((quarter.lastModified as Date).toISOString()).toBe("2026-10-19T00:00:00.000Z");
    // 2 section pages + 2 funds + 8 quarters + every company with data
    expect(entries).toHaveLength(2 + 2 + 8 + capital.getCompaniesWithData().length);
  });

  it("gives every company page tracked positions", () => {
    for (const company of capital.getCompaniesWithData()) {
      expect(capital.getCompany(company.slug)?.positions.length).toBeGreaterThan(0);
    }
    const amazon = capital.getCompany("amazon")!;
    expect(amazon.current.map((p) => p.fund.slug).sort()).toEqual(["pershing-square", "thiel-macro"]);
  });

  it("exposes featured entries for the homepage", () => {
    const featured = getFeaturedCapital();
    expect(featured).toHaveLength(2);
    for (const item of featured) {
      expect(item.href).toMatch(/^\/capital\/funds\/[a-z-]+\/holdings\/\d{4}-q[1-4]$/);
      expect(item.imageUrl).toBe(`${item.href}/og`);
      expect(item.summary).toContain("reported 13F value");
    }
  });
});

describe("formatting", () => {
  it("formats money, weights and dates", () => {
    expect(formatUsdCompact(418_666_506)).toBe("$418.67M");
    expect(formatUsdCompact(19_465_692_772)).toBe("$19.47B");
    expect(formatUsdCompact(3_672_000)).toBe("$3.67M");
    expect(formatUsd(418_666_506)).toBe("$418,666,506");
    expect(formatSignedPercent(-25.22)).toBe("\u221225.22%");
    expect(formatPp(0.001)).toBe("0.00 pp");
    expect(formatDate("2026-06-30")).toBe("Jun 30, 2026");
    expect(quarterLabel("2026-q2")).toBe("Q2 2026");
    expect(previousQuarterKey("2026-q1")).toBe("2025-q4");
  });

  it("maps SIC codes to the studio's broad sectors", () => {
    expect(sectorForSic("4911")).toBe("Utilities & power");
    expect(sectorForSic("1311")).toBe("Oil & gas");
    expect(sectorForSic("3443")).toBe("Industrials");
    expect(sectorForSic(undefined)).toBe("Unclassified");
  });
});
