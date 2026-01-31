# Sumulige Claude
Universal agent harness for AI coding assistants (Claude Code, Codex CLI, Cursor, Windsurf, Antigravity, etc.).

[中文版本](README.zh.md)

## What this project solves
- Turns single-model CLIs into a **5‑agent team** with routing.
- Adds **dual-layer memory** plus automatic rolling/compaction.
- Ships a **workflow pipeline** (kickoff → agent → todo → TDD).
- Provides **guardrails + observability** with sliding‑window latency/hit‑rate, thresholds, and red/yellow/green status.
- Lets you **swap in real RAG/LLM providers** via `SMC_PROVIDER_MODULE` (timeout/retry/fallback-ready skeletons included).
- Comes with **hooks**, **skills marketplace**, and **quality gates** that work across platforms.

## Architecture at a glance
```
User command
   │
   ▼
Router (pattern match) → Conductor / Architect / Builder / Reviewer / Librarian
   │
   ▼
Runtime adapter (hints → retrieve/generate; timeout/retry/fallback; memory index preheat)
   │
   ▼
Observability & Guardrail (p50/p90/p99, p99_recent, hit_rate, dynamic threshold)
   │
   ▼
Post-task hook → autoroll (archive) → rolling index → next-session memory preload
```

## Quickstart
```bash
npm install -g sumulige-claude

# Scaffold project template (safe for existing projects)
smc template --safe

# Kick off a task + route to the right agent
smc agent "设计登录接口"

# Run the workflow pipeline
smc workflow kickoff "实现用户认证" --parse   # produce todos
/tdd --from-todo                              # in Claude Code
```

## Core commands (cheat sheet)
| Area | Command | Purpose |
|------|---------|---------|
| Init | `smc init` | Set up global config |
| Template | `smc template [--safe|--all]` | Deploy multi-platform scaffold |
| Sync | `smc sync` | Incremental sync of configs |
| Status | `smc status` | Show status + guardrail lights |
| Agents | `smc agent "任务"` | Auto-route to Architect/Builder/Reviewer... |
| Workflow | `smc workflow kickoff "任务" [--dry-run|--parse]` | Task analysis → todos |
| Platform | `smc platform:detect` / `platform:convert` / `platform:sync` | Multi-CLI support |
| Memory | `smc memory:compact` | Roll/compact `.claude/memory/current.md` |
| Guardrail | `smc guardrail:stats --json` / `smc guardrail:clear` | Sliding-window metrics |
| Autoroll | `npm run memory:autoroll` | Cron/CI-friendly autoroll helper |
| Provider | `SMC_PROVIDER_MODULE=... smc agent ...` | Plug custom RAG/LLM |

Slash commands (Claude Code): `/review`, `/test`, `/fix`, `/plan`, `/commit`, `/tdd`, `/todos`.

## Configuration highlights
- **Memory guardrails**: `config/memory-guardrails.json` (latency/hit-rate/cost thresholds + degrade actions).
- **Provider module**: set `SMC_PROVIDER_MODULE=lib/runtime/providers/examples/local-rag.js` (or your module). API signature in `lib/runtime/providers/skeleton.js`.
- **Autoroll hook**: `.claude/hooks/post-task/autoroll.sh` (enabled by default). Env: `SMC_AUTOROLL_DISABLE=1`, `SMC_AUTOROLL_DRYRUN=1`, `SMC_AUTOROLL_VERBOSE=1`.
- **Sampling**: `lib/memory-observability.js` default sample_rate=0.1; trace/span/parent_span carried through CLI output.
- **Dynamic thresholds**: `lib/memory-cost.js` `resolveLatencyThreshold` supports day/night windows + `dynamic_factor`.

## Memory & autoroll
- Dual-layer memory: `memory/YYYY-MM-DD.md` (rolling daily) + `memory/current.md` (persistent state).
- Preheat: context builder loads latest summaries from `rolling-store/index.json` (last 3 archives).
- Autoroll: `scripts/autoroll.mjs` archives conversations + writes index summaries; hook runs post-task.

## Observability & guardrails
- Metrics collected with request_id / trace_id / span_id / parent_span_id and sample_rate.
- `smc guardrail:stats --json` exposes p50/p90/p99, `p99_recent` (TTL default 86400s), hit_rate_recent, threshold, over-threshold counts/timestamps, window info.
- `smc status` shows red/yellow/green lights for p99 vs threshold and hit-rate.
- CLI single-line “Metrics Summary”: `traceId | sample_rate | p99_recent/threshold`.
- Degrade path wired via `shouldDegrade` and runtime fallbacks (cache-only or downgraded model).

## Provider integration (real RAG/LLM)
- Skeleton: `lib/runtime/providers/skeleton.js` (timeout, retry, circuit-breaker hooks).
- Local example: `lib/runtime/providers/examples/local-rag.js`.
- Runtime applies hints: rerank depth, search depth, cache usage, max_hops.
- Pass provider path via env: `SMC_PROVIDER_MODULE=...`.

## Workflow pipeline
```
kickoff → agent → todo → /tdd
```
- `kickoff`: generates structured analysis; `--parse` writes todos.
- `agent`: routes to 5-agent stack; can `--create-todo` or `--dry-run`.
- `/tdd`: guided test-driven loop in Claude Code.

## Project layout (after `smc template`)
```
.claude/          # Claude config, hooks, commands, skills, memory
.codex/           # Codex config (if --all)
AGENTS.md         # Codex instructions
CLAUDE.md         # Project-level instructions
config/           # guardrails, platform defaults
lib/              # runtime, agents, memory, guardrails, providers
scripts/          # autoroll, benchmarks
docs/production-checklist.md
```

## Development & testing
```bash
npm install
npm test          # jest suite
npm run memory:autoroll -- --dryrun   # safe check
```

## Production checklist
See `docs/production-checklist.md` for monitoring, thresholds, provider wiring, logging, and rollout steps.

## Troubleshooting
- **Command not found**: `export PATH="$PATH:$(npm bin -g)"`.
- **Platform not detected**: ensure `.claude/settings.json` or `.codex/config.toml` exists.
- **Memory too large**: `smc memory:compact` or enable autoroll (default on).

## Contributing
PRs welcome. Please run `npm test` before submitting.

## License
MIT © sumulige
