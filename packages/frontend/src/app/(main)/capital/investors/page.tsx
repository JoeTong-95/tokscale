import type { Metadata } from "next";
import Link from "next/link";
import { TOKSCALE_X_HANDLE } from "@/lib/community";
import {
  capital,
  capitalPath,
  formatDate,
  formatUsdCompact,
  formatWeight,
  investorsPath,
  investorsUrl,
} from "@/lib/capital";
import { INVESTOR_TYPES, INVESTOR_TYPE_LABELS, formatPartialDate, ledger, type InvestorType } from "@/lib/capital/ledger";
import { Breadcrumbs } from "../_components/Breadcrumbs";
import { CapitalShell } from "../_components/CapitalShell";
import { JsonLd } from "../_components/JsonLd";
import { OrgCell } from "../_components/OrgMark";
import { Missing } from "../_components/Amount";
import styles from "../_components/capital.module.css";

const TITLE = "AI Investors: Rounds, Leads and 13F Holdings | Tokscale";
const DESCRIPTION =
  "Who funds the AI economy: venture, growth, sovereign and corporate investors in the rounds Tokscale tracks, plus the 13F holdings of tracked public fund managers.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: investorsUrl() },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website", url: investorsUrl(), siteName: "Tokscale" },
  twitter: { card: "summary_large_image", site: TOKSCALE_X_HANDLE, title: TITLE, description: DESCRIPTION },
};

/** URL keys for the type filter. "13f" is the public-fund-manager type. */
const TYPE_KEYS: Record<string, InvestorType> = {
  vc: "vc",
  growth: "growth",
  sovereign: "sovereign",
  corporate: "corporate",
  "asset-manager": "asset-manager",
  "registered-fund": "registered-fund",
  "13f": "public-fund-manager",
};
const keyOf = (type: InvestorType) => Object.entries(TYPE_KEYS).find(([, t]) => t === type)![0];

interface PageProps {
  searchParams: Promise<{ type?: string | string[] }>;
}

export default async function InvestorsPage({ searchParams }: PageProps) {
  const raw = (await searchParams).type;
  const typeKey = (Array.isArray(raw) ? raw[0] : raw) ?? "";
  const type = TYPE_KEYS[typeKey] ?? null;
  const all = ledger.getInvestors();
  const rows = all
    .filter((row) => !type || row.org.org.investorTypes.includes(type))
    .sort((a, b) => b.rounds - a.rounds || (b.latest?.date ?? "").localeCompare(a.latest?.date ?? "") || a.org.name.localeCompare(b.org.name));
  const funds = capital.getPublishedFunds();
  const inReview = capital.getInReviewFunds();
  const series = capital.getSeries()[0];
  const showThirteenF = !type || type === "public-fund-manager";
  const counts = new Map(INVESTOR_TYPES.map((t) => [t, all.filter((r) => r.org.org.investorTypes.includes(t)).length] as const));

  return (
    <CapitalShell section={type === "public-fund-manager" ? "public-investors" : "investors"}>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "AI investors Tokscale tracks",
          url: investorsUrl(),
          numberOfItems: all.length,
          itemListElement: all.map((row, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: row.org.name,
            url: investorsUrl().replace(/\/capital\/investors$/, row.org.investorHref ?? ""),
          })),
        }}
      />
      <Breadcrumbs items={[{ label: "Capital", href: capitalPath() }, { label: "Investors" }]} />
      <header className={styles.pageHead}>
        <p className={styles.eyebrow}>{type === "public-fund-manager" ? "Public investors" : "Investors"}</p>
        <h1 className={`${styles.display} ${styles.pageTitle}`}>
          {type === "public-fund-manager" ? "Public investors and the 13F" : "Who funds the AI economy"}
        </h1>
        <p className={styles.lede}>
          {type === "public-fund-manager"
            ? "Fund managers whose quarter-end 13F filings Tokscale reads line by line. A 13F lists U.S.-listed long positions only."
            : "Investors named in the primary sources of the rounds and deals Tokscale tracks, and the public fund managers whose 13F filings we read."}
        </p>
      </header>

      <nav aria-label="Investor type">
        <ul className={styles.views}>
          <li>
            <Link href={investorsPath()} aria-current={!type ? "true" : undefined} scroll={false}>
              All {all.length}
            </Link>
          </li>
          {INVESTOR_TYPES.filter((t) => (counts.get(t) ?? 0) > 0).map((t) => (
            <li key={t}>
              <Link href={investorsPath(keyOf(t))} aria-current={type === t ? "true" : undefined} scroll={false}>
                {INVESTOR_TYPE_LABELS[t]} {counts.get(t)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <section aria-label="Investors">
        <table className={`${styles.ledgerTable} ${styles.ledgerStack}`}>
          <thead>
            <tr>
              <th scope="col">Investor</th>
              <th scope="col">Type</th>
              <th scope="col" className={styles.right}>
                Rounds and deals
              </th>
              <th scope="col" className={styles.right}>
                Led or co-led
              </th>
              <th scope="col">Latest</th>
              <th scope="col">Companies</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.org.id}>
                <td className={styles.full}>
                  <OrgCell org={{ ...row.org, href: row.org.investorHref }} />
                </td>
                <td data-label="Type">{row.org.investorTypeLabels.join(", ")}</td>
                <td className={`${styles.right} ${styles.num}`} data-label="Rounds and deals">
                  {row.rounds > 0 ? row.rounds : <Missing reason="No tracked round yet" />}
                </td>
                <td className={`${styles.right} ${styles.num}`} data-label="Led or co-led">
                  {row.leads > 0 ? row.leads : <Missing reason="Not a lead in a tracked round" />}
                </td>
                <td data-label="Latest">
                  {row.latest ? (
                    <>
                      <Link href={row.latest.href}>{row.latest.title}</Link>
                      <span className={styles.cellSub}>{formatPartialDate(row.latest.date)}</span>
                    </>
                  ) : row.fund ? (
                    <>
                      <Link href={row.fund.latest.href}>{row.fund.latest.label} 13F</Link>
                      <span className={styles.cellSub}>filed {formatDate(row.fund.latest.filedAt)}</span>
                    </>
                  ) : (
                    <Missing />
                  )}
                </td>
                <td data-label="Companies">{row.portfolio.length > 0 ? row.portfolio.join(", ") : <Missing />}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? <p className={styles.empty}>No investor of this type yet.</p> : null}
        <p className={styles.note}>
          Counts are rounds and deals in Tokscale’s ledger, not an investor’s full record. Investors without a tracked round
          have a page but stay out of search results until they have a sourced fact.
        </p>
      </section>

      {showThirteenF ? (
        <section className={styles.section} style={{ marginTop: 40 }} aria-labelledby="thirteen-f">
          <div className={styles.sectionHead}>
            <h2 id="thirteen-f" className={`${styles.display} ${styles.sectionTitle}`}>
              13F managers
            </h2>
            <p className={styles.sectionNote}>Latest quarter-end filings · values are reported 13F values, not assets under management</p>
          </div>
          <table className={`${styles.ledgerTable} ${styles.ledgerStack}`}>
            <thead>
              <tr>
                <th scope="col">Manager</th>
                <th scope="col">Latest quarter</th>
                <th scope="col" className={styles.right}>
                  Reported 13F value
                </th>
                <th scope="col" className={styles.right}>
                  Change
                </th>
                <th scope="col" className={styles.right}>
                  Holdings
                </th>
                <th scope="col" className={styles.right}>
                  Top-5 weight
                </th>
                <th scope="col">Largest position</th>
              </tr>
            </thead>
            <tbody>
              {funds.map(({ fund, latest, href }) => (
                <tr key={fund.slug}>
                  <td className={styles.full}>
                    <Link className={styles.cellMain} href={href}>
                      {fund.shortName}
                    </Link>
                    <span className={styles.cellSub}>{fund.person}</span>
                  </td>
                  <td data-label="Latest quarter">
                    <Link href={latest.href}>{latest.label}</Link>
                    <span className={styles.cellSub}>filed {formatDate(latest.filedAt)}</span>
                  </td>
                  <td className={`${styles.right} ${styles.num}`} data-label="Reported 13F value">
                    {formatUsdCompact(latest.reportedValueUsd)}
                  </td>
                  <td className={styles.right} data-label="Change">
                    {latest.comparison === "previous-empty" ? (
                      <>
                        All new
                        <span className={styles.cellSub}>{latest.previous?.label} listed no positions</span>
                      </>
                    ) : latest.reportedValueChangeUsd === null ? (
                      <Missing reason="Previous quarter not in the dataset" />
                    ) : (
                      <>
                        <span className={styles.num}>
                          {latest.reportedValueChangeUsd >= 0 ? "+" : "−"}
                          {formatUsdCompact(Math.abs(latest.reportedValueChangeUsd))}
                        </span>
                        <span className={styles.cellSub}>vs {latest.previous?.label}; prices and trades</span>
                      </>
                    )}
                  </td>
                  <td className={`${styles.right} ${styles.num}`} data-label="Holdings">
                    {latest.holdings.length}
                  </td>
                  <td className={`${styles.right} ${styles.num}`} data-label="Top-5 weight">
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
          {inReview.length > 0 ? (
            <p className={styles.note}>
              In review, not published: {inReview.map((f) => `${f.name} (${f.person})`).join(", ")}. Their numbers stay
              unpublished until each table is checked line by line against the SEC filing.
            </p>
          ) : null}

          <div className={styles.sectionHead} style={{ marginTop: 32 }}>
            <h3 className={`${styles.display} ${styles.sectionTitle}`}>{series.name}</h3>
            <p className={styles.sectionNote}>{series.summary}</p>
          </div>
          <div className={styles.cards} style={{ "--cols": series.entries.length } as React.CSSProperties}>
            {series.entries.map(({ quarter, story }) => (
              <Link className={styles.card} href={quarter.href} key={story.slug}>
                <span className={styles.eyebrow}>
                  {quarter.fundRecord.shortName} · {quarter.label}
                </span>
                <h4 className={`${styles.display} ${styles.cardTitle}`}>{story.headline}</h4>
                <p className={styles.cardBody}>{story.cardSummary}</p>
                <span className={styles.cardFoot}>
                  {formatUsdCompact(quarter.reportedValueUsd)} reported 13F value · {quarter.holdings.length} holdings
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </CapitalShell>
  );
}
