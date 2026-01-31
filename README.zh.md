# Sumulige Claude （中文）
面向多款 AI 编码助手（Claude Code、Codex CLI、Cursor、Windsurf、Antigravity 等）的通用多 Agent 框架。

[English Version](README.md)

## 解决什么问题
- 把单一模型 CLI 变成**五人智能团队**，自动路由任务。
- 内建**双层记忆**与自动滚存，避免“健忘”和大文件爆炸。
- 提供**端到端工作流**（kickoff → agent → todo → TDD）。
- **观测与护栏**：滑窗延迟/命中率、动态阈值、红黄绿状态灯。
- 可通过 `SMC_PROVIDER_MODULE` **接入真实 RAG/LLM**（自带超时/重试/熔断骨架）。
- **Hooks、技能市场、质量门**跨平台可用。

## 架构速览
```
用户命令
   │
   ▼
路由器 → Conductor / Architect / Builder / Reviewer / Librarian
   │
   ▼
Runtime 适配层（hints→检索/生成；超时/重试/熔断/降级；记忆索引预热）
   │
   ▼
观测 & 护栏（p50/p90/p99、p99_recent、hit_rate、动态阈值）
   │
   ▼
任务结束 → post-task hook → autoroll 归档 → rolling index → 下次预热
```

## 快速开始
```bash
npm install -g sumulige-claude

# 安全初始化模板（不会覆盖自定义文件）
smc template --safe

# 直接让路由分发
smc agent "设计登录接口"

# 跑完整工作流
smc workflow kickoff "实现用户认证" --parse   # 生成并落地 todos
/tdd --from-todo                               # 在 Claude Code 内执行
```

## 常用命令速查
| 范围 | 命令 | 作用 |
|------|------|------|
| 初始化 | `smc init` | 初始化全局配置 |
| 模板 | `smc template [--safe|--all]` | 部署多平台模板 |
| 同步 | `smc sync` | 增量同步配置 |
| 状态 | `smc status` | 显示状态 + 护栏灯牌 |
| Agent | `smc agent "任务"` | 自动路由 Architect/Builder/Reviewer… |
| 工作流 | `smc workflow kickoff "任务" [--dry-run|--parse]` | 任务分析 → todos |
| 平台 | `smc platform:detect/convert/sync` | 多 CLI 支持 |
| 记忆 | `smc memory:compact` | 滚存/压缩 `.claude/memory/current.md` |
| 护栏 | `smc guardrail:stats --json` / `smc guardrail:clear` | 滑窗指标 |
| 归档 | `npm run memory:autoroll` | Cron/CI 友好的自动归档 |
| Provider | `SMC_PROVIDER_MODULE=... smc agent ...` | 注入自定义 RAG/LLM |

Claude Code 内置斜杠：`/review`、`/test`、`/fix`、`/plan`、`/commit`、`/tdd`、`/todos`。

## 配置要点
- **记忆护栏**：`config/memory-guardrails.json`（延迟/命中率/成本阈值 + 降级动作）。
- **Provider 模块**：`SMC_PROVIDER_MODULE=lib/runtime/providers/examples/local-rag.js`（或自定义）。接口见 `lib/runtime/providers/skeleton.js`。
- **自动归档 hook**：`.claude/hooks/post-task/autoroll.sh`（默认开启）。环境变量：`SMC_AUTOROLL_DISABLE=1`、`SMC_AUTOROLL_DRYRUN=1`、`SMC_AUTOROLL_VERBOSE=1`。
- **采样**：`lib/memory-observability.js` 默认 sample_rate=0.1，trace/span/parent_span 全链路透传。
- **动态阈值**：`lib/memory-cost.js` 的 `resolveLatencyThreshold` 支持昼/夜窗口和 `dynamic_factor`。

## 记忆与自动归档
- 双层记忆：`memory/YYYY-MM-DD.md`（每日滚动） + `memory/current.md`（持久状态）。
- 预热：上下文构建阶段加载 `rolling-store/index.json` 最近 3 条摘要。
- 归档：`scripts/autoroll.mjs` 负责归档并写入索引；post-task hook 自动触发。

## 观测 & 护栏
- 指标包含 request_id / trace_id / span_id / parent_span_id / sample_rate。
- `smc guardrail:stats --json` 提供 p50/p90/p99、`p99_recent`（默认 TTL 86400s）、`hit_rate_recent`、阈值、超阈计数/时间戳、窗口信息。
- `smc status` 用红/黄/绿灯提示 p99 与阈值、命中率。
- CLI 单行 “Metrics Summary”：`traceId | sample_rate | p99_recent/threshold`，便于贴日志。
- 降级：`shouldDegrade` + runtime fallback（cache-only 或降级模型）。

## Provider 接入（真实 RAG/LLM）
- 骨架：`lib/runtime/providers/skeleton.js`（超时、重试、熔断、签名）。
- 示例：`lib/runtime/providers/examples/local-rag.js`。
- Runtime 应用 hints（rerank 深度、检索深度、cache、max_hops），支持 fallback。
- 通过环境变量注入：`SMC_PROVIDER_MODULE=...`。

## 工作流
```
kickoff → agent → todo → /tdd
```
- `kickoff`: 生成结构化分析；`--parse` 写入 todos。
- `agent`: 路由五大角色，可 `--create-todo` 或 `--dry-run`。
- `/tdd`: 在 Claude Code 中的测试驱动循环。

## 目录结构（`smc template` 之后）
```
.claude/          # 设置、命令、技能、hooks、记忆
.codex/           # Codex 配置（若 --all）
AGENTS.md         # Codex 指令
CLAUDE.md         # 项目指令
config/           # 护栏与平台默认
lib/              # runtime、agents、memory、guardrails、providers
scripts/          # autoroll、benchmark
docs/production-checklist.md
```

## 开发与测试
```bash
npm install
npm test
npm run memory:autoroll -- --dryrun
```

## 生产落地检查
参见 `docs/production-checklist.md`（监控、阈值、Provider 接入、日志、灰度）。

## 常见问题
- **命令不可用**：`export PATH="$PATH:$(npm bin -g)"`。
- **平台未检测到**：确保存在 `.claude/settings.json` 或 `.codex/config.toml`。
- **记忆文件过大**：`smc memory:compact` 或保持 autoroll（默认开启）。

## 贡献
欢迎 PR，提交前请先跑 `npm test`。

## 许可证
MIT © sumulige
