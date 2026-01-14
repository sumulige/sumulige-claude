# AGENTS.md

<skills_system priority="1">

## Multi-Agent Orchestration

This project uses **Sumulige Claude (SMC)** for intelligent multi-agent collaboration.

### Available Agents

| Agent | Model | Role |
|-------|-------|------|
| **Conductor** | claude-opus-4.5 | Task coordination and decomposition |
| **Architect** | claude-opus-4.5 | Architecture design and technical decisions |
| **Builder** | claude-opus-4.5 | Code implementation and testing |
| **Reviewer** | claude-opus-4.5 | Code review and quality assurance |
| **Librarian** | claude-opus-4.5 | Documentation and knowledge management |

### Usage

```bash
# View agent status
smc status

# Run agent task
smc agent <task>

# List available skills
smc marketplace:list

# Install a skill
smc marketplace:install <skill-name>

# Sync external skills
smc marketplace:sync
```

---

## Skills Marketplace

This project includes a curated skills marketplace with automatic synchronization from external repositories.

### Categories

| Category | Description |
|----------|-------------|
| 🔧 **tools** | CLI tools and utilities |
| 💻 **development** | Language-specific dev assistance |
| ⚡ **productivity** | Workflow automation |
| 🤖 **automation** | Browser, CI/CD, system automation |
| 📊 **data** | Database, data processing |
| 📚 **documentation** | Docs, diagrams, specs |
| 🎼 **workflow** | Multi-agent orchestration |

### Universal Compatibility

This project follows the **AGENTS.md** standard, adopted by 20,000+ repositories and natively supported by:
- Claude Code
- GitHub Copilot
- Google Gemini
- OpenAI Codex
- Factory Droid
- Cursor
- And more...

### Quick Commands

```bash
# Initialize SMC in your project
smc init

# Deploy Claude Code project template
smc template

# Start Manus-style project planning
smc kickoff
```

---

## Project Template Features

When you run `smc template`, your project gets:

- **ThinkingLens** - Autonomous memory system for AI
- **Slash Commands** - `/commit`, `/test`, `/review`, `/pr`, etc.
- **RAG System** - Dynamic skill discovery based on task context
- **Hooks** - Automation for code formatting, TODO management, etc.
- **TODO System** - GTD-style task management

</skills_system>
