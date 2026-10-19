import { formatUsdCompact, formatWeight, type QuarterView } from "@/lib/capital";
import styles from "./capital.module.css";

/**
 * The Inside the 13F carousel, rebuilt as HTML from the same data as the table.
 * Holdings count down to #1 as in the original posts; a spotlight card follows.
 * Numbers come from the quarter view, never from the copy.
 */
export function VisualEdition({ quarter }: { quarter: QuarterView }) {
  const story = quarter.story;
  if (!story) return null;
  const bySlug = new Map(quarter.holdings.map((h) => [h.company.slug, h]));
  const holdingCards = [...story.visual.holdings, ...story.visual.spotlight].map((slug) => bySlug.get(slug)!);
  const total = 2 + holdingCards.length + 1;
  const foot = (position: number) => (
    <span className={styles.slideFoot} aria-hidden>
      <span>tokscale.ai</span>
      <span className={styles.num}>
        {position}/{total}
      </span>
    </span>
  );

  return (
    <ol className={styles.strip} aria-label={`Visual edition: ${total} cards`}>
      <li className={`${styles.slide} ${styles.slideCover}`}>
        <p className={styles.eyebrow}>
          {quarter.label} 13F · {quarter.fundRecord.shortName}
        </p>
        <p className={styles.slideHeadline}>{story.visual.cover.headline}</p>
        <p className={styles.slideText}>{story.visual.cover.body}</p>
        <p className={styles.slideCaption}>Reported 13F value {formatUsdCompact(quarter.reportedValueUsd)}</p>
        <div style={{ height: 18 }} />
        {foot(1)}
      </li>
      <li className={styles.slide}>
        <p className={styles.eyebrow}>{story.visual.intro.eyebrow}</p>
        <p className={styles.slideName}>{story.visual.intro.title}</p>
        <p className={styles.slideText}>{story.visual.intro.body}</p>
        {foot(2)}
      </li>
      {holdingCards.map((h, i) => {
        const spotlight = story.visual.spotlight.includes(h.company.slug);
        return (
          <li className={styles.slide} key={h.cusip6}>
            <span className={styles.slideRank}>#{h.rank}</span>
            {spotlight ? <p className={styles.slideCaption}>Spotlight, not a top-eight position</p> : null}
            <p className={styles.slideName}>{h.company.name}</p>
            <p className={styles.slideTicker}>
              {h.company.exchange}: {h.company.ticker}
            </p>
            <p className={styles.slideWeight}>{formatWeight(h.weight)}</p>
            <p className={styles.slideCaption}>
              of reported 13F value · position {formatUsdCompact(h.valueUsd)}
            </p>
            <p className={styles.slideText}>{story.holdingNotes[h.company.slug]}</p>
            {foot(3 + i)}
          </li>
        );
      })}
      <li className={styles.slide}>
        <p className={styles.eyebrow}>{story.visual.outro.eyebrow}</p>
        <p className={styles.slideName}>{story.visual.outro.title}</p>
        <p className={styles.slideText}>{story.visual.outro.body}</p>
        <p className={styles.slideCaption} style={{ marginTop: "auto", paddingBottom: 18 }}>
          Holdings as of {quarter.periodOfReport}. Weights use the reported 13F value, not assets under management.
        </p>
        {foot(total)}
      </li>
    </ol>
  );
}
