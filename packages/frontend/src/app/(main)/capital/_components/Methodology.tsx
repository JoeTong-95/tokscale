import Link from "next/link";
import type { QuarterView } from "@/lib/capital";
import styles from "./capital.module.css";

export function Methodology({ quarter }: { quarter: QuarterView }) {
  return (
    <div className={styles.prose}>
      <ul>
        <li>
          A Form 13F lists long positions in U.S.-listed securities at the end of a quarter. Managers file it up to 45 days
          after the quarter ends. It does not show short positions, cash, private companies or most non-U.S. holdings, and
          the manager may have traded since.
        </li>
        <li>
          “Reported 13F value” is the total on the filing’s cover page, which equals the sum of its rows. It is not assets
          under management. When a quarter combines reports, we add their totals.
        </li>
        <li>Weights are each position’s value divided by the reported 13F value for the same quarter.</li>
        <li>
          Rows for the same issuer (first six CUSIP characters) are combined, including different share classes. Option and
          debt rows would be listed separately; this filing has none.
        </li>
        <li>
          Changes compare share counts with the previous quarter. A change within 0.5% counts as unchanged. A position that
          was absent last quarter but held in one of the three quarters before that counts as returned, not new.
        </li>
        <li>
          Value change mixes price moves with buying and selling, so we do not call it an inflow or outflow.
        </li>
        <li>
          Sectors come from each company’s SEC SIC code, grouped the same way as the paracosm-studio 13F pipeline. SIC codes
          can be dated, so pages show the code next to the group.
        </li>
        <li>{quarter.fundRecord.reporting}</li>
      </ul>
      {quarter.story ? (
        <p className={styles.note}>
          Every percentage and dollar figure in the story is recomputed from the SEC tables in Tokscale’s test suite. The
          interpretation of why a manager bought a position is ours, not the manager’s.
        </p>
      ) : null}
      <p className={styles.note}>
        Found an error? <Link className={styles.link} href="/contact">Contact us</Link> and we will correct it here.
      </p>
    </div>
  );
}
