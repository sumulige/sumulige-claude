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
```

---

## 使用指南

### 1. 基本命令

```bash
# 查看状态（已配置的 Agent 和技能）
oh-my-claude status

# 列出所有已安装的技能
oh-my-claude skill:list
```

### 2. 项目同步

将 oh-my-claude 同步到你的项目：

```bash
cd /path/to/your/project
oh-my-claude sync
```

这会创建 `.claude/AGENTS.md` 文件，Claude Code 会自动识别。

### 3. 在 Claude Code 中使用

同步后，在 Claude Code 对话中：

```
帮我用 frontend-design 技能创建一个登录页面
```

或者指定 Agent：

```
让 Builder Agent 实现一个 REST API
```

### 4. 安装新技能

```bash
# 安装 Anthropic 官方技能
oh-my-claude skill:install anthropics/skills

# 安装第三方技能
oh-my-claude skill:install numman-ali/n-skills
```

### 5. 查看技能内容

在 Claude Code 中：

```
用 openskills read frontend-design
```

### 6. 自定义配置

编辑 `~/.claude/config.json`：

```json
{
  "agents": {
    "conductor": { "model": "claude-opus-4.5", "role": "总协调" },
    "builder": { "model": "claude-sonnet-4.5", "role": "代码实现" }
  },
  "skills": ["anthropics/skills", "your-custom-skills"]
}
```

修改后运行 `oh-my-claude sync` 更新项目。

---

## Agent 团队

| Agent | 模型 | 职责 |
|-------|------|------|
| **Conductor** | Claude Opus 4.5 | 总协调，任务分解 |
| **Architect** | Claude Sonnet 4.5 | 架构设计，技术决策 |
| **Builder** | Claude Sonnet 4.5 | 代码实现，单元测试 |
| **Reviewer** | Claude Haiku 4.5 | 代码审查，质量检查 |
| **Librarian** | Claude Sonnet 4.5 | 文档编写，知识整理 |

---

## 命令参考

| 命令 | 说明 |
|------|------|
| `oh-my-claude init` | 初始化配置 |
| `oh-my-claude sync` | 同步到当前项目 |
| `oh-my-claude status` | 查看配置状态 |
| `oh-my-claude skill:list` | 列出已安装技能 |
| `oh-my-claude skill:install <source>` | 安装新技能 |
| `oh-my-claude agent <task>` | 启动 Agent 编排 |

---

## 配置文件

**默认配置位置**: `~/.claude/config.json`

```json
{
  "version": "1.0.0",
  "agents": {
    "conductor": { "model": "claude-opus-4.5" },
    "architect": { "model": "claude-sonnet-4.5" },
    "builder": { "model": "claude-sonnet-4.5" },
    "reviewer": { "model": "claude-haiku-4.5" },
    "librarian": { "model": "claude-sonnet-4.5" }
  },
  "skills": [
    "anthropics/skills",
    "numman-ali/n-skills"
  ],
  "thinkingLens": {
    "enabled": true,
    "autoSync": true,
    "syncInterval": 20
  }
}
```

---

## License

MIT

---

**Inspired by** [oh-my-opencode](https://github.com/code-yeongyu/oh-my-opencode)
