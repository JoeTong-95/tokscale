import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TOKSCALE_X_HANDLE } from "@/lib/community";
import {
  absoluteUrl,
  capital,
  capitalPath,
  formatDate,
  formatSignedUsdCompact,
  formatUsd,
  formatUsdCompact,
  formatWeight,
  fundPath,
  quarterOgImagePath,
  quarterUrl,
  type QuarterView,
} from "@/lib/capital";
import { AllocationBar } from "../../../../_components/AllocationBar";
import { Breadcrumbs } from "../../../../_components/Breadcrumbs";
import { CapitalShell } from "../../../../_components/CapitalShell";
import { ChangesTable } from "../../../../_components/ChangesTable";
import { HoldingsTable } from "../../../../_components/HoldingsTable";
import { JsonLd } from "../../../../_components/JsonLd";
import { Methodology } from "../../../../_components/Methodology";
import { Sources } from "../../../../_components/Sources";
import { Stats } from "../../../../_components/Stats";
import { StoryBody } from "../../../../_components/StoryBody";
import { VisualEdition } from "../../../../_components/VisualEdition";
import styles from "../../../../_components/capital.module.css";

interface PageProps {
  params: Promise<{ fund: string; quarter: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return capital.getQuarterPages().map((q) => ({ fund: q.fund, quarter: q.quarter }));
}

function describe(q: QuarterView): string {
  const top = q.holdings[0];
  return `${q.fundRecord.shortName}’s ${q.label} 13F: ${formatUsdCompact(q.reportedValueUsd)} reported value across ${q.holdings.length} holdings as of ${formatDate(q.periodOfReport)}. Largest: ${top.company.name} at ${formatWeight(top.weight)}. Full table, changes and SEC sources.`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { fund, quarter } = await params;
  const q = capital.getQuarter(fund, quarter);
  if (!q) return { title: "Not found | Tokscale", robots: { index: false } };
  const title = `${q.fundRecord.shortName} ${q.label} Portfolio: 13F Holdings | Tokscale`;
  const description = q.story?.dek ?? describe(q);
  const canonical = quarterUrl(fund, quarter);
  const image = {
    url: absoluteUrl(quarterOgImagePath(fund, quarter)),
    width: 1200,
    height: 630,
    alt: `${q.fundRecord.shortName} ${q.label} 13F snapshot`,
  };
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: "article",
      url: canonical,
      siteName: "Tokscale",
      images: [image],
      publishedTime: q.story?.publishedAt,
      modifiedTime: q.story?.reviewedAt,
    },
    twitter: { card: "summary_large_image", site: TOKSCALE_X_HANDLE, title, description, images: [image.url] },
  };
}

export default async function QuarterPage({ params }: PageProps) {
  const { fund, quarter } = await params;
  const q = capital.getQuarter(fund, quarter);
  if (!q) notFound();

  const story = q.story;
  const headline = story?.headline ?? `${q.fundRecord.shortName} ${q.label} 13F holdings`;
  const canonical = quarterUrl(fund, quarter);
  const fundName = q.fundRecord.shortName;
  const skipped = (() => {
    const view = capital.getFund(fund);
    if (!view || !q.older) return [];
    return view.quarters.filter(
      (other) => other.holdings.length === 0 && other.periodOfReport > q.older!.periodOfReport && other.periodOfReport < q.periodOfReport
    );
  })();
  const companies = q.holdings.map((h) => h.company);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline,
        description: story?.dek ?? describe(q),
        url: canonical,
        mainEntityOfPage: canonical,
        image: absoluteUrl(quarterOgImagePath(fund, quarter)),
        ...(story ? { datePublished: story.publishedAt, dateModified: story.reviewedAt } : {}),
        author: { "@type": "Organization", name: "Tokscale", url: absoluteUrl("/") },
        publisher: { "@type": "Organization", name: "Tokscale", url: absoluteUrl("/") },
        about: companies.map((c) => ({ "@type": "Corporation", name: c.name, tickerSymbol: `${c.exchange}: ${c.ticker}` })),
        isBasedOn: q.reports.map((r) => r.urls.index),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Capital", item: absoluteUrl(capitalPath()) },
          { "@type": "ListItem", position: 2, name: fundName, item: absoluteUrl(fundPath(fund)) },
          { "@type": "ListItem", position: 3, name: q.label, item: canonical },
        ],
      },
    ],
  };

  const change = q.reportedValueChangeUsd;

  return (
    <CapitalShell>
      <JsonLd data={jsonLd} />
      <Breadcrumbs
        items={[
          { label: "Capital", href: capitalPath() },
          { label: fundName, href: fundPath(fund) },
          { label: q.label },
        ]}
      />

      <header className={styles.articleHead}>
        <p className={styles.eyebrow}>
          {story ? "Inside the 13F" : "13F holdings"} · {fundName} · {q.label}
        </p>
        <h1 className={`${styles.display} ${styles.articleTitle}`}>{headline}</h1>
        <p className={styles.dek}>{story?.dek ?? describe(q)}</p>
        <p className={styles.byline}>
          <span>Period of report {formatDate(q.periodOfReport)}</span>
          <span>Filed {formatDate(q.filedAt)}</span>
          {story ? <span>Published {formatDate(story.publishedAt)}</span> : null}
          <span>
            Numbers reviewed {formatDate(story?.reviewedAt ?? q.secRetrievedAt.slice(0, 10))} against the SEC tables
          </span>
        </p>
      </header>

      <section aria-labelledby="snapshot">
        <h2 id="snapshot" className={styles.eyebrow} style={{ marginBottom: 12 }}>
          Snapshot · as of {formatDate(q.periodOfReport)}
        </h2>
        <Stats
          label={`${fundName} ${q.label} snapshot`}
          items={[
            { label: "Reported 13F value", value: formatUsdCompact(q.reportedValueUsd), sub: formatUsd(q.reportedValueUsd) },
            {
              label: "Holdings",
              value: String(q.holdings.length),
              sub: q.rowCount === q.holdings.length ? `${q.rowCount} table rows` : `issuers, from ${q.rowCount} table rows`,
            },
            { label: "Top-5 concentration", value: formatWeight(q.topFiveWeight), sub: "of reported 13F value" },
            change === null
              ? { label: "Change in reported value", value: "Not compared", sub: "previous quarter not in dataset" }
              : {
                  label: `Change in reported value vs ${q.previous?.label}`,
                  value: formatSignedUsdCompact(change),
                  sub: `from ${formatUsdCompact(q.previous?.reportedValueUsd ?? 0)}; prices and trades, not inflows`,
                },
          ]}
        />
        <AllocationBar holdings={q.holdings} label={`Weights of ${q.holdings.length} positions in the reported 13F value`} />
        <p className={styles.asOf}>
          Quarter-end, long-only snapshot from {q.reports.length > 1 ? `${q.reports.length} reports` : "one report"} filed{" "}
          {formatDate(q.filedAt)}. No shorts. The manager may have traded since.
        </p>
      </section>

      {story ? (
        <section className={styles.section} style={{ marginTop: 40 }} aria-label="Story">
          <div className={styles.prose}>
            <StoryBody sections={story.sections} />
          </div>
        </section>
      ) : null}

      {story ? (
        <section className={styles.section} aria-labelledby="visual">
          <div className={styles.sectionHead}>
            <h2 id="visual" className={`${styles.display} ${styles.sectionTitle}`}>Visual edition</h2>
            <p className={styles.sectionNote}>The Inside the 13F cards, rebuilt from the table below. Scroll sideways.</p>
          </div>
          <VisualEdition quarter={q} />
        </section>
      ) : null}

      <section className={styles.section} style={story ? undefined : { marginTop: 40 }} aria-labelledby="holdings">
        <div className={styles.sectionHead}>
          <h2 id="holdings" className={`${styles.display} ${styles.sectionTitle}`}>All holdings</h2>
        </div>
        <HoldingsTable quarter={q} />
      </section>

      <section className={styles.section} aria-labelledby="changes">
        <div className={styles.sectionHead}>
          <h2 id="changes" className={`${styles.display} ${styles.sectionTitle}`}>
            {q.previous ? `What changed since ${q.previous.label}` : "What changed"}
          </h2>
        </div>
        <ChangesTable quarter={q} />
      </section>

      <section className={styles.section} aria-labelledby="sources">
        <div className={styles.sectionHead}>
          <h2 id="sources" className={`${styles.display} ${styles.sectionTitle}`}>Sources</h2>
        </div>
        <Sources quarter={q} />
      </section>

      <section className={styles.section} aria-labelledby="method">
        <div className={styles.sectionHead}>
          <h2 id="method" className={`${styles.display} ${styles.sectionTitle}`}>Methodology</h2>
        </div>
        <Methodology quarter={q} />
      </section>

      <section className={styles.section} aria-labelledby="corrections">
        <div className={styles.sectionHead}>
          <h2 id="corrections" className={`${styles.display} ${styles.sectionTitle}`}>Corrections</h2>
        </div>
        <div className={styles.prose}>
          {story && story.corrections.length > 0 ? (
            <ul>
              {story.corrections.map((c) => (
                <li key={c.date + c.text}>
                  {formatDate(c.date)}: {c.text}
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.note} style={{ marginTop: 0 }}>
              No corrections since this page was {story ? `published on ${formatDate(story.publishedAt)}` : "created"}.
            </p>
          )}
        </div>
      </section>

      <nav className={styles.section} aria-label="Other quarters">
        <ul className={styles.pager}>
          <li>
            {q.older ? (
              <Link href={q.older.href}>
                <span className={styles.eyebrow}>← Earlier quarter</span>
                <strong>
                  {fundName} {q.older.label}
                </strong>
              </Link>
            ) : (
              <span className={styles.note}>No earlier quarter in Tokscale’s dataset.</span>
            )}
          </li>
          <li className={styles.pagerNext}>
            {q.newer ? (
              <Link href={q.newer.href}>
                <span className={styles.eyebrow}>Later quarter →</span>
                <strong>
                  {fundName} {q.newer.label}
                </strong>
              </Link>
            ) : (
              <span className={styles.note}>This is the latest filing Tokscale tracks.</span>
            )}
          </li>
        </ul>
        {skipped.length > 0 ? (
          <p className={styles.note}>
            {[...skipped].reverse().map((s) => s.label).join(" and ")}: the {skipped.length > 1 ? "reports" : "report"} listed no
            positions, so {skipped.length > 1 ? "they have" : "it has"} no page. See the{" "}
            <Link className={styles.link} href={fundPath(fund)}>
              filing history
            </Link>
            .
          </p>
        ) : null}
      </nav>

      <section className={styles.section} aria-labelledby="related">
        <div className={styles.sectionHead}>
          <h2 id="related" className={`${styles.display} ${styles.sectionTitle}`}>Companies in this filing</h2>
        </div>
        <ul className={styles.chips}>
          {companies.map((c) => (
            <li key={c.slug}>
              <Link href={c.href}>
                {c.name} <span className={styles.muted}>{c.ticker}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </CapitalShell>
  );
}
