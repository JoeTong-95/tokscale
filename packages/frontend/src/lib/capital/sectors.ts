/**
 * Broad sectors from SEC SIC codes.
 *
 * Ported from paracosm-studio's 13F pipeline (server/studio_server/thirteenf_sectors.py)
 * so both products group companies the same way. SIC codes are assigned by the SEC
 * and can be dated: Netflix is filed under 7841 "video tape rental", and X-energy,
 * a reactor developer, under 3443 "fabricated plate work". Pages show the code and
 * its SEC description next to the broad group so readers can see the source.
 */
const SIC_SECTORS: ReadonlyArray<readonly [number, number, string]> = [
  [100, 999, "Agriculture"], [1000, 1299, "Mining"], [1300, 1399, "Oil & gas"], [1400, 1499, "Mining"],
  [1500, 1799, "Construction"], [2000, 2199, "Food & beverage"], [2200, 2799, "Consumer goods"],
  [2800, 2829, "Chemicals"], [2830, 2836, "Pharma & biotech"], [2837, 2899, "Chemicals"], [2900, 2999, "Oil & gas"],
  [3000, 3569, "Industrials"], [3570, 3579, "Technology hardware"], [3580, 3599, "Industrials"],
  [3600, 3669, "Technology hardware"], [3670, 3679, "Semiconductors"], [3680, 3699, "Technology hardware"],
  [3700, 3719, "Autos"], [3720, 3729, "Aerospace & defense"], [3730, 3799, "Industrials"],
  [3800, 3849, "Health care"], [3850, 3999, "Consumer goods"], [4000, 4499, "Transportation"],
  [4500, 4599, "Airlines"], [4600, 4799, "Transportation"], [4800, 4899, "Telecom & media"],
  [4900, 4999, "Utilities & power"], [5000, 5199, "Wholesale"], [5200, 5999, "Retail"], [6000, 6199, "Banks & credit"],
  [6200, 6299, "Asset managers & exchanges"], [6300, 6499, "Insurance"], [6500, 6799, "Real estate & holding cos"],
  [7000, 7299, "Consumer services"], [7300, 7379, "Software & internet"], [7380, 7999, "Business services"],
  [8000, 8099, "Health care"], [8100, 8999, "Business services"], [9000, 9999, "Other"],
];

export function sectorForSic(sic: string | null | undefined): string {
  const code = Number(sic ?? "");
  if (!sic || !Number.isInteger(code)) return "Unclassified";
  for (const [low, high, name] of SIC_SECTORS) {
    if (code >= low && code <= high) return name;
  }
  return "Unclassified";
}

/** "Services-Prepackaged Software" reads better as "Prepackaged software". */
export function readableSicDescription(description: string | null | undefined): string | null {
  if (!description) return null;
  const trimmed = description.replace(/^Services-/, "").replace(/\s+/g, " ").trim();
  const lower = trimmed.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}
