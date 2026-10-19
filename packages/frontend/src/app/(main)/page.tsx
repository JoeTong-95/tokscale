import type { Metadata } from "next";
import { Navigation } from "@/components/layout/Navigation";
import { HomePage } from "@/components/home/HomePage";
import type { CapitalPreviewItem } from "@/components/home/CapitalPreview";
import { getCommunitySnapshot, getHumansLeaderboard, getModelLeaderboard } from "@/lib/explore";
import { homeUrl } from "@/lib/seo/urls";

// Declared per-page rather than on the root layout: `alternates.canonical` is
// inherited by every nested route, so putting it in app/layout.tsx would point
// every page on the site at the home page.
export const metadata: Metadata = {
  alternates: {
    canonical: homeUrl(),
  },
};

// Local stub until the capital workstream provides real entries.
const CAPITAL_PREVIEW: CapitalPreviewItem[] = [
  {
    title: "Thiel Macro holdings, Q2 2026",
    fund: "Thiel Macro",
    quarter: "Q2 2026",
    href: "/capital/funds/thiel-macro/holdings/2026-q2",
    summary: "The positions the fund reported at the end of the quarter in its 13F filing.",
  },
  {
    title: "Pershing Square holdings, Q2 2026",
    fund: "Pershing Square",
    quarter: "Q2 2026",
    href: "/capital/funds/pershing-square/holdings/2026-q2",
    summary: "The positions the fund reported at the end of the quarter in its 13F filing.",
  },
];

export default async function Page() {
  const [snapshot, humans, models] = await Promise.all([
    getCommunitySnapshot("30d").catch(() => null),
    getHumansLeaderboard({ period: "30d", limit: 1 }).catch(() => null),
    getModelLeaderboard({ period: "30d", sort: "users", limit: 2 }).catch(() => null),
  ]);

  return (
    <>
      <Navigation />
      <HomePage
        snapshot={snapshot}
        featuredHuman={humans?.rows[0] ?? null}
        humansCoverage={humans?.coverage ?? null}
        models={models?.rows ?? []}
        modelsCoverage={models?.coverage ?? null}
        capital={CAPITAL_PREVIEW}
      />
    </>
  );
}
