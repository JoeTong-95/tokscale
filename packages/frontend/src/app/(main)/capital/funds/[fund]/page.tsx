import { notFound, permanentRedirect } from "next/navigation";
import { legacyCapitalRedirect } from "@/lib/capital/redirects";

/** Moved to /capital/investors/[slug]. Old links get a 308. */
export const dynamic = "force-dynamic";

export default async function LegacyFundPage({ params }: { params: Promise<{ fund: string }> }) {
  const { fund } = await params;
  const target = legacyCapitalRedirect(`/capital/funds/${fund}`);
  if (!target) notFound();
  permanentRedirect(target);
}
