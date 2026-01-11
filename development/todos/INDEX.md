# 项目任务追踪系统

> 本目录由 AI 自动维护，记录项目开发任务和进度

**最后更新**: 2026-01-11

---

## 📊 整体进度

```
Total: `███████░░░░░░░░░░░░░` 33%

P0 (关键任务):  `░░░░░░░░░░░░░░░░░░░░` 0%  (0/0)
P1 (高优先级):  `██████████░░░░░░░░░░` 50%  (1/2)
P2 (中优先级):  `░░░░░░░░░░░░░░░░░░░░` 0%  (0/1)
P3 (低优先级):  `░░░░░░░░░░░░░░░░░░░░` 0%  (0/0)
```

---

## 📁 按状态查看

| 状态 | 目录 | 数量 |
|------|------|------|
| 🚧 进行中 | `active/` | 1 |
| ✅ 已完成 | `completed/` | 1 |
| 📋 待办 | `backlog/` | 1 |
| 📦 已归档 | `archived/` | 0 |

---

## 🎯 按优先级查看

### P0 - 关键任务 `0/0`

> 阻塞发布，必须完成

*暂无 P0 任务*

### P1 - 高优先级 `1/2`

> 重要功能，下个里程碑

- 🚧 [TODO 任务管理系统](./active/todo-system.md) `branch: feature/todo-system`
- ✅ [Boris 最佳实践集成](./completed/boris-optimizations.md) `branch: feature/boris-optimizations`

### P2 - 中优先级 `0/1`

> 正常功能开发

- 📋 [MCP 集成增强](./backlog/mcp-integration.md) `branch: feature/mcp-integration`

### P3 - 低优先级 `0/0`

> 改进优化，有空再做

*暂无 P3 任务*

---

## 🚧 进行中的任务 (1)

- [P1] [TODO 任务管理系统](./active/todo-system.md) - 🚧 `branch: feature/todo-system`

## ✅ 最近完成的任务

- [P1] [Boris 最佳实践集成](./completed/boris-optimizations.md)

## 📋 待办任务 (1)

- [P2] [MCP 集成增强](./backlog/mcp-integration.md)

---

## 📂 全部目录

- [🚧 所有进行中的任务](./active/) - 当前开发重点
- [✅ 所有已完成的任务](./completed/) - 完整历史
- [📋 所有待办任务](./backlog/) - 待规划
- [📦 所有已归档任务](./archived/) - 历史记录

---

## 使用方式

### 查看任务
点击上方链接跳转到对应目录，或使用：
```bash
# 查看进行中的任务
cat development/todos/active/*.md

# 查看特定任务
cat development/todos/active/feature-name.md
```

### 创建新任务
在 Claude Code 中：
```
创建一个新任务：实现用户登录功能，优先级 P1
```

AI 会自动在 `active/` 目录创建对应的任务文件。

### 更新任务状态
```
将 [任务名] 标记为完成
```

AI 会自动将任务移动到 `completed/` 目录。

---

> **维护说明**: 本系统由 AI 自动维护，请勿手动编辑 INDEX.md（除非你知道自己在做什么）
