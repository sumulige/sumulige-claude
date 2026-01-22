# Phase 3 E2E Test Cases

> **版本**: 1.0
> **日期**: 2026-01-17
> **状态**: ✅ 已完成

---

## 测试概述

本文档定义了 Phase 3（规划阶段）的端到端测试用例。

### 测试范围

| 模块 | 测试内容 |
|------|----------|
| Phase 3 CLI | next 命令自动进入 Phase 3 |
| PRD Generation | PRD 文档生成 |
| Task Plan Generation | TASK_PLAN.md 生成 |
| Prototype Structure | prototype/ 目录创建 |
| Planning Validator | PRD 和任务计划质量检查 |

---

## TC-301: Phase 3 启动

### 描述
验证从 Phase 2 进入 Phase 3 的完整流程。

### 前置条件
- Phase 2 需求文档已生成

### 测试步骤

```bash
# 使用 next 命令自动进入下一阶段
smc workflow next

# 检查 phase3 目录是否创建
ls development/projects/proj_xxx/phase3/

# 查看生成的文件
cat development/projects/proj_xxx/phase3/PRD.md | head -50
cat development/projects/proj_xxx/phase3/TASK_PLAN.md | head -50
```

### 预期结果

| 步骤 | 预期输出 |
|------|----------|
| 1 | `✅ Phase 3 initialized!` |
| 2 | `phase3/` 目录包含 PRD.md, TASK_PLAN.md, prototype/ |
| 3 | PRD 包含以下章节：<br>- Document Control<br>- Executive Summary<br>- Product Overview<br>- System Architecture<br>- Data Model<br>- API Design<br>- Testing Strategy |

### 状态
- [x] 通过

---

## TC-302: 工作流状态查询

### 描述
验证 `smc workflow status` 正确显示 Phase 3 状态。

### 前置条件
- 至少有一个项目已进入 Phase 3

### 测试步骤

```bash
smc workflow status
```

### 预期结果

| 字段 | 说明 |
|------|------|
| Phase Icon | 📐 (Phase 3) |
| Phase Number | 3 - Planning |
| Phase 1 Status | ✅ Phase 1: feasibility-report.md |
| Phase 2 Status | ✅ Phase 2: requirements.md |
| Phase 3 Status | ✅ Phase 3: PRD.md |

### 状态
- [x] 通过

---

## TC-303: PRD 文档验证

### 描述
验证 PRD 文档质量检查功能。

### 前置条件
- PRD 文档已生成

### 测试步骤

```bash
# 验证 PRD
smc workflow validate development/projects/proj_xxx/phase3/PRD.md
```

### 预期结果

| 场景 | 预期输出 |
|------|----------|
| 完整 PRD | `✅ PASSED` - 6项检查全部通过 |
| 模板 PRD | `❌ FAILED` - 列出需要填充的部分 |

### PRD 验证检查项

1. **PRD Overview** - 产品概述
2. **Architecture Design** - 系统架构设计
3. **Data Model** - 数据模型
4. **API Design** - API 设计
5. **Task Breakdown** - 任务分解
6. **Milestones** - 里程碑

### 状态
- [x] 通过

---

## TC-304: Task Plan 生成

### 描述
验证任务计划文档的生成。

### 前置条件
- Phase 3 已启动

### 测试步骤

```bash
# 查看任务计划
cat development/projects/proj_xxx/phase3/TASK_PLAN.md
```

### 预期结果

任务计划应包含：
- **Overview** - 项目概述
- **Task Breakdown** - 5 个 Sprint 的任务分解
- **Task Dependencies** - 任务依赖关系图
- **Milestones** - 项目里程碑
- **Time Estimates** - 时间估算

### 状态
- [x] 通过

---

## TC-305: Prototype 目录创建

### 描述
验证原型开发目录的创建。

### 前置条件
- Phase 3 已启动

### 测试步骤

```bash
# 查看 prototype 目录
ls -la development/projects/proj_xxx/phase3/prototype/
cat development/projects/proj_xxx/phase3/prototype/README.md
```

### 预期结果

`prototype/` 目录应包含：
- `README.md` - 说明文件

### 状态
- [x] 通过

---

## TC-306: 自动阶段推进

### 描述
验证 `next` 命令能自动检测并推进到下一阶段。

### 前置条件
- 有多个项目处于不同阶段

### 测试步骤

```bash
# 创建一个新的 Phase 1 项目
smc workflow start "测试项目"

# 使用 next 命令
smc workflow next
```

### 预期结果

1. 第一个 `next` 将推进到 Phase 2
2. 第二个 `next` 将推进到 Phase 3

### 状态
- [x] 通过

---

## TC-307: 多阶段项目状态

### 描述
验证状态命令能正确显示多阶段项目。

### 测试步骤

```bash
smc workflow status | grep -E "proj_mkh4y2qk_9lm8z|Phase:"
```

### 预期结果

应显示：
```
📐 proj_mkh4y2qk_9lm8z
   Phase: 3 - Planning
   ✅ Phase 1: feasibility-report.md
   ✅ Phase 2: requirements.md
   ✅ Phase 3: PRD.md
```

### 状态
- [x] 通过

---

## TC-308: PRD 内容继承

### 描述
验证 PRD 从 Phase 2 需求中正确提取信息。

### 前置条件
- Phase 2 需求包含完整信息

### 测试步骤

```bash
# 检查 PRD 中的 Phase 1 摘要
grep -A 10 "Phase 1 Summary" development/projects/proj_xxx/phase3/PRD.md
```

### 预期结果

PRD 应包含从 Phase 1 和 Phase 2 继承的信息：
- Original Idea
- Functional Requirements
- Success Metrics

### 状态
- [x] 通过

---

## 测试执行记录

### 测试环境

| 项目 | 值 |
|------|-----|
| 操作系统 | macOS Darwin 23.6.0 |
| Node.js 版本 | v22.x |
| CLI 版本 | 1.1.2 |

### 执行日期
2026-01-17

### 结果汇总

| 用例编号 | 用例名称 | 状态 | 备注 |
|----------|----------|------|------|
| TC-301 | Phase 3 启动 | ✅ 通过 | |
| TC-302 | 工作流状态查询 | ✅ 通过 | 正确显示 Phase 3 |
| TC-303 | PRD 文档验证 | ✅ 通过 | 验证器正确工作 |
| TC-304 | Task Plan 生成 | ✅ 通过 | 5 Sprint 任务分解 |
| TC-305 | Prototype 目录创建 | ✅ 通过 | |
| TC-306 | 自动阶段推进 | ✅ 通过 | next 命令正常工作 |
| TC-307 | 多阶段项目状态 | ✅ 通过 | |
| TC-308 | PRD 内容继承 | ✅ 通过 | 从 Phase 2 继承信息 |

### 通过率
100% (8/8)

---

## 快速测试命令

```bash
# 完整 Phase 3 流程测试
smc workflow start "测试想法"    # Phase 1
smc workflow next                 # Phase 2
smc workflow next                 # Phase 3

# 验证 PRD
smc workflow validate development/projects/*/phase3/PRD.md

# 查看状态
smc workflow status

# 查看生成的文件
ls -la development/projects/*/phase3/
```
