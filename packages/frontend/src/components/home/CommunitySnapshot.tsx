"use client";

import Link from "next/link";
import styled, { css } from "styled-components";
import type { CommunitySnapshot as Snapshot, HumanRow, ModelUsageRow } from "@/lib/explore";
import { Arrow, focusRing, VisuallyHidden } from "./primitives";
import { compactNumber, coverageRangeLabel, periodLabel, uniqueNames, updatedLabel, userChange, wholeNumber } from "./format";

interface CommunitySnapshotProps {
  snapshot: Snapshot | null;
}

export function CommunitySnapshot({ snapshot }: CommunitySnapshotProps) {
  const humans = snapshot?.humans.slice(0, 5) ?? [];
  const models = snapshot?.models.slice(0, 5) ?? [];
  const coverage = snapshot?.coverage ?? null;
  const range = coverage ? coverageRangeLabel(coverage) : null;
  const updated = coverage ? updatedLabel(coverage.lastDataAt) : null;
  const period = coverage ? periodLabel(coverage.period) : "Last 30 days";

  return (
    <Panel aria-labelledby="community-snapshot-title">
      <PanelHeader>
        <PanelTitle id="community-snapshot-title">Community snapshot</PanelTitle>
        <PeriodMeta>
          <strong>{period}</strong>
          {range ? <span>{range}</span> : null}
        </PeriodMeta>
      </PanelHeader>

      <Columns>
        <Column aria-labelledby="snapshot-humans-title">
          <ColumnHead>
            <ColumnTitle id="snapshot-humans-title">Humans</ColumnTitle>
            <ColumnLink href="/leaderboard">
              All humans <Arrow />
            </ColumnLink>
          </ColumnHead>
          <HeaderRow $kind="humans" aria-hidden="true">
            <span>#</span>
            <span>Builder</span>
            <HideNarrow>Top models and agents</HideNarrow>
            <Right>Tokens</Right>
          </HeaderRow>
          {humans.length > 0 ? (
            <List>
              {humans.map((human) => (
                <HumanItem key={human.username} human={human} />
              ))}
            </List>
          ) : (
            <Empty>No public usage in this period yet.</Empty>
          )}
        </Column>

        <Column aria-labelledby="snapshot-models-title">
          <ColumnHead>
            <ColumnTitle id="snapshot-models-title">Models</ColumnTitle>
            <ColumnLink href="/models">
              All models <Arrow />
            </ColumnLink>
          </ColumnHead>
          <HeaderRow $kind="models" aria-hidden="true">
            <span>#</span>
            <span>Model</span>
            <Right>Active users</Right>
            <Right>vs previous</Right>
          </HeaderRow>
          {models.length > 0 ? (
            <List>
              {models.map((model) => (
                <ModelItem key={model.key} model={model} />
              ))}
            </List>
          ) : (
            <Empty>No model usage in this period yet.</Empty>
          )}
        </Column>
      </Columns>

      <PanelFooter>
        <span>
          Based on public usage submissions.
          {updated ? ` Updated ${updated}.` : null}
        </span>
        {coverage ? <span>{wholeNumber(coverage.accounts)} accounts with usage in this period</span> : null}
      </PanelFooter>
    </Panel>
  );
}

function HumanItem({ human }: { human: HumanRow }) {
  const name = human.displayName || human.username;
  const models = uniqueNames(human.topModels).slice(0, 2);
  const agents = uniqueNames(human.topAgents).slice(0, 2);
  return (
    <li>
      <RowLink href={`/u/${encodeURIComponent(human.username)}`} $kind="humans">
        <Rank>{human.rank}</Rank>
        <Identity>
          <AvatarImg
            src={human.avatarUrl || `https://github.com/${encodeURIComponent(human.username)}.png?size=64`}
            alt=""
            width={28}
            height={28}
            loading="lazy"
          />
          <NameBlock>
            <Name>{name}</Name>
            {human.displayName && human.displayName !== human.username ? <Sub>@{human.username}</Sub> : null}
            <NarrowStack>
              {[models[0], agents[0]].filter(Boolean).join(" · ") || "—"}
            </NarrowStack>
          </NameBlock>
        </Identity>
        <Stack>
          <VisuallyHidden>Top models: </VisuallyHidden>
          <StackLine>{models.length ? models.join(", ") : "—"}</StackLine>
          <VisuallyHidden>. Agents: </VisuallyHidden>
          <StackLine $muted>{agents.length ? agents.join(", ") : "—"}</StackLine>
        </Stack>
        <Value>
          <VisuallyHidden>Tokens: </VisuallyHidden>
          {compactNumber(human.tokens)}
        </Value>
      </RowLink>
    </li>
  );
}

function ModelItem({ model }: { model: ModelUsageRow }) {
  const change = userChange(model);
  return (
    <li>
      <RowLink href={`/models/${encodeURIComponent(model.key)}`} $kind="models">
        <Rank>{model.rank}</Rank>
        <NameBlock>
          <Name>{model.name}</Name>
          <Sub>{model.lab ?? "Unknown lab"}</Sub>
        </NameBlock>
        <Value>
          <VisuallyHidden>Active users: </VisuallyHidden>
          {wholeNumber(model.activeUsers)}
        </Value>
        <Change $kind={change.kind}>
          <VisuallyHidden>Change in active users against the previous period: </VisuallyHidden>
          {change.kind === "new" ? <NewBadge>New</NewBadge> : change.label}
        </Change>
      </RowLink>
    </li>
  );
}

const Panel = styled.section`
  position: relative;
  border: 1px solid var(--v2-rule-strong);
  border-radius: 12px;
  background: rgba(4, 5, 8, 0.86);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
`;

const PanelHeader = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px 16px;
  padding: 18px 24px;
  border-bottom: 1px solid var(--v2-rule);

  @media (max-width: 520px) {
    padding: 16px;
  }
`;

const PanelTitle = styled.h2`
  margin: 0;
  color: var(--v2-text);
  font-size: 16px;
  font-weight: 600;
`;

const PeriodMeta = styled.p`
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
  margin: 0;
  color: var(--v2-text-subtle);
  font-size: 13px;

  strong {
    color: var(--v2-text);
    font-weight: 500;
  }
`;

const Columns = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);

  @media (max-width: 960px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const Column = styled.section`
  min-width: 0;
  padding: 8px 0 12px;

  & + & {
    border-left: 1px solid var(--v2-rule);
  }

  @media (max-width: 960px) {
    & + & {
      border-top: 1px solid var(--v2-rule);
      border-left: 0;
    }
  }
`;

const ColumnHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 24px 6px;

  @media (max-width: 520px) {
    padding: 10px 16px 6px;
  }
`;

const ColumnTitle = styled.h3`
  margin: 0;
  color: var(--v2-text);
  font-family: var(--v2-font-display);
  font-size: 24px;
  font-weight: 400;
  line-height: 1.2;
`;

const ColumnLink = styled(Link)`
  display: inline-flex;
  gap: 6px;
  align-items: center;
  min-height: 32px;
  border-radius: 4px;
  color: var(--v2-text-muted);
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  ${focusRing}

  span[aria-hidden] {
    color: var(--v2-accent);
  }

  &:hover {
    color: var(--v2-text);
  }
`;

const humansGrid = css`
  grid-template-columns: 20px minmax(0, 1.1fr) minmax(0, 1fr) 64px;

  @media (max-width: 1100px) and (min-width: 961px), (max-width: 600px) {
    grid-template-columns: 20px minmax(0, 1fr) 64px;
  }
`;

const modelsGrid = css`
  grid-template-columns: 20px minmax(0, 1fr) 92px 92px;

  @media (max-width: 520px) {
    grid-template-columns: 20px minmax(0, 1fr) 64px 64px;
  }
`;

const HeaderRow = styled.div<{ $kind: "humans" | "models" }>`
  display: grid;
  ${({ $kind }) => ($kind === "humans" ? humansGrid : modelsGrid)}
  gap: 12px;
  padding: 6px 24px;
  color: var(--v2-text-subtle);
  font-size: 12px;
  font-weight: 500;

  @media (max-width: 520px) {
    padding: 6px 16px;
  }
`;

const HideNarrow = styled.span`
  @media (max-width: 1100px) and (min-width: 961px), (max-width: 600px) {
    display: none;
  }
`;

const Right = styled.span`
  text-align: right;
`;

const List = styled.ol`
  margin: 0;
  padding: 0;
  list-style: none;

  li + li a {
    border-top: 1px solid var(--v2-rule);
  }
`;

const RowLink = styled(Link)<{ $kind: "humans" | "models" }>`
  display: grid;
  ${({ $kind }) => ($kind === "humans" ? humansGrid : modelsGrid)}
  gap: 12px;
  align-items: center;
  min-height: 60px;
  margin: 0 12px;
  padding: 10px 12px;
  border-radius: 6px;
  color: inherit;
  text-decoration: none;
  transition: background-color 120ms ease;

  &:hover {
    background: rgba(255, 255, 255, 0.04);
  }

  &:focus-visible {
    outline: 2px solid var(--v2-focus);
    outline-offset: -2px;
  }

  @media (max-width: 520px) {
    margin: 0 4px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const Rank = styled.span`
  color: var(--v2-text-subtle);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
`;

const Identity = styled.span`
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
`;

const AvatarImg = styled.img`
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--v2-surface-raised);
  box-shadow: 0 0 0 1px var(--v2-rule-strong);
`;

const NameBlock = styled.span`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const ellipsis = css`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Name = styled.span`
  ${ellipsis}
  color: var(--v2-text);
  font-size: 15px;
  font-weight: 500;
`;

const Sub = styled.span`
  ${ellipsis}
  color: var(--v2-text-subtle);
  font-size: 13px;
`;

const Stack = styled.span`
  display: flex;
  flex-direction: column;
  min-width: 0;

  @media (max-width: 1100px) and (min-width: 961px), (max-width: 600px) {
    display: none;
  }
`;

const NarrowStack = styled.span`
  display: none;
  ${ellipsis}
  color: var(--v2-text-muted);
  font-size: 13px;

  @media (max-width: 1100px) and (min-width: 961px), (max-width: 600px) {
    display: block;
  }
`;

const StackLine = styled.span<{ $muted?: boolean }>`
  ${ellipsis}
  color: ${({ $muted }) => ($muted ? "var(--v2-text-subtle)" : "var(--v2-text-muted)")};
  font-size: 13px;
`;

const Value = styled.span`
  color: var(--v2-text);
  font-size: 15px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  text-align: right;
`;

const Change = styled.span<{ $kind: string }>`
  color: ${({ $kind }) => ($kind === "up" ? "var(--v2-numeric)" : "var(--v2-text-muted)")};
  font-size: 14px;
  font-variant-numeric: tabular-nums;
  text-align: right;
`;

const NewBadge = styled.span`
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 8px;
  border: 1px solid rgba(0, 115, 255, 0.55);
  border-radius: 999px;
  background: var(--v2-accent-soft);
  color: #8cc2ff;
  font-size: 12px;
  font-weight: 600;
`;

const Empty = styled.p`
  margin: 0;
  padding: 24px;
  color: var(--v2-text-muted);
  font-size: 14px;
`;

const PanelFooter = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 4px 16px;
  padding: 14px 24px;
  border-top: 1px solid var(--v2-rule);
  color: var(--v2-text-subtle);
  font-size: 13px;

  @media (max-width: 520px) {
    padding: 14px 16px;
  }
`;
