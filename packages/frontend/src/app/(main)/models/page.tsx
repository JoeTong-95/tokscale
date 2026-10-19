import type { Metadata } from "next";
import { Navigation } from "@/components/layout/Navigation";
import { ServiceFooter } from "@/components/layout/ServiceFooter";
import { getModelLeaderboard } from "@/lib/explore";
import { TOKSCALE_X_HANDLE } from "@/lib/community";
import { homeUrl } from "@/lib/seo/urls";
import { breadcrumbJsonLd, modelsIndexUrl, serializeJsonLd } from "@/lib/seo/explore";
import { EXPLORE_PERIODS, EXPLORE_SORTS, periodShortLabel, resolveExplorePeriod, resolveExploreSort, sortLabel } from "@/components/explore/format";
import { ModelCatalog } from "@/components/explore/ModelCatalog";
import { PageHeader, PageLead, PageTitle } from "@/components/explore/ExploreUI";
import { buildExploreHref } from "../leaderboard/views";

/** The catalog lists every model with data, so it defaults to all time. */
const CATALOG_DEFAULT_PERIOD = "all" as const;
const CATALOG_LIMIT = 1000;

const TITLE = "AI Models Used for Coding - Active Users, Tokens, Est. Cost | Tokscale";
const DESCRIPTION =
  "Every AI model seen in public Tokscale submissions, grouped by lab: active users, adoption, tokens, and estimated cost per model.";

export function generateMetadata(): Metadata {
  const canonical = modelsIndexUrl();
  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical },
    openGraph: { title: TITLE, description: DESCRIPTION, type: "website", url: canonical, siteName: "Tokscale" },
    twitter: { card: "summary_large_image", site: TOKSCALE_X_HANDLE, title: TITLE, description: DESCRIPTION },
  };
}

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

function text(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.slice(0, 80) ?? "";
}

export default async function ModelsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const period = resolveExplorePeriod(params.period, CATALOG_DEFAULT_PERIOD);
  const sort = resolveExploreSort(params.sort);
  const ranked = await getModelLeaderboard({ period, sort, limit: CATALOG_LIMIT });

  const current = { period, sort };
  const defaults = { period: CATALOG_DEFAULT_PERIOD, sort: "users" };
  const periodOptions = EXPLORE_PERIODS.map((value) => ({
    href: buildExploreHref("/models", current, { period: value }, defaults),
    label: periodShortLabel(value),
    active: value === period,
  }));
  const sortOptions = EXPLORE_SORTS.map((value) => ({
    href: buildExploreHref("/models", current, { sort: value }, defaults),
    label: sortLabel(value),
    active: value === sort,
  }));

  const jsonLd = breadcrumbJsonLd([
    { name: "Tokscale", url: homeUrl() },
    { name: "Models", url: modelsIndexUrl() },
  ]);

  return (
    <div className="service-page-shell">
      <Navigation />
      <main className="service-main" id="main-content">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
        <PageHeader>
          <PageTitle>Models</PageTitle>
          <PageLead>
            Every model seen in public Tokscale submissions, grouped by lab. Open a model to see its daily trend, token mix,
            and the agents that carry it.
          </PageLead>
        </PageHeader>
        <ModelCatalog
          rows={ranked.rows}
          coverage={ranked.coverage}
          sort={sort}
          periodOptions={periodOptions}
          sortOptions={sortOptions}
          initialQuery={text(params.q)}
          initialLab={text(params.lab) || "all"}
        />
      </main>
      <ServiceFooter />
    </div>
  );
}
