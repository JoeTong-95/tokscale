/**
 * Number and date formatting for the capital pages.
 *
 * All money is US dollars as reported in the 13F information table. Compact
 * values keep two decimals ($418.67M, $19.47B) so they match the published
 * Inside the 13F cards; exact values are shown next to them where it matters.
 */

const MINUS = "\u2212";

export function formatUsd(value: number): string {
  return `${value < 0 ? MINUS : ""}$${Math.abs(value).toLocaleString("en-US")}`;
}

export function formatUsdCompact(value: number): string {
  const sign = value < 0 ? MINUS : "";
  const abs = Math.abs(value);
  const units: Array<[number, string]> = [
    [1e12, "T"],
    [1e9, "B"],
    [1e6, "M"],
    [1e3, "K"],
  ];
  for (const [size, suffix] of units) {
    if (abs >= size) return `${sign}$${(abs / size).toFixed(2)}${suffix}`;
  }
  return `${sign}$${abs.toLocaleString("en-US")}`;
}

export function formatSignedUsdCompact(value: number): string {
  if (value === 0) return "$0";
  return value > 0 ? `+${formatUsdCompact(value)}` : formatUsdCompact(value);
}

export function formatShares(value: number): string {
  return value.toLocaleString("en-US");
}

export function formatSignedShares(value: number): string {
  if (value === 0) return "0";
  return `${value > 0 ? "+" : MINUS}${Math.abs(value).toLocaleString("en-US")}`;
}

/** A share of the reported total, given as a fraction (0..1). */
export function formatWeight(fraction: number): string {
  return `${(fraction * 100).toFixed(2)}%`;
}

/** A percent value (14.58 means +14.58%). */
export function formatSignedPercent(percent: number): string {
  const fixed = Math.abs(percent).toFixed(2);
  if (Number(fixed) === 0) return "0.00%";
  return `${percent > 0 ? "+" : MINUS}${fixed}%`;
}

/** A change in weight, in percentage points. */
export function formatPp(points: number): string {
  const fixed = Math.abs(points).toFixed(2);
  if (Number(fixed) === 0) return "0.00 pp";
  return `${points > 0 ? "+" : MINUS}${fixed} pp`;
}

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

/** "2026-06-30" -> "Jun 30, 2026". Dates are calendar dates, so format in UTC. */
export function formatDate(isoDate: string): string {
  return DATE_FORMAT.format(new Date(`${isoDate.slice(0, 10)}T00:00:00Z`));
}

/** "2026-q2" -> "Q2 2026". */
export function quarterLabel(key: string): string {
  const [year, q] = key.split("-");
  return `${q.toUpperCase()} ${year}`;
}

/** "2026-q2" -> "2026-q1"; "2026-q1" -> "2025-q4". */
export function previousQuarterKey(key: string): string {
  const [yearText, q] = key.split("-q");
  const year = Number(yearText);
  const quarter = Number(q);
  return quarter === 1 ? `${year - 1}-q4` : `${year}-q${quarter - 1}`;
}

/** "2026-06-30" -> "2026-q2". */
export function quarterKeyForPeriod(period: string): string {
  const [year, month] = period.split("-");
  return `${year}-q${Math.floor((Number(month) - 1) / 3) + 1}`;
}
