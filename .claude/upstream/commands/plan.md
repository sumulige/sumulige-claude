---
description: Plan implementation with architecture design
---

# /plan

为功能或任务创建实现计划，支持快速规划和深度设计。

## 使用方式

```bash
/plan              # 快速规划（默认）
/plan --deep       # 深度设计（架构决策）
/plan --arch       # 仅架构设计
```

## 关联 Skill

此命令加载 `design-brain` skill（复杂任务使用 opus）。

---

## 工作流程

### 快速规划（默认）

```markdown
# Plan: [功能名称]

## Goal
[一句话描述]

## Steps
1. [ ] [步骤 1]
2. [ ] [步骤 2]
3. [ ] [步骤 3]

## Files
- `path/to/file.ts` - [修改内容]

## Risk
- [主要风险] → [缓解策略]
```

### 深度设计（--deep）

```markdown
# Design: [系统名称]

## Overview
[背景和目标]

## Architecture
[组件图 + 数据流]

## Technical Decisions
| Decision | Choice | Reason | Trade-offs |
|----------|--------|--------|------------|

## Implementation Plan
### Phase 1: [阶段名]
1. [ ] Step 1
2. [ ] Step 2

## Risks
| Risk | Impact | Mitigation |
|------|--------|------------|

## Success Criteria
- [ ] 标准 1
- [ ] 标准 2
```

---

## 设计原则

1. **简单优于复杂** - 能用简单方案就不要复杂化
2. **最小变更** - 优先复用现有代码
3. **可测试性** - 每个步骤都可验证

## 使用场景

| 场景 | 推荐模式 |
|------|---------|
| 小功能/bug 修复 | 快速规划 |
| 新模块/系统 | 深度设计 |
| 技术选型 | --arch |
