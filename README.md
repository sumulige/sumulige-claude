# Oh My Claude

> The Best Agent Harness for Claude Code

Oh My Claude 是一个专为 Claude Code 设计的配置管理和 Agent 编排框架，灵感来自 [oh-my-opencode](https://github.com/code-yeongyu/oh-my-opencode)。

## 特性

- 🤖 **多 Agent 协作** - 专业 Agent 分工协作完成复杂任务
- 📦 **技能管理** - 统一管理和加载 Claude Skills
- 🎯 **任务编排** - 持续任务追踪，确保完成
- 🔧 **配置同步** - 跨项目配置同步和管理
- 📊 **会话记忆** - ThinkingLens 对话历史追踪
- 🌐 **MCP 集成** - Model Context Protocol 支持

## 快速开始

```bash
# 全局安装
npm install -g oh-my-claude

# 初始化配置
oh-my-claude init

# 同步到当前项目
oh-my-claude sync

# 启动 Agent 编排
oh-my-claude agent <task>
```

## Agent 团队

| Agent | 模型 | 职责 |
|-------|------|------|
| **Conductor** | Claude Opus 4.5 | 总协调，任务分解 |
| **Architect** | Claude Sonnet 4.5 | 架构设计，技术决策 |
| **Builder** | Claude Sonnet 4.5 | 代码实现，单元测试 |
| **Reviewer** | Claude Haiku 4.5 | 代码审查，质量检查 |
| **Librarian** | Claude Sonnet 4.5 | 文档编写，知识整理 |

## 配置文件

`~/.claude/config.json`:
```json
{
  "agents": {
    "conductor": { "model": "claude-opus-4.5" },
    "architect": { "model": "claude-sonnet-4.5" },
    "builder": { "model": "claude-sonnet-4.5" },
    "reviewer": { "model": "claude-haiku-4.5" }
  },
  "skills": [
    "anthropics/skills",
    "numman-ali/n-skills"
  ],
  "hooks": {
    "pre-task": [".claude/hooks/pre-task.sh"],
    "post-task": [".claude/hooks/post-task.sh"]
  }
}
```

## License

MIT

---

**Inspired by** [oh-my-opencode](https://github.com/code-yeongyu/oh-my-opencode)
