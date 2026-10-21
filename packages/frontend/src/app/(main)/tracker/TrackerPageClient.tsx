"use client";

import Link from "next/link";
import styled from "styled-components";
import { PublicFooter } from "@/components/layout/PublicFooter";
import type { SupportedAgent } from "@/components/home/agents";
import { CopyCommand } from "@/components/home/CopyCommand";
import {
  Arrow,
  Container,
  DisplayTitle,
  Eyebrow,
  focusRing,
  Lead,
  PageShell,
  PrimaryButton,
  Section,
  SectionHeader,
  SectionTitle,
  TextLink,
} from "@/components/home/primitives";
import { AgentsGrid } from "./AgentsGrid";
import { EmbedShowcase } from "./EmbedShowcase";
import { TuiShowcase } from "./TuiShowcase";

const GITHUB_URL = "https://github.com/junhoyeo/tokscale";

export interface TrackerFaq {
  question: string;
  answer: string;
}

export const TRACKER_FAQ: TrackerFaq[] = [
  {
    question: "Do I need an account to use Tokscale?",
    answer:
      "No. The terminal UI runs on your machine and reads local files. You only sign in with GitHub when you want to submit usage to a public profile.",
  },
  {
    question: "Does Tokscale read my prompts or code?",
    answer:
      "It reads your agents' local session files to count tokens, but it never sends prompts, responses, code, file names, or API keys. Run tokscale submit --dry-run to see exactly what a submission contains.",
  },
  {
    question: "How is cost estimated?",
    answer:
      "Tokscale multiplies token counts by public list prices from LiteLLM, with OpenRouter as a fallback. It is an estimate. Subscriptions, discounts, and free tiers are not reflected.",
  },
  {
    question: "Can I keep my profile up to date automatically?",
    answer:
      "Yes. tokscale autosubmit enable schedules the normal submit with your operating system scheduler, every 24 hours by default. Pass --interval to change it, and tokscale autosubmit disable to remove it.",
  },
  {
    question: "How do I remove my data?",
    answer:
      "Open Settings on tokscale.ai. You can delete your submitted data and keep the account, or delete the account and everything linked to it. Both take effect immediately.",
  },
];

export function TrackerPageClient({ agents }: { agents: SupportedAgent[] }) {
  return (
    <PageShell>
      <main>
        <Hero aria-labelledby="tracker-title">
          <Container>
            <HeroCopy>
              <Eyebrow>Tracker</Eyebrow>
              <DisplayTitle id="tracker-title">
                Track your AI usage <Line>from the terminal.</Line>
              </DisplayTitle>
              <HeroLead>
                Tokscale reads the session logs your coding agents already keep and shows tokens, models, and
                estimated cost on your machine. Submit when you want a public profile.
              </HeroLead>
              <CopyCommand command="bunx tokscale@latest" label="Copy the command to run Tokscale" />
              <HeroLinks>
                <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
                  Read the docs on GitHub <span aria-hidden="true">↗</span>
                </a>
                <Link href="/local">Open the local viewer</Link>
              </HeroLinks>
            </HeroCopy>
          </Container>
        </Hero>

        <Section aria-labelledby="tracker-steps-title" style={{ paddingTop: 40 }}>
          <Container>
            <VisuallyHiddenTitle id="tracker-steps-title">How it works</VisuallyHiddenTitle>
            <Steps>
              <li>
                <StepNumber>1</StepNumber>
                <StepTitle>Run it locally</StepTitle>
                <StepBody>
                  Opens a terminal dashboard of your usage across agents, models, days, and sessions. Your usage data
                  stays on your machine.
                </StepBody>
                <Commands>
                  <code>bunx tokscale@latest</code>
                </Commands>
              </li>
              <li>
                <StepNumber>2</StepNumber>
                <StepTitle>Submit your usage</StepTitle>
                <StepBody>
                  Sign in with GitHub once, then submit. Or let your scheduler submit every 24 hours. Add{" "}
                  <InlineCode>--dry-run</InlineCode> to preview the payload first.
                </StepBody>
                <Commands>
                  <code>tokscale login</code>
                  <code>tokscale submit</code>
                  <code>tokscale autosubmit enable</code>
                </Commands>
              </li>
              <li>
                <StepNumber>3</StepNumber>
                <StepTitle>Share it</StepTitle>
                <StepBody>
                  Your public profile lives at <Nowrap>tokscale.ai/u/your-username</Nowrap>. Add a card to your
                  README, or join a group to compare with your team or friends.
                </StepBody>
                <StepLinks>
                  <TextLink href="/leaderboard">
                    Leaderboards <Arrow />
                  </TextLink>
                  <TextLink href="/leaderboard?view=groups">
                    Groups <Arrow />
                  </TextLink>
                </StepLinks>
              </li>
            </Steps>
          </Container>
        </Section>

        <Section aria-labelledby="tracker-tui-title">
          <Container>
            <Header>
              <Eyebrow>Terminal UI</Eyebrow>
              <SectionTitle id="tracker-tui-title">Your usage, in your terminal.</SectionTitle>
              <Lead>Six of its views. In the app, switch views with the arrow keys or Tab.</Lead>
            </Header>
            <TuiShowcase />
          </Container>
        </Section>

        <Section aria-labelledby="tracker-agents-title">
          <Container>
            <Header>
              <Eyebrow>Supported agents</Eyebrow>
              <SectionTitle id="tracker-agents-title">Works with the agents you already use.</SectionTitle>
              <Lead>
                Tokscale reads local logs from {agents.length} coding agents and AI clients.
              </Lead>
            </Header>
            <AgentsGrid agents={agents} />
          </Container>
        </Section>

        <Section aria-labelledby="tracker-embed-title">
          <Container>
            <Header>
              <Eyebrow>README embed</Eyebrow>
              <SectionTitle id="tracker-embed-title">Put your usage in your README.</SectionTitle>
              <Lead>
                Pick one of eight cards. Each card renders from your latest submitted data. More options, like theme
                and period, are in the Embed dialog on your profile.
              </Lead>
            </Header>
            <EmbedShowcase />
          </Container>
        </Section>

        <Section aria-labelledby="tracker-data-title">
          <Container>
            <Header>
              <Eyebrow>Your data</Eyebrow>
              <SectionTitle id="tracker-data-title">Counts leave your machine. Content does not.</SectionTitle>
            </Header>
            <DataGrid>
              <DataColumn>
                <h3>What tokscale submit sends</h3>
                <ul>
                  <li>Daily token counts per client and model: input, output, cache, and reasoning</li>
                  <li>Estimated cost, from public list prices</li>
                  <li>Message counts and session timing, never message content</li>
                  <li>The names of MCP servers configured in your clients</li>
                  <li>Your CLI version and a device label</li>
                </ul>
              </DataColumn>
              <DataColumn>
                <h3>What it never sends</h3>
                <ul>
                  <li>Prompts, responses, or any conversation content</li>
                  <li>Source code, file contents, or file names</li>
                  <li>API keys or provider credentials</li>
                </ul>
              </DataColumn>
              <DataColumn>
                <h3>Your controls</h3>
                <ul>
                  <li>
                    Inspect an export in your browser with the <Link href="/local">local viewer</Link>. Nothing is
                    uploaded.
                  </li>
                  <li>
                    Delete submitted data or your whole account in <Link href="/settings">Settings</Link>.
                  </li>
                  <li>
                    MIT licensed.{" "}
                    <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
                      Read the source
                    </a>{" "}
                    or self-host with Docker Compose.
                  </li>
                </ul>
              </DataColumn>
            </DataGrid>
            <DataNote>
              Full details are in the <Link href="/privacy">privacy policy</Link>.
            </DataNote>
          </Container>
        </Section>

        <Section aria-labelledby="tracker-faq-title">
          <Container>
            <FaqLayout>
              <Header>
                <Eyebrow>FAQ</Eyebrow>
                <SectionTitle id="tracker-faq-title">Questions</SectionTitle>
              </Header>
              <Faq>
                {TRACKER_FAQ.map((item) => (
                  <details key={item.question}>
                    <summary>{item.question}</summary>
                    <p>{item.answer}</p>
                  </details>
                ))}
              </Faq>
            </FaqLayout>
          </Container>
        </Section>

        <Closing aria-labelledby="tracker-closing-title">
          <Container>
            <ClosingInner>
              <SectionTitle id="tracker-closing-title">Start with one command.</SectionTitle>
              <Lead>No account needed to look at your own usage.</Lead>
              <CopyCommand command="bunx tokscale@latest" label="Copy the command to run Tokscale" />
              <PrimaryButton href="/leaderboard">See who else is building</PrimaryButton>
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
  padding: 128px 0 40px;
  /* The same faint blue glow as the home hero. */
  background: var(--v2-glow);

  @media (max-width: 720px) {
    padding: 112px 0 32px;
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
  max-width: 36rem;
  font-size: 18px;

  @media (max-width: 520px) {
    font-size: 16px;
  }
`;

const HeroLinks = styled.p`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px 24px;
  margin: 0;

  a {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 32px;
    border-radius: 4px;
    color: var(--v2-text-muted);
    font-size: 14px;
    text-decoration: underline;
    text-decoration-color: var(--v2-rule-strong);
    text-underline-offset: 3px;
    ${focusRing}
  }

  a:hover {
    color: var(--v2-text);
  }
`;

const VisuallyHiddenTitle = styled.h2`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
`;

const Header = styled(SectionHeader)`
  margin-bottom: 40px;
`;

const Steps = styled.ol`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: 0;
  padding: 0;
  border: 1px solid var(--v2-rule-strong);
  border-radius: 12px;
  background: var(--v2-surface);
  list-style: none;

  > li {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
    padding: 28px 24px;
  }

  > li + li {
    border-left: 1px solid var(--v2-rule);
  }

  @media (max-width: 900px) {
    grid-template-columns: minmax(0, 1fr);

    > li + li {
      border-top: 1px solid var(--v2-rule);
      border-left: 0;
    }
  }

  @media (max-width: 520px) {
    > li {
      padding: 20px 16px;
    }
  }
`;

const StepNumber = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid var(--v2-rule-strong);
  border-radius: 999px;
  color: var(--v2-text-muted);
  font-size: 13px;
  font-weight: 600;
`;

const StepTitle = styled.h3`
  margin: 0;
  color: var(--v2-text);
  font-family: var(--v2-font-display);
  font-size: 28px;
  font-weight: 400;
  line-height: 1.15;
`;

const StepBody = styled.p`
  margin: 0;
  color: var(--v2-text-muted);
  font-size: 15px;
  line-height: 1.6;
`;

const Nowrap = styled.span`
  color: var(--v2-text);
  white-space: nowrap;
`;

const InlineCode = styled.code`
  padding: 1px 6px;
  white-space: nowrap;
  border: 1px solid var(--v2-rule);
  border-radius: 4px;
  color: var(--v2-text);
  font-size: 13px;
`;

const Commands = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: auto;
  padding-top: 8px;

  code {
    display: block;
    overflow-x: auto;
    padding: 8px 12px;
    border: 1px solid var(--v2-rule);
    border-radius: 6px;
    background: #000;
    color: var(--v2-text);
    font-size: 13px;
    white-space: nowrap;
  }
`;

const StepLinks = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
  margin-top: auto;
  padding-top: 8px;
`;

const DataGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-top: 1px solid var(--v2-rule-strong);

  @media (max-width: 900px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const DataColumn = styled.section`
  padding: 24px 24px 8px 0;

  & + & {
    padding-left: 24px;
    border-left: 1px solid var(--v2-rule);
  }

  h3 {
    margin: 0 0 12px;
    color: var(--v2-text);
    font-size: 16px;
    font-weight: 600;
  }

  ul {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin: 0;
    padding: 0 0 0 18px;
    color: var(--v2-text-muted);
    font-size: 15px;
    line-height: 1.55;
    list-style: disc;
  }

  li::marker {
    color: var(--v2-text-subtle);
  }

  a {
    border-radius: 3px;
    color: var(--v2-text);
    text-decoration: underline;
    text-decoration-color: var(--v2-rule-strong);
    text-underline-offset: 3px;
    ${focusRing}
  }

  @media (max-width: 900px) {
    padding: 20px 0 8px;

    & + & {
      padding-left: 0;
      border-top: 1px solid var(--v2-rule);
      border-left: 0;
    }
  }
`;

const DataNote = styled.p`
  margin: 24px 0 0;
  color: var(--v2-text-subtle);
  font-size: 14px;

  a {
    color: var(--v2-text-muted);
    text-decoration: underline;
    text-underline-offset: 3px;
  }
`;

const FaqLayout = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 4fr) minmax(0, 8fr);
  gap: 40px;

  @media (max-width: 900px) {
    grid-template-columns: minmax(0, 1fr);
    gap: 0;
  }
`;

const Faq = styled.div`
  border-top: 1px solid var(--v2-rule-strong);

  details {
    border-bottom: 1px solid var(--v2-rule);
  }

  summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    min-height: 56px;
    padding: 12px 0;
    color: var(--v2-text);
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    list-style: none;
  }

  summary::-webkit-details-marker {
    display: none;
  }

  summary::after {
    flex-shrink: 0;
    color: var(--v2-text-subtle);
    font-size: 20px;
    font-weight: 300;
    content: "+";
  }

  details[open] summary::after {
    content: "−";
  }

  summary:focus-visible {
    outline: 2px solid var(--v2-focus);
    outline-offset: 2px;
  }

  p {
    max-width: 44rem;
    margin: 0;
    padding: 0 0 20px;
    color: var(--v2-text-muted);
    font-size: 15px;
    line-height: 1.6;
  }
`;

const Closing = styled.section`
  margin-top: 120px;
  padding: 120px 0;
  border-top: 1px solid var(--v2-rule);

  @media (max-width: 720px) {
    margin-top: 80px;
    padding: 80px 0;
  }
`;

const ClosingInner = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  max-width: 640px;
  margin: 0 auto;
  text-align: center;
`;
