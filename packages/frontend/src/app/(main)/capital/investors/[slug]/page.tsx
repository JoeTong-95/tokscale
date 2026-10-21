import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TOKSCALE_X_HANDLE } from "@/lib/community";
import {
  absoluteUrl,
  capitalPath,
  edgarCompanyUrl,
  formatDate,
  formatUsd,
  formatUsdCompact,
  formatWeight,
  investorsPath,
  investorUrl,
} from "@/lib/capital";
import { formatPartialDate, ledger, type InvestorProfile } from "@/lib/capital/ledger";
import { AllocationBar } from "../../_components/AllocationBar";
import { Amount, Missing } from "../../_components/Amount";
import { Breadcrumbs } from "../../_components/Breadcrumbs";
import { CapitalShell } from "../../_components/CapitalShell";
import { EventFeed } from "../../_components/EventFeed";
import { JsonLd } from "../../_components/JsonLd";
import { OrgMark } from "../../_components/OrgMark";
import { SourceLink, sourceShortLabel } from "../../_components/SourceLink";
import { Stats } from "../../_components/Stats";
import styles from "../../_components/capital.module.css";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return ledger.getInvestors().map((row) => ({ slug: row.org.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const p = ledger.getInvestor(slug);
  if (!p) return { title: "Not found | Tokscale", robots: { index: false } };
  const title = p.fund
    ? `${p.org.name}: 13F Holdings by Quarter | Tokscale`
    : `${p.org.name}: AI Investments Tokscale Tracks | Tokscale`;
  const description = p.fund
    ? `${p.fund.fund.name} 13F holdings by quarter. Latest: ${p.fund.latest.label}, ${formatUsdCompact(p.fund.latest.reportedValueUsd)} reported 13F value across ${p.fund.latest.holdings.length} holdings.`
    : `${p.org.name} in ${p.participations.length} AI ${p.participations.length === 1 ? "round or deal" : "rounds and deals"} Tokscale tracks, with roles and primary sources.`;
  const canonical = investorUrl(slug);
  return {
    title,
    description,
    alternates: { canonical },
    robots: p.indexable ? undefined : { index: false, follow: true },
    openGraph: { title, description, type: "profile", url: canonical, siteName: "Tokscale" },
    twitter: { card: "summary", site: TOKSCALE_X_HANDLE, title, description },
  };
}

function ThirteenF({ p }: { p: InvestorProfile }) {
  const view = p.fund!;
  const { latest } = view;
  const filers = new Map<string, string[]>();
  for (const filing of view.quarters.flatMap((q) => [...q.reports, ...q.notices])) {
    const names = filers.get(filing.cik) ?? [];
    if (!names.includes(filing.filerName)) names.push(filing.filerName);
    filers.set(filing.cik, names);
  }
  return (
    <>
      <p className={styles.callout}>{view.fund.scope}</p>
      <section aria-labelledby="latest">
        <div className={styles.sectionHead}>
          <h2 id="latest" className={styles.eyebrow}>
            Latest 13F · {latest.label} · as of {formatDate(latest.periodOfReport)}
          </h2>
          <Link className={styles.link} href={latest.href}>
            {latest.story ? "Read the story and full table →" : "See all holdings →"}
          </Link>
        </div>
        <Stats
          label={`${view.fund.shortName} ${latest.label} snapshot`}
          items={[
            { label: "Reported 13F value", value: formatUsdCompact(latest.reportedValueUsd), sub: formatUsd(latest.reportedValueUsd) },
            { label: "Holdings", value: String(latest.holdings.length), sub: `${latest.rowCount} table rows` },
            { label: "Top-5 concentration", value: formatWeight(latest.topFiveWeight), sub: "of reported 13F value" },
            {
              label: latest.comparison === "previous-empty" ? `Change vs ${latest.previous?.label}` : "Filed",
              value: latest.comparison === "previous-empty" ? "All new" : formatDate(latest.filedAt),
              sub:
                latest.comparison === "previous-empty"
                  ? `The ${latest.previous?.label} report listed no positions`
                  : `${latest.reports.length > 1 ? "reports" : "report"} for ${latest.label}`,
            },
          ]}
        />
        <AllocationBar holdings={latest.holdings} label={`Weights in ${view.fund.shortName}’s ${latest.label} 13F`} />
      </section>

      <section className={styles.section} style={{ marginTop: 40 }} aria-labelledby="history">
        <div className={styles.sectionHead}>
          <h2 id="history" className={`${styles.display} ${styles.sectionTitle}`}>
            Filing history
          </h2>
          <p className={styles.sectionNote}>Quarters in Tokscale’s dataset, newest first</p>
        </div>
        <table className={`${styles.ledgerTable} ${styles.ledgerStack}`}>
          <thead>
            <tr>
              <th scope="col">Quarter</th>
              <th scope="col" className={styles.right}>
                Reported 13F value
              </th>
              <th scope="col" className={styles.right}>
                Holdings
              </th>
              <th scope="col">Largest position</th>
              <th scope="col">Filed</th>
            </tr>
          </thead>
          <tbody>
            {view.quarters.map((q) => (
              <tr key={q.quarter}>
                <td className={styles.full}>
                  {q.holdings.length > 0 ? (
                    <Link className={styles.cellMain} href={q.href}>
                      {q.label}
                    </Link>
                  ) : (
                    <span className={styles.cellMain}>{q.label}</span>
                  )}
                  <span className={styles.cellSub}>
                    Period ending {formatDate(q.periodOfReport)}
                    {q.story ? " · Inside the 13F" : ""}
                  </span>
                </td>
                <td className={`${styles.right} ${styles.num}`} data-label="Reported value">
                  {formatUsdCompact(q.reportedValueUsd)}
                </td>
                <td className={`${styles.right} ${styles.num}`} data-label="Holdings">
                  {q.holdings.length}
                </td>
                <td data-label="Largest">
                  {q.holdings[0] ? (
                    <>
                      {q.holdings[0].company.ticker}{" "}
                      <span className={`${styles.muted} ${styles.num}`}>{formatWeight(q.holdings[0].weight)}</span>
                    </>
                  ) : (
                    <span className={styles.muted}>No positions</span>
                  )}
                </td>
                <td className={styles.wide} data-label="Filed">
                  {formatDate(q.filedAt)}
                  <span className={styles.cellSub}>{[...q.reports, ...q.notices].map((f) => `${f.form} ${f.accession}`).join(" · ")}</span>
                  {q.placeholderRows > 0 && q.holdings.length === 0 ? (
                    <span className={styles.cellSub}>One placeholder row with a value of $0</span>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className={styles.section} aria-labelledby="entities">
        <div className={styles.sectionHead}>
          <h2 id="entities" className={`${styles.display} ${styles.sectionTitle}`}>
            Who files
          </h2>
        </div>
        <div className={styles.prose}>
          <p>{view.fund.reporting}</p>
          <ul>
            {[...filers].map(([cik, [name, ...former]]) => (
              <li key={cik}>
                <a href={edgarCompanyUrl(cik)} target="_blank" rel="noopener noreferrer">
                  {name}
                </a>{" "}
                · CIK {Number(cik)}
                {former.length > 0 ? ` · filed earlier as ${former.join(", ")}` : ""}
              </li>
            ))}
          </ul>
          <p className={styles.note}>
            A 13F is a quarter-end list of long positions in U.S.-listed securities, filed up to 45 days later. It shows no
            shorts, cash or private holdings. “Reported 13F value” is the filing’s own total, not assets under management.
          </p>
        </div>
      </section>
    </>
  );
}

export default async function InvestorPage({ params }: PageProps) {
  const { slug } = await params;
  const p = ledger.getInvestor(slug);
  if (!p) notFound();
  const org = p.org.org;
  const canonical = investorUrl(slug);

  return (
    <CapitalShell section={p.fund ? "public-investors" : "investors"}>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              name: org.name,
              ...(org.legalNames[0] ? { legalName: org.legalNames[0] } : {}),
              ...(org.website ? { url: org.website } : {}),
              ...(org.ids.wikidata || org.website
                ? { sameAs: [org.website, org.ids.wikidata ? `https://www.wikidata.org/wiki/${org.ids.wikidata}` : null].filter(Boolean) }
                : {}),
              ...(org.ids.secAdviser ? { identifier: { "@type": "PropertyValue", propertyID: "SEC adviser number", value: org.ids.secAdviser } } : {}),
              description: org.description,
              mainEntityOfPage: canonical,
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Capital", item: absoluteUrl(capitalPath()) },
                { "@type": "ListItem", position: 2, name: "Investors", item: absoluteUrl(investorsPath()) },
                { "@type": "ListItem", position: 3, name: org.name, item: canonical },
              ],
            },
          ],
        }}
      />
      <Breadcrumbs items={[{ label: "Capital", href: capitalPath() }, { label: "Investors", href: investorsPath() }, { label: org.name }]} />
      <header className={styles.profileHead}>
        <OrgMark org={p.org} large />
        <div>
          <p className={styles.eyebrow}>
            {[p.org.investorTypeLabels.join(", "), org.hq ? [org.hq.city, org.hq.country].filter(Boolean).join(", ") : null].filter(Boolean).join(" · ")}
          </p>
          <h1 className={`${styles.display} ${styles.profileTitle}`}>{org.name}</h1>
          <p className={styles.lede}>{p.fund ? p.fund.fund.summary : org.description}</p>
          <ul className={styles.idLinks}>
            {org.website ? (
              <li>
                <a href={org.website} target="_blank" rel="noopener noreferrer">
                  {new URL(org.website).hostname.replace(/^www\./, "")}
                </a>
              </li>
            ) : null}
            {org.ids.wikidata ? (
              <li>
                <a href={`https://www.wikidata.org/wiki/${org.ids.wikidata}`} target="_blank" rel="noopener noreferrer">
                  Wikidata {org.ids.wikidata}
                </a>
              </li>
            ) : null}
            {p.companyHref ? (
              <li>
                <Link href={p.companyHref}>{org.name} company profile</Link>
              </li>
            ) : null}
          </ul>
        </div>
      </header>

      {p.participations.length > 0 ? (
        <>
          <dl className={styles.stats} style={{ "--cols": 4 } as React.CSSProperties} aria-label={`${org.name} in tracked rounds`}>
            <div className={styles.stat}>
              <dt className={styles.statLabel}>Rounds and deals tracked</dt>
              <dd className={styles.statValue}>{p.participations.length}</dd>
            </div>
            <div className={styles.stat}>
              <dt className={styles.statLabel}>Led or co-led</dt>
              <dd className={styles.statValue}>{p.leadCount}</dd>
            </div>
            <div className={styles.stat}>
              <dt className={styles.statLabel}>First tracked</dt>
              <dd className={styles.statValue}>{p.firstDate ? formatPartialDate(p.firstDate) : "—"}</dd>
            </div>
            <div className={styles.stat}>
              <dt className={styles.statLabel}>Latest tracked</dt>
              <dd className={styles.statValue}>{p.latestDate ? formatPartialDate(p.latestDate) : "—"}</dd>
            </div>
          </dl>

          <section className={styles.section} style={{ marginTop: 32 }} aria-labelledby="rounds">
            <div className={styles.sectionHead}>
              <h2 id="rounds" className={`${styles.display} ${styles.sectionTitle}`}>
                AI rounds and deals
              </h2>
              <p className={styles.sectionNote}>Roles as named in the primary source</p>
            </div>
            <table className={`${styles.ledgerTable} ${styles.ledgerStack}`}>
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Event</th>
                  <th scope="col">Role</th>
                  <th scope="col" className={styles.right}>
                    Size
                  </th>
                  <th scope="col" className={styles.right}>
                    Post-money
                  </th>
                  <th scope="col">Source</th>
                </tr>
              </thead>
              <tbody>
                {p.participations.map(({ event, roleLabels }) => {
                  const size = event.amounts.find((a) => a.skipped === null && ["equity_raised", "debt_raised", "ipo_proceeds", "equity_investment", "purchase_price"].includes(a.amount.measure));
                  return (
                    <tr key={event.id}>
                      <td className={styles.nowrap} data-label="Date">
                        {formatPartialDate(event.date)}
                      </td>
                      <td className={styles.full}>
                        <Link className={styles.cellMain} href={event.href}>
                          {event.title}
                        </Link>
                        <span className={styles.cellSub}>{event.issuer ? event.issuer.name : event.partiesText}</span>
                      </td>
                      <td data-label="Role">{roleLabels.join(", ")}</td>
                      <td className={styles.right} data-label="Size">
                        {size ? <Amount view={size} /> : <Missing reason="No amount stated" />}
                      </td>
                      <td className={styles.right} data-label="Post-money">
                        {event.valuation ? <Amount view={event.valuation} /> : <Missing />}
                      </td>
                      <td data-label="Source">
                        <SourceLink source={event.sources[0]} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className={styles.note}>
              Size is the whole round or deal, not this investor’s share. Amounts per investor appear only when a source states
              them
              {p.ownAmounts.length > 0
                ? `: ${p.ownAmounts.map((a) => `${a.short} (${a.amount.label ?? a.amount.measure}, ${formatPartialDate(a.amount.asOf)}${a.skipped === "included_in" ? ", counted in a later round" : ""})`).join("; ")}`
                : ""}
              .
            </p>
          </section>

          {p.portfolio.length > 0 ? (
            <section className={styles.section} aria-labelledby="portfolio">
              <div className={styles.sectionHead}>
                <h2 id="portfolio" className={`${styles.display} ${styles.sectionTitle}`}>
                  Companies in tracked rounds
                </h2>
              </div>
              <ul className={styles.chips}>
                {p.portfolio.map((o) => (
                  <li key={o.id}>{o.companyHref ? <Link href={o.companyHref}>{o.name}</Link> : o.name}</li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      ) : !p.fund ? (
        <p className={styles.callout}>
          Tokscale has no round or deal with a primary source that names {org.name} yet. This page stays out of search results
          until it has one.
        </p>
      ) : null}

      {p.otherEvents.length > 0 ? (
        <section className={styles.section} aria-labelledby="other">
          <div className={styles.sectionHead}>
            <h2 id="other" className={`${styles.display} ${styles.sectionTitle}`}>
              Other deals
            </h2>
            <p className={styles.sectionNote}>Compute, leases and acquisitions with {org.name} as a party</p>
          </div>
          <EventFeed events={p.otherEvents} />
        </section>
      ) : null}

      {p.fund ? <ThirteenF p={p} /> : null}

      {p.sources.length > 0 ? (
        <section className={styles.section} aria-labelledby="sources">
          <div className={styles.sectionHead}>
            <h2 id="sources" className={`${styles.display} ${styles.sectionTitle}`}>
              Sources
            </h2>
            <p className={styles.sectionNote}>Reviewed {formatPartialDate(p.reviewedAt)}</p>
          </div>
          <ol className={styles.sourcesOl}>
            {p.sources.map((s) => (
              <li key={s.id}>
                {s.publisher}, “
                <a href={s.url} target="_blank" rel="noopener noreferrer">
                  {s.title}
                </a>
                ”{s.publishedAt ? `, ${formatPartialDate(s.publishedAt)}` : ""} · {sourceShortLabel(s)}
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </CapitalShell>
  );
}
