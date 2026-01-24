<p align="center">
  <h1 align="center">Sumulige Claude</h1>
  <p align="center">
    <strong>The Universal Agent Harness for AI Coding Assistants</strong>
  </p>
  <p align="center">
    Transform Claude Code and OpenAI Codex into intelligent, memory-aware development teams
  </p>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/sumulige-claude"><img src="https://badge.fury.io/js/sumulige-claude.svg" alt="npm version"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <a href="#"><img src="https://img.shields.io/badge/platforms-Claude%20%7C%20Codex-blue.svg" alt="Platforms"></a>
</p>

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
| Works with Claude, need Codex too | Maintain two config systems | One config, both platforms |

---

## Features

### Multi-Platform Support

```
┌─────────────────────────────────────────────────────────────┐
│                    smc CLI                                   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐          ┌─────────────────┐           │
│  │   Claude Code   │          │   Codex CLI     │           │
│  │   (Anthropic)   │          │   (OpenAI)      │           │
│  │                 │          │                 │           │
│  │  .claude/       │  ◄────►  │  .codex/        │           │
│  │  CLAUDE.md      │  sync    │  AGENTS.md      │           │
│  │  JSON config    │          │  TOML config    │           │
│  └─────────────────┘          └─────────────────┘           │
├─────────────────────────────────────────────────────────────┤
│              Shared: Skills, Rules, Memory                   │
└─────────────────────────────────────────────────────────────┘
```

### Core Capabilities

- **Memory System** - AI remembers decisions across sessions
- **Multi-Agent** - Specialized AI agents (Architect, Builder, Reviewer)
- **Skills Marketplace** - Install and share reusable AI capabilities
- **Quality Gate** - Automatic code quality enforcement
- **Slash Commands** - `/commit`, `/test`, `/review`, `/fix`

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
  "version": "1.6.0",
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

```
Session Start
     │
     ▼
┌─────────────────┐
│ memory-loader   │ ◄── Load MEMORY.md, ANCHORS.md
└─────────────────┘
     │
     ▼
   Work with AI
     │
     ▼
┌─────────────────┐
│ memory-saver    │ ──► Save to MEMORY.md
└─────────────────┘
     │
     ▼
Session End
```

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

### v1.6.0 (2026-01-24)

**Multi-Platform Support** - OpenAI Codex CLI compatibility

- **Platform Adapters** - Abstract layer for multi-CLI support
- **Config Converter** - JSON ↔ TOML conversion
- **Instruction Converter** - CLAUDE.md ↔ AGENTS.md
- **New Commands**:
  - `platform:detect` - Detect configured platforms
  - `platform:list` - List supported platforms
  - `platform:convert` - Convert between platforms
  - `platform:sync` - Sync to all platforms
- **Template Extensions**:
  - `--codex` flag for Codex-only deployment
  - `--all` flag for both platforms

### v1.5.2 (2026-01-23)

- Architecture refactoring and code cleanup
- Design standards system + 3 new skills

### v1.5.0 (2026-01-22)

- Three-tier quality gate system

[Full Changelog](CHANGELOG.md)

---

## License

MIT © [sumulige](https://github.com/sumulige)

---

<p align="center">
  <strong>Works with</strong><br>
  <a href="https://claude.ai">Claude Code</a> •
  <a href="https://openai.com/codex">Codex CLI</a>
</p>
