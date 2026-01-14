# SMC 技能市场 - 用户指南

SMC (Sumulige Claude) 技能市场是一个精选的 AI 编程代理技能集合，支持 Claude Code、GitHub Copilot、Cursor、Windsurf 等多种 AI 工具。

## 目录

- [快速开始](#快速开始)
- [命令参考](#命令参考)
- [技能分类](#技能分类)
- [贡献指南](#贡献指南)
- [常见问题](#常见问题)

---

## 快速开始

### 安装 SMC

```bash
npm install -g sumulige-claude
```

### 初始化

```bash
smc init
```

### 列出可用技能

```bash
smc marketplace:list
```

### 安装技能

```bash
smc marketplace:install dev-browser
```

### 同步外部技能

```bash
smc marketplace:sync
```

---

## 命令参考

### smc marketplace:list

列出市场中所有可用的技能，按分类显示。

```bash
smc marketplace:list
```

**输出示例：**

```
📋 SMC Skill Marketplace
=====================================

🔧 CLI 工具
  zai-cli [native]
    Z.AI vision, search, reader via MCP

🎼 工作流编排
  manus-kickoff [native]
    Manus-style project kickoff workflow
  gastown
    Multi-agent orchestrator

🤖 自动化
  dev-browser [external]
    Browser automation with persistent page state
```

---

### smc marketplace:install <name>

从市场安装指定的技能。

```bash
smc marketplace:install <skill-name>
```

**示例：**

```bash
# 安装浏览器自动化技能
smc marketplace:install dev-browser

# 安装多代理编排技能
smc marketplace:install gastown
```

**说明：**
- Native 技能已经包含在 SMC 中，无需下载
- External 技能会从上游仓库同步

---

### smc marketplace:sync

同步所有外部技能到本地。

```bash
smc marketplace:sync
```

**执行流程：**
1. 读取 `sources.yaml` 中的外部技能配置
2. 克隆上游仓库
3. 复制指定文件到 `template/.claude/skills/`
4. 生成 `.source.json` 源信息文件
5. 更新 `marketplace.json` 注册表

**通常不需要手动执行**，因为 GitHub Actions 会每日自动同步。

---

### smc marketplace:add <repo>

添加外部技能源到 `sources.yaml`。

```bash
smc marketplace:add <owner/repo>
```

**示例：**

```bash
# 添加 n-skills 市场作为源
smc marketplace:add numman-ali/n-skills
```

**说明：**
此命令会在 `sources.yaml` 中添加一个条目，但不会立即同步。你需要：

1. 手动编辑 `sources.yaml` 更新描述和分类
2. 运行 `smc marketplace:sync` 执行同步

---

### smc marketplace:remove <name>

从 `sources.yaml` 移除技能源。

```bash
smc marketplace:remove <skill-name>
```

**注意：** 此命令只从配置文件中移除条目，不会删除已下载的技能文件。如需删除，请手动删除：

```bash
rm -rf template/.claude/skills/*/<skill-name>
```

---

### smc marketplace:status

显示市场状态信息。

```bash
smc marketplace:status
```

**输出示例：**

```
📊 Marketplace Status
=====================================

Registry: .claude-plugin/marketplace.json
Version: 1.0.7
Skills: 5
Updated: 2025-01-14T00:00:00.000Z

Sources: sources.yaml
External sources: 3
Native skills: 2

=====================================
```

---

## 技能分类

| 分类 | 图标 | 说明 |
|------|------|------|
| **tools** | 🔧 | CLI 工具和实用程序 |
| **development** | 💻 | 语言特定开发辅助 |
| **productivity** | ⚡ | 工作流自动化和效率提升 |
| **automation** | 🤖 | 浏览器、CI/CD、系统自动化 |
| **data** | 📊 | 数据库、数据处理和分析 |
| **documentation** | 📚 | 文档、图表、规范生成 |
| **workflow** | 🎼 | 多代理编排和协调 |

---

## 贡献指南

### 提交新技能

我们欢迎高质量的技能贡献！请确保：

1. **技能解决真实问题** - 避免包装器技能
2. **代码清晰** - 有良好的文档和注释
3. **维护活跃** - 技能应持续维护
4. **许可证兼容** - 使用 MIT 或 Apache-2.0

### 提交流程

1. **Fork 仓库**
   ```bash
   git clone https://github.com/sumulige/sumulige-claude.git
   ```

2. **创建技能目录**
   ```bash
   mkdir -p template/.claude/skills/my-skill
   cd template/.claude/skills/my-skill
   ```

3. **创建技能文件**
   - `SKILL.md` - 技能说明
   - `metadata.yaml` - 元数据

4. **更新 sources.yaml**
   ```yaml
   - name: my-skill
     description: "Brief description"
     native: true
     target:
       category: tools
       path: template/.claude/skills/my-skill
     author:
       name: Your Name
       github: yourusername
     license: MIT
     homepage: https://github.com/yourusername/your-repo
   ```

5. **提交 PR**
   ```bash
   git add .
   git commit -m "feat: add my-skill"
   git push
   ```

### 技能格式规范

#### SKILL.md 模板

```markdown
# Skill Name

> A one-line description of what this skill does

## Overview

Detailed description of the skill's purpose and functionality.

## Usage

When the user... use this skill to...

## Examples

Example 1: ...
Example 2: ...

## Requirements

- Requirement 1
- Requirement 2
```

#### metadata.yaml 模板

```yaml
name: skill-name
description: A one-line description
version: 1.0.0
category: tools
keywords:
  - keyword1
  - keyword2
dependencies: []
author:
  name: Your Name
  github: yourusername
license: MIT
```

---

## 常见问题

### Q: 技能和 Agent 有什么区别？

**A:**
- **Agent** 是具有特定角色的 AI 助手（如 Conductor、Architect、Builder）
- **Skill** 是 Agent 可以调用的功能模块（如 PDF 处理、浏览器自动化）

### Q: 我可以在其他 AI 工具中使用这些技能吗？

**A:** 可以！SMC 技能使用通用格式（AGENTS.md + SKILL.md），支持：
- Claude Code
- GitHub Copilot
- Cursor
- Windsurf
- Cline
- OpenCode

### Q: 如何更新已安装的技能？

**A:** 运行同步命令：
```bash
smc marketplace:sync
```

### Q: 技能同步需要多长时间？

**A:** 取决于技能数量和文件大小，通常 30 秒到 2 分钟。

### Q: 同步失败怎么办？

**A:**
1. 检查网络连接
2. 验证 `sources.yaml` 中的仓库地址
3. 查看错误日志
4. 尝试手动同步单个技能

### Q: 可以使用私有仓库的技能吗？

**A:** 目前不支持。私有仓库技能需要手动复制到 `template/.claude/skills/` 目录。

---

## 相关链接

- **项目主页**: https://github.com/sumulige/sumulige-claude
- **问题反馈**: https://github.com/sumulige/sumulige-claude/issues
- **n-skills**: https://github.com/numman-ali/n-skills
- **openskills**: https://github.com/numman-ali/openskills
- **agentskills.io**: https://agentskills.io
