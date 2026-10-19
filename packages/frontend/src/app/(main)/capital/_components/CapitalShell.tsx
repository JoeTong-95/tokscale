import { Navigation } from "@/components/layout/Navigation";
import { ServiceFooter } from "@/components/layout/ServiceFooter";
import styles from "./capital.module.css";

/** Page frame for the capital section and company pages. Server-rendered. */
export function CapitalShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="service-page-shell">
      <Navigation />
      <main className="service-main" id="main-content">
        <div className={styles.page}>{children}</div>
      </main>
      <ServiceFooter />
    </div>
  );
}
