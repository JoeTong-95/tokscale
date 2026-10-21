import Image from "next/image";
import type { OrgView } from "@/lib/capital/ledger";
import styles from "./capital.module.css";

/**
 * Decorative company mark. A vendored lab mark (LobeHub, MIT) where one exists for the
 * company itself; otherwise a text monogram. The name is always rendered next to it.
 */
export function OrgMark({ org, large = false }: { org: Pick<OrgView, "logo" | "monogram">; large?: boolean }) {
  const size = large ? 28 : 16;
  return (
    <span className={`${styles.mark} ${large ? styles.markLarge : ""}`} aria-hidden="true">
      {org.logo ? <Image src={org.logo} alt="" width={size} height={size} unoptimized /> : org.monogram}
    </span>
  );
}

/** Mark plus linked name, for tables. */
export function OrgCell({ org, sub }: { org: OrgView; sub?: React.ReactNode }) {
  const name = org.href ? (
    <a className={styles.cellMain} href={org.href}>
      {org.name}
    </a>
  ) : (
    <span className={styles.cellMain}>{org.name}</span>
  );
  return (
    <span className={styles.orgCell}>
      <OrgMark org={org} />
      <span>
        {name}
        {sub ? <span className={styles.cellSub}>{sub}</span> : null}
      </span>
    </span>
  );
}
