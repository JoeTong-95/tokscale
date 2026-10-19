import type { Metadata } from "next";
import Link from "next/link";
import { TOKSCALE_X_HANDLE } from "@/lib/community";
import {
  capital,
  capitalUrl,
  formatDate,
  formatUsd,
  formatUsdCompact,
  formatWeight,
  portfoliosPath,
  quarterLabel,
  quarterKeyForPeriod,
} from "@/lib/capital";
import { AllocationBar } from "./_components/AllocationBar";
import { CapitalShell } from "./_components/CapitalShell";
import { Stats } from "./_components/Stats";
import styles from "./_components/capital.module.css";

const TITLE = "Capital: 13F Research on the AI Economy | Tokscale";
const DESCRIPTION =
  "Follow capital across the AI economy. Quarter-end 13F holdings of tracked managers, checked line by line against SEC filings, with changes, sources and methodology.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: capitalUrl() },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website", url: capitalUrl(), siteName: "Tokscale" },
  twitter: { card: "summary_large_image", site: TOKSCALE_X_HANDLE, title: TITLE, description: DESCRIPTION },
};

export default function CapitalPage() {
  const series = capital.getSeries()[0];
  const funds = capital.getPublishedFunds();
  const latestPeriod = capital.getLatestPeriod();
  const featured = series.entries[0];
  const q = featured.quarter;
  const filings = capital.getRecentFilings(5);
  const themes = capital.getThemes();

  return (
    <CapitalShell>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>Capital</p>
        <h1 className={`${styles.display} ${styles.heroTitle}`}>Follow capital across the AI economy.</h1>
        <p className={styles.heroLede}>
          What tracked managers reported holding at quarter end, from cloud platforms to the power plants that feed them.
          Every number comes from an SEC filing and links back to it.
        </p>
        <p className={styles.heroMeta}>
          {funds.length} managers tracked · Latest period {quarterLabel(quarterKeyForPeriod(latestPeriod))} (
          {formatDate(latestPeriod)})
        </p>
      </header>

      <section className={styles.section} aria-label="Featured portfolio and recent filings">
        <div className={styles.grid}>
          <article aria-labelledby="featured-title">
            <p className={styles.eyebrow}>
              Featured portfolio · {q.fundRecord.shortName} · {q.label}
            </p>
            <h2 id="featured-title" className={`${styles.display} ${styles.featuredTitle}`}>
              <Link href={q.href}>{featured.story.headline}</Link>
            </h2>
            <p className={styles.dek}>{featured.story.dek}</p>
            <Stats
              label={`${q.fundRecord.shortName} ${q.label} snapshot`}
              items={[
                { label: "Reported 13F value", value: formatUsdCompact(q.reportedValueUsd), sub: formatUsd(q.reportedValueUsd) },
                { label: "Holdings", value: String(q.holdings.length), sub: `as of ${formatDate(q.periodOfReport)}` },
                { label: "Top-5 concentration", value: formatWeight(q.topFiveWeight), sub: `filed ${formatDate(q.filedAt)}` },
              ]}
            />
            <AllocationBar holdings={q.holdings} label={`Weights in ${q.fundRecord.shortName}’s ${q.label} 13F`} />
            <p className={styles.note}>
              <Link className={styles.link} href={q.href}>
                Read the story, the full table and the sources →
              </Link>
            </p>
          </article>

          <aside aria-labelledby="recent-filings">
            <p id="recent-filings" className={styles.eyebrow} style={{ marginBottom: 16 }}>
              Recent filings
            </p>
            <ul className={styles.rows}>
              {filings.map(({ fund, quarter, filing }) => (
                <li className={styles.row} key={filing.accession}>
                  <p className={styles.rowTitle}>
                    {quarter.holdings.length > 0 ? (
                      <Link href={quarter.href}>
                        {fund.shortName} · {filing.form}
                      </Link>
                    ) : (
                      <>
                        {fund.shortName} · {filing.form}
                      </>
                    )}
                  </p>
                  <p className={styles.rowMeta}>
                    {filing.filerName} · {quarter.label} · filed {formatDate(filing.filedAt)}
                  </p>
                  <p className={styles.rowMeta}>
                    {filing.form === "13F-NT"
                      ? "Notice: holdings reported in another manager’s filing"
                      : `${formatUsdCompact(filing.declaredTotalUsd)} on the cover page · `}
                    {filing.form === "13F-NT" ? null : (
                      <a className={styles.link} href={filing.urls.index} target="_blank" rel="noopener noreferrer">
                        SEC
                      </a>
                    )}
                  </p>
                </li>
              ))}
            </ul>
            <p className={styles.note}>
              <Link className={styles.link} href={portfoliosPath()}>
                All tracked portfolios →
              </Link>
            </p>
          </aside>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="series">
        <div className={styles.sectionHead}>
          <h2 id="series" className={`${styles.display} ${styles.sectionTitle}`}>{series.name}</h2>
          <p className={styles.sectionNote}>{series.summary}</p>
        </div>
        <div className={styles.cards} style={{ "--cols": series.entries.length + series.inReview.length } as React.CSSProperties}>
          {series.entries.map(({ quarter, story }) => (
            <Link className={styles.card} href={quarter.href} key={story.slug}>
              <span className={styles.eyebrow}>
                {quarter.fundRecord.shortName} · {quarter.label}
              </span>
              <h3 className={`${styles.display} ${styles.cardTitle}`}>{story.headline}</h3>
              <p className={styles.cardBody}>{story.cardSummary}</p>
              <span className={styles.cardFoot}>
                {formatUsdCompact(quarter.reportedValueUsd)} reported 13F value · {quarter.holdings.length} holdings ·
                largest {quarter.holdings[0].company.ticker} {formatWeight(quarter.holdings[0].weight)}
              </span>
            </Link>
          ))}
          {series.inReview.map((entry) => (
            <div className={`${styles.card} ${styles.cardDisabled}`} key={entry.fund.slug}>
              <span className={styles.eyebrow}>
                {entry.fund.shortName} · {entry.label}
              </span>
              <h3 className={`${styles.display} ${styles.cardTitle}`}>{entry.fund.name}</h3>
              <span className={styles.pill}>In review</span>
              <p className={styles.cardBody}>{entry.fund.status === "in-review" ? entry.fund.reviewNote : null}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="themes">
        <div className={styles.sectionHead}>
          <h2 id="themes" className={`${styles.display} ${styles.sectionTitle}`}>Explore by theme</h2>
          <p className={styles.sectionNote}>
            Combined reported 13F value among managers Tokscale tracks, {quarterLabel(quarterKeyForPeriod(latestPeriod))}
          </p>
        </div>
        <div className={styles.cards} style={{ "--cols": themes.length } as React.CSSProperties}>
          {themes.map((theme) => (
            <div className={styles.card} key={theme.slug}>
              <h3 className={`${styles.display} ${styles.cardTitle}`}>{theme.name}</h3>
              <p className={styles.cardBody}>{theme.summary}</p>
              <ul className={styles.chips}>
                {theme.companies.map(({ company }) => (
                  <li key={company.slug}>
                    <Link href={company.href}>{company.ticker}</Link>
                  </li>
                ))}
              </ul>
              <span className={styles.cardFoot}>
                {theme.valueUsd > 0
                  ? `${formatUsdCompact(theme.valueUsd)} held by ${theme.funds.join(" and ")}`
                  : "Not held in the latest quarter"}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="about-13f">
        <div className={styles.grid}>
          <div className={styles.prose}>
            <h2 id="about-13f" className={`${styles.display} ${styles.sectionTitle}`}>What a 13F shows</h2>
            <p>
              Investment managers with at least $100 million in U.S.-listed securities file Form 13F with the SEC every
              quarter. It lists their long positions at quarter end and arrives up to 45 days later.
            </p>
            <p>
              It does not show short positions, cash, private companies or trades made since the quarter ended. Tokscale
              calls its total the “reported 13F value”, never assets under management.
            </p>
          </div>
          <div>
            <p className={styles.eyebrow} style={{ marginBottom: 16 }}>
              Tracked managers
            </p>
            <ul className={styles.rows}>
              {funds.map((view) => (
                <li className={styles.row} key={view.fund.slug}>
                  <p className={styles.rowTitle}>
                    <Link href={view.href}>{view.fund.shortName}</Link>
                  </p>
                  <p className={styles.rowMeta}>
                    {view.fund.person} · {view.latest.label} · {formatUsdCompact(view.latest.reportedValueUsd)} ·{" "}
                    {view.latest.holdings.length} holdings
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </CapitalShell>
  );
}
