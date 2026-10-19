"use client";

import { useState } from "react";
import styled from "styled-components";
import type { SupportedAgent } from "@/components/home/agents";

const INITIAL_COUNT = 16;

export function AgentsGrid({ agents }: { agents: SupportedAgent[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? agents : agents.slice(0, INITIAL_COUNT);
  const hidden = agents.length - INITIAL_COUNT;

  return (
    <div>
      <Grid id="supported-agents-list">
        {visible.map((agent) => (
          <li key={agent.key}>
            {/* eslint-disable-next-line @next/next/no-img-element -- remote logos from mixed hosts */}
            <img src={agent.logoUrl} alt="" width={24} height={24} loading="lazy" />
            <span>{agent.name}</span>
          </li>
        ))}
      </Grid>
      {hidden > 0 ? (
        <Toggle
          type="button"
          aria-expanded={expanded}
          aria-controls="supported-agents-list"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "Show fewer" : `Show all ${agents.length}`}
        </Toggle>
      ) : null}
    </div>
  );
}

const Grid = styled.ul`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin: 0;
  padding: 0;
  border-top: 1px solid var(--v2-rule);
  border-left: 1px solid var(--v2-rule);
  list-style: none;

  li {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
    min-height: 64px;
    padding: 12px 16px;
    border-right: 1px solid var(--v2-rule);
    border-bottom: 1px solid var(--v2-rule);
  }

  img {
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    border-radius: 6px;
    background: #fff;
    object-fit: contain;
  }

  span {
    overflow: hidden;
    color: var(--v2-text);
    font-size: 15px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  @media (max-width: 960px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media (max-width: 680px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));

    li {
      min-height: 56px;
      padding: 10px 12px;
    }

    span {
      font-size: 14px;
    }
  }
`;

const Toggle = styled.button`
  min-height: 44px;
  margin-top: 16px;
  padding: 0 16px;
  border: 1px solid var(--v2-rule-strong);
  border-radius: 8px;
  background: transparent;
  color: var(--v2-text);
  font-size: 14px;
  font-weight: 600;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  &:focus-visible {
    outline: 2px solid var(--v2-focus);
    outline-offset: 3px;
  }
`;
