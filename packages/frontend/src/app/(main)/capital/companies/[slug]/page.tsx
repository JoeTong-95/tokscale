import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TOKSCALE_X_HANDLE } from "@/lib/community";
import {
  absoluteUrl,
  capital,
  capitalPath,
  companyUrl,
  formatDate,
  formatShares,
  formatUsdCompact,
  formatWeight,
  quarterLabel,
  quarterKeyForPeriod,
} from "@/lib/capital";
import { Breadcrumbs } from "../../_components/Breadcrumbs";
import { CapitalShell } from "../../_components/CapitalShell";
import { JsonLd } from "../../_components/JsonLd";
import styles from "../../_components/capital.module.css";
import { changeClass, changeText } from "../../_components/changeLabel";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/** Only companies that a tracked manager reported holding get a page. */
export const dynamicParams = false;

export function generateStaticParams() {
  return capital.getCompaniesWithData().map((company) => ({ slug: company.slug }));
}

function summarize(slug: string) {
  const detail = capital.getCompany(slug);
  if (!detail) return null;
  const period = quarterLabel(quarterKeyForPeriod(detail.latestPeriod));
  const value = detail.current.reduce((sum, p) => sum + p.holding.valueUsd, 0);
  const sentence =
    detail.current.length > 0
      ? `Held by ${detail.current.length} of the ${detail.trackedFunds} managers Tokscale tracks in ${period}, with a combined reported 13F value of ${formatUsdCompact(value)}.`
      : `Not held by any of the ${detail.trackedFunds} managers Tokscale tracks in ${period}. Earlier positions are listed below.`;
  return { detail, period, value, sentence };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const summary = summarize(slug);
  if (!summary) return { title: "Not found | Tokscale", robots: { index: false } };
  const { company } = summary.detail;
  const title = `${company.name} (${company.ticker}) Among Tracked 13F Portfolios | Tokscale`;
  const description = `${summary.sentence} Shares, reported values and weights by quarter, from SEC 13F filings.`;
  const canonical = companyUrl(slug);
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, type: "website", url: canonical, siteName: "Tokscale" },
    twitter: { card: "summary", site: TOKSCALE_X_HANDLE, title, description },
  };
}

export default async function CompanyPage({ params }: PageProps) {
  const { slug } = await params;
  const summary = summarize(slug);
  if (!summary) notFound();
  const { detail } = summary;
  const { company } = detail;

  return (
    <CapitalShell>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Corporation",
              name: company.name,
              tickerSymbol: `${company.exchange}: ${company.ticker}`,
              url: companyUrl(slug),
              ...(company.descriptionSource ? { sameAs: [company.descriptionSource.url] } : {}),
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Capital", item: absoluteUrl(capitalPath()) },
                { "@type": "ListItem", position: 2, name: company.name, item: companyUrl(slug) },
              ],
            },
          ],
        }}
      />
      <Breadcrumbs items={[{ label: "Capital", href: capitalPath() }, { label: company.name }]} />

      <header className={styles.articleHead}>
        <p className={styles.eyebrow}>
          Company · {company.exchange}: {company.tickers.join(", ")}
        </p>
        <h1 className={`${styles.display} ${styles.articleTitle}`}>{company.name}</h1>
        <p className={styles.dek}>{summary.sentence}</p>
      </header>

      <section className={styles.section} aria-label="About the company">
        <div className={styles.grid}>
          <div className={styles.prose}>
            {company.description ? (
              <>
                <p>{company.description}</p>
                {company.descriptionSource ? (
                  <p className={styles.note}>
                    Source:{" "}
                    <a href={company.descriptionSource.url} target="_blank" rel="noopener noreferrer">
                      {company.descriptionSource.label}
                    </a>
                  </p>
                ) : null}
              </>
            ) : (
              <p className={styles.muted}>Tokscale has not written a description of this company yet.</p>
            )}
            {company.note ? <p className={styles.callout}>{company.note}</p> : null}
          </div>
          <dl className={styles.dl}>
            <dt>Ticker</dt>
            <dd>
              {company.exchange}: {company.tickers.join(", ")}
            </dd>
            <dt>SEC CIK</dt>
            <dd className={styles.num}>{Number(company.cik)}</dd>
            <dt>SIC code</dt>
            <dd>{company.sic ? `${company.sic} · ${company.sicLabel}` : "None on file"}</dd>
            <dt>Sector</dt>
            <dd>{company.sector}</dd>
            <dt>CUSIP issuer</dt>
            <dd className={styles.num}>{company.cusip6}</dd>
          </dl>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="positions">
        <div className={styles.sectionHead}>
          <h2 id="positions" className={`${styles.display} ${styles.sectionTitle}`}>
            Positions among managers Tokscale tracks
          </h2>
          <p className={styles.sectionNote}>Quarter-end 13F values, newest first</p>
        </div>
        <table className={`${styles.table} ${styles.stack}`}>
          <thead>
            <tr>
              <th scope="col">Manager and quarter</th>
              <th scope="col" className={styles.right}>Shares</th>
              <th scope="col" className={styles.right}>Reported value</th>
              <th scope="col" className={styles.right}>Weight in that 13F</th>
              <th scope="col">vs previous quarter</th>
            </tr>
          </thead>
          <tbody>
            {[...detail.positions]
              .sort(
                (a, b) =>
                  b.quarter.periodOfReport.localeCompare(a.quarter.periodOfReport) || b.holding.valueUsd - a.holding.valueUsd
              )
              .map(({ fund, quarter, holding }) => (
                <tr key={`${fund.slug}-${quarter.quarter}`}>
                  <td className={styles.stackFull}>
                    <Link className={styles.companyName} href={quarter.href}>
                      {fund.shortName} · {quarter.label}
                    </Link>
                    <span className={styles.companySub}>
                      Rank {holding.rank} of {quarter.holdings.length} · as of {formatDate(quarter.periodOfReport)}
                    </span>
                  </td>
                  <td className={`${styles.right} ${styles.num}`} data-label="Shares">
                    {formatShares(holding.shares)}
                  </td>
                  <td className={`${styles.right} ${styles.num}`} data-label="Reported value">
                    {formatUsdCompact(holding.valueUsd)}
                  </td>
                  <td className={`${styles.right} ${styles.num}`} data-label="Weight">
                    {formatWeight(holding.weight)}
                  </td>
                  <td className={styles.stackFull} data-label="Change">
                    <span className={`${styles.status} ${changeClass(holding.change.kind)}`}>{changeText(holding.change)}</span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        <p className={styles.note}>
          Weights are shares of each manager’s own reported 13F value for that quarter. A 13F shows long positions at
          quarter end only; the managers may have traded since.
        </p>
      </section>

      {detail.themes.length > 0 ? (
        <section className={styles.section} aria-labelledby="themes">
          <p id="themes" className={styles.eyebrow} style={{ marginBottom: 12 }}>
            Themes
          </p>
          <ul className={styles.chips}>
            {detail.themes.map((theme) => (
              <li key={theme.slug}>
                <Link href={`${capitalPath()}#themes`}>{theme.name}</Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </CapitalShell>
  );
}
