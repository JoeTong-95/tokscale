"use client";

import Link from "next/link";
import styled from "styled-components";
import { Arrow, Container, Eyebrow, Lead, Section, SectionHeader, SectionTitle, TextLink } from "./primitives";

export interface CapitalPreviewItem {
  title: string;
  fund: string;
  quarter: string;
  href: string;
  summary: string;
  imageUrl?: string;
}

interface CapitalPreviewProps {
  items: CapitalPreviewItem[];
}

/** Engraving crops used when an item has no image of its own. */
const FALLBACK_POSITIONS = ["4% 92%", "100% 92%", "50% 92%"];

export function CapitalPreview({ items }: CapitalPreviewProps) {
  return (
    <Section aria-labelledby="home-capital-title">
      <Container>
        <Head>
          <SectionHeader>
            <Eyebrow>Capital</Eyebrow>
            <SectionTitle id="home-capital-title">Follow the companies building AI.</SectionTitle>
            <Lead>
              Notes on the companies behind AI models and agents, and on the funds that hold them. Fund holdings come
              from public 13F filings.
            </Lead>
          </SectionHeader>
          <TextLink href="/capital">
            Explore capital <Arrow />
          </TextLink>
        </Head>

        {items.length > 0 ? (
          <Grid>
            {items.map((item, index) => (
              <li key={item.href}>
                <Card href={item.href}>
                  <Media aria-hidden="true">
                    {item.imageUrl ? (
                      <MediaImage src={item.imageUrl} alt="" loading="lazy" />
                    ) : (
                      <Fallback style={{ backgroundPosition: FALLBACK_POSITIONS[index % FALLBACK_POSITIONS.length] }} />
                    )}
                  </Media>
                  <Body>
                    <Meta>
                      <span>{item.fund}</span>
                      <span aria-hidden="true">·</span>
                      <span>{item.quarter}</span>
                    </Meta>
                    <CardTitle>{item.title}</CardTitle>
                    <Summary>{item.summary}</Summary>
                    <More>
                      Read holdings <Arrow />
                    </More>
                  </Body>
                </Card>
              </li>
            ))}
          </Grid>
        ) : null}
      </Container>
    </Section>
  );
}

const Head = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 40px;
`;

const Grid = styled.ul`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr));
  gap: 24px;
  margin: 0;
  padding: 0;
  list-style: none;
`;

const Card = styled(Link)`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  border: 1px solid var(--v2-rule-strong);
  border-radius: 12px;
  background: var(--v2-surface);
  color: inherit;
  text-decoration: none;
  transition: border-color 120ms ease;

  &:hover {
    border-color: rgba(255, 255, 255, 0.32);
  }

  &:focus-visible {
    outline: 2px solid var(--v2-focus);
    outline-offset: 3px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const Media = styled.div`
  aspect-ratio: 2 / 1;
  overflow: hidden;
  border-bottom: 1px solid var(--v2-rule);
  background: #000;
`;

const MediaImage = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

/* Crops of the ledger engraving for items without their own image. */
const Fallback = styled.div`
  width: 100%;
  height: 100%;
  background-image: url("/assets/v2/ledger-960.webp");
  background-repeat: no-repeat;
  background-size: 200% auto;
  opacity: 0.75;
`;

const Body = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
  padding: 20px 24px 24px;

  @media (max-width: 520px) {
    padding: 16px;
  }
`;

const Meta = styled.p`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  color: var(--v2-text-subtle);
  font-size: 13px;
`;

const CardTitle = styled.h3`
  margin: 0;
  color: var(--v2-text);
  font-family: var(--v2-font-display);
  font-size: 28px;
  font-weight: 400;
  line-height: 1.15;
`;

const Summary = styled.p`
  flex: 1;
  margin: 0;
  color: var(--v2-text-muted);
  font-size: 15px;
  line-height: 1.55;
`;

const More = styled.span`
  display: inline-flex;
  gap: 6px;
  margin-top: 8px;
  color: var(--v2-text);
  font-size: 14px;
  font-weight: 600;

  span[aria-hidden] {
    color: var(--v2-accent);
  }
`;
