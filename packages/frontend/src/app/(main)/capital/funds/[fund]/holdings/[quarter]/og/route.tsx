import { ImageResponse } from "next/og";
import { OG_BORDER, OG_SIZE, OG_TEXT, OG_TEXT_MUTED, OgCardShell } from "@/components/og/OgCard";
import { capital, formatUsdCompact, formatWeight } from "@/lib/capital";
import { loadOgFonts } from "@/lib/og/fonts";

/**
 * 1200x630 Open Graph card for a quarter page, served at <quarter page>/og.
 *
 * A route handler rather than the opengraph-image.tsx convention: inside the
 * (main) route group Next appends a hash to metadata image URLs, and the
 * JSON-LD, the page metadata and getFeaturedCapital() need one stable URL.
 */
export const dynamic = "force-dynamic";

const ACCENT = "#0073ff";

export async function GET(_request: Request, { params }: { params: Promise<{ fund: string; quarter: string }> }) {
  const { fund, quarter } = await params;
  const q = capital.getQuarter(fund, quarter);
  if (!q) return new Response("Not found", { status: 404 });

  const eyebrow = `${q.story ? "INSIDE THE 13F" : "13F HOLDINGS"} · ${q.fundRecord.name.toUpperCase()} · AS OF ${q.periodOfReport}`;
  // Straight apostrophes: the subset font renders the typographic one with a wide gap.
  const headline = (q.story?.headline ?? `${q.fundRecord.shortName} ${q.label} 13F holdings`).replace(/\u2019/g, "'");
  const stats = [
    { label: "REPORTED 13F VALUE", value: formatUsdCompact(q.reportedValueUsd) },
    { label: "HOLDINGS", value: String(q.holdings.length) },
    { label: "TOP-5 WEIGHT", value: formatWeight(q.topFiveWeight) },
  ];
  const fonts = await loadOgFonts(`${eyebrow}${headline}${stats.map((s) => s.label + s.value).join("")}`);

  return new ImageResponse(
    (
      <OgCardShell>
        <div style={{ display: "flex", flexDirection: "column", marginTop: 28 }}>
          <div style={{ display: "flex", fontSize: 20, color: OG_TEXT_MUTED, letterSpacing: 2 }}>{eyebrow}</div>
          <div style={{ display: "flex", marginTop: 14, fontSize: 46, fontWeight: 700, color: OG_TEXT, lineHeight: 1.12 }}>
            {headline}
          </div>
        </div>
        <div style={{ display: "flex", flex: 1 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", height: 12, gap: 2, background: OG_BORDER }}>
            {q.holdings.map((h, i) => (
              <div
                key={h.cusip6}
                style={{
                  display: "flex",
                  flexGrow: h.weight,
                  flexBasis: 0,
                  minWidth: 2,
                  background: ACCENT,
                  opacity: Math.max(0.22, 1 - i * 0.11),
                }}
              />
            ))}
          </div>
          <div style={{ display: "flex", gap: 48 }}>
            {stats.map((s) => (
              <div key={s.label} style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", fontSize: 40, fontWeight: 700, color: OG_TEXT }}>{s.value}</div>
                <div style={{ display: "flex", marginTop: 4, fontSize: 18, color: OG_TEXT_MUTED, letterSpacing: 2 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </OgCardShell>
    ),
    { ...OG_SIZE, fonts }
  );
}
