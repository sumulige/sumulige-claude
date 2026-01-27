<p align="center">
  <h1 align="center">Sumulige Claude</h1>
  <p align="center">
    <strong>The Universal Agent Harness for AI Coding Assistants</strong>
  </p>
  <p align="center">
    Transform Claude Code, Codex CLI, Cursor, and 5 more AI assistants into intelligent development teams
  </p>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/sumulige-claude"><img src="https://img.shields.io/npm/v/sumulige-claude.svg" alt="npm version"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <a href="#supported-platforms"><img src="https://img.shields.io/badge/platforms-10%20AI%20CLIs-blue.svg" alt="Platforms"></a>
</p>

**Sumulige Claude** is a universal agent harness for AI coding assistants. Supports **10 platforms** including Claude Code, Codex CLI, Cursor, Windsurf, Antigravity, and more. Features 5-agent orchestration, dual-layer memory, TDD workflow, and cross-platform config sync.

---

## Quick Start

```bash
# Install
npm install -g sumulige-claude

# Initialize in your project
smc template

# Start Claude Code
claude
```

**That's it.** Your project now has AI memory, slash commands, and quality gates.

---

## Why Sumulige Claude?

| Problem | Before | After |
|---------|--------|-------|
| AI forgets context every session | Repeat project structure constantly | Automatic memory via ThinkingLens |
| Inconsistent code quality | Manual reviews, missed issues | Quality Gate auto-checks |
| Works with multiple AI CLIs | Maintain separate configs | One config, 8 platforms |

---

## Features

### Multi-Platform Support

#### Supported Platforms

| Platform | Vendor | Config | Instructions |
|----------|--------|--------|--------------|
| **Claude Code** | Anthropic | JSON | CLAUDE.md |
| **Codex CLI** | OpenAI | TOML | AGENTS.md |
| **Cursor** | cursor.com | MDC | .cursorrules |
| **Aider** | aider.chat | YAML | CONVENTIONS.md |
| **Cline/Roo** | VS Code | Markdown | .clinerules |
| **OpenCode** | opencode.ai | JSONC | instructions |
| **Trae** | ByteDance | YAML | agents config |
| **Zed** | Zed Industries | JSON | settings |
| **Windsurf** | Codeium | Markdown | .windsurfrules |
| **Antigravity** | Google | JSON + MD | .agent/rules/ |

```
┌─────────────────────────────────────────────────────────────┐
│                    smc CLI                                   │
├─────────────────────────────────────────────────────────────┤
│  Claude  │  Codex  │  Cursor │  Aider  │  Cline │  ...     │
│    ↓         ↓         ↓         ↓         ↓                │
│  .claude/  .codex/  .cursor/  .aider    .cline              │
├─────────────────────────────────────────────────────────────┤
│         Shared: Skills, Rules, Memory, Instructions          │
└─────────────────────────────────────────────────────────────┘
```

### Core Capabilities

- **Memory System** - Dual-layer memory (daily notes + long-term) with pre-compaction flush
- **Agent Orchestration** - 5 specialized agents with intelligent routing
- **Workflow Integration** - kickoff → agent → todo → tdd pipeline
- **Skills Marketplace** - Install and share reusable AI capabilities
- **Quality Gate** - Automatic code quality enforcement
- **Slash Commands** - `/commit`, `/test`, `/review`, `/fix`

### Agent Orchestration

```
smc agent "实现用户登录"
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  Router: Pattern Matching                                    │
│  "实现" → Builder | "设计" → Architect | "审查" → Reviewer   │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐
│ Conductor │ │ Architect │ │  Builder  │ │ Reviewer  │ │ Librarian │
│   Opus    │ │   Opus    │ │  Sonnet   │ │   Opus    │ │   Haiku   │
│ 任务协调   │ │ 架构设计   │ │ 代码实现   │ │ 代码审查   │ │ 文档归档   │
└───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘
```

### Workflow Pipeline

```bash
# Complete workflow: kickoff → agent → todo → tdd
smc workflow kickoff "实现用户认证" --dry-run  # Generate analysis prompt
smc workflow kickoff --parse                    # Parse output, create todos
/tdd --from-todo                                # Start TDD from todo
```

---

## Installation

### Requirements

- Node.js 16+
- Claude Code or Codex CLI installed

### Install

```bash
npm install -g sumulige-claude
```

### Verify

```bash
smc --version
```

---

## Usage

### New Project Setup

```bash
# Deploy Claude Code template
smc template

# Or deploy for both platforms
smc template --all

# Or Codex only
smc template --codex
```

### Existing Project

```bash
# Add to existing project (safe mode - won't overwrite)
smc template --safe

# Or sync incrementally
smc sync
```

### Platform Commands

```bash
# Detect configured platforms
smc platform:detect

# Convert Claude config to Codex
smc platform:convert claude codex

# Sync to all platforms
smc platform:sync
```

---

## Project Structure

After `smc template`, your project looks like:

```
your-project/
├── .claude/                 # Claude Code configuration
│   ├── settings.json        # Hooks and settings
│   ├── CLAUDE.md            # Project instructions
│   ├── commands/            # Slash commands
│   ├── skills/              # Installed skills
│   ├── hooks/               # Automation hooks
│   ├── rag/                 # Knowledge index
│   └── MEMORY.md            # AI memory
│
├── .codex/                  # Codex CLI configuration (if --all)
│   └── config.toml          # Codex settings
│
├── AGENTS.md                # Codex instructions (if --all)
└── CLAUDE.md                # Project-level AI config
```

---

## Commands Reference

### Core Commands

| Command | Description |
|---------|-------------|
| `smc init` | Initialize global configuration |
| `smc template` | Deploy project template |
| `smc sync` | Sync configuration (incremental) |
| `smc status` | Show current status |

### Platform Commands

| Command | Description |
|---------|-------------|
| `smc platform:detect` | Detect AI platforms in project |
| `smc platform:list` | List supported platforms |
| `smc platform:convert <from> <to>` | Convert between platforms |
| `smc platform:sync` | Sync config to all platforms |

### Skill Commands

| Command | Description |
|---------|-------------|
| `smc skill:list` | List installed skills |
| `smc skill:create <name>` | Create new skill |
| `smc marketplace:list` | Browse skill marketplace |
| `smc marketplace:install <name>` | Install a skill |

### Quality Commands

| Command | Description |
|---------|-------------|
| `smc qg:check` | Run quality gate checks |
| `smc qg:rules` | List quality rules |
| `smc config:validate` | Validate configuration |

---

## Slash Commands

Available in Claude Code after template deployment:

| Command | Model | Description |
|---------|-------|-------------|
| `/review` | Sonnet | Code review + security scan |
| `/test` | Sonnet | Run tests with TDD support |
| `/fix` | Haiku | Quick fix for build/lint errors |
| `/plan` | Opus | Architecture and planning |
| `/commit` | - | Git commit with message |
| `/tdd` | - | Test-driven development workflow |
| `/todos` | - | Task management |

## Agent Commands

```bash
# List available agents
smc agent --list

# Route task to appropriate agent
smc agent "设计 REST API"              # → Architect
smc agent "实现登录功能"               # → Builder
smc agent "审查代码质量"               # → Reviewer

# Options
smc agent "任务" --dry-run             # Preview only
smc agent "任务" --create-todo         # Create todo from output
smc agent "任务" --verbose             # Detailed output
```

## Workflow Commands

```bash
# Task kickoff and analysis
smc workflow kickoff "实现用户反馈功能"           # Create placeholder todo
smc workflow kickoff "任务" --dry-run             # Show Conductor prompt
smc workflow kickoff --parse                       # Parse Claude output to todos

# Project workflow
smc workflow start "Build a REST API"             # Start Phase 1
smc workflow status                                # Show all projects
smc workflow next                                  # Advance to next phase
```

---

## Multi-Platform Workflow

### Converting Existing Project

```bash
# You have a Claude Code project, want to add Codex support

# 1. See what's configured
smc platform:detect
# Output: Detected 1 platform(s): claude

# 2. Convert to Codex
smc platform:convert claude codex

# 3. Verify
smc platform:detect
# Output: Detected 2 platform(s): claude, codex

# 4. Use either CLI
claude "Fix the login bug"
codex "Fix the login bug"
```

### Platform Config Mapping

| Claude Code | Codex CLI |
|-------------|-----------|
| `.claude/settings.json` | `.codex/config.toml` |
| `CLAUDE.md` | `AGENTS.md` |
| JSON format | TOML format |
| Hooks in settings.json | Notifications in config.toml |

---

## Configuration

### Claude Code (`~/.claude/config.json`)

```json
{
  "version": "1.7.2",
  "model": "claude-sonnet-4",
  "agents": {
    "architect": { "model": "claude-opus-4" },
    "builder": { "model": "claude-sonnet-4" },
    "reviewer": { "model": "claude-opus-4" }
  },
  "thinkingLens": {
    "enabled": true,
    "autoSync": true
  }
}
```

### Codex CLI (`.codex/config.toml`)

```toml
model = "o3"
model_provider = "openai"
sandbox_mode = "workspace-write"
approval_policy = "on-failure"

[project]
project_doc_fallback_filenames = ["AGENTS.md", "CLAUDE.md"]

[features]
shell_tool = true
web_search_request = true
```

---

## Architecture

### Memory System

**Dual-Layer Architecture** (Inspired by [Clawdbot](https://github.com/peterthehan/clawdbot))

```
.claude/
├── MEMORY.md              # Layer 2: 长期记忆（偏好、约束、决策）
└── memory/
    ├── 2026-01-27.md      # Layer 1: 今日笔记
    ├── 2026-01-26.md      # 昨日笔记
    └── ...                # 14天滚动清理
```

| Layer | 文件 | 内容 | 生命周期 |
|-------|------|------|---------|
| **Layer 1** | `memory/YYYY-MM-DD.md` | 临时笔记、会话记录、WIP | 14天滚动 |
| **Layer 2** | `MEMORY.md` | 用户偏好、架构决策、项目约束 | 永久 |

#### Session Lifecycle

```
Session Start
     │
     ▼
┌─────────────────┐
│ memory-loader   │ ◄── Load memory/今日+昨日.md + MEMORY.md
└─────────────────┘
     │
     ▼
   Work with AI
     │
     ├── Pre-compaction Flush ──► 重要信息写入 memory/
     │
     ▼
┌─────────────────┐
│ memory-saver    │ ──► Save insights to memory/YYYY-MM-DD.md
└─────────────────┘
     │
     ▼
Session End
```

#### Pre-compaction Memory Flush

当 context 接近上限时，AI 会主动将重要信息刷盘：

```markdown
## 15:00 - Session Summary

### 关键决策
- 采用双层记忆架构
- 使用 14 天滚动保留

### 下一步
- [ ] 测试完整流程
```

**触发信号**: 对话 > 15 轮 | 工具调用 > 30 次 | 文件修改 > 10 个

### Hook System

```
Claude Code Event
     │
     ▼
┌─────────────────────────────────────────┐
│            settings.json                 │
├─────────────────────────────────────────┤
│ SessionStart  → memory-loader.cjs       │
│ SessionEnd    → memory-saver.cjs        │
│ PreCompact    → auto-handoff.cjs        │
│ PostToolUse   → code-formatter.cjs      │
└─────────────────────────────────────────┘
```

---

## Upgrading

### From v1.x

```bash
# Update global package
npm update -g sumulige-claude

# Update project template
smc template --force
```

### Migration

Old hooks are automatically migrated. Your custom configurations are backed up to `.claude/backup/`.

---

## Troubleshooting

### Common Issues

**Q: Commands not found after install**
```bash
# Ensure npm global bin is in PATH
export PATH="$PATH:$(npm bin -g)"
```

**Q: Platform not detected**
```bash
# Ensure project has config files
ls -la .claude/settings.json
ls -la .codex/config.toml
```

**Q: Codex can't read AGENTS.md**
```bash
# Regenerate from Claude config
smc platform:convert claude codex
```

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

---

## Documentation

| Document | Description |
|----------|-------------|
| [Development Guide](docs/DEVELOPMENT.md) | Architecture and adding skills |
| [Marketplace Guide](docs/MARKETPLACE.md) | Skill marketplace user guide |
| [Q&A](Q&A.md) | Frequently asked questions |

---

## Changelog

### v1.10.2 (2026-01-27)

**Quality Gate + SEO Skill**

- **changelog-version-sync** - Pre-commit 检查 CHANGELOG 是否包含当前版本
- **seo-optimization skill** - Git/README/Release/Technical SEO 最佳实践

### v1.10.1 (2026-01-27)

**Cleanup** - 清理测试产物 (-7,604 行)

- 删除 4 个空 Skills、3 个测试项目、demo 文件

### v1.10.0 (2026-01-27)

**New Platform Support** - Windsurf + Antigravity (8 → 10 platforms)

- **Windsurf** (Codeium) - AI-native IDE with Cascade system
- **Antigravity** (Google) - Agent-first IDE

### v1.9.2 (2026-01-27)

**Multi-Platform Architecture Refactoring** - Plugin-style architecture

- **UnifiedInstruction** - Unified instruction format, N×M → 2N conversion methods
- **PlatformRegistry** - Auto-discovery registration, no manual index.js changes
- **Self-contained Adapters** - Each platform in single directory (`lib/platforms/xxx/`)
- **Backward Compatible** - `lib/adapters/` re-exports new architecture
- **Code Reduction** - Removed ~1900 lines of legacy code

### v1.8.0 (2026-01-27)

**6 New Platforms** - Aider, Cursor, Cline, OpenCode, Trae, Zed

- Support for 8 total AI coding platforms
- Platform-specific configuration and instruction formats

### v1.7.2 (2026-01-27)

**Dual-Layer Memory System** - Inspired by Clawdbot

- **Two-Layer Architecture** - Daily notes (`memory/YYYY-MM-DD.md`) + Long-term (`MEMORY.md`)
- **Pre-compaction Flush** - Save important info before context compression
- **Content-Aware Save** - Save insights, not just metadata
- **14-Day Rolling** - Auto-cleanup of old daily notes

### v1.7.0 (2026-01-26)

**Agent Orchestration & Workflow Integration**

- **5-Agent System** - Conductor, Architect, Builder, Reviewer, Librarian
- **Intelligent Routing** - Auto-route tasks based on pattern matching
- **Workflow Pipeline** - kickoff → agent → todo → tdd
- **Todo Bridge** - Auto-create todos from agent analysis
- **Strategic Compact** - Smart context compression before compaction
- **New Commands**:
  - `smc agent <task>` - Route task to agent
  - `smc workflow kickoff` - Task analysis and planning
  - `--create-todo`, `--parse` options

### v1.6.0 (2026-01-24)

**Multi-Platform Support** - OpenAI Codex CLI compatibility

- Platform Adapters, Config Converter, Instruction Converter
- `platform:detect`, `platform:convert`, `platform:sync` commands

### v1.5.2 (2026-01-23)

- Architecture refactoring and code cleanup

[Full Changelog](CHANGELOG.md)

---

## Feedback & Contributing

We'd love to hear from you!

| 类型 | 链接 |
|------|------|
| 🐛 Bug 报告 | [Open an Issue](https://github.com/sumulige/sumulige-claude/issues/new?template=bug_report.md) |
| 💡 功能建议 | [Feature Request](https://github.com/sumulige/sumulige-claude/issues/new?template=feature_request.md) |
| 💬 问题讨论 | [Discussions](https://github.com/sumulige/sumulige-claude/discussions) |
| ⭐ 觉得有用？ | [Give us a Star](https://github.com/sumulige/sumulige-claude) |

### Contributing

```bash
# Fork & Clone
git clone https://github.com/YOUR_USERNAME/sumulige-claude.git

# Install dependencies
npm install

# Run tests
npm test

# Submit PR
```

欢迎提交 PR！无论是修复 typo 还是新增功能，我们都很感激。

---

## License

MIT © [sumulige](https://github.com/sumulige)

---

<p align="center">
  <strong>Works with</strong><br>
  <a href="https://claude.ai">Claude Code</a> •
  <a href="https://openai.com/codex">Codex CLI</a>
</p>
