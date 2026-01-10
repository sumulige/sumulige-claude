# AGENTS

<skills_system priority="1">

## Agent Orchestration

This project uses **Oh My Claude** for multi-agent collaboration.

### conductor
- **Model**: claude-opus-4.5
- **Role**: Task coordination and decomposition

### architect
- **Model**: claude-sonnet-4.5
- **Role**: Architecture design and decisions

### builder
- **Model**: claude-sonnet-4.5
- **Role**: Code implementation and testing

### reviewer
- **Model**: claude-haiku-4.5
- **Role**: Code review and quality check

### librarian
- **Model**: claude-sonnet-4.5
- **Role**: Documentation and knowledge

## Usage

```bash
# View agent status
oh-my-claude status

# Run agent task
oh-my-claude agent <task>

# List skills
oh-my-claude skill:list
```

</skills_system>
