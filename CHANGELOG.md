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
