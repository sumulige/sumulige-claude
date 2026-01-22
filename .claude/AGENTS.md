# AGENTS

<skills_system priority="1">

## Agent Orchestration

This project uses **Sumulige Claude** for multi-agent collaboration.

### architect
- **Model**: claude-opus-4-5-20251101
- **Role**: Architecture design and decisions

### builder
- **Model**: claude-opus-4-5-20251101
- **Role**: Code implementation and testing

### conductor
- **Model**: claude-opus-4-5-20251101
- **Role**: Task coordination and decomposition

### librarian
- **Model**: claude-opus-4-5-20251101
- **Role**: Documentation and knowledge

### reviewer
- **Model**: claude-opus-4-5-20251101
- **Role**: Code review and quality check

## Usage

```bash
# View agent status
sumulige-claude status

# Run agent task
sumulige-claude agent <task>

# List skills
sumulige-claude skill:list
```

</skills_system>
