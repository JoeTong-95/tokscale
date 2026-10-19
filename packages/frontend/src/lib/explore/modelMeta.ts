/**
 * Display metadata for models and agents on the explore surfaces.
 *
 * Lab attribution is by key prefix only. It never guesses: a key that does
 * not start with a known family prefix gets lab = null.
 */
import { SOURCE_DISPLAY_NAMES, SOURCE_LOGOS } from "@/lib/constants";
import { ownValue } from "@/lib/safeRecord";
import type { AgentRef, ModelRef } from "./types";

export interface Lab {
  name: string;
  slug: string;
}

export const LABS = {
  anthropic: { name: "Anthropic", slug: "anthropic" },
  openai: { name: "OpenAI", slug: "openai" },
  google: { name: "Google", slug: "google" },
  xai: { name: "xAI", slug: "xai" },
  moonshot: { name: "Moonshot AI", slug: "moonshot-ai" },
  alibaba: { name: "Alibaba", slug: "alibaba" },
  deepseek: { name: "DeepSeek", slug: "deepseek" },
  zai: { name: "Z.ai", slug: "zai" },
  mistral: { name: "Mistral", slug: "mistral" },
  minimax: { name: "MiniMax", slug: "minimax" },
} as const satisfies Record<string, Lab>;

/** Ordered: the first matching rule wins. Each pattern is anchored at the start of the key. */
const LAB_RULES: Array<[RegExp, Lab]> = [
  [/^claude(?:-|$)/, LABS.anthropic],
  [/^(?:gpt|chatgpt|codex)(?:-|$)/, LABS.openai],
  [/^o\d+(?:-|$)/, LABS.openai],
  [/^(?:gemini|gemma)/, LABS.google],
  [/^grok(?:-|$)/, LABS.xai],
  [/^kimi(?:-|$)/, LABS.moonshot],
  [/^qwen/, LABS.alibaba],
  [/^deepseek(?:-|$)/, LABS.deepseek],
  [/^glm(?:-|\d|$)/, LABS.zai],
  [/^(?:mistral|devstral|codestral)(?:-|$)/, LABS.mistral],
  [/^minimax(?:-|$)/, LABS.minimax],
];

/**
 * Agent products that prefix the model id they route to
 * ("antigravity-gemini-3.8-flash", "cursor-grok-4.6-xhigh"). Stripped only for
 * lab lookup; the key itself is never rewritten.
 */
const PRODUCT_PREFIXES = ["antigravity-", "cursor-"];

export function labForModel(key: string): Lab | null {
  const candidates = [key, ...PRODUCT_PREFIXES.filter((p) => key.startsWith(p)).map((p) => key.slice(p.length))];
  for (const candidate of candidates) {
    for (const [pattern, lab] of LAB_RULES) {
      if (pattern.test(candidate)) return lab;
    }
  }
  return null;
}

const BRAND_TOKENS: Record<string, string> = {
  claude: "Claude",
  gpt: "GPT",
  chatgpt: "ChatGPT",
  codex: "Codex",
  gemini: "Gemini",
  gemma: "Gemma",
  grok: "Grok",
  kimi: "Kimi",
  qwen: "Qwen",
  deepseek: "DeepSeek",
  glm: "GLM",
  mistral: "Mistral",
  devstral: "Devstral",
  codestral: "Codestral",
  minimax: "MiniMax",
};

const UPPER_TOKENS = new Set(["oss", "vl", "it", "mlx", "gguf", "bf16", "fp8", "nvfp4"]);

const WORD_TOKENS: Record<string, string> = { xhigh: "XHigh" };

/** Brands written with a hyphen before their version: "GPT-5.6", "GLM-5.3". */
const HYPHENATED_BRANDS = new Set(["gpt", "glm"]);

function prettifyToken(token: string): string {
  const brand = ownValue(BRAND_TOKENS, token);
  if (brand) return brand;
  // "qwen3.6" -> "Qwen3.6"
  const brandWithVersion = /^([a-z]+)(\d[\d.]*)$/.exec(token);
  if (brandWithVersion && ownValue(BRAND_TOKENS, brandWithVersion[1])) {
    return `${BRAND_TOKENS[brandWithVersion[1]]}${brandWithVersion[2]}`;
  }
  if (UPPER_TOKENS.has(token)) return token.toUpperCase();
  const word = ownValue(WORD_TOKENS, token);
  if (word) return word;
  // Parameter sizes: "20b" -> "20B", "a17b" -> "A17B", "128k" -> "128K".
  if (/^a?\d+(?:\.\d+)?[bkmt]$/.test(token)) return token.toUpperCase();
  // Version-like tokens: "k3" -> "K3", "v4" -> "V4", "m2.7" -> "M2.7".
  if (/^[a-z]\d[\d.]*[a-z]?$/.test(token)) return token.charAt(0).toUpperCase() + token.slice(1);
  if (/^\d/.test(token)) return token;
  return token.charAt(0).toUpperCase() + token.slice(1);
}

/**
 * Human display name for a canonical key: "claude-opus-4-5" -> "Claude Opus 4.5",
 * "gpt-5.6-sol" -> "GPT-5.6 Sol", "kimi-k3" -> "Kimi K3".
 */
export function modelDisplayName(key: string): string {
  // OpenAI o-series keeps its lowercase brand: "o3", "o4-mini".
  if (/^o\d+(?:-|$)/.test(key)) return key;
  const tokens = key.split("-").filter((t) => t.length > 0);
  if (tokens.length === 0) return key;

  // Claude splits versions across tokens ("opus-4-5"); join digit runs with ".".
  // Also when a product prefix comes first ("antigravity-claude-sonnet-4-6").
  const merged: string[] = [];
  const isClaude = tokens.includes("claude");
  for (const token of tokens) {
    const previous = merged[merged.length - 1];
    if (isClaude && previous !== undefined && /^\d+$/.test(token) && /^\d+(?:\.\d+)*$/.test(previous)) {
      merged[merged.length - 1] = `${previous}.${token}`;
    } else {
      merged.push(token);
    }
  }

  const words: string[] = [];
  for (let i = 0; i < merged.length; i++) {
    const token = merged[i];
    const next = merged[i + 1];
    if (i === 0 && HYPHENATED_BRANDS.has(token) && next !== undefined && /^\d/.test(next)) {
      words.push(`${prettifyToken(token)}-${next}`);
      i++;
      continue;
    }
    words.push(prettifyToken(token));
  }
  return words.join(" ");
}

export function modelRef(key: string): ModelRef {
  const lab = labForModel(key);
  return { key, name: modelDisplayName(key), lab: lab?.name ?? null, labSlug: lab?.slug ?? null };
}

/** Legacy client ids folded into their current id (mirrors the submit path). */
const LEGACY_CLIENT_ALIASES: Record<string, string> = { kilocode: "kilo" };

export function agentKey(client: string): string {
  return ownValue(LEGACY_CLIENT_ALIASES, client) ?? client;
}

export function agentRef(client: string): AgentRef {
  const key = agentKey(client);
  const names = SOURCE_DISPLAY_NAMES as Record<string, string>;
  const logos = SOURCE_LOGOS as Record<string, string>;
  return { key, name: ownValue(names, key) ?? key, logoUrl: ownValue(logos, key) ?? null };
}
