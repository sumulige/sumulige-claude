# Boris 优化指南

本指南基于 Claude Code 创造者 Boris Cherny 的最佳实践，为 oh-my-claude 项目提供优化建议。

## 已实现的优化

### 1. 验证反馈循环 🔍

**文件**: `.claude/hooks/verify-work.cjs`

**重要性**: ⭐⭐⭐⭐⭐ (最重要！质量提升 2-3 倍)

**功能**:
- 在关键操作后自动提醒验证
- 记录待验证任务列表
- 生成验证日志

**使用方式**:
```bash
# 手动触发验证流程
/verify-work
```

**验证时机**:
- git commit 后 - 运行测试确保功能正常
- git push 后 - 检查 CI/CD 状态
- deploy 后 - 在预发布环境验证
- build 后 - 检查构建产物

---

### 2. Slash Commands ⚡

**目录**: `.claude/commands/`

**可用命令**:

| 命令 | 功能 |
|------|------|
| `/commit-push-pr` | 提交代码、推送、创建 PR |
| `/commit` | 创建 git commit |
| `/pr` | 创建或更新 PR |
| `/test` | 运行测试套件 |
| `/review` | 审查当前更改 |
| `/verify-work` | 查看待验证任务 |
| `/sessions` | 管理并行会话 |

**使用方式**:
```bash
# 快速提交并创建 PR
/commit-push-pr

# 审查更改后再提交
/review
/commit

# 运行测试
/test
```

---

### 3. 代码格式化 Hook 🎨

**文件**: `.claude/hooks/code-formatter.cjs`

**功能**:
- 在代码编辑后自动格式化
- 支持多种语言和格式化工具
- 静默运行，不打扰工作流

**支持的语言**:
- JavaScript/TypeScript (Prettier)
- Python (Black)
- Rust (rustfmt)
- Go (gofmt)
- JSON/YAML/Markdown (Prettier)

**调试模式**:
```bash
export DEBUG_FORMATTER=1
```

---

### 4. 并行多会话支持 🔄

**文件**: `.claude/hooks/multi-session.cjs`

**功能**:
- 跟踪活跃的并行会话
- 为每个会话分配编号 (1-10)
- 自动清理过期会话

**Boris 的工作流**:
```
终端标签 1: Conductor (协调/规划)
终端标签 2: Architect (设计/架构)
终端标签 3: Builder (实现)
终端标签 4: Reviewer (审查)
终端标签 5: Explorer (研究)

+ 5-10 个 claude.ai/code Web 会话
```

**使用方式**:
```bash
# 查看所有活跃会话
/sessions

# 或直接运行
node .claude/hooks/multi-session.cjs --status
```

---

## 配置更新

所有 hooks 已添加到 `.claude/settings.json`:

```json
{
  "matcher": "UserPromptSubmit|PreToolUse|PostToolUse|AgentStop",
  "hooks": [
    { "command": "...project-kickoff.cjs", "timeout": 1 },
    { "command": "...thinking-silent.cjs", "timeout": 1 },
    { "command": "...rag-skill-loader.cjs", "timeout": 1 },
    { "command": "...code-formatter.cjs", "timeout": 5 },
    { "command": "...verify-work.cjs", "timeout": 1 },
    { "command": "...multi-session.cjs", "timeout": 1 }
  ]
}
```

---

## 最佳实践总结

### 启动会话
1. **Plan 模式开始** (Shift+Tab 两次)
2. 批准计划后切换到 auto-accept 模式
3. 使用 `/commit-push-pr` 完成工作流

### 并行工作
1. 开启 5 个终端标签页
2. 每个标签运行不同的 agent/任务
3. 使用系统通知跟踪进度
4. 同时使用 claude.ai/code Web 会话

### 验证工作
1. 每次提交前 `/review`
2. 提交后 `/test` 验证
3. 定期 `/verify-work` 查看待验证项
4. 使用 background agent 验证长时间任务

### 团队协作
1. 共享 CLAUDE.md 到 git
2. PR 审查时使用 @.claude 添加规范
3. 定期更新团队知识库

---

## 额外资源

- [Claude Code 文档](https://code.claude.com)
- [Boris 的 Twitter Thread](https://twitter-thread.com/t/2007179832300581177)
- [Claude Chrome Extension](https://code.claude.com/docs/en/chrome)
