import { formatDate, formatUsd, type QuarterView } from "@/lib/capital";
import styles from "./capital.module.css";

const cikNumber = (cik: string) => String(Number(cik));

export function Sources({ quarter }: { quarter: QuarterView }) {
  const story = quarter.story;
  const retrieved = new Date(quarter.secRetrievedAt);
  return (
    <div>
      <h3 className={styles.subhead}>SEC filings</h3>
      <ul className={styles.rows}>
        {quarter.reports.map((report) => (
          <li className={styles.row} key={report.accession}>
            <p className={styles.rowTitle}>
              {report.form} · {report.reportType.replace(/^13F /, "").toLowerCase()} · {report.filerName}
            </p>
            <p className={styles.rowMeta}>
              CIK {cikNumber(report.cik)} · Accession {report.accession} · Filed {formatDate(report.filedAt)} · Period{" "}
              {formatDate(report.periodOfReport)} · Cover-page total {formatUsd(report.declaredTotalUsd)} in{" "}
              {report.declaredEntries} rows
            </p>
            <p className={styles.rowMeta}>
              <a className={styles.link} href={report.urls.index} target="_blank" rel="noopener noreferrer">
                Filing index
              </a>
              {" · "}
              <a className={styles.link} href={report.urls.infoTable} target="_blank" rel="noopener noreferrer">
                Information table
              </a>
              {" · "}
              <a className={styles.link} href={report.urls.primaryDoc} target="_blank" rel="noopener noreferrer">
                Cover page
              </a>
            </p>
          </li>
        ))}
        {quarter.notices.map((notice) => (
          <li className={styles.row} key={notice.accession}>
            <p className={styles.rowTitle}>
              {notice.form} · notice · {notice.filerName}
            </p>
            <p className={styles.rowMeta}>
              CIK {cikNumber(notice.cik)} · Accession {notice.accession} · Filed {formatDate(notice.filedAt)}. Lists no
              holdings; it names {notice.noticeManagers.map((m) => m.name).join(", ")} as the manager that reports them.
            </p>
            <p className={styles.rowMeta}>
              <a className={styles.link} href={notice.urls.index} target="_blank" rel="noopener noreferrer">
                Filing index
              </a>
            </p>
          </li>
        ))}
      </ul>
      <p className={styles.note}>
        Tokscale read these filings from SEC EDGAR on{" "}
        {retrieved.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" })} UTC.
      </p>
      {story ? (
        <>
          <h3 className={styles.subhead}>Story and company sources</h3>
          <ul className={styles.sourceList}>
            {story.sources.map((source) => (
              <li key={source.url}>
                <a href={source.url} target="_blank" rel="noopener noreferrer">
                  {source.label}
                </a>
                {source.kind === "company" ? " · company description" : " · story"}
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
