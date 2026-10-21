import { investorsPath } from "./urls";

/**
 * Old Capital URLs and where they live now. The old route files call this and
 * answer with a permanent (308) redirect, so shared links keep working.
 *
 *   /capital/portfolios                              -> /capital/investors?type=13f
 *   /capital/funds/:fund                             -> /capital/investors/:fund
 *   /capital/funds/:fund/holdings/:quarter           -> /capital/investors/:fund/13f/:quarter
 *   /capital/funds/:fund/holdings/:quarter/og        -> /capital/investors/:fund/13f/:quarter/og
 */
const SEGMENT = "([a-z0-9]+(?:-[a-z0-9]+)*)";
const QUARTER = "(\\d{4}-q[1-4])";

const RULES: Array<[RegExp, (m: RegExpExecArray) => string]> = [
  [/^\/capital\/portfolios\/?$/, () => investorsPath("13f")],
  [new RegExp(`^/capital/funds/${SEGMENT}/?$`), (m) => `/capital/investors/${m[1]}`],
  [new RegExp(`^/capital/funds/${SEGMENT}/holdings/${QUARTER}/?$`), (m) => `/capital/investors/${m[1]}/13f/${m[2]}`],
  [new RegExp(`^/capital/funds/${SEGMENT}/holdings/${QUARTER}/og/?$`), (m) => `/capital/investors/${m[1]}/13f/${m[2]}/og`],
];

/** The new path for an old Capital path, or null when the path is not an old Capital URL. */
export function legacyCapitalRedirect(pathname: string): string | null {
  for (const [pattern, target] of RULES) {
    const match = pattern.exec(pathname);
    if (match) return target(match);
  }
  return null;
}
