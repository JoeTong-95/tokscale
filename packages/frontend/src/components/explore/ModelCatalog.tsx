"use client";

/**
 * /models catalog: every model with data, grouped by lab, with a search box
 * and a lab filter. Search and lab live in the URL (?q=, ?lab=) through
 * history.replaceState, so a filtered list can be shared without adding
 * history entries. The full list is server-rendered for crawlers.
 */
import { useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import styled from "styled-components";
import type { Coverage, ExploreSort, ModelUsageRow } from "@/lib/explore";
import { SearchIcon, XIcon } from "@/components/ui/Icons";
import { companyPath, modelPath } from "@/lib/seo/explore";
import { formatCount, formatEstimatedCost, formatShare, formatTokens } from "./format";
import { groupModelsByLab, matchesModelQuery, UNKNOWN_LAB_NAME } from "./catalog";
import {
  ButtonSegments,
  ControlBar,
  CoverageLine,
  EmptyNote,
  InlineLink,
  LinkSegments,
  SectionTitle,
  ModelMark,
  VisuallyHidden,
  type LinkOption,
} from "./ExploreUI";

const SearchField = styled.label`
  position: relative;
  display: flex;
  width: min(100%, 320px);
  align-items: center;
`;

const SearchGlyph = styled.span`
  position: absolute;
  left: 10px;
  display: inline-flex;
  color: var(--service-text-muted);
  pointer-events: none;
`;

const SearchInput = styled.input`
  width: 100%;
  min-height: 36px;
  padding: 0 36px 0 34px;
  border: 1px solid var(--service-border-strong);
  border-radius: 8px;
  background: var(--service-surface);
  color: var(--service-text);
  font-size: 0.875rem;

  &::placeholder {
    color: var(--service-text-muted);
  }

  &:focus-visible {
    border-color: var(--service-focus);
    outline: 2px solid var(--service-focus);
    outline-offset: 1px;
  }

  &::-webkit-search-cancel-button {
    display: none;
  }

  @media (max-width: 640px), (pointer: coarse) {
    min-height: 44px;
    font-size: 1rem;
  }
`;

const ClearButton = styled.button`
  position: absolute;
  right: 2px;
  display: inline-grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--service-text-muted);

  &:hover {
    color: var(--service-text);
  }

  &:focus-visible {
    outline: 2px solid var(--service-focus);
  }

  @media (max-width: 640px), (pointer: coarse) {
    width: 44px;
    height: 44px;
    right: 0;
  }
`;

const LabFilter = styled.div`
  margin-bottom: 16px;
`;

const CoverageRow = styled(CoverageLine)`
  margin-bottom: 20px;
`;

const ResultCount = styled.p`
  margin: 0 0 8px;
  color: var(--service-text-muted);
  font-size: 0.8125rem;
`;

const ColumnHead = styled.div`
  display: none;

  @media (min-width: 720px) {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 120px 170px 100px 100px;
    gap: 16px;
    padding: 8px 0;
    border-bottom: 1px solid var(--service-border);
    color: var(--service-text-muted);
    font-size: 0.75rem;
    font-weight: 500;

    > span:not(:first-child) {
      text-align: right;
    }

    > span[aria-sort] {
      color: var(--service-text);
    }
  }
`;

const LabGroup = styled.section`
  &:not(:first-of-type) {
    margin-top: 28px;
  }
`;

const LabHeading = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 4px 16px;
  padding: 10px 0;
  border-bottom: 1px solid var(--service-border);
`;

const LabMeta = styled.span`
  color: var(--service-text-muted);
  font-size: 0.8125rem;
  font-weight: 400;
`;

const List = styled.ul`
  margin: 0;
  padding: 0;
`;

const Item = styled.li`
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 2px 12px;
  align-items: center;
  min-height: 64px;
  padding: 10px 0;
  list-style: none;

  &:not(:last-child) {
    border-bottom: 1px solid var(--service-border);
  }

  &:hover {
    background: rgba(255, 255, 255, 0.02);
  }

  @media (min-width: 720px) {
    grid-template-columns: minmax(0, 1fr) 120px 170px 100px 100px;
    gap: 16px;
    min-height: 56px;
  }
`;

const NameBlock = styled.div`
  display: grid;
  min-width: 0;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 2px 10px;

  > :first-child {
    grid-row: span 2;
  }
`;

/* Stretched link: the whole row is the touch target. */
const NameLink = styled(Link)`
  overflow: hidden;
  color: var(--service-text);
  font-size: 0.9375rem;
  font-weight: 600;
  text-decoration: none;
  text-overflow: ellipsis;
  white-space: nowrap;

  &::after {
    content: "";
    position: absolute;
    inset: 0;
  }

  &:hover {
    color: var(--service-accent-hover);
  }

  &:focus-visible {
    outline: none;
  }

  &:focus-visible::after {
    outline: 2px solid var(--service-focus);
    outline-offset: -2px;
  }

  @media (max-width: 640px) {
    font-size: 1rem;
  }
`;

const Key = styled.code`
  overflow: hidden;
  color: var(--service-text-muted);
  font-size: 0.75rem;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Value = styled.span`
  display: none;
  color: var(--service-text);
  font-size: 0.875rem;
  font-variant-numeric: tabular-nums;
  text-align: right;

  @media (min-width: 720px) {
    display: block;
  }
`;

const MobilePrimary = styled.span`
  display: grid;
  justify-items: end;
  color: var(--service-text);
  font-size: 1rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;

  > span {
    color: var(--service-text-muted);
    font-size: 0.75rem;
    font-weight: 400;
  }

  @media (min-width: 720px) {
    display: none;
  }
`;

const MobileMeta = styled.span`
  grid-column: 1 / -1;
  color: var(--service-text-muted);
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;

  @media (min-width: 720px) {
    display: none;
  }
`;

const CompanyLink = styled(InlineLink)`
  font-size: 0.8125rem;
`;

const Footnote = styled.p`
  margin: 20px 0 0;
  color: var(--service-text-muted);
  font-size: 0.8125rem;
  line-height: 1.5;

  @media (max-width: 640px) {
    font-size: 0.875rem;
  }
`;

const ClearAll = styled.button`
  margin-top: 12px;
  min-height: 36px;
  padding: 0 12px;
  border: 1px solid var(--service-border-strong);
  border-radius: 8px;
  background: transparent;
  color: var(--service-text);
  font-size: 0.875rem;

  &:focus-visible {
    outline: 2px solid var(--service-focus);
    outline-offset: 2px;
  }

  @media (max-width: 640px), (pointer: coarse) {
    min-height: 44px;
  }
`;

interface ModelCatalogProps {
  rows: ModelUsageRow[];
  coverage: Coverage;
  sort: ExploreSort;
  periodOptions: LinkOption[];
  sortOptions: LinkOption[];
  initialQuery: string;
  initialLab: string;
  /** Lab slug -> company page slug, only for labs that have a company page. */
  companySlugs: Record<string, string>;
}

export function ModelCatalog({
  rows,
  coverage,
  sort,
  periodOptions,
  sortOptions,
  initialQuery,
  initialLab,
  companySlugs,
}: ModelCatalogProps) {
  const [query, setQuery] = useState(initialQuery);
  const [lab, setLab] = useState(initialLab);
  const searchId = useId();

  const allGroups = useMemo(() => groupModelsByLab(rows, sort), [rows, sort]);
  const labOptions = useMemo(
    () => [
      { value: "all", label: "All labs", count: rows.length },
      ...allGroups.map((group) => ({ value: group.key, label: group.name, count: group.models.length })),
    ],
    [allGroups, rows.length],
  );
  const activeLab = labOptions.some((option) => option.value === lab) ? lab : "all";

  const groups = useMemo(() => {
    return allGroups
      .filter((group) => activeLab === "all" || group.key === activeLab)
      .map((group) => ({ ...group, models: group.models.filter((model) => matchesModelQuery(model, query)) }))
      .filter((group) => group.models.length > 0);
  }, [allGroups, activeLab, query]);
  const shown = groups.reduce((total, group) => total + group.models.length, 0);

  useEffect(() => {
    const url = new URL(window.location.href);
    const trimmed = query.trim();
    if (trimmed) url.searchParams.set("q", trimmed);
    else url.searchParams.delete("q");
    if (activeLab !== "all") url.searchParams.set("lab", activeLab);
    else url.searchParams.delete("lab");
    const next = `${url.pathname}${url.search}`;
    if (next !== `${window.location.pathname}${window.location.search}`) {
      window.history.replaceState(window.history.state, "", next);
    }
  }, [query, activeLab]);

  const usersSorted = sort === "users";

  return (
    <>
      <ControlBar>
        <SearchField htmlFor={searchId}>
          <VisuallyHidden>Search models</VisuallyHidden>
          <SearchGlyph aria-hidden="true">
            <SearchIcon size={16} />
          </SearchGlyph>
          <SearchInput
            id={searchId}
            type="search"
            value={query}
            placeholder="Search models or labs"
            autoComplete="off"
            spellCheck={false}
            onChange={(event) => setQuery(event.target.value)}
          />
          {query ? (
            <ClearButton type="button" aria-label="Clear search" onClick={() => setQuery("")}>
              <XIcon size={14} />
            </ClearButton>
          ) : null}
        </SearchField>
        <LinkSegments label="Period" visibleLabel="Period" options={periodOptions} />
        <LinkSegments label="Sort by" visibleLabel="Sort" options={sortOptions} />
      </ControlBar>

      <LabFilter>
        <ButtonSegments label="Filter by lab" value={activeLab} options={labOptions} onChange={setLab} />
      </LabFilter>

      <CoverageRow coverage={coverage} />

      <ResultCount aria-live="polite">
        {shown === rows.length ? `${formatCount(rows.length)} models` : `${formatCount(shown)} of ${formatCount(rows.length)} models`}
      </ResultCount>

      {shown === 0 ? (
        <EmptyNote>
          {rows.length === 0 ? "No model usage in this period yet." : `No models match "${query.trim()}".`}
          {rows.length > 0 ? (
            <div>
              <ClearAll
                type="button"
                onClick={() => {
                  setQuery("");
                  setLab("all");
                }}
              >
                Clear search and filter
              </ClearAll>
            </div>
          ) : null}
        </EmptyNote>
      ) : (
        <>
          <ColumnHead aria-hidden="true">
            <span>Model</span>
            <span aria-sort={usersSorted ? "descending" : undefined}>Active users</span>
            <span>Adoption</span>
            <span aria-sort={usersSorted ? undefined : "descending"}>Tokens</span>
            <span>Est. cost</span>
          </ColumnHead>
          {groups.map((group) => (
            <LabGroup key={group.key} aria-labelledby={`lab-${group.key}`}>
              <LabHeading>
                <SectionTitle id={`lab-${group.key}`}>
                  {group.name} <LabMeta>{group.models.length === 1 ? "1 model" : `${group.models.length} models`}</LabMeta>
                </SectionTitle>
                {group.slug && companySlugs[group.slug] ? (
                  <CompanyLink href={companyPath(companySlugs[group.slug])}>About {group.name}</CompanyLink>
                ) : null}
              </LabHeading>
              <List>
                {group.models.map((model) => (
                  <Item key={model.key}>
                    <NameBlock>
                      <ModelMark model={model} size={28} />
                      <NameLink href={modelPath(model.key)}>{model.name}</NameLink>
                      <Key>{model.key}</Key>
                    </NameBlock>
                    <MobilePrimary>
                      {usersSorted ? formatCount(model.activeUsers) : formatTokens(model.tokens)}
                      <span>{usersSorted ? "active users" : "tokens"}</span>
                    </MobilePrimary>
                    <MobileMeta>
                      {usersSorted ? `${formatTokens(model.tokens)} tokens` : `${formatCount(model.activeUsers)} active users`}
                      {` · ${formatShare(model.adoption)} adoption · ${formatEstimatedCost(model.estimatedCost)} est. cost`}
                    </MobileMeta>
                    <Value>
                      {formatCount(model.activeUsers)}
                      <VisuallyHidden> active users</VisuallyHidden>
                    </Value>
                    <Value>
                      {formatShare(model.adoption)}
                      <VisuallyHidden> adoption</VisuallyHidden>
                    </Value>
                    <Value>
                      {formatTokens(model.tokens)}
                      <VisuallyHidden> tokens</VisuallyHidden>
                    </Value>
                    <Value>
                      {formatEstimatedCost(model.estimatedCost)}
                      <VisuallyHidden> estimated cost</VisuallyHidden>
                    </Value>
                  </Item>
                ))}
              </List>
            </LabGroup>
          ))}
        </>
      )}

      <Footnote>
        Adoption is the share of the {formatCount(coverage.accounts)} accounts active in this period that used the model.
        Models with no identified lab are listed under &ldquo;{UNKNOWN_LAB_NAME}&rdquo;. Cost is estimated from public
        list prices. <InlineLink href="/methodology">Methodology</InlineLink>
      </Footnote>
    </>
  );
}
