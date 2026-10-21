"use client";

import styled from "styled-components";
import type { CommunitySnapshot as Snapshot, Coverage, HumanRow, ModelUsageRow } from "@/lib/explore";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { CapitalPreview, type CapitalPreviewItem } from "./CapitalPreview";
import { CommunitySnapshot } from "./CommunitySnapshot";
import { CopyCommand } from "./CopyCommand";
import { HumansSection } from "./HumansSection";
import { ModelsSection } from "./ModelsSection";
import { TrustedBy } from "./TrustedBy";
import { Container, DisplayTitle, Lead, PageShell, PrimaryButton, SecondaryButton, SectionTitle } from "./primitives";

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
              <HeroTitle id="home-title">See how people build with AI.</HeroTitle>
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
            <TrustedBy />
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

/* One line at 40px; narrow screens scale the size down so it never wraps (the line is ~9.6 em wide). */
const HeroTitle = styled(DisplayTitle)`
  font-size: 40px;
  line-height: 1.1;
  white-space: nowrap;

  @media (max-width: 520px) {
    font-size: min(40px, calc((100vw - 32px) * 0.104));
  }
`;

/* Above the snapshot backdrop, which reaches up behind the hero's lower edge. */
const Hero = styled.section`
  position: relative;
  z-index: 1;
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
  /*
   * Room under the card and the logo row for the observatory engraving. The
   * padding tracks the engraving height, so the telescope always starts below
   * the logo row.
   */
  padding-bottom: min(440px, 42vw);

  @media (max-width: 720px) {
    padding-bottom: 64vw;
  }
`;

const Backdrop = styled.div`
  position: absolute;
  z-index: -1;
  bottom: -24px;
  left: 50%;
  width: min(1240px, 118vw);
  transform: translateX(-50%);
  pointer-events: none;
  opacity: 0.62;
  /*
   * Sits below the snapshot card: the card covers only the sky, and the dome
   * and telescope show in the space under it. Fade the sides, the top (behind
   * the card), and the base so it runs softly into the next section.
   */
  -webkit-mask-image:
    radial-gradient(ellipse 66% 90% at 50% 58%, #000 50%, transparent 100%),
    linear-gradient(to bottom, transparent 0%, #000 30%, #000 74%, transparent 100%);
  -webkit-mask-composite: source-in;
  mask-image:
    radial-gradient(ellipse 66% 90% at 50% 58%, #000 50%, transparent 100%),
    linear-gradient(to bottom, transparent 0%, #000 30%, #000 74%, transparent 100%);
  mask-composite: intersect;

  img {
    display: block;
    width: 100%;
    height: auto;
  }

  @media (max-width: 720px) {
    bottom: -12px;
    width: 175vw;
    opacity: 0.5;
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
  inset: 0;
  display: flex;
  align-items: flex-end;
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
