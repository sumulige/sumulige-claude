# 项目锚点索引

> 快速定位关键模块

---

## 核心目录

| 目录 | 说明 | 关键文件 |
|------|------|---------|
| `.claude/hooks/` | 自动化脚本 | `tl-summary.sh`, `multi-session.cjs` |
| `.claude/thinking-routes/` | 对话流数据 | `.conversation-flow.json` |
| `.claude/commands/` | 技能命令定义 | `todos.md`, `sessions.md`, `commit.md` |
| `.claude/sessions/` | 会话管理 | `active-sessions.json` |
| `.claude/skills/` | 知识库 | 用户自定义技能 |
| `template/.claude/` | 模板库 | 所有模板源头 |
| `development/todos/` | 任务追踪 | `INDEX.md` |

---

## 快速命令

| 命令 | 效果 |
|------|------|
| `tl` | 查看今日对话摘要 |
| `log` | 查看完整项目日志 |
| `memory` | 查看最近变更 |
| `smc status` | 查看会话状态 |

---

## 设计系统

| 文件 | 用途 |
|------|------|
| `.claude/rules/design-philosophy.md` | **核心哲学** - Steve Jobs/Jony Ive 设计原则 |
| `.claude/rules/web-design-standard.md` | 技术规范 - 排版、间距、组件标准 |
| `.claude/skills/design-audit/SKILL.md` | 审计协议 - 15 维度系统性审计 |
| `.claude/skills/frontend-design/SKILL.md` | 前端美学 - 创意方向指南 |
| `.claude/commands/design-audit.md` | 快速入口 - `/design-audit` 命令 |

---

## 关键文件

| 文件 | 用途 |
|------|------|
| `cli.js` | 主 CLI 入口 (30KB) |
| `package.json` | 项目配置 |
| `PROJECT_STRUCTURE.md` | 项目结构说明 |
| `Q&A.md` | 常见问题 |
| `README.md` | 项目说明 |
