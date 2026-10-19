import { formatWeight, type HoldingView } from "@/lib/capital";
import styles from "./capital.module.css";

const LEGEND_SIZE = 5;

/** Weight of each position in the reported 13F value, largest first. */
export function AllocationBar({ holdings, label }: { holdings: HoldingView[]; label: string }) {
  const shade = (index: number) => Math.max(0.22, 1 - index * 0.11);
  const rest = holdings.slice(LEGEND_SIZE);
  const restWeight = rest.reduce((sum, h) => sum + h.weight, 0);
  return (
    <figure className={styles.allocation}>
      <div className={styles.bar} role="img" aria-label={label}>
        {holdings.map((h, i) => (
          <span
            key={h.cusip6}
            className={styles.barSegment}
            style={{ flexGrow: h.weight, flexBasis: 0, opacity: shade(i) }}
            title={`${h.company.name}: ${formatWeight(h.weight)}`}
          />
        ))}
      </div>
      <figcaption>
        <ul className={styles.legend}>
          {holdings.slice(0, LEGEND_SIZE).map((h, i) => (
            <li key={h.cusip6}>
              <span className={styles.swatch} style={{ opacity: shade(i) }} aria-hidden />
              {h.company.ticker} <span className={styles.num}>{formatWeight(h.weight)}</span>
            </li>
          ))}
          {rest.length > 0 ? (
            <li>
              {rest.length} more <span className={styles.num}>{formatWeight(restWeight)}</span>
            </li>
          ) : null}
        </ul>
      </figcaption>
    </figure>
  );
}
