import Link from "next/link";
import { capital, formatDate, formatShares, formatUsdCompact, formatWeight } from "@/lib/capital";
import { changeClass, changeText } from "./changeLabel";
import styles from "./capital.module.css";

type CompanyHoldings = NonNullable<ReturnType<typeof capital.getCompany>>;

/** Quarter-end 13F positions of a company among the managers Tokscale tracks, newest first. */
export function PositionsTable({ detail }: { detail: CompanyHoldings }) {
  return (
    <>
      <table className={`${styles.ledgerTable} ${styles.ledgerStack}`}>
        <thead>
          <tr>
            <th scope="col">Manager and quarter</th>
            <th scope="col" className={styles.right}>
              Shares
            </th>
            <th scope="col" className={styles.right}>
              Reported value
            </th>
            <th scope="col" className={styles.right}>
              Weight in that 13F
            </th>
            <th scope="col">vs previous quarter</th>
          </tr>
        </thead>
        <tbody>
          {[...detail.positions]
            .sort((a, b) => b.quarter.periodOfReport.localeCompare(a.quarter.periodOfReport) || b.holding.valueUsd - a.holding.valueUsd)
            .map(({ fund, quarter, holding }) => (
              <tr key={`${fund.slug}-${quarter.quarter}`}>
                <td className={styles.full}>
                  <Link className={styles.cellMain} href={quarter.href}>
                    {fund.shortName} · {quarter.label}
                  </Link>
                  <span className={styles.cellSub}>
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
                <td className={styles.wide} data-label="Change">
                  <span className={`${styles.status} ${changeClass(holding.change.kind)}`}>{changeText(holding.change)}</span>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
      <p className={styles.note}>
        Weights are shares of each manager’s own reported 13F value for that quarter. A 13F shows long positions at quarter
        end only; the managers may have traded since.
      </p>
    </>
  );
}
