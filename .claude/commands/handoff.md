---
description: Generate context handoff document for session continuity
---

# /handoff

生成上下文交接文档，用于会话切换或新对话开始时的上下文传递。

## 使用方式

```bash
/handoff              # 生成交接文档（默认）
/handoff --save       # 保存到 .claude/handoffs/
/handoff --compact    # 生成精简版本
```

## 工作流程

### Step 1: 收集当前上下文

分析当前会话，提取以下信息：

1. **任务概述** - 当前正在做什么
2. **已完成工作** - 完成了哪些步骤
3. **阻塞点** - 遇到了什么问题
4. **下一步行动** - 接下来要做什么
5. **关键文件** - 涉及的重要文件

### Step 2: 生成交接文档

```markdown
# Handoff: [任务名称]

**Date**: YYYY-MM-DD HH:mm
**Session**: [session-id]

## Summary
[一句话描述当前任务]

## Progress
- [x] 已完成的步骤 1
- [x] 已完成的步骤 2
- [ ] 进行中的步骤

## Blockers
- [阻塞点描述]
- [需要解决的问题]

## Next Steps
1. [下一步行动 1]
2. [下一步行动 2]

## Key Files
| File | Purpose |
|------|---------|
| `path/to/file.ts` | [文件作用] |

## Context
[重要的技术决策或上下文信息]

## Commands to Continue
```bash
# 继续工作的命令
cd /path/to/project
# 相关命令...
```
```

### Step 3: 保存（可选）

如果使用 `--save`，保存到：
```
.claude/handoffs/
└── handoff-YYYY-MM-DD-HHmm.md
```

---

## 最佳实践

1. **定期生成** - 长会话每 30 分钟生成一次
2. **上下文过长时** - 使用 `/compact` 后生成 handoff
3. **切换任务前** - 保存当前上下文
4. **新会话开始** - 读取最近的 handoff 文档

## 与 MEMORY.md 的区别

| 特性 | /handoff | MEMORY.md |
|------|----------|-----------|
| 目的 | 会话交接 | 长期记忆 |
| 粒度 | 当前任务 | 项目全局 |
| 更新频率 | 每次会话 | 重大变更 |
| 格式 | 结构化文档 | 增量记录 |
