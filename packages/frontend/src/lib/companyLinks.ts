import { capital } from "@/lib/capital";

/**
 * Explore labels a model's lab with a lab slug ("google"), while company pages
 * are keyed by the filer ("alphabet") and exist only for companies with data.
 */
const LAB_COMPANY_ALIASES: Readonly<Record<string, string>> = {
  google: "alphabet",
};

/** Company slug to link a lab to, or null when no company page exists. */
export function companySlugForLab(labSlug: string | null): string | null {
  if (!labSlug) return null;
  const slug = LAB_COMPANY_ALIASES[labSlug] ?? labSlug;
  return capital.getCompany(slug) ? slug : null;
}
