import type { AmountView } from "@/lib/capital/ledger";
import styles from "./capital.module.css";

/**
 * One typed amount: dense symbol form ("≈$11.6B") with the plain words in the title and for
 * screen readers. Press-reported values carry their outlet; they are never totals.
 */
export function Amount({ view, emphasis = false }: { view: AmountView; emphasis?: boolean }) {
  return (
    <span
      className={`${styles.num} ${emphasis ? styles.cyan : ""} ${view.amount.status === "reported" ? styles.reported : ""}`}
      title={`${view.words} · ${view.statusLabel}${view.term ? ` · ${view.term}` : ""}`}
    >
      <span aria-hidden="true">{view.short}</span>
      <span className={styles.srOnly}>{view.words}</span>
    </span>
  );
}

/** "—" with a reason in the tooltip. Unknown is never shown as zero. */
export function Missing({ reason = "Not tracked yet" }: { reason?: string }) {
  return (
    <span className={styles.dash} title={reason}>
      <span aria-hidden="true">—</span>
      <span className={styles.srOnly}>{reason}</span>
    </span>
  );
}
