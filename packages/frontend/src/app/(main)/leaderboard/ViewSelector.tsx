"use client";

import { useSearchParams } from "next/navigation";
import styled from "styled-components";
import { SegmentedGroup } from "@/components/leaderboard/RankingUI";
import { DISPLAY_FONT, TouchSegment } from "@/components/explore/ExploreUI";
import Link from "next/link";
import {
  LEADERBOARD_VIEWS,
  LEADERBOARD_VIEW_LABELS,
  buildLeaderboardViewHref,
  type LeaderboardSearchParams,
  type LeaderboardView,
} from "./views";

// Top-of-page segmented control that swaps between the Humans, Models, Agents
// and Groups views. Pure-link nav (no client state), so SSR + back/forward
// behave naturally and the URL is shareable.
//
// Uses aria-current="page" rather than role="tablist": these are full-page
// navigations, not in-page tab panels, so the link semantics are the honest
// thing and keep ArrowLeft/Right doing whatever the browser would normally do
// for in-page focus.

export { buildLeaderboardViewHref };
export type { LeaderboardSearchParams, LeaderboardView };

const Header = styled.header`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 24px;

  @media (max-width: 760px) {
    align-items: flex-start;
    flex-direction: column;
    gap: 16px;
  }
`;

const HeadingGroup = styled.div`
  min-width: 0;
`;

/* Same treatment as the eyebrows on the home and tracker pages. */
const Eyebrow = styled.p`
  margin: 0 0 8px;
  color: var(--v2-text-subtle);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
`;

const Title = styled.h1`
  margin: 0;
  color: var(--service-text);
  font-family: ${DISPLAY_FONT};
  font-size: 2rem;
  font-weight: 500;
  letter-spacing: -0.02em;
  line-height: 1.15;
  text-wrap: balance;

  @media (max-width: 640px) {
    font-size: 1.75rem;
  }
`;

const Description = styled.p`
  max-width: 68ch;
  margin: 6px 0 0;
  color: var(--service-text-muted);
  font-size: 0.875rem;
  line-height: 1.5;
  text-wrap: pretty;

  @media (max-width: 640px) {
    font-size: 1rem;
  }
`;

const VIEW_DESCRIPTIONS: Record<LeaderboardView, string> = {
  humans: "Public Tokscale profiles ranked by the usage they submitted.",
  models: "Models ranked by how many people used them, from public Tokscale submissions.",
  agents: "Coding agents ranked by how many people used them, from public Tokscale submissions.",
  groups: "Scoped rankings for teams, friends, and workspaces.",
};

const VIEW_TITLES: Record<LeaderboardView, string> = {
  humans: "Human leaderboard",
  models: "Model leaderboard",
  agents: "Agent leaderboard",
  groups: "Groups",
};

interface ViewSelectorProps {
  current: LeaderboardView;
  searchParams: LeaderboardSearchParams;
}

export default function ViewSelector({ current, searchParams }: ViewSelectorProps) {
  const liveSearchParams = useSearchParams();
  const liveSearchParamsRecord: LeaderboardSearchParams = {};

  liveSearchParams.forEach((value, key) => {
    const existing = liveSearchParamsRecord[key];
    if (existing === undefined) {
      liveSearchParamsRecord[key] = value;
    } else if (Array.isArray(existing)) {
      existing.push(value);
    } else {
      liveSearchParamsRecord[key] = [existing, value];
    }
  });

  const activeSearchParams = liveSearchParams.toString()
    ? liveSearchParamsRecord
    : searchParams;

  return (
    <Header>
      <HeadingGroup>
        <Eyebrow>Leaderboards</Eyebrow>
        <Title>{VIEW_TITLES[current]}</Title>
        <Description>{VIEW_DESCRIPTIONS[current]}</Description>
      </HeadingGroup>
      <SegmentedGroup as="nav" aria-label="Leaderboard view">
        {LEADERBOARD_VIEWS.map((view) => (
          <TouchSegment
            key={view}
            as={Link}
            href={buildLeaderboardViewHref(activeSearchParams, view)}
            $active={current === view}
            aria-current={current === view ? "page" : undefined}
          >
            {LEADERBOARD_VIEW_LABELS[view]}
          </TouchSegment>
        ))}
      </SegmentedGroup>
    </Header>
  );
}
