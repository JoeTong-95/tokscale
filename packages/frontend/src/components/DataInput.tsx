"use client";

import { useCallback, useId, useState } from "react";
import styled, { keyframes } from "styled-components";
import type { TokenContributionData } from "@/lib/types";
import { isValidContributionData } from "@/lib/utils";
import { SecondaryButton } from "@/components/leaderboard/RankingUI";

interface DataInputProps {
  onDataLoaded: (data: TokenContributionData) => void;
}

export function DataInput({ onDataLoaded }: DataInputProps) {
  const [rawJson, setRawJson] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const titleId = useId();
  const textareaId = useId();
  const tipId = useId();
  const errorId = useId();
  const stepsId = useId();

  const parseJson = useCallback(() => {
    setError(null);

    if (!rawJson.trim()) {
      setError("Please enter JSON data");
      return;
    }

    try {
      const parsed = JSON.parse(rawJson);

      if (!isValidContributionData(parsed)) {
        setError("Invalid data format. Expected TokenContributionData structure with meta, summary, years, and contributions.");
        return;
      }

      onDataLoaded(parsed);
    } catch (err) {
      setError(`Invalid JSON: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }, [rawJson, onDataLoaded]);

  const loadSampleData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/sample-data.json");
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      if (!isValidContributionData(data)) throw new Error("Sample data has invalid format");

      setRawJson(JSON.stringify(data, null, 2));
      onDataLoaded(data);
    } catch (err) {
      setError(`Failed to load sample data: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  }, [onDataLoaded]);

  return (
    <Layout>
      <InputCard aria-labelledby={titleId}>
        <CardHeader>
          <CardTitle id={titleId}>Load token usage data</CardTitle>
          <CardLead>
            Paste JSON from <InlineCode>tokscale graph</InlineCode>, or load sample data.
          </CardLead>
        </CardHeader>

        <CardBody>
          <FieldLabel htmlFor={textareaId}>Export JSON</FieldLabel>
          <Textarea
            id={textareaId}
            value={rawJson}
            onChange={(e) => {
              setRawJson(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault();
                parseJson();
              }
            }}
            placeholder='{"meta": {...}, "summary": {...}, "contributions": [...]}'
            spellCheck={false}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${tipId} ${errorId}` : tipId}
            $hasError={!!error}
          />
          <Tip id={tipId}>Tip: Press Ctrl+Enter (Cmd+Enter on Mac) to parse.</Tip>

          {error && (
            <ErrorBox id={errorId} role="alert">
              {error}
            </ErrorBox>
          )}

          <Actions>
            <PrimaryButton type="button" onClick={parseJson} disabled={isLoading || !rawJson.trim()}>
              Parse JSON
            </PrimaryButton>

            <SecondaryButton type="button" onClick={loadSampleData} disabled={isLoading}>
              {isLoading ? (
                <LoadingWrapper>
                  <SpinnerSvg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <SpinnerCircle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <SpinnerPath fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </SpinnerSvg>
                  Loading...
                </LoadingWrapper>
              ) : (
                "Load sample data"
              )}
            </SecondaryButton>
          </Actions>
        </CardBody>
      </InputCard>

      <Steps aria-labelledby={stepsId}>
        <StepsTitle id={stepsId}>How to get your data</StepsTitle>
        <StepList>
          <li>
            Install tokscale
            <Command>bunx tokscale</Command>
          </li>
          <li>
            Run the graph command
            <Command>tokscale graph</Command>
          </li>
          <li>Copy the JSON output and paste it into the box.</li>
        </StepList>
      </Steps>
    </Layout>
  );
}

const Layout = styled.div`
  display: grid;
  max-width: 1120px;
  grid-template-columns: minmax(0, 1fr) minmax(240px, 320px);
  align-items: start;
  gap: 16px;

  @media (max-width: 900px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const InputCard = styled.section`
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--service-border);
  border-radius: 12px;
  background: var(--service-surface);
`;

const CardHeader = styled.header`
  padding: 16px 20px;
  border-bottom: 1px solid var(--service-border);

  @media (max-width: 520px) {
    padding: 14px 16px;
  }
`;

const CardTitle = styled.h2`
  margin: 0;
  color: var(--service-text);
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: -0.01em;
`;

const CardLead = styled.p`
  margin: 4px 0 0;
  color: var(--service-text-muted);
  font-size: 0.875rem;
  line-height: 1.5;
`;

const InlineCode = styled.code`
  padding: 1px 6px;
  border: 1px solid var(--service-border);
  border-radius: 4px;
  background: var(--service-surface-muted);
  color: var(--service-text);
  font-size: 0.8125rem;
  white-space: nowrap;
`;

const CardBody = styled.div`
  display: grid;
  gap: 8px;
  padding: 16px 20px 20px;

  @media (max-width: 520px) {
    padding: 14px 16px 16px;
  }
`;

const FieldLabel = styled.label`
  color: var(--service-text);
  font-size: 0.8125rem;
  font-weight: 500;
`;

const Textarea = styled.textarea<{ $hasError?: boolean }>`
  width: 100%;
  min-height: 240px;
  height: 18rem;
  padding: 12px;
  border: 1px solid ${({ $hasError }) => ($hasError ? "rgba(248, 81, 73, 0.7)" : "var(--service-border-strong)")};
  border-radius: 8px;
  background: var(--service-canvas);
  color: var(--service-text);
  font-family: var(--v2-font-mono);
  font-size: 0.8125rem;
  line-height: 1.55;
  resize: vertical;

  &::placeholder {
    color: var(--v2-text-subtle);
  }

  &:hover {
    border-color: ${({ $hasError }) => ($hasError ? "rgba(248, 81, 73, 0.85)" : "rgba(255, 255, 255, 0.3)")};
  }

  &:focus-visible {
    border-color: ${({ $hasError }) => ($hasError ? "rgba(248, 81, 73, 0.9)" : "var(--service-focus)")};
    outline: 2px solid ${({ $hasError }) => ($hasError ? "rgba(248, 81, 73, 0.9)" : "var(--service-focus)")};
    outline-offset: -1px;
  }

  @media (max-width: 640px) {
    height: 14rem;
    font-size: 0.875rem;
  }
`;

const Tip = styled.p`
  margin: 0;
  color: var(--service-text-muted);
  font-size: 0.8125rem;
`;

const ErrorBox = styled.p`
  margin: 4px 0 0;
  padding: 10px 12px;
  border: 1px solid rgba(248, 81, 73, 0.4);
  border-radius: 8px;
  background: rgba(248, 81, 73, 0.08);
  color: #ff8c85;
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.5;
  overflow-wrap: anywhere;
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
`;

/* Filled v2 action. White on --v2-accent-strong is 5.2:1. */
const PrimaryButton = styled.button`
  display: inline-flex;
  min-height: 36px;
  align-items: center;
  justify-content: center;
  padding: 0 14px;
  border: 1px solid var(--v2-accent-strong);
  border-radius: 8px;
  background: var(--v2-accent-strong);
  color: #fff;
  font-size: 0.875rem;
  font-weight: 600;
  white-space: nowrap;
  transition:
    background-color 120ms ease,
    border-color 120ms ease;

  &:hover:not(:disabled) {
    border-color: var(--v2-accent);
    background: var(--v2-accent);
  }

  &:focus-visible {
    outline: 2px solid var(--service-focus);
    outline-offset: 2px;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  @media (max-width: 640px) {
    min-height: 44px;
    font-size: 1rem;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const LoadingWrapper = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
`;

const SpinnerSvg = styled.svg`
  width: 1rem;
  height: 1rem;
  animation: ${spin} 1s linear infinite;

  @media (prefers-reduced-motion: reduce) {
    animation-duration: 3s;
  }
`;

const SpinnerCircle = styled.circle`
  opacity: 0.25;
`;

const SpinnerPath = styled.path`
  opacity: 0.75;
`;

const Steps = styled.section`
  min-width: 0;
  padding: 16px 20px 20px;
  border: 1px solid var(--service-border);
  border-radius: 12px;

  @media (max-width: 520px) {
    padding: 14px 16px 16px;
  }
`;

const StepsTitle = styled.h2`
  margin: 0 0 12px;
  color: var(--service-text);
  font-size: 0.9375rem;
  font-weight: 600;
`;

const StepList = styled.ol`
  display: grid;
  gap: 14px;
  margin: 0;
  padding: 0;
  counter-reset: local-step;
  list-style: none;

  li {
    position: relative;
    display: grid;
    gap: 6px;
    min-width: 0;
    padding-left: 30px;
    color: var(--service-text-muted);
    font-size: 0.875rem;
    line-height: 1.5;
    counter-increment: local-step;
  }

  li::before {
    position: absolute;
    top: 1px;
    left: 0;
    display: inline-grid;
    width: 20px;
    height: 20px;
    place-items: center;
    border: 1px solid var(--service-border-strong);
    border-radius: 999px;
    color: var(--service-text);
    content: counter(local-step);
    font-size: 0.6875rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
`;

const Command = styled.code`
  display: block;
  width: fit-content;
  max-width: 100%;
  overflow-x: auto;
  padding: 6px 10px;
  border: 1px solid var(--service-border);
  border-radius: 6px;
  background: var(--service-surface-muted);
  color: var(--service-text);
  font-size: 0.8125rem;
  white-space: nowrap;
`;
