import type { MetadataRoute } from "next";
import { ledger } from "./ledger";
import { capital, type QuarterView } from "./model";
import {
  absoluteUrl,
  capitalUrl,
  companiesUrl,
  companyUrl,
  computeUrl,
  investorUrl,
  investorsUrl,
  methodologyUrl,
  quarterUrl,
  roundsUrl,
  sectorUrl,
  spendingUrl,
} from "./urls";

/**
 * Sitemap entries for the capital section. app/sitemap.ts spreads these in.
 *
 * lastModified is a real content date, never the request time: event and profile pages use
 * their latest review or correction date; a 13F story page its publish or correction date; a
 * data-only 13F quarter the date its SEC responses were retrieved; the spending page the date
 * its XBRL facts were retrieved. Section pages take the newest of their parts.
 *
 * Pages that are not indexable (no primary source, no sourced fact, filtered list views) are
 * left out, matching their robots metadata.
 */
const day = (date: string) => new Date(`${date.slice(0, 10)}T00:00:00.000Z`);
const newest = (dates: Date[]) => new Date(Math.max(...dates.map((d) => d.getTime())));

function quarterLastModified(quarter: QuarterView): Date {
  const dates = quarter.story
    ? [quarter.story.publishedAt, ...quarter.story.corrections.map((c) => c.date)]
    : [quarter.secRetrievedAt.slice(0, 10)];
  return day(dates.sort().at(-1)!);
}

export function capitalSitemapEntries(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];
  const seen = new Set<string>();
  const push = (entry: MetadataRoute.Sitemap[number]) => {
    if (seen.has(entry.url)) return;
    seen.add(entry.url);
    entries.push(entry);
  };

  const events = ledger.getEvents().filter((e) => e.indexable);
  const eventModified = (e: (typeof events)[number]) =>
    day([e.event.reviewedAt, ...e.event.corrections.map((c) => c.date)].sort().at(-1)!);
  const ledgerModified = day(ledger.reviewedAt());
  const quarterPages = capital.getQuarterPages();
  const thirteenFModified = newest(quarterPages.map(quarterLastModified));
  const sectionModified = newest([ledgerModified, thirteenFModified]);
  const capexModified = day(ledger.capexRetrievedAt);

  push({ url: capitalUrl(), lastModified: newest([sectionModified, capexModified]), changeFrequency: "weekly", priority: 0.8 });
  push({ url: companiesUrl(), lastModified: ledgerModified, changeFrequency: "weekly", priority: 0.7 });
  push({ url: investorsUrl(), lastModified: sectionModified, changeFrequency: "weekly", priority: 0.6 });
  push({ url: roundsUrl(), lastModified: ledgerModified, changeFrequency: "weekly", priority: 0.7 });
  push({ url: computeUrl(), lastModified: ledgerModified, changeFrequency: "weekly", priority: 0.7 });
  push({ url: spendingUrl(), lastModified: capexModified, changeFrequency: "monthly", priority: 0.7 });
  push({ url: methodologyUrl(), lastModified: ledgerModified, changeFrequency: "monthly", priority: 0.4 });

  for (const sector of ledger.getSectors()) {
    const dates = [ledgerModified, ...sector.events.filter((e) => e.indexable).map(eventModified)];
    push({ url: sectorUrl(sector.slug), lastModified: newest(dates), changeFrequency: "weekly", priority: 0.6 });
  }

  for (const event of events) {
    push({ url: absoluteUrl(event.href), lastModified: eventModified(event), changeFrequency: "monthly", priority: 0.6 });
  }

  for (const org of ledger.getCompanies()) {
    const profile = ledger.getCompany(org.slug);
    if (!profile || !profile.indexable) continue;
    push({ url: companyUrl(org.slug), lastModified: day(profile.reviewedAt), changeFrequency: "weekly", priority: 0.6 });
  }

  for (const row of ledger.getInvestors()) {
    const profile = ledger.getInvestor(row.org.slug);
    if (!profile || !profile.indexable) continue;
    const dates = [day(profile.reviewedAt), ...(profile.fund ? profile.fund.quarters.filter((q) => q.holdings.length > 0).map(quarterLastModified) : [])];
    push({ url: investorUrl(row.org.slug), lastModified: newest(dates), changeFrequency: "monthly", priority: 0.5 });
  }

  for (const quarter of quarterPages) {
    push({
      url: quarterUrl(quarter.fund, quarter.quarter),
      lastModified: quarterLastModified(quarter),
      changeFrequency: "yearly",
      priority: quarter.story ? 0.6 : 0.4,
    });
  }

  // U.S.-listed companies that appear only in tracked 13F filings keep their positions page.
  for (const company of capital.getCompaniesWithData()) {
    const detail = capital.getCompany(company.slug);
    if (!detail) continue;
    push({
      url: companyUrl(company.slug),
      lastModified: newest(detail.positions.map((p) => quarterLastModified(p.quarter))),
      changeFrequency: "monthly",
      priority: 0.4,
    });
  }

  return entries;
}
