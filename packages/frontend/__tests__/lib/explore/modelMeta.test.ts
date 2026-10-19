import { describe, expect, it } from "vitest";
import { agentRef, labForModel, modelDisplayName, modelRef } from "@/lib/explore/modelMeta";

describe("labForModel", () => {
  it.each([
    ["claude-opus-5", "Anthropic", "anthropic"],
    ["gpt-5.6-sol", "OpenAI", "openai"],
    ["o3", "OpenAI", "openai"],
    ["o4-mini", "OpenAI", "openai"],
    ["codex-mini-latest", "OpenAI", "openai"],
    ["gemini-3-pro", "Google", "google"],
    ["grok-4.6", "xAI", "xai"],
    ["kimi-k3", "Moonshot AI", "moonshot-ai"],
    ["qwen3.6-max-preview", "Alibaba", "alibaba"],
    ["deepseek-v4-pro", "DeepSeek", "deepseek"],
    ["glm-5.3-flash", "Z.ai", "zai"],
    ["mistral-large-3", "Mistral", "mistral"],
    ["devstral-2", "Mistral", "mistral"],
    ["codestral-latest", "Mistral", "mistral"],
    ["minimax-m2.7", "MiniMax", "minimax"],
    ["antigravity-gemini-3.8-flash", "Google", "google"],
    ["cursor-grok-4.6-xhigh", "xAI", "xai"],
  ])("%s -> %s", (key, name, slug) => {
    expect(labForModel(key)).toEqual({ name, slug });
  });

  it.each(["k3", "big-pickle", "muse-spark-1.3", "unknown", "openclaw", "glamour-1", "grokky"])("does not guess a lab for %s", (key) => {
    expect(labForModel(key)).toBeNull();
  });
});

describe("modelDisplayName", () => {
  it.each([
    ["claude-opus-4-5", "Claude Opus 4.5"],
    ["claude-opus-5", "Claude Opus 5"],
    ["claude-fable-5-1", "Claude Fable 5.1"],
    ["claude-opus-4-5-thinking-high", "Claude Opus 4.5 Thinking High"],
    ["claude-3-5-sonnet", "Claude 3.5 Sonnet"],
    ["gpt-5.6-sol", "GPT-5.6 Sol"],
    ["gpt-5-codex", "GPT-5 Codex"],
    ["gpt-oss-20b", "GPT OSS 20B"],
    ["o4-mini", "o4-mini"],
    ["gemini-3-pro", "Gemini 3 Pro"],
    ["gemini-3.1-pro-preview", "Gemini 3.1 Pro Preview"],
    ["kimi-k3", "Kimi K3"],
    ["qwen-4-coder", "Qwen 4 Coder"],
    ["qwen3.6-max-preview", "Qwen3.6 Max Preview"],
    ["deepseek-v4-pro", "DeepSeek V4 Pro"],
    ["glm-5.3-flash", "GLM-5.3 Flash"],
    ["minimax-m2.7", "MiniMax M2.7"],
    ["grok-4.6", "Grok 4.6"],
    ["codex-mini-latest", "Codex Mini Latest"],
    ["big-pickle", "Big Pickle"],
    ["antigravity-claude-sonnet-4-6-thinking", "Antigravity Claude Sonnet 4.6 Thinking"],
    ["gpt-5.2-xhigh", "GPT-5.2 XHigh"],
  ])("%s -> %s", (key, name) => {
    expect(modelDisplayName(key)).toBe(name);
  });

  it("builds a full ModelRef", () => {
    expect(modelRef("claude-sonnet-5")).toEqual({ key: "claude-sonnet-5", name: "Claude Sonnet 5", lab: "Anthropic", labSlug: "anthropic" });
    expect(modelRef("k3")).toEqual({ key: "k3", name: "K3", lab: null, labSlug: null });
  });
});

describe("agentRef", () => {
  it("uses the shared client names and logos", () => {
    const claude = agentRef("claude");
    expect(claude.name).toBe("Claude Code");
    expect(claude.logoUrl).toMatch(/^https:\/\//);
  });

  it("folds legacy client aliases", () => {
    expect(agentRef("kilocode").key).toBe("kilo");
  });

  it("keeps unknown clients without guessing", () => {
    expect(agentRef("some-new-agent")).toEqual({ key: "some-new-agent", name: "some-new-agent", logoUrl: null });
    expect(agentRef("constructor")).toEqual({ key: "constructor", name: "constructor", logoUrl: null });
  });
});
