# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [1.12.2](https://github.com/sumulige/sumulige-claude/compare/v1.12.1...v1.12.2) (2026-02-03)

### Fixed
- todo-manager: 写入失败时输出简短错误并记录到 `.claude/agent-logs/todo-errors.log`，避免静默失败。
- smc status: 兼容新版 `development/todos/INDEX.md` 统计格式，减少状态脱节。

### [1.11.2](https://github.com/sumulige/sumulige-claude/compare/v1.11.1...v1.11.2) (2026-01-31)

### Features
- Guardrail & metrics: 滑窗 p99_recent/命中率、动态阈值、status 灯牌、CLI Metrics Summary。
- Memory 归档：post-task autoroll hook 默认启用，rolling-store/index.json 摘要透传检索。
- Runtime：可插拔 RAG/LLM Provider skeleton（超时/重试/熔断/降级），hints 作用到检索/缓存。

### Documentation
- README 英/中文重写，新增生产落地检查、观测与 provider 接入说明。
- 新增 docs/memory-guardrails.md、docs/metrics-tracing.md、docs/production-checklist.md。

### [1.11.1](https://github.com/sumulige/sumulige-claude/compare/v1.11.0...v1.11.1) (2026-01-28)


* bump version to 1.11.0 ([eb37b6d](https://github.com/sumulige/sumulige-claude/commits/eb37b6d4f5fd163c974a043a820eb3f347a4514a))


### Fixed

* **hooks:** support recursive scanning of nested todo directories ([eb1ea17](https://github.com/sumulige/sumulige-claude/commits/eb1ea17271c375ba3eccc71580ea10302d3c2bd2))
* update prepublish check for archived skills ([435224a](https://github.com/sumulige/sumulige-claude/commits/435224ade82d9f4ffba6b734feeca96976eadab2))

## [1.11.0](https://github.com/sumulige/sumulige-claude/compare/v1.10.2...v1.11.0) (2026-01-27)

### 🔧 Hook System Refactor

- **修复 hook-dispatcher**: 移除硬编码 registry，统一使用 `hook-registry.json`
- **删除 9 个弃用 hooks**: conversation-recorder, session-save, context-analyzer, session-restore, handoff-loader, strategic-compact, conversation-logger, priority-scorer, code-tracer
- **修复 settings.local.json**: 移除对已弃用 hooks 的引用

### 🧠 Memory System Migration

- **MEMORY.md → memory/current.md**: 新的双层记忆架构
  - `memory/current.md` - 持久状态（项目信息、用户偏好）
  - `memory/YYYY-MM-DD.md` - 日志（当日会话记录）
- **更新 15+ 文件引用**: handoffs, commands, thinking-routes, README 等

### 🧹 Skills Cleanup

- **归档 3 个重叠 skills** 到 `_archived/`:
  - `react-node-practices` (保留 `react-best-practices`)
  - `test-master`, `test-workflow` (保留 `rules/testing.md`)

### 📦 Template Sync

- **全量同步 template/** 到最新状态 (50+ 文件)
- **新增文件**: rules/, prompts/, commands/, hooks 等
- **修复 init.sh**: 创建 `memory/current.md` 而非 `MEMORY.md`

### 📝 Documentation

- **删除冗余**: 3 个 `CLAUDE-template.md` 副本
- **新增**: `prompts/project-paradigm.md` (协作范式说明)
- **更新**: `PROJECT_LOG.md` (完整构建历史)

### 统计

- **删除**: 4,682 行代码 (弃用 hooks + 重复 skills)
- **新增**: 2,389 行代码 (template sync + 新功能)
- **净减少**: ~2,300 行

---

## [1.10.2](https://github.com/sumulige/sumulige-claude/compare/v1.10.1...v1.10.2) (2026-01-27)

### Features

- **changelog-version-sync**: 新增 CHANGELOG 版本同步检查规则
  - 确保 package.json 版本在 CHANGELOG 中有对应记录
  - pre-commit 时自动检查，阻止未更新文档的发布
- **seo-optimization skill**: 新增 SEO 优化最佳实践 Skill
  - Git commit message 优化
  - README/文档 SEO
  - GitHub Release notes 优化
  - 技术 SEO (meta tags, Open Graph, 结构化数据)

---

## [1.10.1](https://github.com/sumulige/sumulige-claude/compare/v1.10.0...v1.10.1) (2026-01-27)

### 🧹 Cleanup

清理测试产物，减少包体积

- 删除 3 个测试 workflow 项目 (`development/projects/proj_*`)
- 删除 4 个空 Skills (`api-tester`, `code-reviewer-123`, `my-skill`, `test-skill-name`)
- 删除测试目录和 demo 文件
- **-7,604 行代码**，包文件数 524 → 508

---

## [1.10.0](https://github.com/sumulige/sumulige-claude/compare/v1.9.4...v1.10.0) (2026-01-27)

### ✨ New Platform Support

**8 → 10 AI CLIs** - 新增 Windsurf 和 Antigravity 支持

| 平台 | Vendor | 配置格式 | 指令文件 |
|------|--------|----------|----------|
| **Windsurf** 🏄 | Codeium | Markdown | `.windsurfrules` / `.windsurf/rules/rules.md` |
| **Antigravity** 🚀 | Google | JSON + MD | `.agent/rules/main.md` |

#### 新增文件

```
lib/platforms/
├── windsurf/index.js     # Codeium Windsurf IDE
└── antigravity/index.js  # Google Antigravity IDE
```

#### 支持的全部 10 个平台

Claude Code, Codex CLI, Cursor, Aider, Cline/Roo, OpenCode, Trae, Zed, **Windsurf**, **Antigravity**

---

## [1.9.2](https://github.com/sumulige/sumulige-claude/compare/v1.9.0...v1.9.2) (2026-01-27)

### 🏗️ Multi-Platform Architecture Refactoring

**插件式架构** - 添加新平台只需一个目录

```
lib/platforms/                    # 新架构
├── _base/
│   ├── adapter.js               # 基类 + static meta
│   ├── unified-instruction.js   # 统一指令格式
│   └── index.js                 # 自动发现注册表
├── claude/index.js              # 自包含适配器
├── codex/index.js
├── cursor/index.js
├── aider/index.js
├── cline/index.js
├── opencode/index.js
├── trae/index.js
└── zed/index.js
```

#### 核心变化

| 变化 | 说明 |
|------|------|
| **UnifiedInstruction** | 统一指令格式，N×M → 2N 转换方法 |
| **PlatformRegistry** | 自动发现注册，无需手动修改 index.js |
| **Static Metadata** | 平台元数据内聚到 adapter 类 |
| **向后兼容** | `lib/adapters/index.js` 重导出新架构 |

#### 删除的旧文件

| 目录 | 文件数 | 行数 |
|------|--------|------|
| `lib/adapters/*.js` | 9 个 | -898 行 |
| `lib/converters/` | 3 个 | -991 行 |

#### 收益

| 指标 | 重构前 | 重构后 |
|------|--------|--------|
| 添加新平台需改文件 | 4+ 个 | 1 个目录 |
| 转换方法数 | N×M (32+) | 2N (16) |
| 代码量 | ~1957 行 | ~1050 行 |

---

## [1.8.0](https://github.com/sumulige/sumulige-claude/compare/v1.7.2...v1.8.0) (2026-01-27)

### ✨ Features

- Add support for 6 new AI coding platforms (5cd8547b)

### 🐛 Bug Fixes

- 更换 npm 版本徽章为 shields.io (更快更新) (1a7a34e5)

### 📝 Documentation

- SEO 优化 - 添加 README 首段描述 (cf3424e3)

### 🧹 Chores

- bump version to v1.7.7 (315f947f)
- bump version to v1.7.6 (2624247d)

## [1.7.2](https://github.com/sumulige/sumulige-claude/compare/v1.7.0...v1.7.2) (2026-01-27)

### 🧠 Dual-Layer Memory System

**Clawdbot 风格双层记忆架构** - 临时笔记 + 长期记忆分离

```
.claude/
├── MEMORY.md              # Layer 2: 长期策展（偏好、约束、决策）
└── memory/
    └── YYYY-MM-DD.md      # Layer 1: 日期分片（14天滚动）
```

#### 核心特性

| 特性 | 说明 |
|------|------|
| **Pre-compaction Flush** | Context 压缩前主动保存重要信息 |
| **Daily Notes** | 日期分片的临时笔记，14天自动清理 |
| **Content-Aware Save** | 保存 insights 内容，而非仅元数据 |
| **Dual Loading** | 启动时加载 今日+昨日 + 长期记忆 |

#### 新增/修改文件

| 文件 | 变更 |
|------|------|
| `.claude/CLAUDE.md` | 添加 Context 管理规则章节 |
| `.claude/rules/performance.md` | 添加 PERF-006 Pre-compaction 规则 |
| `.claude/hooks/memory-loader.cjs` | 支持 daily + long-term 双层加载 |
| `.claude/hooks/memory-saver.cjs` | 支持日期文件写入 + insights 保存 |
| `.claude/memory/` | 新建目录 |

#### Session 输出示例

```
📂 Session: sumulige-claude v1.7.2
📝 Daily notes: 1 files (2026-01-27)
💾 Long-term: 8 entries
📋 TODOs: 5 active, 1 completed
```

### 📚 灵感来源

借鉴 [Clawdbot](https://github.com/peterthehan/clawdbot) 的记忆系统设计：
- 两层记忆分离（临时 vs 永久）
- Pre-compaction flush 策略
- 搜索 > 注入原则

---

## [1.7.0](https://github.com/sumulige/sumulige-claude/compare/v1.6.0...v1.7.0) (2026-01-26)

### 🤖 Agent Orchestration System

**5-Agent 智能编排系统** - 根据任务自动路由到最合适的 Agent

```
┌─────────────────────────────────────────────────────────────────┐
│                    smc agent "任务描述"                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────┐   ┌───────────┐   ┌───────────┐                  │
│  │ Conductor │   │ Architect │   │  Builder  │                  │
│  │  (Opus)   │   │  (Opus)   │   │ (Sonnet)  │                  │
│  │ 任务协调  │   │ 架构设计  │   │ 代码实现  │                  │
│  └───────────┘   └───────────┘   └───────────┘                  │
│  ┌───────────┐   ┌───────────┐                                  │
│  │ Reviewer  │   │ Librarian │                                  │
│  │  (Opus)   │   │  (Haiku)  │                                  │
│  │ 代码审查  │   │ 文档归档  │                                  │
│  └───────────┘   └───────────┘                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 新增文件

| 文件 | 用途 |
|------|------|
| `lib/agent-orchestrator/index.js` | 主入口 |
| `lib/agent-orchestrator/dispatcher.js` | 任务调度 |
| `lib/agent-orchestrator/router.js` | 智能路由 |
| `lib/agent-orchestrator/executor.js` | 执行控制 |
| `lib/agent-orchestrator/prompts.js` | Agent 提示词 |
| `lib/agent-orchestrator/todo-bridge.js` | Todo 集成 |
| `.claude/agent-registry.json` | Agent 注册表 |

### 🔄 Workflow Integration

**完整工作流串联**: kickoff → agent → todo → tdd

```bash
# 1. 启动任务分析
smc workflow kickoff "实现用户认证" --dry-run

# 2. Claude 分析后，解析创建 todos
smc workflow kickoff --parse

# 3. 开始 TDD 开发
/tdd --from-todo
```

#### 新增命令

| 命令 | 说明 |
|------|------|
| `smc workflow kickoff <task>` | 任务分析与规划 |
| `smc workflow kickoff --parse` | 从 Claude 输出创建 todos |
| `smc agent <task> --create-todo` | Agent 执行并创建 todo |

### 📋 Todo Bridge

**自动化任务管理** - 从 Agent 分析结果自动创建 Todo 文件

- `createTodosFromAnalysis()` - 批量创建任务
- `extractTasksFromInstruction()` - 从输出提取任务
- `parseConductorOutput()` - 解析 Conductor 输出
- 完成回调触发 Librarian 归档

### ⚡ Strategic Compact System

**智能上下文压缩** - 在 Context 耗尽前保留关键信息

| 组件 | 用途 |
|------|------|
| `priority-scorer.cjs` | 优先级评分算法 |
| `context-analyzer.cjs` | 上下文内容分析 |
| `strategic-compact.cjs` | 分级压缩引擎 |
| `handoff-loader.cjs` | Handoff 自动加载 |

压缩级别:
- Level 1 (70%): 去重
- Level 2 (85%): 摘要
- Level 3 (95%): 骨架

### 🔧 Improvements

- **Conductor Prompt 优化** - 简洁明了，输出可解析格式
- **Todo Manager 增强** - 完成检测、状态追踪、归档回调
- **Agent 命令增强** - 新增 `--create-todo`, `--verbose` 选项

---

## [1.6.0](https://github.com/sumulige/sumulige-claude/compare/v1.5.2...v1.6.0) (2026-01-24)

### 🌐 Multi-Platform Support

**OpenAI Codex CLI 兼容** - 一套配置，双平台支持

- Platform Adapters - 多 CLI 抽象层
- Config Converter - JSON ↔ TOML 转换
- Instruction Converter - CLAUDE.md ↔ AGENTS.md

#### 新增命令

| 命令 | 说明 |
|------|------|
| `platform:detect` | 检测已配置平台 |
| `platform:list` | 列出支持的平台 |
| `platform:convert` | 平台间配置转换 |
| `platform:sync` | 同步到所有平台 |

---

## [1.5.2](https://github.com/sumulige/sumulige-claude/compare/v1.5.1...v1.5.2) (2026-01-23)

### 🏗️ 架构重构

**commands.js 模块化拆分**: 将 3,588 行单体文件拆分为 13 个专注模块

```
lib/commands/
├── index.js           (85行, 分发器)
├── helpers.js         (336行, 共享函数)
├── init.js            (224行)
├── sync.js            (346行)
├── template.js        (520行)
├── skills-core.js     (245行)
├── skills-official.js (203行)
├── skills-manage.js   (732行)
├── config.js          (256行)
├── quality-gate.js    (75行)
├── workflow.js        (481行)
├── misc.js            (385行)
└── integrations.js    (86行)
```

### 🧹 代码清理

- 移除 4 个测试占位符 Skills (my-skill, test-skill-name, code-reviewer-123, api-tester)
- 清理 10 个废弃的开发项目目录 (仅 phase1 的项目)
- 清除 web-search 缓存目录

### 📊 质量提升

| 指标 | 修复前 | 修复后 |
|------|--------|--------|
| 最大文件行数 | 3,588 | 732 |
| 测试覆盖率阈值 | 50% | 80% |
| Skills 元数据完整率 | 26% | 100% |
| skill-index 同步 | 76% | 100% |
| rules 优先级覆盖 | 71% | 100% |

### ✨ 新增

| 项目 | 说明 |
|------|------|
| `react-node-practices` Skill | React & Node.js 最佳实践知识包 |
| `scripts/prepublish-check.js` | npm 发布前检查脚本 |
| 20 个 metadata.yaml | 所有 Skills 元数据补全 |

### 📝 文档更新

- `SKILLS.md` 重构为 26 个技能的分类索引
- `skill-index.json` 更新至 v1.2.0
- 所有 rules 文件添加优先级标签

---

## [1.5.1](https://github.com/sumulige/sumulige-claude/compare/v1.5.0...v1.5.1) (2026-01-23)

### ✨ 设计标准体系

建立统一的编程哲学和设计标准，从代码到架构到视觉设计。

```
┌─────────────────────────────────────────────────────────────────┐
│  代码层        →  架构层        →  设计层                        │
│  linus-style     software-        web-design-                   │
│                  architect        standard                      │
├─────────────────────────────────────────────────────────────────┤
│  消除特殊情况    12 支柱决策      三铁律                         │
│  向后兼容        权衡分析         眯眼测试                       │
│  极简主义        反模式检查       奥卡姆剃刀                     │
└─────────────────────────────────────────────────────────────────┘
```

### 📚 新增规则文件

| 文件 | 用途 |
|------|------|
| `rules/linus-style.md` | Linus 编程哲学 (v1.5.0 已添加) |
| `rules/web-design-standard.md` | Web 设计标准 |

### 📝 新增 Prompts

| 文件 | 用途 |
|------|------|
| `prompts/linus-architect.md` | 代码审查 System Prompt |
| `prompts/software-architect.md` | 架构决策 System Prompt |
| `prompts/web-designer.md` | 设计审查 System Prompt |

### 🎨 新增 Skills

| Skill | 来源 | 用途 |
|-------|------|------|
| `react-best-practices` | Vercel | 45 条 React/Next.js 性能规则 |
| `threejs-fundamentals` | - | 3D 场景/相机/渲染器基础 |
| `web-design-guidelines` | Vercel | UI 代码审查规范 |

### 🎯 新增 Demo

| 文件 | 说明 |
|------|------|
| `demos/power-3d-scatter.html` | Three.js 功率-时间-心率 3D 散点图 |

---

## [1.5.0](https://github.com/sumulige/sumulige-claude/compare/v1.4.1...v1.5.0) (2026-01-23)

### 🚀 三层硬质量门控系统

**问题**：规则是文档，可以忽略。代码可以直接写，无需规划。质量检查仅在提交时触发。

**解决方案**：三层硬门控，从"事后检查"变为"事前预防"。

```
┌─────────────────────────────────────────────────────────────────┐
│  Layer 1: Plan Gate (PreToolUse)                                │
│  ────────────────────────────────                               │
│  无批准计划 → 阻止 Write/Edit                                   │
│  检查 ~/.claude/plans/ + 项目级 .claude/plans/                  │
│  24小时有效期                                                   │
├─────────────────────────────────────────────────────────────────┤
│  Layer 2: Live Quality (PostToolUse)                            │
│  ────────────────────────────────────                           │
│  文件行数 ≤ 800 | 函数长度 ≤ 50 行                              │
│  检测硬编码密钥 | 禁止 console.log                              │
│  即时反馈                                                       │
├─────────────────────────────────────────────────────────────────┤
│  Layer 3: Strict Pre-commit                                     │
│  ────────────────────────────────────                           │
│  severity: warn (更严格)                                        │
│  启用 no-console-logs + function-length 规则                    │
└─────────────────────────────────────────────────────────────────┘
```

### ✨ 新增

| 文件 | 用途 |
|------|------|
| `hooks/plan-gate.cjs` | PreToolUse 强制规划检查 |
| `hooks/live-quality.cjs` | PostToolUse 实时质量检查 |
| `rules/linus-style.md` | Linus 编程哲学规则 |
| `prompts/linus-architect.md` | 架构师 System Prompt |

### 🔧 修改

| 文件 | 变更 |
|------|------|
| `settings.json` | 添加 PreToolUse 事件 |
| `hook-registry.json` | 注册 plan-gate + live-quality |
| `quality-gate.json` | 添加 planGate/liveQuality 配置，severity: warn |
| `pre-commit.cjs` | 使用配置的 severity，美化阻止提示 |

### 🎯 效果

| 指标 | 之前 | 之后 |
|------|------|------|
| 未规划的代码 | 可以提交 | 被阻止 |
| 超大文件 | 提交时才发现 | 写入时立即警告 |
| 硬编码密钥 | 可能遗漏 | 立即检测 |
| 质量漂移 | 渐进恶化 | 持续监控 |

---

## [1.4.1](https://github.com/sumulige/sumulige-claude/compare/v1.4.0...v1.4.1) (2026-01-23)

### 💡 契机

在将 sumulige-claude 配置同步到多个项目时，发现每次更新后需要手动复制 hooks/skills/templates/commands 到各项目的 `.claude/` 目录，维护成本高且容易出现配置漂移。

**问题**：
- 14 个项目各自维护 `.claude/` 副本
- 更新 sumulige-claude 后需要逐个同步
- 项目间配置不一致

**解决方案**：利用 Claude Code 的全局配置继承机制，实现单一真相源。

### 🏗️ 架构优化：配置分层继承

```
┌─────────────────────────────────────────────────────────────────┐
│           sumulige-claude/.claude/ (Git 仓库 - 版本控制)         │
│  hooks/ ─────────────────────────────────────────────────────── │
│  skills/ ────────────────────────────────────────────────────── │  符号链接
│  templates/ ─────────────────────────────────────────────────── │     ↓
│  commands/ ──────────────────────────────────────────────────── │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    ~/.claude/ (运行时)                          │
│  hooks/ → symlink to sumulige-claude                            │
│  skills/ → symlink to sumulige-claude                           │
│  templates/ → symlink to sumulige-claude                        │
│  commands/ → symlink to sumulige-claude                         │
│  + 运行时数据 (cache, debug, history.jsonl...)                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓ 自动继承
┌─────────────────────────────────────────────────────────────────┐
│                    项目/.claude/ (仅项目特定内容)                │
│  MEMORY.md, PROJECT_LOG.md, ANCHORS.md, CLAUDE.md              │
│  thinking-routes/, rag/                                         │
│  ❌ 不再需要: hooks/, skills/, templates/, commands/            │
└─────────────────────────────────────────────────────────────────┘
```

### ✨ 新增

- **`scripts/sync-to-home.sh`**: 符号链接同步脚本
  ```bash
  ./scripts/sync-to-home.sh          # 完整同步（链接 + 复制模板）
  ./scripts/sync-to-home.sh --link   # 仅建立符号链接
  ./scripts/sync-to-home.sh --copy   # 仅复制模板文件
  ./scripts/sync-to-home.sh --status # 查看当前状态
  ```

- **`.claude/skills/template/`**: Skill 创建模板目录

### 🧹 清理

| 删除 | 原因 |
|------|------|
| `.claude/backup/` | 空目录 |
| `.claude/verify/` | 空目录 |
| `.claude/sessions/*.json` | 运行时数据 |
| 测试 skills (api-tester, my-skill...) | 测试数据 |

### 📚 文档更新

- **CLAUDE.md**: 更新受保护目录说明，添加全局继承注意事项
- **MEMORY.md**: 重置为空模板

### 🎯 收益

| 指标 | 之前 | 之后 |
|------|------|------|
| 项目 `.claude/` 文件数 | ~300 个 | ~10 个 |
| 更新配置需同步项目数 | 14 个 | 0 个 (自动) |
| 配置漂移风险 | 高 | 零 |

---

## [1.4.0](https://github.com/sumulige/sumulige-claude/compare/v1.3.3...v1.4.0) (2026-01-23)

### 🚀 架构优化 (Token 成本降低 62%)

#### 新增文件 (10 个)

| 文件 | 用途 |
|------|------|
| `hook-dispatcher.cjs` | 统一 Hook 调度器，支持 debounce 和条件执行 |
| `hook-registry.json` | Hook 配置注册表 |
| `hooks/lib/fs-utils.cjs` | 共享文件操作库 |
| `hooks/lib/cache.cjs` | 缓存工具类 |
| `version-manifest.json` | 版本兼容性矩阵 |
| `lib/version-manifest.js` | 版本管理库 |
| `lib/incremental-sync.js` | 增量同步实现 |
| `commands/workflow.md` | /workflow 统一命令 |

#### 精简内容

| 项目 | 之前 | 之后 | 变化 |
|------|------|------|------|
| `PreToolUse` hooks | 3 个 | 0 个 | **清空** |
| `PostToolUse` hooks | 5 个 | 1 个 | **-80%** |
| `UserPromptSubmit` hooks | 5 个 | 1 个 | **-80%** |
| `AgentStop` hooks | 4 个 | 1 个 | **-75%** |
| `settings.json` 行数 | 155 行 | 81 行 | **-48%** |

#### 性能提升

| 指标 | 优化前 | 优化后 | 提升 |
|------|--------|--------|------|
| Hook 调用次数/tool call | 12+ 次 | 2-3 次 | **-75%** |
| RAG 匹配 | O(n×m) | O(1) 缓存 | **显著** |
| PostToolUse 开销 | 每次 5 hooks | 仅 Write/Edit | **-90%+** |

### ✨ New Features

- **`smc sync --incremental`**: 增量同步，只更新变更文件
- **`/workflow` 命令**: 统一工作流
  - `/workflow check` - 检查更新状态
  - `/workflow pull` - 增量同步
  - `/workflow full` - 一键完整流程
- **Hook 智能调度**: debounce、runOnce、条件执行
- **RAG 缓存**: 5 分钟 TTL，避免重复匹配
- **版本追踪**: 自动检测 breaking changes

### 🧪 Tests

```
Test Suites: 15 passed, 15 total
Tests:       575 passed, 575 total
```

---

## [1.3.3](https://github.com/sumulige/sumulige-claude/compare/v1.3.2...v1.3.3) (2026-01-22)

### ✨ New Features

- **`smc sync --hooks`**: Incremental hooks update for existing projects
  - Adds new lifecycle hooks without overwriting customizations
  - Merges SessionStart/SessionEnd/PreCompact into existing settings.json

### 📝 Documentation

- Add Layer 7: Lifecycle Hooks section to README
- Document update methods for other projects

---

## [1.3.2](https://github.com/sumulige/sumulige-claude/compare/v1.3.1...v1.3.2) (2026-01-22)

### ✨ New Features

- **Official Hooks Integration**: Claude Code lifecycle auto-sync
  - `SessionStart` → `memory-loader.cjs`: Auto-load MEMORY.md, ANCHORS.md, restore TODO state
  - `SessionEnd` → `memory-saver.cjs`: Auto-save session summary, archive session, sync TODO
  - `PreCompact` → `auto-handoff.cjs`: Auto-generate handoff before context compression
- **Context Preservation**: Automatic handoff documents in `.claude/handoffs/`
  - Includes active TODOs, recently modified files, recovery commands
  - `LATEST.md` always points to most recent handoff

### 🔧 Improvements

- Session state tracking via `.session-state.json`
- Automatic session archiving to `.claude/sessions/`
- Memory entries kept for 7 days with auto-cleanup

---

## [1.3.1](https://github.com/sumulige/sumulige-claude/compare/v1.3.0...v1.3.1) (2026-01-22)

### ✨ New Features

- **System Prompt Optimization**: Token savings via MCP lazy-loading
  - `ENABLE_TOOL_SEARCH=true` - MCP tools loaded on demand
  - `DISABLE_AUTOUPDATER=1` - Reduce startup overhead
  - ~50% token reduction for system prompts
- **New Commands**:
  - `/handoff` - Generate context handoff documents for session continuity
  - `/gha` - Analyze GitHub Actions CI failures
  - `/audit` - Security audit for approved commands (cc-safe style)
- **Permission Audit**: Detect dangerous patterns in approved commands
  - Critical: `rm -rf /`, disk overwrite, fork bombs
  - High: `sudo`, `chmod 777`, privileged containers
  - Medium: global installs, force push

### 📝 Documentation

- Add `/handoff` command guide
- Add `/gha` CI analysis guide
- Add `/audit` security audit guide

---

## [1.3.0](https://github.com/sumulige/sumulige-claude/compare/v1.2.1...v1.3.0) (2026-01-22)

### ✨ New Features

- **4 Core Skills System**: Cost-optimized skill architecture
  - `quality-guard` (sonnet) - Code review + security + cleanup
  - `test-master` (sonnet) - TDD + E2E + coverage
  - `design-brain` (opus) - Planning + architecture
  - `quick-fix` (haiku) - Fast error resolution
- **Model Strategy**: Automatic model selection based on task complexity
- **Workflow Engine**: 4-phase project workflow (research → approve → plan → develop)
- **Usage Manual**: Comprehensive `.claude/USAGE.md` documentation

### 🐛 Bug Fixes

- make git hooks executable (e748915a)
- fix pre-push hook for deleted files detection (46cccc6)

### 📝 Documentation

- add `.claude/USAGE.md` with complete skills guide
- add Layer 5.5 Core Skills section to README
- update CHANGELOG with test coverage improvements

### ♻️ Refactor

- **BREAKING**: merge 9 skills into 4 core skills (60-70% cost reduction)
- delete 6 placeholder skills
- streamline commands from 17 to 12

### 🧪 Tests

- improve test coverage to 63.53%
- all 575 tests passing

### 🧹 Chores

- add workflows, templates, and development infrastructure
- add hook templates for customization

## [1.2.1](https://github.com/sumulige/sumulige-claude/compare/v1.1.2...v1.2.1) (2026-01-18)


### Fixed

* make git hooks executable ([e748915](https://github.com/sumulige/sumulige-claude/commits/e748915a2675664885c69d649133d7f8cc354f89))


* add comprehensive regression tests for core modules ([e3b570e](https://github.com/sumulige/sumulige-claude/commits/e3b570ed1998aefd8d75e2767e78f2d7611eb0b9))
* **release:** 1.2.0 ([03c0c30](https://github.com/sumulige/sumulige-claude/commits/03c0c3096d94293b48943a23cc69d618d940f386))
* significantly improve test coverage to 63.53% ([0b552e0](https://github.com/sumulige/sumulige-claude/commits/0b552e03a42f88587a641da0fa40cbf2f3b136d4))


### Changed

* update CHANGELOG with test coverage improvements ([d82cd19](https://github.com/sumulige/sumulige-claude/commits/d82cd19f97318ad96e7a67509622c2a9ffdcb643))
* update README with v1.2.0 changelog entry ([aa3cbc1](https://github.com/sumulige/sumulige-claude/commits/aa3cbc1d7bb438197e1fa477fcc44646eda97fe5))

## [1.2.0](https://github.com/sumulige/sumulige-claude/compare/v1.1.2...v1.2.0) (2026-01-17)


### Fixed

* make git hooks executable ([e748915](https://github.com/sumulige/sumulige-claude/commits/e748915a2675664885c69d649133d7f8cc354f89))


* add comprehensive regression tests for core modules ([e3b570e](https://github.com/sumulige/sumulige-claude/commits/e3b570ed1998aefd8d75e2767e78f2d7611eb0b9))

## [1.1.0](https://github.com/sumulige/sumulige-claude/compare/v1.0.11...v1.1.0) (2026-01-15)


### Changed

* sync documentation with v1.0.11 ([b00c509](https://github.com/sumulige/sumulige-claude/commits/b00c50928038bf8a4a655e81712420cd3294935d))


* add standard-version for automated releases ([32522fa](https://github.com/sumulige/sumulige-claude/commits/32522fa912dd26a4540cba10532c24d4e29e6daf))


### Added

* add test-workflow skill and enhance CLI commands ([972a676](https://github.com/sumulige/sumulige-claude/commits/972a6762411c5f863d9bfa3e360df7dc7f379aab))

## [1.0.11] - 2026-01-15

### Added
- Complete test suite with 78 tests across 5 modules
- Version-aware migration system (`lib/migrations.js`)
- `smc migrate` command for manual migration
- Auto-migration of old hooks format on `smc sync`
- Code simplifier integration

### Changed
- Modularized codebase for better maintainability

### Fixed
- Test coverage improvements

## [1.0.10] - 2026-01-15

### Added
- Conversation logger Hook (`conversation-logger.cjs`)
- Automatic conversation recording to `DAILY_CONVERSATION.md`
- Date-grouped conversation history

### Fixed
- Auto-migration for old hooks format

## [1.0.9] - 2026-01-15

### Fixed
- Clean up stale session entries

## [1.0.8] - 2026-01-14

### Added
- Skill Marketplace system with external repository support
- Auto-sync mechanism via GitHub Actions (daily schedule)
- 6 new marketplace commands: `list`, `install`, `sync`, `add`, `remove`, `status`
- Claude Code native plugin registry (`.claude-plugin/marketplace.json`)
- Skill categorization system (7 categories)
- Development documentation (`docs/DEVELOPMENT.md`)
- Marketplace user guide (`docs/MARKETPLACE.md`)

### Changed
- Refactored CLI into modular architecture (`lib/` directory)
- Streamlined README with dedicated documentation files

## [1.0.7] - 2026-01-13

### Changed
- Project template updates

## [1.0.6] - 2026-01-14

### Added
- Comprehensive Claude official skills integration via `smc-skills` repository
- 16 production-ready skills for enhanced AI capabilities:
  - **algorithmic-art**: p5.js generative art with seeded randomness
  - **brand-guidelines**: Anthropic brand colors and typography
  - **canvas-design**: Visual art creation for posters and designs
  - **doc-coauthoring**: Structured documentation workflow
  - **docx**: Word document manipulation (tracked changes, comments)
  - **internal-comms**: Company communication templates
  - **manus-kickoff**: Project kickoff templates
  - **mcp-builder**: MCP server construction guide
  - **pdf**: PDF manipulation (forms, merge, split)
  - **pptx**: PowerPoint presentation tools
  - **skill-creator**: Skill creation guide
  - **slack-gif-creator**: Animated GIFs for Slack
  - **template**: Skill template
  - **theme-factory**: 10 pre-set themes for artifacts
  - **web-artifacts-builder**: React/Tailwind artifact builder
  - **webapp-testing**: Playwright browser testing
  - **xlsx**: Spreadsheet operations

### Changed
- Updated hooks compatibility with latest Claude Code format
- Improved documentation with PROJECT_STRUCTURE.md and Q&A.md

### Fixed
- Hook format compatibility issues

## [1.0.5] - 2025-01-13

### Fixed
- Update hooks to new Claude Code format

## [1.0.4] - 2025-01-12

### Added
- Comprehensive smc usage guide in README

## [1.0.3] - 2025-01-11

### Fixed
- Template command now copies all files including commands, skills, templates

## [1.0.2] - 2025-01-11

### Added
- Initial stable release
## 1.12.1 (2026-02-01)
- Added overlay-aware dispatcher (hooks/registry load order: .claude/local > .claude/hooks > .claude/upstream/hooks)
- Introduced safe sync flow: `smc sync:plan` (no-op) and `smc sync:apply` (write to .claude/upstream only)
- Postinstall now opt-in via `SMC_POSTINSTALL=0|1` to avoid sandbox/CI side effects
- Added affected-files generator (`scripts/affected-files.mjs`) based on version-manifest
- Template hook-registry includes optional `post-task-autoroll` (disabled by default)
## 1.12.0 (2026-02-01)
- Added overlay-aware dispatcher (hooks/registry load order: .claude/local > .claude/hooks > .claude/upstream/hooks)
- Introduced safe sync flow: `smc sync:plan` (no-op) and `smc sync:apply` (write to .claude/upstream only)
- Postinstall now opt-in via `SMC_POSTINSTALL=0|1` to avoid sandbox/CI side effects
- Added affected-files generator (`scripts/affected-files.mjs`) based on version-manifest
- Template hook-registry includes optional `post-task-autoroll` (disabled by default)
