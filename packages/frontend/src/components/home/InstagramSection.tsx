"use client";

import styled from "styled-components";
import { TOKSCALE_INSTAGRAM_HANDLE, TOKSCALE_INSTAGRAM_URL } from "@/lib/community";
import { Container, Eyebrow, focusRing, Lead, Section, SectionHeader, SectionTitle, TextLink } from "./primitives";

export interface InstagramPost {
  href: string;
  /** Vendored card image (public/assets/v2/instagram, see SOURCES.json there). */
  image: string;
  alt: string;
  /** The post's first line. */
  caption: string;
}

/** Four recent posts from @tokscaleai, refreshed by hand. */
export const INSTAGRAM_POSTS: InstagramPost[] = [
  {
    href: "https://www.instagram.com/p/DeAHX4kEhxX/",
    image: "/assets/v2/instagram/DeAHX4kEhxX.webp",
    alt: "Card: 6.4% of AI coders burned half the tokens.",
    caption: "In September 2026, just 63 accounts on Tokscale used as many AI tokens as the other 926 combined.",
  },
  {
    href: "https://www.instagram.com/p/Dd_a8fwEixF/",
    image: "/assets/v2/instagram/Dd_a8fwEixF.webp",
    alt: "Card: 76.3% of AI coders use Codex.",
    caption: "Codex showed up in more accounts. Claude Code moved more tokens.",
  },
  {
    href: "https://www.instagram.com/p/DemjVOaElI9/",
    image: "/assets/v2/instagram/DemjVOaElI9.webp",
    alt: "Card: Tracking a trillion tokens worldwide.",
    caption: "You opened your laptop for one small fix. Now the sky outside is turning blue.",
  },
  {
    href: "https://www.instagram.com/p/DeAU_0RTKhn/",
    image: "/assets/v2/instagram/DeAU_0RTKhn.webp",
    alt: "Card: SoftBank completes $30B OpenAI investment.",
    caption: "SoftBank has delivered on its $30 billion commitment to OpenAI.",
  },
];

export function InstagramSection({ posts = INSTAGRAM_POSTS }: { posts?: InstagramPost[] }) {
  return (
    <Section aria-labelledby="home-instagram-title">
      <Container>
        <Head>
          <SectionHeader>
            <Eyebrow>Instagram</Eyebrow>
            <SectionTitle id="home-instagram-title">Tokscale data, in your feed.</SectionTitle>
            <Lead>Cards on how people build with AI, drawn from Tokscale data, and on the money behind AI.</Lead>
            <TextLink href={TOKSCALE_INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
              Follow {TOKSCALE_INSTAGRAM_HANDLE} <span aria-hidden="true">↗</span>
            </TextLink>
          </SectionHeader>
        </Head>
        <Posts>
          {posts.map((post) => (
            <li key={post.href}>
              <PostLink href={post.href} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element -- small vendored card images */}
                <img src={post.image} alt={post.alt} width={540} height={720} loading="lazy" decoding="async" />
                <Caption>{post.caption}</Caption>
              </PostLink>
            </li>
          ))}
        </Posts>
      </Container>
    </Section>
  );
}

const Head = styled.div`
  margin-bottom: 40px;
`;

const Posts = styled.ul`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px;
  margin: 0;
  padding: 0;
  list-style: none;

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }
`;

const PostLink = styled.a`
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-radius: 12px;
  color: inherit;
  text-decoration: none;
  ${focusRing}

  img {
    display: block;
    width: 100%;
    height: auto;
    aspect-ratio: 3 / 4;
    object-fit: cover;
    border-radius: 12px;
    box-shadow: 0 0 0 1px var(--v2-rule-strong);
    transition: transform 160ms ease, box-shadow 160ms ease;
  }

  &:hover img {
    box-shadow: 0 0 0 1px var(--v2-accent);
  }

  @media (prefers-reduced-motion: no-preference) {
    &:hover img {
      transform: translateY(-2px);
    }
  }
`;

/* Two lines at most; the full text is on Instagram. */
const Caption = styled.span`
  display: -webkit-box;
  overflow: hidden;
  color: var(--v2-text-muted);
  font-size: 14px;
  line-height: 1.5;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
`;
