import type { Metadata } from "next";
import Link from "next/link";
import { TOKSCALE_X_HANDLE } from "@/lib/community";
import {
  capital,
  capitalPath,
  formatDate,
  formatSignedUsdCompact,
  formatUsd,
  formatUsdCompact,
  formatWeight,
  portfoliosPath,
  portfoliosUrl,
} from "@/lib/capital";
import { AllocationBar } from "../_components/AllocationBar";
import { Breadcrumbs } from "../_components/Breadcrumbs";
import { CapitalShell } from "../_components/CapitalShell";
import styles from "../_components/capital.module.css";

const TITLE = "Tracked Portfolios: 13F Holdings by Manager | Tokscale";
const DESCRIPTION =
  "Latest 13F filings of the managers Tokscale tracks: reported 13F value, holdings, concentration and largest positions, each linked to the SEC filing.";

interface PageProps {
  searchParams: Promise<{ view?: string | string[] }>;
}

/** Both views show the same portfolios, so the bare URL is canonical. */
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: portfoliosUrl() },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website", url: portfoliosUrl(), siteName: "Tokscale" },
  twitter: { card: "summary_large_image", site: TOKSCALE_X_HANDLE, title: TITLE, description: DESCRIPTION },
};

export default async function PortfoliosPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const view = params.view === "table" ? "table" : "editorial";
  const funds = capital.getPublishedFunds();
  const inReview = capital.getInReviewFunds();

  return (
    <CapitalShell>
      <Breadcrumbs items={[{ label: "Capital", href: capitalPath() }, { label: "Portfolios" }]} />
      <header className={styles.articleHead}>
        <p className={styles.eyebrow}>Tracked portfolios</p>
        <h1 className={`${styles.display} ${styles.articleTitle}`}>Portfolios</h1>
        <p className={styles.dek}>
          The latest 13F of each manager Tokscale tracks. Values are reported 13F values at quarter end, not assets under
          management.
        </p>
        <nav aria-label="View">
          <div className={styles.toggle}>
            <Link href={portfoliosPath()} aria-current={view === "editorial" ? "page" : undefined} scroll={false}>
              Editorial
            </Link>
            <Link href={portfoliosPath("table")} aria-current={view === "table" ? "page" : undefined} scroll={false}>
              Table
            </Link>
          </div>
        </nav>
      </header>

      {view === "editorial" ? (
        <section aria-label="Portfolios">
          {funds.map(({ fund, latest, href }) => (
            <article className={styles.section} key={fund.slug}>
              <div className={styles.grid}>
                <div>
                  <p className={styles.eyebrow}>
                    {fund.person} · {latest.label} · as of {formatDate(latest.periodOfReport)}
                  </p>
                  <h2 className={`${styles.display} ${styles.featuredTitle}`}>
                    <Link href={href}>{fund.shortName}</Link>
                  </h2>
                  {latest.story ? (
                    <p className={styles.dek}>
                      <Link className={styles.textLink} href={latest.href}>
                        {latest.story.headline}
                      </Link>
                    </p>
                  ) : (
                    <p className={styles.dek}>{fund.summary}</p>
                  )}
                  <AllocationBar holdings={latest.holdings} label={`Weights in ${fund.shortName}’s ${latest.label} 13F`} />
                </div>
                <div>
                  <dl className={styles.dl}>
                    <dt>Reported 13F value</dt>
                    <dd className={styles.num}>
                      {formatUsdCompact(latest.reportedValueUsd)}{" "}
                      <span className={styles.muted}>({formatUsd(latest.reportedValueUsd)})</span>
                    </dd>
                    <dt>Holdings</dt>
                    <dd className={styles.num}>{latest.holdings.length}</dd>
                    <dt>Top-5 weight</dt>
                    <dd className={styles.num}>{formatWeight(latest.topFiveWeight)}</dd>
                    <dt>Largest</dt>
                    <dd>
                      <Link className={styles.link} href={latest.holdings[0].company.href}>
                        {latest.holdings[0].company.name}
                      </Link>{" "}
                      <span className={styles.num}>{formatWeight(latest.holdings[0].weight)}</span>
                    </dd>
                    <dt>Filed</dt>
                    <dd>{formatDate(latest.filedAt)}</dd>
                  </dl>
                  <p className={styles.note}>
                    <Link className={styles.link} href={latest.href}>
                      {latest.label} holdings →
                    </Link>
                  </p>
                </div>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className={styles.section} aria-label="Portfolios table">
          <table className={`${styles.table} ${styles.stack}`}>
            <thead>
              <tr>
                <th scope="col">Manager</th>
                <th scope="col">Period</th>
                <th scope="col" className={styles.right}>Reported 13F value</th>
                <th scope="col" className={styles.right}>Change vs previous</th>
                <th scope="col" className={styles.right}>Holdings</th>
                <th scope="col" className={styles.right}>Top-5 weight</th>
                <th scope="col">Largest position</th>
              </tr>
            </thead>
            <tbody>
              {funds.map(({ fund, latest, href }) => (
                <tr key={fund.slug}>
                  <td className={styles.stackFull}>
                    <Link className={styles.companyName} href={href}>
                      {fund.shortName}
                    </Link>
                    <span className={styles.companySub}>{fund.person}</span>
                  </td>
                  <td data-label="Period">
                    <Link className={styles.link} href={latest.href}>
                      {latest.label}
                    </Link>
                    <span className={styles.companySub}>filed {formatDate(latest.filedAt)}</span>
                  </td>
                  <td className={`${styles.right} ${styles.num}`} data-label="Reported value">
                    {formatUsdCompact(latest.reportedValueUsd)}
                  </td>
                  <td className={`${styles.right} ${styles.num}`} data-label="Change">
                    {latest.comparison === "previous-empty"
                      ? "All new"
                      : latest.reportedValueChangeUsd === null
                        ? "Not compared"
                        : formatSignedUsdCompact(latest.reportedValueChangeUsd)}
                    {latest.previous ? (
                      <span className={styles.companySub}>
                        {latest.comparison === "previous-empty" ? `${latest.previous.label} listed no positions` : `vs ${latest.previous.label}`}
                      </span>
                    ) : null}
                  </td>
                  <td className={`${styles.right} ${styles.num}`} data-label="Holdings">
                    {latest.holdings.length}
                  </td>
                  <td className={`${styles.right} ${styles.num}`} data-label="Top-5">
                    {formatWeight(latest.topFiveWeight)}
                  </td>
                  <td data-label="Largest">
                    {latest.holdings[0].company.ticker}{" "}
                    <span className={`${styles.muted} ${styles.num}`}>{formatWeight(latest.holdings[0].weight)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className={styles.note}>
            Change vs previous is the change in reported 13F value. It mixes price moves with trading and is not an inflow.
          </p>
        </section>
      )}

      {inReview.length > 0 ? (
        <section className={styles.section} aria-labelledby="in-review">
          <p id="in-review" className={styles.eyebrow} style={{ marginBottom: 16 }}>
            In review, not published
          </p>
          <ul className={styles.rows}>
            {inReview.map((fund) => (
              <li className={styles.row} key={fund.slug}>
                <p className={styles.rowTitle}>
                  {fund.name} <span className={styles.muted}>· {fund.person}</span>
                </p>
                <p className={styles.rowMeta}>{fund.status === "in-review" ? fund.reviewNote : null}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </CapitalShell>
  );
}
