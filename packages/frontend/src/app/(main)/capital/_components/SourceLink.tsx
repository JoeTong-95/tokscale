import type { Source } from "@/lib/capital/ledger";
import styles from "./capital.module.css";

/** Short label for a source: the SEC form ("8-K"), else the publisher. */
export function sourceShortLabel(source: Source): string {
  if (source.filing) return source.filing.form === "D" ? "Form D" : source.filing.form;
  return source.publisher;
}

/** External link to a source with a short label. The full title is in the tooltip. */
export function SourceLink({ source, label }: { source: Source; label?: string }) {
  return (
    <a className={styles.srcLink} href={source.url} target="_blank" rel="noopener noreferrer" title={source.title}>
      {label ?? sourceShortLabel(source)} ↗
    </a>
  );
}
