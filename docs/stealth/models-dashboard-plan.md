# Models dashboard with benchmarks: plan

Stealth prototype, local only. Written 2026-10-21. Source data was checked on that date; evidence is in
`/tmp/tokscale-stealth/bench-research/` (raw downloads and coverage scripts).

## 1. What the dashboard must answer

1. Which models do builders use right now? (Tokscale usage: active users, change, adoption.)
2. Which models score best on the work I care about: agentic coding, web development, reasoning?
3. Which agent and model pairs do well, and which pairs do people actually use?
4. What does a model cost at real agent usage, not at a made-up input/output mix?
5. How fast is a new model adopted after release?

Rules carried over from the explore pages:

- No Tokscale composite score. Each benchmark stays in its own column with its own source.
- Every score shows its source, its date, and its run conditions (reasoning effort, agent or harness).
- A missing score is shown as "not evaluated", never as zero.
- Usage and benchmarks are shown side by side. We do not claim one causes the other.

## 2. Data sources (checked 2026-10-21)

| Source | What it gives | Access | License / terms | Freshness | Match with our models | Role |
|---|---|---|---|---|---|---|
| Tokscale submissions | Active users, tokens, token mix (input, output, cache read, cache write, reasoning), agent per model | Own DB | Own data | Live (10 min cache) | 100% | Core |
| [models.dev](https://models.dev/api.json) | Catalog: provider and lab, release date, knowledge cutoff, context and output limits, modalities, reasoning, tool use, open weights, prices including cache read/write | Public JSON (5.9 MB, 232 providers) | MIT (github sst/models.dev) | Pushed 2026-10-20 | 124 of 149 models; 92.8% of model-user pairs; 99.8% of tokens (30d, local seed) | Specs and prices |
| [Epoch AI benchmarking hub](https://epoch.ai/data/benchmark_data.zip) | 90 CSVs: Epoch Capabilities Index (ECI), GPQA Diamond, FrontierMath, SimpleQA Verified, SWE-bench Verified, plus collected external results (Terminal-Bench, CursorBench, DeepSWE, FrontierSWE, WebDev Arena, METR time horizon, HLE, ARC-AGI-2, APEX-Agents, GDPval, SciCode, and more). Also `model_metadata.csv` and `benchmark_metadata.csv` (scale, random baseline, ceiling, superseded-by) | Public zip (2.4 MB) | CC BY 4.0 (README in the zip); credit Epoch AI and the original benchmark | Rows through 2026-10-17 | Model metadata: 96 of 149 models, 86.6% of model-user pairs, 99.2% of tokens. ECI: 14 of our top 15 models | Capability core |
| [LMArena leaderboard dataset](https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset) | 24 boards: text, webdev (+ react, html), agent (+ bash reliability, recovery steps, steerability, tool hallucination, task outcome), search, vision, and more. Score with 95% CI, vote or session count, rank, publish date | Hugging Face parquet | CC BY 4.0 | Published 2026-10-19 | Names carry effort, e.g. "Claude Opus 5.5 (Max)"; top models present | Human preference, agent arena |
| [Terminal-Bench 4.0](https://www.tbench.ai/leaderboard) | Agent x model accuracy, tokens, cost, run date (35 rows). Agents: Claude Code, Codex, Grok Build, Muse Code, mini-SWE-agent | Leaderboard page embeds JSON | Harness code Apache-2.0; site data terms not stated. Ask before public use | Latest run 2026-09-29 | 23 models incl. Opus 5.5, GPT-6.1 Sol, GPT-6 Astra, Sonnet 5.5 | Agentic coding, agent x model |
| [Artificial Analysis free API](https://artificialanalysis.ai/documentation) | Intelligence, coding and math indexes, evals, prices, output tokens per second, time to first token | API key, 1,000 requests per day, server-side cache required | Attribution required; Terms of Use and Data Platform Terms | Not checked (needs key) | Not checked | Speed (only source). Phase 2 |
| [OpenRouter models API](https://openrouter.ai/api/v1/models) | 468 models, prices, context; Artificial Analysis indexes for 304 models | Public JSON | API terms; the indexes are Artificial Analysis data | Live | Not measured | Cross-check only |
| [SWE-bench leaderboards](https://raw.githubusercontent.com/SWE-bench/swe-bench.github.io/master/data/leaderboards.json) | Verified (180), Lite, Multimodal, Multilingual boards | GitHub raw | License not stated | Newest entry 2026-02-26 | Mostly older models | History only |
| Aider polyglot, LiveBench | Coding and general boards | GitHub YAML, Hugging Face | Open | Last updates 2025-10 and 2025-04 | Stale | Skip |

## 3. Findings that shape the design

1. **Coverage is good.** Catalog and capability data exist for the models that carry about 99% of tokens. The gaps are internal or
   unlisted models (`codex-auto-review`, `gpt-reserve`) and short ids (`k3`).
2. **SWE-bench Verified is stale.** The newest official entry is from February 2026, and the newest models are not on it. It goes
   into a "history" group, not the main board.
3. **Benchmarks now exist per agent, not only per model.** Terminal-Bench 4.0 ranks agent x model pairs (for example Opus 5.5 in
   Claude Code at 64.85%). LMArena runs an agent arena. Tokscale knows which agent carries each model's tokens. Joining the two
   is something only Tokscale can show.
4. **Real agent usage is almost all cache reads.** In the local seed (built from 20 real public profiles), 95-98% of each top
   model's tokens are cache reads. At list prices that gives an effective price far below the usual 3:1 input/output blend:

   | Model | List $/1M in / out / cache read | Cache-read share | Effective $/1M at this mix | 3:1 blend |
   |---|---|---|---|---|
   | Claude Opus 5.5 | 4 / 20 / 0.2 | 98.2% | $0.32 | $8.00 |
   | GPT-6.1 Sol | 2 / 10 / 0.1 | 96.6% | $0.20 | $4.00 |
   | GPT-6 Astra | 10 / 50 / 1 | 97.1% | $1.38 | $20.00 |
   | Claude Sonnet 5.5 | 2 / 10 / 0.1 | 97.0% | $0.20 | $4.00 |

   This must be measured again on production data before we publish it. If it holds, "price at real agent usage" is a strong,
   unique column.
5. **Results depend on conditions.** The same model appears as "(Max)", "(High)", "_xhigh", or with different agents. Effort and
   agent are stored as conditions of a result, never as part of the model identity.
6. **Scales differ.** ECI is an index, arena scores are Elo-like ratings with confidence intervals, and agent benchmarks are
   pass rates. Each gets its own column and unit. ECI is labelled "Epoch Capabilities Index", not a Tokscale score.
7. **Interesting gaps appear.** For example, Gemini 4 Argon is #5 on ECI but has little Tokscale usage. The usage-vs-capability
   chart makes these gaps visible.

## 4. Pages

```
/models                   Models dashboard (new landing for Models)
/models/all               Full catalog (today's /models list; long tail paginated)
/models/[key]             Model page + Benchmarks, Pricing, Specs sections
/models/compare?m=a,b,c   Side-by-side comparison, shareable URL
/benchmarks               Index of tracked benchmarks by category
/benchmarks/[slug]        One benchmark: full results, conditions, sources
```

### /models dashboard

```
Models                                               [7d | 30d | All time]
What builders use, how models score, and what they cost.

[Usage] [Capability] [Agentic coding] [Web dev] [Price] [Specs]   <- column groups
┌──────────────────────────────────────────────────────────────────────────┐
│ #  Model            Active users  ECI    Terminal-Bench 4.0  WebDev   $/1M │
│ 1  [◎] Claude Opus 5.5   165 +87   168.8  64.9% Claude Code   1807   0.32 │
│ 2  [◎] GPT-6.1 Sol       141 +82   168.4  58.2% Codex         1800   0.20 │
│ ...  each cell: value, small condition tag (Max, xhigh), source on hover │
└──────────────────────────────────────────────────────────────────────────┘
Usage vs capability (scatter)       Price vs capability (frontier line)
Best in the agents people use (model x agent matrix: usage share + score)
Adoption after launch (days since release vs active users, last 8 releases)
New this week (releases, new results)        Sources and attribution
```

- Default rows: models with 5+ active users in the period, plus the top 20 by ECI (about 60 models on the seed).
- Column groups switch with chips; the URL keeps the state (`?cols=usage,coding`).
- Every score cell has a popover: benchmark, version, value with CI, effort, agent or harness, run date, source link.
- Mobile: one card per model with the selected column group, no sideways scrolling.

### /models/[key] additions

- **Benchmarks:** one row per tracked benchmark: score, rank among models we track, effort, agent or harness, date, source.
  Agent rows from Terminal-Bench sit next to this model's Tokscale agent share.
- **Pricing:** list prices per provider (models.dev); effective price at the community's token mix; effective price at this
  model's own mix.
- **Specs:** context, output limit, modalities, knowledge cutoff, open weights, release date.

### /benchmarks and /benchmarks/[slug]

- Index grouped by category, with what each benchmark measures, publisher, last update, number of models, and a "saturated" or
  "stale" note when it applies.
- Detail page: results table with conditions, a score-over-release-date chart, a Tokscale usage column, method notes, license and
  attribution.

### First benchmark set

| Category | Benchmark | Source |
|---|---|---|
| Overall | Epoch Capabilities Index | Epoch AI |
| Agentic coding | Terminal-Bench 4.0 | tbench.ai (terms to confirm) |
| Agentic coding | CursorBench, DeepSWE, FrontierSWE | Epoch AI (collected) |
| Web development | WebDev Arena | LMArena |
| Agents | Agent Arena | LMArena |
| Reasoning | GPQA Diamond, HLE, FrontierMath Tiers 1-3 v2 | Epoch AI |
| Knowledge | SimpleQA Verified | Epoch AI |
| History | SWE-bench Verified | Epoch AI, SWE-bench |
| Speed (phase 2) | Output tokens/s, time to first token | Artificial Analysis |

## 5. Data model

Phase 1 stores typed JSON snapshots in `src/content/benchmarks/`, validated with zod at load (the same pattern as Capital).
Database tables can come later.

- **Benchmark:** slug, name, category, publisher, URL, license, attribution text, unit, scale, higher-is-better, random baseline,
  ceiling, saturated, superseded-by, versions.
- **Result:** benchmark, version, source, external model id, mapped model key, effort, agent or harness, score, CI low and high,
  votes or sessions, cost, tokens, run date, published date, measured-by (`lab`, `independent`, later `tokscale`), source URL,
  retrieved-at.
- **Model spec** (from models.dev): model key, provider offerings (provider, id, input, output, cache read, cache write prices,
  context, output limit), release date, knowledge cutoff, modalities, reasoning, tool use, open weights.
- **Alias map:** (source, external id) -> model key, with method (`exact`, `normalized`, `manual`) and a reviewed flag.

Identity rules: the model key is the canonical Tokscale key. Effort and agent are conditions. Dated snapshots and host prefixes
fold into the key. External ids that do not map are listed in an "unmapped" report and are never guessed.

## 6. Pipeline

`scripts/benchmarks/sync.ts` (run by hand in the stealth branch; a scheduled job later):

1. Fetch models.dev JSON, the Epoch zip, LMArena parquet boards (webdev, agent, text), and the Terminal-Bench page JSON.
2. Normalize ids, map them to model keys, attach conditions.
3. Validate, then write JSON snapshots and a report: coverage by tokens and by users, unmapped ids, and changes since the last
   snapshot.
4. If one source fails, keep its last good snapshot and show that snapshot's date on the page.

Every page that shows a source shows its attribution line.

## 7. Delivery phases

| Phase | Ships | Done when |
|---|---|---|
| 1 (stealth) | Sync script and snapshots for models.dev, Epoch, LMArena, Terminal-Bench; `/models` dashboard (board, two charts); model page Benchmarks, Pricing and Specs; `/benchmarks` index and detail; `/models/all` | A visitor can go from the board to a model, see its scores with conditions and sources, and open the benchmark |
| 2 | Compare page; model x agent matrix; adoption-after-launch chart; speed from Artificial Analysis | A visitor can compare three models and see which agent each is strongest in |
| 3 | "Measured by Tokscale": our own runs of agent x model on a fixed task set (Terminal-Bench harness), with cost and time | Results are reproducible and published with logs |

## 8. Risks

- **Wrong model matches.** Mitigation: alias map with review flags and an unmapped report.
- **Stale benchmarks.** Mitigation: dates on every cell, stale and saturated notes.
- **Licensing.** Epoch and LMArena are CC BY 4.0, models.dev is MIT. Terminal-Bench site data and the Artificial Analysis terms
  must be confirmed before public launch.
- **Over-reading the numbers.** No composite score, no causal claims, coverage notes on every table.
- **Sample bias.** Tokscale users are self-selected. The local seed is a synthetic remix; all coverage numbers above must be
  measured again on production data.

## 9. Decisions for the owner

1. Should `/models` become the dashboard, with the full catalog at `/models/all`?
2. Is the first benchmark set right?
3. Should we create an Artificial Analysis account for speed data? The API key would be stored as a secret.
4. For Terminal-Bench: ask the maintainers for permission, or only link to their leaderboard?
5. Should "price at real agent usage" be public after we measure it on production?
6. Do we want our own evaluations later (phase 3)?
