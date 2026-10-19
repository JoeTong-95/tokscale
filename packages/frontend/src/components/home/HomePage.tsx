"use client";

import styled from "styled-components";
import type { CommunitySnapshot as Snapshot, Coverage, HumanRow, ModelUsageRow } from "@/lib/explore";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { CapitalPreview, type CapitalPreviewItem } from "./CapitalPreview";
import { CommunitySnapshot } from "./CommunitySnapshot";
import { CopyCommand } from "./CopyCommand";
import { HumansSection } from "./HumansSection";
import { ModelsSection } from "./ModelsSection";
import { Container, DisplayTitle, Eyebrow, Lead, PageShell, PrimaryButton, SecondaryButton, SectionTitle } from "./primitives";

export interface HomePageProps {
  snapshot: Snapshot | null;
  featuredHuman: HumanRow | null;
  humansCoverage: Coverage | null;
  models: ModelUsageRow[];
  modelsCoverage: Coverage | null;
  capital: CapitalPreviewItem[];
}

export function HomePage({ snapshot, featuredHuman, humansCoverage, models, modelsCoverage, capital }: HomePageProps) {
  return (
    <PageShell>
      <main>
        <Hero aria-labelledby="home-title">
          <Container>
            <HeroCopy>
              <Eyebrow>AI, in practice</Eyebrow>
              <DisplayTitle id="home-title">
                See how people build <Line>with AI.</Line>
              </DisplayTitle>
              <HeroLead>
                Discover what builders use, compare AI models, and follow the companies and capital behind them.
              </HeroLead>
              <Actions>
                <PrimaryButton href="/leaderboard">Explore leaderboards</PrimaryButton>
                <SecondaryButton href="/tracker">Track your usage</SecondaryButton>
              </Actions>
            </HeroCopy>
          </Container>
        </Hero>

        <SnapshotStage>
          <Backdrop aria-hidden="true">
            <picture>
              <source media="(max-width: 720px)" srcSet="/assets/v2/observatory-960.webp" />
              <img src="/assets/v2/observatory.webp" alt="" width={1672} height={941} decoding="async" />
            </picture>
          </Backdrop>
          <Container>
            <CommunitySnapshot snapshot={snapshot} />
          </Container>
        </SnapshotStage>

        <HumansSection human={featuredHuman} coverage={humansCoverage} />
        <ModelsSection models={models} coverage={modelsCoverage} />
        <CapitalPreview items={capital} />

        <Closing aria-labelledby="home-closing-title">
          <ClosingArt aria-hidden="true">
            <picture>
              <source media="(max-width: 720px)" srcSet="/assets/v2/instruments-960.webp" />
              <img src="/assets/v2/instruments.webp" alt="" width={1672} height={941} loading="lazy" decoding="async" />
            </picture>
          </ClosingArt>
          <Container>
            <ClosingInner>
              <SectionTitle id="home-closing-title">
                Track your usage. <Line>Join the community.</Line>
              </SectionTitle>
              <Lead>
                Tokscale reads the session logs your coding agents already keep, on your machine. Nothing leaves it
                until you submit.
              </Lead>
              <CopyCommand command="bunx tokscale@latest" label="Copy the command to run Tokscale" />
              <PrimaryButton href="/tracker">Start tracking</PrimaryButton>
              <TeamsLine>
                Bringing AI to your team?{" "}
                <a href="https://tokscale.io" target="_blank" rel="noopener noreferrer">
                  Explore Tokscale for teams <span aria-hidden="true">↗</span>
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </TeamsLine>
            </ClosingInner>
          </Container>
        </Closing>
      </main>
      <PublicFooter />
    </PageShell>
  );
}

const Line = styled.span`
  @media (min-width: 721px) {
    display: block;
  }
`;

const Hero = styled.section`
  padding: 128px 0 56px;

  @media (max-width: 720px) {
    padding: 112px 0 48px;
  }
`;

const HeroCopy = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  max-width: 860px;
  margin: 0 auto;
  text-align: center;
`;

const HeroLead = styled(Lead)`
  max-width: 34rem;
  font-size: 18px;

  @media (max-width: 520px) {
    font-size: 16px;
  }
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  margin-top: 8px;

  @media (max-width: 400px) {
    flex-direction: column;
    align-self: stretch;
  }
`;

const SnapshotStage = styled.div`
  position: relative;
  isolation: isolate;
  padding-bottom: 48px;

  @media (max-width: 720px) {
    padding-bottom: 24px;
  }
`;

const Backdrop = styled.div`
  position: absolute;
  z-index: -1;
  top: -140px;
  left: 50%;
  width: min(1680px, 140vw);
  transform: translateX(-50%);
  pointer-events: none;
  opacity: 0.5;
  /* Fade the sides and the base so the dome never runs into the next section. */
  -webkit-mask-image:
    radial-gradient(ellipse 62% 75% at 50% 45%, #000 45%, transparent 100%),
    linear-gradient(to bottom, #000 50%, transparent 80%);
  -webkit-mask-composite: source-in;
  mask-image:
    radial-gradient(ellipse 62% 75% at 50% 45%, #000 45%, transparent 100%),
    linear-gradient(to bottom, #000 50%, transparent 80%);
  mask-composite: intersect;

  img {
    display: block;
    width: 100%;
    height: auto;
  }

  @media (max-width: 720px) {
    top: -48px;
    width: 220vw;
    opacity: 0.4;
  }
`;

const Closing = styled.section`
  position: relative;
  isolation: isolate;
  margin-top: 120px;
  padding: 120px 0 240px;
  border-top: 1px solid var(--v2-rule);

  @media (max-width: 720px) {
    margin-top: 80px;
    padding: 80px 0 160px;
  }
`;

const ClosingArt = styled.div`
  position: absolute;
  z-index: -1;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  justify-content: center;
  overflow: hidden;
  pointer-events: none;
  opacity: 0.42;
  -webkit-mask-image: linear-gradient(to bottom, transparent 0%, #000 55%);
  mask-image: linear-gradient(to bottom, transparent 0%, #000 55%);

  img {
    display: block;
    width: min(1440px, 160vw);
    max-width: none;
    height: auto;
  }
`;

const ClosingInner = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  max-width: 640px;
  margin: 0 auto;
  text-align: center;

  > p {
    max-width: 30rem;
  }

  /* Keep the copy readable over the instruments engraving. */
  &::before {
    position: absolute;
    z-index: -1;
    inset: -80px -160px;
    background: radial-gradient(closest-side, rgba(0, 0, 0, 0.92) 55%, rgba(0, 0, 0, 0) 100%);
    content: "";
    pointer-events: none;
  }
`;

const TeamsLine = styled.p`
  margin: 24px 0 0;
  color: var(--v2-text-subtle);
  font-size: 14px;

  a {
    border-radius: 4px;
    color: var(--v2-text-muted);
    text-decoration: underline;
    text-decoration-color: var(--v2-rule-strong);
    text-underline-offset: 3px;
  }

  a:hover {
    color: var(--v2-text);
    text-decoration-color: currentColor;
  }

  a:focus-visible {
    outline: 2px solid var(--v2-focus);
    outline-offset: 3px;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }
`;
