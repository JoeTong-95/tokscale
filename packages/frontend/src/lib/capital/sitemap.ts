import type { MetadataRoute } from "next";
import { capital, type QuarterView } from "./model";
import { capitalUrl, companyUrl, fundUrl, portfoliosUrl, quarterUrl } from "./urls";

/**
 * Sitemap entries for the capital section. app/sitemap.ts spreads these in.
 *
 * lastModified is a real content date, never the request time: a story page
 * uses its publish date or latest correction; a data-only quarter uses the date
 * its SEC responses were retrieved. Section pages take the newest of those.
 */
function quarterLastModified(quarter: QuarterView): Date {
  const dates = quarter.story
    ? [quarter.story.publishedAt, ...quarter.story.corrections.map((c) => c.date)]
    : [quarter.secRetrievedAt.slice(0, 10)];
  return new Date(`${dates.sort().at(-1)}T00:00:00.000Z`);
}

const newest = (dates: Date[]) => new Date(Math.max(...dates.map((d) => d.getTime())));

export function capitalSitemapEntries(): MetadataRoute.Sitemap {
  const quarterPages = capital.getQuarterPages();
  const sectionLastModified = newest(quarterPages.map(quarterLastModified));

  const entries: MetadataRoute.Sitemap = [
    { url: capitalUrl(), lastModified: sectionLastModified, changeFrequency: "weekly", priority: 0.7 },
    { url: portfoliosUrl(), lastModified: sectionLastModified, changeFrequency: "weekly", priority: 0.6 },
  ];

  for (const view of capital.getPublishedFunds()) {
    const pages = view.quarters.filter((q) => q.holdings.length > 0);
    entries.push({
      url: fundUrl(view.fund.slug),
      lastModified: newest(pages.map(quarterLastModified)),
      changeFrequency: "monthly",
      priority: 0.6,
    });
    for (const quarter of pages) {
      entries.push({
        url: quarterUrl(view.fund.slug, quarter.quarter),
        lastModified: quarterLastModified(quarter),
        changeFrequency: "yearly",
        priority: quarter.story ? 0.6 : 0.4,
      });
    }
  }

  for (const company of capital.getCompaniesWithData()) {
    const detail = capital.getCompany(company.slug);
    if (!detail) continue;
    entries.push({
      url: companyUrl(company.slug),
      lastModified: newest(detail.positions.map((p) => quarterLastModified(p.quarter))),
      changeFrequency: "monthly",
      priority: 0.4,
    });
  }

  return entries;
}
