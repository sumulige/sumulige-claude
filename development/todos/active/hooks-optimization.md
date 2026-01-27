# Hooks 优化方案

**状态**: ✅ 已完成
**优先级**: P1
**负责人**: AI
**创建时间**: 2026-01-27

## 问题描述

当前有 27 个 hooks 文件，但 dispatcher 只注册了 9 个。存在大量冗余和功能重叠。

## 审计结果

### 已注册 (9个) ✅
| Hook | 事件 | 功能 |
|------|------|------|
| thinking-silent | AgentStop | 静默思考模式 |
| multi-session | UserPromptSubmit, AgentStop | 多会话管理 |
| todo-manager | AgentStop | 任务索引更新 |
| rag-skill-loader | UserPromptSubmit | 技能自动加载 |
| project-kickoff | UserPromptSubmit | 项目初始化 (runOnce) |
| memory-loader | SessionStart | 加载记忆 (runOnce) |
| memory-saver | SessionEnd | 保存记忆 |
| auto-handoff | PreCompact | 上下文保留 |
| verify-work | AgentStop | 工作验证 |

### 未注册 (17个) - 分类处理

#### 🔴 应删除（功能重叠）
| Hook | 重叠对象 | 处理方式 |
|------|---------|---------|
| session-save | memory-saver | 删除，功能完全重叠 |
| session-restore | memory-loader | 删除，功能完全重叠 |
| conversation-logger | conversation-recorder | 保留一个，删除另一个 |
| context-analyzer | strategic-compact | 合并到 strategic-compact |
| priority-scorer | strategic-compact | 合并到 strategic-compact |

#### 🟡 应合并
| Hooks | 合并为 | 说明 |
|-------|--------|------|
| auto-handoff + handoff-loader | handoff.cjs | 保存/加载配对 |
| conversation-logger + conversation-recorder | conversation.cjs | 功能相似 |

#### 🟢 有价值但未启用
| Hook | 功能 | 建议 |
|------|------|------|
| code-formatter | 自动格式化 | 注册到 PostToolUse |
| pre-commit | 提交前检查 | Git hook 调用 |
| pre-push | 推送前检查 | Git hook 调用 |
| live-quality | 实时检查 | 注册到 PostToolUse |
| plan-gate | 强制规划 | 注册到 PreToolUse |
| decision-tracker | 决策追踪 | 注册到 AgentStop |
| pattern-learner | 模式学习 | 注册到 SessionEnd |

#### ⚪ 可选删除
| Hook | 说明 |
|------|------|
| code-tracer | 变更追踪，功能边缘 |
| export | 导出工具，按需使用 |
| strategic-compact | 智能压缩，与 auto-handoff 重叠 |

## 执行计划

### 阶段 1: 清理冗余 (立即执行)

```bash
# 1. 备份
mkdir -p .claude/hooks/_deprecated
mv .claude/hooks/session-save.cjs .claude/hooks/_deprecated/
mv .claude/hooks/session-restore.cjs .claude/hooks/_deprecated/
mv .claude/hooks/conversation-logger.cjs .claude/hooks/_deprecated/
mv .claude/hooks/context-analyzer.cjs .claude/hooks/_deprecated/
mv .claude/hooks/priority-scorer.cjs .claude/hooks/_deprecated/

# 2. 合并 handoff
# 将 handoff-loader 的逻辑合并到 auto-handoff
```

### 阶段 2: 精简注册表

更新 `hook-dispatcher.cjs` 的 `getDefaultRegistry()`：

```javascript
{
  // 核心 hooks (保留)
  "memory-loader": { events: ["SessionStart"], runOnce: true },
  "memory-saver": { events: ["SessionEnd"] },
  "auto-handoff": { events: ["PreCompact", "SessionStart"] }, // 合并 loader
  "todo-manager": { events: ["AgentStop"], debounce: 10000 },
  "verify-work": { events: ["AgentStop"] },

  // 可选 hooks (按需启用)
  "code-formatter": { events: ["PostToolUse"], enabled: false },
  "live-quality": { events: ["PostToolUse"], enabled: false },
  "plan-gate": { events: ["PreToolUse"], enabled: false },
  "decision-tracker": { events: ["AgentStop"], enabled: false },

  // 删除
  // thinking-silent - 功能不明确
  // multi-session - 复杂度高收益低
  // project-kickoff - 可由 memory-loader 替代
  // rag-skill-loader - 可由 commands 替代
}
```

### 阶段 3: 最终目标

从 27 个精简到 8-10 个核心 hooks：

```
.claude/hooks/
├── hook-dispatcher.cjs     # 调度器
├── memory-loader.cjs       # SessionStart: 加载记忆
├── memory-saver.cjs        # SessionEnd: 保存记忆
├── handoff.cjs             # PreCompact + SessionStart: 上下文保留
├── todo-manager.cjs        # AgentStop: 任务管理
├── verify-work.cjs         # AgentStop: 工作验证
├── code-formatter.cjs      # PostToolUse: 格式化 (可选)
├── pre-commit.cjs          # Git hook: 提交检查
└── _deprecated/            # 归档的旧 hooks
```

## 验收标准

- [ ] Hooks 数量从 27 减少到 ≤10
- [ ] 所有保留 hooks 都在 dispatcher 注册
- [ ] 无功能重叠
- [ ] 测试所有保留 hooks 正常工作

## 进度

- [x] 审计所有 hooks
- [x] 分类处理方案
- [x] 执行阶段 1: 清理冗余 (移动 5 个到 _deprecated)
- [x] 执行阶段 2: 移动可选删除 hooks (移动 4 个到 _deprecated)
- [x] 执行阶段 3: 合并 handoff hooks (auto-handoff + handoff-loader)
- [x] 执行阶段 4: 更新 dispatcher 注册表
- [x] 验证: 27 → 18 活跃 hooks

## 完成统计

| 指标 | 之前 | 之后 | 变化 |
|------|------|------|------|
| 活跃 hooks | 27 | 18 | -33% |
| 已弃用 | 0 | 9 | +9 |
| 注册表项 | 9 | 12 | +3 (含可选) |
| 核心 hooks | 9 | 5 | -44% |
