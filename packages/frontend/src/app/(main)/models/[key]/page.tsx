import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Navigation } from "@/components/layout/Navigation";
import { ServiceFooter } from "@/components/layout/ServiceFooter";
import { getModelDetail, type ExplorePeriod, type ModelDetail } from "@/lib/explore";
import { TOKSCALE_X_HANDLE } from "@/lib/community";
import { homeUrl } from "@/lib/seo/urls";
import { breadcrumbJsonLd, modelUrl, modelsIndexUrl, serializeJsonLd } from "@/lib/seo/explore";
import {
  DEFAULT_EXPLORE_PERIOD,
  EXPLORE_PERIODS,
  formatCount,
  formatTokens,
  periodShortLabel,
  resolveExplorePeriod,
} from "@/components/explore/format";
import { ModelDetailView } from "@/components/explore/ModelDetailView";
import { buildExploreHref } from "../../leaderboard/views";

interface PageProps {
  params: Promise<{ key: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

/** Canonical keys are lowercase and URL-safe; anything else cannot exist. */
const MODEL_KEY_PATTERN = /^[a-z0-9][a-z0-9._:-]{0,127}$/;

function decodeKey(raw: string): string | null {
  let key: string;
  try {
    key = decodeURIComponent(raw);
  } catch {
    return null;
  }
  return MODEL_KEY_PATTERN.test(key) ? key : null;
}

interface LoadedDetail {
  detail: ModelDetail;
  period: ExplorePeriod;
  fallbackFrom: ExplorePeriod | null;
}

/**
 * Load the requested period. If the model exists but had no usage in that
 * window, show all time with a notice instead of a 404.
 */
async function loadDetail(key: string, period: ExplorePeriod): Promise<LoadedDetail | null> {
  const detail = await getModelDetail(key, period);
  if (detail) return { detail, period, fallbackFrom: null };
  if (period === "all") return null;
  const allTime = await getModelDetail(key, "all");
  return allTime ? { detail: allTime, period: "all", fallbackFrom: period } : null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { key: rawKey } = await params;
  const key = decodeKey(rawKey);
  const loaded = key ? await loadDetail(key, DEFAULT_EXPLORE_PERIOD) : null;
  if (!key || !loaded) {
    return { title: "Model not found | Tokscale", robots: { index: false } };
  }

  const { model, summary } = loaded.detail;
  const canonical = modelUrl(model.key);
  const by = model.lab ? ` by ${model.lab}` : "";
  const title = `${model.name}${by} - Usage, Active Users, Est. Cost | Tokscale`;
  const description = `${model.name}${by}: ${formatCount(summary.activeUsers)} active users and ${formatTokens(summary.tokens)} tokens in public Tokscale submissions, with daily trend, token mix, estimated cost, and the coding agents that use it.`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, type: "website", url: canonical, siteName: "Tokscale" },
    twitter: { card: "summary_large_image", site: TOKSCALE_X_HANDLE, title, description },
  };
}

export default async function ModelPage({ params, searchParams }: PageProps) {
  const [{ key: rawKey }, query] = await Promise.all([params, searchParams]);
  const key = decodeKey(rawKey);
  if (!key) notFound();

  const requested = resolveExplorePeriod(query.period);
  const loaded = await loadDetail(key, requested);
  if (!loaded) notFound();

  const { detail, period, fallbackFrom } = loaded;
  const path = `/models/${encodeURIComponent(detail.model.key)}`;
  const periodOptions = EXPLORE_PERIODS.map((value) => ({
    href: buildExploreHref(path, { period: requested }, { period: value }, { period: DEFAULT_EXPLORE_PERIOD }),
    label: periodShortLabel(value),
    active: value === requested,
  }));

  const crumbs = [
    { name: "Tokscale", url: homeUrl() },
    { name: "Models", url: modelsIndexUrl() },
    { name: detail.model.name, url: modelUrl(detail.model.key) },
  ];

  return (
    <div className="service-page-shell">
      <Navigation />
      <main className="service-main" id="main-content">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd(crumbs)) }} />
        <ModelDetailView detail={detail} period={period} periodOptions={periodOptions} fallbackFrom={fallbackFrom} />
      </main>
      <ServiceFooter />
    </div>
  );
}
