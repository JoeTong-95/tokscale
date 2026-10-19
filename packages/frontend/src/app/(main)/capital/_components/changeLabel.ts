import { formatSignedPercent, type HoldingChange } from "@/lib/capital";
import styles from "./capital.module.css";

export function changeText(change: HoldingChange): string {
  switch (change.kind) {
    case "new":
      return "New";
    case "returned":
      return change.lastHeld ? `Returned (held ${change.lastHeld.label})` : "Returned";
    case "added":
      return `Added ${formatSignedPercent(change.shareChangePct ?? 0)}`;
    case "trimmed":
      return `Trimmed ${formatSignedPercent(change.shareChangePct ?? 0)}`;
    case "unchanged":
      return "Unchanged";
    default:
      return "Not compared";
  }
}

export function changeClass(kind: HoldingChange["kind"] | "exited"): string {
  switch (kind) {
    case "new":
      return styles.statusNew;
    case "returned":
      return styles.statusReturned;
    case "added":
      return styles.statusAdded;
    case "trimmed":
      return styles.statusTrimmed;
    case "exited":
      return styles.statusExited;
    case "unchanged":
      return styles.statusUnchanged;
    default:
      return styles.statusNot;
  }
}
