---
description: Manage project todos and tasks
---

Manage project tasks in the development/todos directory.

## Show Task Overview

Display the task overview:

```bash
cat development/todos/INDEX.md
```

## Task Operations

### Task Types (v2.0)

任务管理系统支持 R-D-T 三阶段生命周期：

```
Research (研究) → Develop (开发) → Test (测试) → Done (完成)
```

| 类型 | 图标 | 目录 | 说明 |
|------|------|------|------|
| Research | 📊 | `active/research/` | 调研/设计/探索 |
| Develop | 💻 | `active/develop/` | 实现/编码/重构 |
| Test | 🧪 | `active/test/` | 测试/验证/QA |

### Task Templates

使用 `.claude/templates/tasks/` 中的模板创建任务：

- **研究任务**: `.claude/templates/tasks/research.md`
- **开发任务**: `.claude/templates/tasks/develop.md`
- **测试任务**: `.claude/templates/tasks/test.md`

### Create a New Task

When user asks to create a task:
1. Determine the task type (research/develop/test)
2. Create file in `development/todos/active/{type}/`
3. Use kebab-case for filename (e.g., `user-authentication.md`)
4. Copy from the corresponding template

#### Task Template (Legacy Format)

```markdown
# [Task Name]

**状态**: 🚧 进行中
**优先级**: P0/P1/P2/P3
**负责人**: AI/Human
**分支**: `feature/xxx`
**创建时间**: YYYY-MM-DD
**预计完成**: YYYY-MM-DD

## 描述

[Task description]

## 子任务

- [ ] Subtask 1
- [ ] Subtask 2

## 依赖

- [Dependencies]

## 进度

- [x] Planning
- [ ] In progress
- [ ] Testing
- [ ] Review

## 备注

[Notes]
```

### Update Task Status

To move a task:
- **Complete**: Move from `active/{type}/` to `completed/{type}/`
- **Backlog**: Move from `active/{type}/` to `backlog/{type}/`
- **Archive**: Move from `completed/{type}/` to `archived/{type}/`

Example: Move `active/develop/auth.md` → `completed/develop/auth.md`

### Auto-Transition Suggestions

When a develop task is completed, the todo-manager will suggest creating a corresponding test task. Check with:

```bash
node .claude/hooks/todo-manager.cjs --suggest
```

### Update Task Progress

Edit the task file and update:
- Subtask checkboxes
- Progress checklist
- Add notes

## Refresh Task Index

After any task changes, refresh the index:

```bash
node .claude/hooks/todo-manager.cjs --force
```

## Task Priority Levels

| Priority | Usage |
|----------|-------|
| P0 | Critical - blocks release |
| P1 | High - important for next milestone |
| P2 | Medium - normal feature work |
| P3 | Low - nice to have |

## Examples

User says: "Create a task for implementing user authentication"
→ Create `active/user-authentication.md`

User says: "Mark the login task as complete"
→ Move `active/login.md` to `completed/login.md`

User says: "Show all active tasks"
→ List all files in `development/todos/active/`
