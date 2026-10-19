import type { Metadata } from "next";
import { Navigation } from "@/components/layout/Navigation";
import { listSupportedAgents } from "@/components/home/agents";
import { getPublicOrigin } from "@/lib/seo/urls";
import { TrackerPageClient } from "./TrackerPageClient";

const TITLE = "Tracker: AI usage from your terminal | Tokscale";
const DESCRIPTION =
  "Run bunx tokscale@latest to see tokens, models, and estimated cost from your coding agents' local logs. Submit to get a public profile and README card.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${getPublicOrigin()}/tracker` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${getPublicOrigin()}/tracker`,
    siteName: "Tokscale",
    type: "website",
  },
};

export default function TrackerPage() {
  return (
    <>
      <Navigation />
      <TrackerPageClient agents={listSupportedAgents()} />
    </>
  );
}
