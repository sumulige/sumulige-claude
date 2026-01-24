# Codex CLI Configuration

This directory contains configuration for [OpenAI Codex CLI](https://developers.openai.com/codex/).

## Files

| File | Purpose |
|------|---------|
| `config.toml` | Codex CLI settings (model, sandbox, approval policy) |
| `../AGENTS.md` | Project instructions for the AI agent |

## Quick Start

```bash
# Install Codex CLI
npm install -g @openai/codex

# Run Codex in your project
codex

# Or with a specific task
codex "Fix the failing tests"
```

## Configuration Options

### Sandbox Modes

| Mode | Description |
|------|-------------|
| `read-only` | Can only read files, no modifications |
| `workspace-write` | Can modify project files (recommended) |
| `danger-full-access` | Full system access (use with caution) |

### Approval Policies

| Policy | Description |
|--------|-------------|
| `untrusted` | Require approval for all actions |
| `on-failure` | Auto-approve, ask on errors (recommended) |
| `on-request` | Auto-approve unless agent requests |
| `never` | Never ask for approval |

## Integration with Claude Code

This project supports both Claude Code and Codex CLI:

- Claude Code reads `.claude/CLAUDE.md` and `.claude/settings.json`
- Codex CLI reads `AGENTS.md` and `.codex/config.toml`

Both tools can use the same project rules in `.claude/rules/`.

## Sync Configuration

Use sumulige-claude to sync settings between platforms:

```bash
# Convert Claude config to Codex
smc platform:convert claude codex

# Sync all platforms
smc platform:sync
```

## Documentation

- [Codex CLI Documentation](https://developers.openai.com/codex/)
- [AGENTS.md Guide](https://developers.openai.com/codex/guides/agents-md)
- [Configuration Reference](https://developers.openai.com/codex/config-reference/)
