"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import styled from "styled-components";

export interface TuiView {
  id: string;
  label: string;
  caption: string;
  src: string;
}

export const TUI_VIEWS: TuiView[] = [
  {
    id: "overview",
    label: "Overview",
    caption: "Tokens per day by model, and every model ranked by estimated cost.",
    src: "/assets/v2/tui/tui-overview.webp",
  },
  {
    id: "models",
    label: "Models",
    caption: "Each model with its provider, agent, input, output, cache tokens, and estimated cost.",
    src: "/assets/v2/tui/tui-models.webp",
  },
  {
    id: "daily",
    label: "Daily",
    caption: "One row per day: messages, tokens by type, and estimated cost.",
    src: "/assets/v2/tui/tui-daily.webp",
  },
  {
    id: "hourly",
    label: "Hourly",
    caption: "Usage hour by hour, with the agent and model behind each hour.",
    src: "/assets/v2/tui/tui-hourly.webp",
  },
  {
    id: "sessions",
    label: "Sessions",
    caption: "One session in detail: agent, workspace, models, duration, tokens, and cost.",
    src: "/assets/v2/tui/tui-sessions.webp",
  },
  {
    id: "stats",
    label: "Stats",
    caption: "A year of activity as a contribution graph, with streaks and your most used model.",
    src: "/assets/v2/tui/tui-stats.webp",
  },
];

export function TuiShowcase({ views = TUI_VIEWS }: { views?: TuiView[] }) {
  const [active, setActive] = useState(0);
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);
  const view = views[active];

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const last = views.length - 1;
    let next: number | null = null;
    if (event.key === "ArrowRight") next = active === last ? 0 : active + 1;
    if (event.key === "ArrowLeft") next = active === 0 ? last : active - 1;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = last;
    if (next === null) return;
    event.preventDefault();
    setActive(next);
    tabs.current[next]?.focus();
  };

  return (
    <Wrap>
      <TabList role="tablist" aria-label="Terminal UI views" onKeyDown={onKeyDown}>
        {views.map((item, index) => (
          <Tab
            key={item.id}
            ref={(node) => {
              tabs.current[index] = node;
            }}
            type="button"
            role="tab"
            id={`tui-tab-${item.id}`}
            aria-selected={index === active}
            aria-controls={`tui-panel-${item.id}`}
            tabIndex={index === active ? 0 : -1}
            $active={index === active}
            onClick={() => setActive(index)}
          >
            {item.label}
          </Tab>
        ))}
      </TabList>
      <Panel role="tabpanel" id={`tui-panel-${view.id}`} aria-labelledby={`tui-tab-${view.id}`}>
        <Caption>{view.caption}</Caption>
        <Frame>
          {/* eslint-disable-next-line @next/next/no-img-element -- static screenshots, sized by CSS */}
          <img
            key={view.id}
            src={view.src}
            alt={`Tokscale terminal UI, ${view.label} view. ${view.caption}`}
            width={1800}
            height={1270}
            loading={active === 0 ? "eager" : "lazy"}
          />
        </Frame>
      </Panel>
    </Wrap>
  );
}

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const TabList = styled.div`
  display: flex;
  gap: 2px;
  max-width: 100%;
  overflow-x: auto;
  padding: 2px;
  border-bottom: 1px solid var(--v2-rule);
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const Tab = styled.button<{ $active: boolean }>`
  position: relative;
  flex-shrink: 0;
  min-height: 40px;
  padding: 0 14px;
  border: 0;
  border-radius: 6px 6px 0 0;
  background: transparent;
  color: ${({ $active }) => ($active ? "var(--v2-text)" : "var(--v2-text-muted)")};
  font-size: 14px;
  font-weight: ${({ $active }) => ($active ? 600 : 500)};

  &::after {
    position: absolute;
    right: 10px;
    bottom: -3px;
    left: 10px;
    height: 2px;
    background: ${({ $active }) => ($active ? "var(--v2-accent)" : "transparent")};
    content: "";
  }

  &:hover {
    color: var(--v2-text);
  }

  &:focus-visible {
    outline: 2px solid var(--v2-focus);
    outline-offset: -2px;
  }

  @media (pointer: coarse) {
    min-height: 44px;
  }
`;

const Panel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Caption = styled.p`
  margin: 0;
  color: var(--v2-text-muted);
  font-size: 15px;
`;

/* The screenshots carry their own window chrome, so no extra border here. */
const Frame = styled.div`
  max-width: 1040px;

  img {
    display: block;
    width: 100%;
    height: auto;
  }
`;
