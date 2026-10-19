import Link from "next/link";
import {
  formatPp,
  formatShares,
  formatSignedPercent,
  formatSignedShares,
  formatSignedUsdCompact,
  formatUsdCompact,
  formatWeight,
  type QuarterView,
} from "@/lib/capital";
import styles from "./capital.module.css";
import { changeClass, changeText } from "./changeLabel";

/**
 * Quarter-over-quarter changes with value, share and weight change in separate
 * columns. Value change mixes price moves and trading, so it is never called a flow.
 */
export function ChangesTable({ quarter }: { quarter: QuarterView }) {
  const previous = quarter.previous;
  if (!previous) {
    return (
      <p className={styles.note}>
        The quarter before {quarter.label} is not in Tokscale’s dataset yet, so this page does not show changes.
      </p>
    );
  }
  const counts = quarter.holdings.reduce<Record<string, number>>((acc, h) => {
    acc[h.change.kind] = (acc[h.change.kind] ?? 0) + 1;
    return acc;
  }, {});
  const summary = [
    counts.new ? `${counts.new} new` : null,
    counts.returned ? `${counts.returned} returned` : null,
    counts.added ? `${counts.added} added to` : null,
    counts.trimmed ? `${counts.trimmed} reduced` : null,
    counts.unchanged ? `${counts.unchanged} unchanged` : null,
    quarter.exited.length ? `${quarter.exited.length} exited` : null,
  ].filter(Boolean);

  return (
    <>
      <p className={styles.note}>
        Compared with {previous.label} (period ending {previous.periodOfReport}): {summary.join(", ")}.
        {previous.reportedValueUsd === 0
          ? ` The ${previous.label} report listed no positions, so every position counts as new.`
          : ""}{" "}
        Share change shows trading. Value change also includes price moves. Weight change is in percentage points of
        each quarter’s reported total.
      </p>
      <div className={styles.tableWrap}>
        <table className={`${styles.table} ${styles.stack}`}>
          <thead>
            <tr>
              <th scope="col">Company</th>
              <th scope="col" className={styles.right}>Shares {previous.label} → {quarter.label}</th>
              <th scope="col" className={styles.right}>Share change</th>
              <th scope="col" className={styles.right}>Value change</th>
              <th scope="col" className={styles.right}>Weight change</th>
            </tr>
          </thead>
          <tbody>
            {quarter.holdings.map((h) => (
              <tr key={h.cusip6}>
                <td className={styles.stackFull}>
                  <Link className={styles.companyName} href={h.company.href}>
                    {h.company.name}
                  </Link>
                  <span className={`${styles.status} ${changeClass(h.change.kind)}`}>{changeText(h.change)}</span>
                  {h.change.lastHeld ? (
                    <span className={styles.companySub}>
                      {h.change.lastHeld.label}: {formatShares(h.change.lastHeld.shares)} shares,{" "}
                      {formatUsdCompact(h.change.lastHeld.valueUsd)}
                    </span>
                  ) : null}
                </td>
                <td className={`${styles.right} ${styles.num} ${styles.stackFull}`} data-label="Shares">
                  {formatShares(h.change.previousShares ?? 0)} → {formatShares(h.shares)}
                </td>
                <td className={`${styles.right} ${styles.num}`} data-label="Share change">
                  {formatSignedShares(h.change.shareChange ?? 0)}
                  {h.change.shareChangePct !== null ? (
                    <span className={styles.companySub}>{formatSignedPercent(h.change.shareChangePct)}</span>
                  ) : null}
                </td>
                <td className={`${styles.right} ${styles.num}`} data-label="Value change">
                  {formatSignedUsdCompact(h.change.valueChangeUsd ?? 0)}
                  <span className={styles.companySub}>
                    {formatUsdCompact(h.change.previousValueUsd ?? 0)} → {formatUsdCompact(h.valueUsd)}
                  </span>
                </td>
                <td className={`${styles.right} ${styles.num}`} data-label="Weight change">
                  {formatPp(h.change.weightChangePp ?? 0)}
                  <span className={styles.companySub}>
                    {formatWeight(h.change.previousWeight ?? 0)} → {formatWeight(h.weight)}
                  </span>
                </td>
              </tr>
            ))}
            {quarter.exited.map((e) => (
              <tr key={e.company.cusip6}>
                <td className={styles.stackFull}>
                  <Link className={styles.companyName} href={e.company.href}>
                    {e.company.name}
                  </Link>
                  <span className={`${styles.status} ${changeClass("exited")}`}>Exited</span>
                </td>
                <td className={`${styles.right} ${styles.num} ${styles.stackFull}`} data-label="Shares">
                  {formatShares(e.previousShares)} → 0
                </td>
                <td className={`${styles.right} ${styles.num}`} data-label="Share change">
                  {formatSignedShares(-e.previousShares)}
                  <span className={styles.companySub}>{formatSignedPercent(-100)}</span>
                </td>
                <td className={`${styles.right} ${styles.num}`} data-label="Value change">
                  {formatSignedUsdCompact(-e.previousValueUsd)}
                  <span className={styles.companySub}>{formatUsdCompact(e.previousValueUsd)} → $0</span>
                </td>
                <td className={`${styles.right} ${styles.num}`} data-label="Weight change">
                  {formatPp(-e.previousWeight * 100)}
                  <span className={styles.companySub}>{formatWeight(e.previousWeight)} → 0.00%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
