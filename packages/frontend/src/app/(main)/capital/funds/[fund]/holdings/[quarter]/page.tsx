import { notFound, permanentRedirect } from "next/navigation";
import { legacyCapitalRedirect } from "@/lib/capital/redirects";

/** Moved to /capital/investors/[slug]/13f/[quarter]. Old links get a 308. */
export const dynamic = "force-dynamic";

export default async function LegacyQuarterPage({ params }: { params: Promise<{ fund: string; quarter: string }> }) {
  const { fund, quarter } = await params;
  const target = legacyCapitalRedirect(`/capital/funds/${fund}/holdings/${quarter}`);
  if (!target) notFound();
  permanentRedirect(target);
}
