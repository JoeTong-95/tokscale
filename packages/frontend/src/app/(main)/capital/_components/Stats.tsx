import styles from "./capital.module.css";

export interface StatItem {
  label: string;
  value: string;
  sub?: string;
}

export function Stats({ items, label }: { items: StatItem[]; label: string }) {
  return (
    <dl className={styles.stats} style={{ "--cols": items.length } as React.CSSProperties} aria-label={label}>
      {items.map((item) => (
        <div className={styles.stat} key={item.label}>
          <dt className={styles.statLabel}>{item.label}</dt>
          <dd className={styles.statValue}>{item.value}</dd>
          {item.sub ? <dd className={styles.statSub}>{item.sub}</dd> : null}
        </div>
      ))}
    </dl>
  );
}
