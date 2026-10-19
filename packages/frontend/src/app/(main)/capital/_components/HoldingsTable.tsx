import Link from "next/link";
import {
  formatShares,
  formatUsd,
  formatUsdCompact,
  formatWeight,
  type QuarterView,
} from "@/lib/capital";
import styles from "./capital.module.css";
import { changeClass, changeText } from "./changeLabel";

/**
 * Every position in the quarter, by reported value.
 *
 * Phones keep rank, company, value and weight as columns; sector, shares and the
 * change move into a second line under the company so the page never scrolls sideways.
 */
export function HoldingsTable({ quarter }: { quarter: QuarterView }) {
  const compared = quarter.previous !== null;
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <caption>
          {quarter.holdings.length} positions in {quarter.fundRecord.shortName}’s {quarter.label} 13F, by reported value.
          Weights are shares of the {formatUsd(quarter.reportedValueUsd)} reported total.
        </caption>
        <thead>
          <tr>
            <th scope="col" className={styles.rank}>#</th>
            <th scope="col">Company</th>
            <th scope="col" className={styles.hideSm}>Sector (SEC SIC)</th>
            <th scope="col" className={`${styles.right} ${styles.hideSm}`}>Shares</th>
            <th scope="col" className={styles.right}>Reported value</th>
            <th scope="col" className={styles.right}>Weight</th>
            {compared ? <th scope="col" className={styles.hideSm}>vs {quarter.previous?.label}</th> : null}
          </tr>
        </thead>
        <tbody>
          {quarter.holdings.map((h) => (
            <tr key={h.cusip6}>
              <td className={`${styles.rank} ${styles.num}`}>{h.rank}</td>
              <td>
                <Link className={styles.companyName} href={h.company.href}>
                  {h.company.name}
                </Link>
                <span className={styles.companySub}>
                  {h.company.exchange}: {h.company.tickers.join(", ")} · {h.titlesOfClass.join(", ")}
                  {h.rows > 1 ? ` · ${h.rows} rows combined` : ""}
                </span>
                <span className={styles.mobileMeta}>
                  {formatShares(h.shares)} sh · {h.company.sector}
                  {compared ? (
                    <>
                      {" · "}
                      <span className={changeClass(h.change.kind)}>{changeText(h.change)}</span>
                    </>
                  ) : null}
                </span>
              </td>
              <td className={styles.hideSm}>
                {h.company.sector}
                <span className={styles.companySub}>{h.company.sic ? `${h.company.sic} ${h.company.sicLabel ?? ""}` : "No SIC code"}</span>
              </td>
              <td className={`${styles.right} ${styles.num} ${styles.hideSm}`}>{formatShares(h.shares)}</td>
              <td className={`${styles.right} ${styles.num}`} title={formatUsd(h.valueUsd)}>
                {formatUsdCompact(h.valueUsd)}
                <span className={`${styles.companySub} ${styles.hideSm}`}>{formatUsd(h.valueUsd)}</span>
              </td>
              <td className={`${styles.right} ${styles.num} ${styles.weightCell}`}>
                {formatWeight(h.weight)}
                <span className={styles.weightBar} aria-hidden>
                  <span style={{ width: `${(h.weight / quarter.holdings[0].weight) * 100}%` }} />
                </span>
              </td>
              {compared ? (
                <td className={styles.hideSm}>
                  <span className={`${styles.status} ${changeClass(h.change.kind)}`}>{changeText(h.change)}</span>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
        <tfoot className={styles.tfoot}>
          <tr>
            <td />
            <td>
              Total, {quarter.holdings.length} issuers from {quarter.rowCount} table rows
            </td>
            <td className={styles.hideSm} />
            <td className={styles.hideSm} />
            <td className={`${styles.right} ${styles.num}`}>{formatUsdCompact(quarter.reportedValueUsd)}</td>
            <td className={`${styles.right} ${styles.num}`}>100.00%</td>
            {compared ? <td className={styles.hideSm} /> : null}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
