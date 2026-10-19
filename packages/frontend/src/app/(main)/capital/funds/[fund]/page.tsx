import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TOKSCALE_X_HANDLE } from "@/lib/community";
import {
  absoluteUrl,
  capital,
  capitalPath,
  edgarCompanyUrl,
  formatDate,
  formatUsd,
  formatUsdCompact,
  formatWeight,
  fundUrl,
} from "@/lib/capital";
import { AllocationBar } from "../../_components/AllocationBar";
import { Breadcrumbs } from "../../_components/Breadcrumbs";
import { CapitalShell } from "../../_components/CapitalShell";
import { JsonLd } from "../../_components/JsonLd";
import { Stats } from "../../_components/Stats";
import styles from "../../_components/capital.module.css";

interface PageProps {
  params: Promise<{ fund: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return capital.getPublishedFunds().map((view) => ({ fund: view.fund.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { fund } = await params;
  const view = capital.getFund(fund);
  if (!view) return { title: "Not found | Tokscale", robots: { index: false } };
  const latest = view.latest;
  const title = `${view.fund.shortName} Portfolio & 13F Holdings | Tokscale`;
  const description = `${view.fund.name} (${view.fund.person}) 13F holdings by quarter. Latest: ${latest.label}, ${formatUsdCompact(latest.reportedValueUsd)} reported 13F value across ${latest.holdings.length} holdings, filed ${formatDate(latest.filedAt)}.`;
  const canonical = fundUrl(fund);
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, type: "website", url: canonical, siteName: "Tokscale" },
    twitter: { card: "summary_large_image", site: TOKSCALE_X_HANDLE, title, description },
  };
}

export default async function FundPage({ params }: PageProps) {
  const { fund } = await params;
  const view = capital.getFund(fund);
  if (!view) notFound();
  const { latest } = view;
  // Newest name first; older names of the same CIK are shown as former names.
  const filers = new Map<string, string[]>();
  for (const filing of view.quarters.flatMap((q) => [...q.reports, ...q.notices])) {
    const names = filers.get(filing.cik) ?? [];
    if (!names.includes(filing.filerName)) names.push(filing.filerName);
    filers.set(filing.cik, names);
  }

  return (
    <CapitalShell>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Capital", item: absoluteUrl(capitalPath()) },
            { "@type": "ListItem", position: 2, name: view.fund.shortName, item: fundUrl(fund) },
          ],
        }}
      />
      <Breadcrumbs items={[{ label: "Capital", href: capitalPath() }, { label: view.fund.shortName }]} />

      <header className={styles.articleHead}>
        <p className={styles.eyebrow}>Tracked manager · {view.fund.person}</p>
        <h1 className={`${styles.display} ${styles.articleTitle}`}>{view.fund.shortName} portfolio and 13F holdings</h1>
        <p className={styles.dek}>{view.fund.summary}</p>
        <p className={styles.callout}>{view.fund.scope}</p>
      </header>

      <section aria-labelledby="latest">
        <div className={styles.sectionHead}>
          <h2 id="latest" className={styles.eyebrow}>
            Latest filing · {latest.label} · as of {formatDate(latest.periodOfReport)}
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
            { label: "Filed", value: formatDate(latest.filedAt), sub: `${latest.reports.length > 1 ? "reports" : "report"} for ${latest.label}` },
          ]}
        />
        <AllocationBar holdings={latest.holdings} label={`Weights in ${view.fund.shortName}’s ${latest.label} 13F`} />
        {latest.story ? (
          <p className={styles.note}>
            <Link className={styles.textLink} href={latest.href}>
              {latest.story.headline}
            </Link>
          </p>
        ) : null}
      </section>

      <section className={styles.section} style={{ marginTop: 40 }} aria-labelledby="history">
        <div className={styles.sectionHead}>
          <h2 id="history" className={`${styles.display} ${styles.sectionTitle}`}>Filing history</h2>
          <p className={styles.sectionNote}>Quarters in Tokscale’s dataset, newest first</p>
        </div>
        <table className={`${styles.table} ${styles.stack}`}>
          <thead>
            <tr>
              <th scope="col">Quarter</th>
              <th scope="col" className={styles.right}>Reported 13F value</th>
              <th scope="col" className={styles.right}>Holdings</th>
              <th scope="col">Largest position</th>
              <th scope="col">Filed</th>
            </tr>
          </thead>
          <tbody>
            {view.quarters.map((q) => (
              <tr key={q.quarter}>
                <td className={styles.stackFull}>
                  {q.holdings.length > 0 ? (
                    <Link className={styles.companyName} href={q.href}>
                      {q.label}
                    </Link>
                  ) : (
                    <span className={styles.companyName}>{q.label}</span>
                  )}
                  <span className={styles.companySub}>
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
                <td className={styles.stackFull} data-label="Filed">
                  {formatDate(q.filedAt)}
                  <span className={styles.companySub}>
                    {[...q.reports, ...q.notices].map((f) => `${f.form} ${f.accession}`).join(" · ")}
                  </span>
                  {q.placeholderRows > 0 && q.holdings.length === 0 ? (
                    <span className={styles.companySub}>One placeholder row with a value of $0</span>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className={styles.section} aria-labelledby="entities">
        <div className={styles.sectionHead}>
          <h2 id="entities" className={`${styles.display} ${styles.sectionTitle}`}>Who files</h2>
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
    </CapitalShell>
  );
}
