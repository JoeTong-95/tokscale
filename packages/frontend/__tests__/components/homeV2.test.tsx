import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import path from "node:path";
import { listSupportedAgents, agentLogoUrl } from "../../src/components/home/agents";
import { AGENT_ICONS } from "../../src/lib/agentIcons";
import { SOURCE_DISPLAY_NAMES } from "../../src/lib/constants";
import { CapitalPreview } from "../../src/components/home/CapitalPreview";
import { CommunitySnapshot } from "../../src/components/home/CommunitySnapshot";
import { TrustedBy } from "../../src/components/home/TrustedBy";
import {
  coverageDays,
  coverageRangeLabel,
  percent,
  uniqueByKey,
  uniqueNames,
  updatedLabel,
  updatedShortLabel,
  userChange,
  compactCost,
} from "../../src/components/home/format";
import { NAV_ITEMS, isNavItemActive } from "../../src/components/layout/Navigation";
import { PublicFooter, SPONSOR_URL } from "../../src/components/layout/PublicFooter";
import { embedImageUrl, embedMarkdown, EMBED_SHOWCASE_TEMPLATES } from "../../src/app/(main)/tracker/EmbedShowcase";
import { EMBED_TEMPLATES } from "../../src/lib/embed/embedShared";
import { fixtureSnapshot } from "../../src/lib/explore/fixtures";
import { TOKSCALE_DISCORD_URL, TOKSCALE_X_URL } from "../../src/lib/community";

describe("home format helpers", () => {
  it("shows no price instead of $0 when there is usage but no cost", () => {
    expect(compactCost(0, 5_000)).toBe("—");
    expect(compactCost(0, 0)).toBe("$0");
    expect(compactCost(1_500, 5_000)).not.toBe("—");
  });

  it("shortens the data time for the snapshot header", () => {
    expect(updatedShortLabel("2026-10-19T09:24:00.000Z", "2026-10-19")).toBe("09:24 UTC");
    expect(updatedShortLabel("2026-10-20T01:05:00.000Z", "2026-10-19")).toBe("Oct 20, 01:05 UTC");
    expect(updatedShortLabel(null, "2026-10-19")).toBeNull();
  });

  it("labels the coverage window in UTC", () => {
    expect(coverageRangeLabel({ start: "2026-09-19", end: "2026-10-18" })).toBe("Sep 19 – Oct 18, 2026");
    expect(coverageRangeLabel({ start: "2025-12-20", end: "2026-01-18" })).toBe("Dec 20, 2025 – Jan 18, 2026");
    expect(coverageDays({ start: "2026-09-19", end: "2026-10-18" })).toBe(30);
    expect(updatedLabel("2026-10-19T04:12:00.000Z")).toBe("Oct 19, 2026, 04:12 UTC");
    expect(updatedLabel(null)).toBeNull();
  });

  it("formats shares without inventing precision", () => {
    expect(percent(0.364)).toBe("36%");
    expect(percent(0.004)).toBe("<1%");
    expect(percent(0)).toBe("0%");
  });

  it("shows added users or a New badge instead of growth percentages", () => {
    expect(userChange({ activeUsers: 142, previousActiveUsers: 0, isNew: true })).toEqual({ kind: "new", label: "New" });
    expect(userChange({ activeUsers: 512, previousActiveUsers: 470, isNew: false })).toMatchObject({ kind: "up", label: "+42" });
    expect(userChange({ activeUsers: 280, previousActiveUsers: 301, isNew: false })).toMatchObject({ kind: "down", label: "−21" });
    expect(userChange({ activeUsers: 10, previousActiveUsers: null, isNew: false })).toEqual({ kind: "none", label: "—" });
  });

  it("drops repeated keys", () => {
    const items = [
      { key: "claude", name: "Claude Code" },
      { key: "claude", name: "Claude Code" },
      { key: "codex", name: "Codex CLI" },
    ];
    expect(uniqueNames(items)).toEqual(["Claude Code", "Codex CLI"]);
    expect(uniqueByKey(items)).toHaveLength(2);
  });
});

describe("supported agents", () => {
  it("collapses aliases that share a name and logo and lists featured agents first", () => {
    const agents = listSupportedAgents();
    const kilo = agents.filter((agent) => agent.name === "Kilo");
    expect(kilo).toHaveLength(1);
    expect(agents[0].key).toBe("claude");
    expect(new Set(agents.map((agent) => agent.key)).size).toBe(agents.length);
  });

  it("keeps distinct names that reuse a logo", () => {
    const agents = listSupportedAgents(
      { a: "Alpha", b: "Alpha", c: "Gamma" },
      { a: "logo-1", b: "logo-1", c: "logo-1" },
      [],
    );
    expect(agents.map((agent) => agent.key)).toEqual(["a", "c"]);
  });

  it("uses a vendored README icon for every client", () => {
    for (const key of Object.keys(SOURCE_DISPLAY_NAMES)) {
      const icon = AGENT_ICONS[key];
      expect(icon, key).toMatch(/^\/assets\/v2\/agents\//);
      expect(existsSync(path.join(process.cwd(), "public", icon)), icon).toBe(true);
    }
    expect(listSupportedAgents().every((agent) => agent.logoUrl.startsWith("/assets/v2/agents/"))).toBe(true);
  });

  it("uses each client's own icon", () => {
    expect(AGENT_ICONS.omp).toContain("omp-sh");
    expect(AGENT_ICONS["9router"]).toBe("/assets/v2/agents/9router.svg");
    expect(AGENT_ICONS["9router"]).not.toBe(AGENT_ICONS.gjc);
    expect(AGENT_ICONS.kilo).toBe(AGENT_ICONS.kilocode);
  });

  it("falls back to the client registry logo", () => {
    expect(agentLogoUrl({ key: "claude", logoUrl: null })).toContain("client-claude");
    expect(agentLogoUrl({ key: "not-a-client", logoUrl: null })).toBeNull();
    expect(agentLogoUrl({ key: "claude", logoUrl: "https://example.com/x.png" })).toBe("https://example.com/x.png");
  });
});

describe("navigation", () => {
  it("uses sentence-case labels in the agreed order", () => {
    expect(NAV_ITEMS.map((item) => item.label)).toEqual(["Leaderboards", "Models", "Capital", "Tracker"]);
  });

  it("marks the section for nested routes only on path boundaries", () => {
    const [leaderboards, models, capital] = NAV_ITEMS;
    expect(isNavItemActive(leaderboards, "/groups/acme")).toBe(true);
    expect(isNavItemActive(models, "/models/claude-opus-5")).toBe(true);
    expect(isNavItemActive(models, "/modelsx")).toBe(false);
    expect(isNavItemActive(models, "/benchmarks/terminal-bench-4")).toBe(true);
    expect(isNavItemActive(capital, "/capital/companies/anthropic")).toBe(true);
    expect(isNavItemActive(capital, null)).toBe(false);
  });
});

describe("public footer", () => {
  it("links community, sponsor, and legal pages", () => {
    const markup = renderToStaticMarkup(<PublicFooter />);
    for (const href of [TOKSCALE_DISCORD_URL, TOKSCALE_X_URL, SPONSOR_URL, "https://github.com/junhoyeo/tokscale"]) {
      const anchor = markup.match(new RegExp(`<a[^>]*href="${href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^>]*>`))?.[0];
      expect(anchor, href).toContain('rel="noopener noreferrer"');
    }
    for (const path of ["/privacy", "/terms", "/contact"]) {
      expect(markup).toContain(`href="${path}"`);
    }
  });
});

describe("community snapshot", () => {
  it("links five humans and five models, labels the period, and shows estimated cost", () => {
    const snapshot = fixtureSnapshot("30d");
    const markup = renderToStaticMarkup(<CommunitySnapshot snapshot={snapshot} />);
    expect(markup.match(/href="\/u\//g)).toHaveLength(5);
    expect(markup.match(/href="\/models\/[^"]+"/g)).toHaveLength(5);
    expect(markup).toContain("Last 30 days");
    expect(markup).toContain("Est. cost");
    expect(markup).toMatch(/Updated (<!-- -->)?Oct 19, 04:12 UTC/);
    expect(markup).not.toContain("Based on public usage submissions");
  });

  it("shows a New badge for models without previous usage", () => {
    const snapshot = fixtureSnapshot("30d");
    const models = snapshot.models.map((model, index) =>
      index === 0 ? { ...model, isNew: true, previousActiveUsers: 0 } : model,
    );
    const markup = renderToStaticMarkup(<CommunitySnapshot snapshot={{ ...snapshot, models }} />);
    expect(markup).toContain(">New<");
    expect(markup).not.toMatch(/\d{3,}%/);
  });

  it("renders an empty state without data", () => {
    const markup = renderToStaticMarkup(<CommunitySnapshot snapshot={null} />);
    expect(markup).toContain("No public usage in this period yet.");
  });
});

describe("trusted by", () => {
  it("names each logo under the trusted-by label", () => {
    const markup = renderToStaticMarkup(<TrustedBy />);
    for (const name of ["Microsoft", "Amazon", "Google", "ByteDance", "Tencent", "Alibaba", "Intel", "Toss", "Hashed"]) {
      expect(markup).toContain(`alt="${name}"`);
    }
    expect(markup).not.toContain("MUSINSA");
    expect(markup).not.toContain('alt="Meta"');
    expect(markup).toContain("Trusted by professionals at");
  });
});

describe("capital preview", () => {
  it("renders each item as a link with its fund and quarter", () => {
    const markup = renderToStaticMarkup(
      <CapitalPreview
        items={[
          {
            title: "Fund holdings, Q2 2026",
            fund: "Example Fund",
            quarter: "Q2 2026",
            href: "/capital/funds/example/holdings/2026-q2",
            summary: "Summary.",
          },
        ]}
      />,
    );
    expect(markup).toContain('href="/capital/funds/example/holdings/2026-q2"');
    expect(markup).toContain("Example Fund");
    expect(markup).toContain("Q2 2026");
  });
});

describe("README embed showcase", () => {
  it("covers every embed template", () => {
    expect(EMBED_SHOWCASE_TEMPLATES.map((t) => t.id).sort()).toEqual([...EMBED_TEMPLATES].sort());
  });

  it("builds a linked markdown image for a username", () => {
    expect(embedImageUrl("junhoyeo", "receipt")).toBe("https://tokscale.ai/api/embed/junhoyeo/svg?template=receipt");
    expect(embedMarkdown("octocat", "classic")).toBe(
      "[![Tokscale Stats](https://tokscale.ai/api/embed/octocat/svg?template=classic)](https://tokscale.ai/u/octocat)",
    );
  });
});
