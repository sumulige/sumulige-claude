# Phase 2 E2E Test Cases

> **版本**: 1.0
> **日期**: 2026-01-17
> **状态**: ✅ 已完成

---

## 测试概述

本文档定义了 Phase 2（审批阶段）的端到端测试用例。

### 测试范围

| 模块 | 测试内容 |
|------|----------|
| Phase 2 CLI | approve/next/status 命令 |
| Requirements Generation | 需求文档生成 |
| Approval Validator | 需求文档质量检查 |
| Phase Transition | Phase 1 → Phase 2 流转 |

---

## TC-201: Phase 2 启动

### 描述
验证从 Phase 1 进入 Phase 2 的完整流程。

### 前置条件
- Phase 1 可行性报告已生成

### 测试步骤

```bash
# 1. 启动 Phase 2 (使用 next 命令自动选择最新项目)
smc workflow next

# 2. 或者指定项目 ID
smc workflow approve proj_xxx

# 3. 检查 phase2 目录是否创建
ls development/projects/proj_xxx/phase2/

# 4. 查看需求文档
cat development/projects/proj_xxx/phase2/requirements.md
```

### 预期结果

| 步骤 | 预期输出 |
|------|----------|
| 1 | `✅ Phase 2 initialized!` |
| 2 | 同上 |
| 3 | `requirements.md` 文件存在 |
| 4 | 报告包含以下章节：<br>- Executive Summary<br>- Phase 1 Summary<br>- Clarification Questions<br>- Functional Requirements<br>- Non-Functional Requirements<br>- Success Metrics<br>- Edge Cases |

### 实际结果
_(测试后填写)_

### 状态
- [x] 通过
- [ ] 失败

---

## TC-202: 工作流状态查询

### 描述
验证 `smc workflow status` 正确显示 Phase 2 状态。

### 前置条件
- 至少有一个项目已进入 Phase 2

### 测试步骤

```bash
# 查询工作流状态
smc workflow status
```

### 预期结果

| 字段 | 说明 |
|------|------|
| Phase Icon | 🤝 (Phase 2) |
| Phase Number | 2 - Approval |
| Phase 1 Status | ✅ Phase 1: feasibility-report.md |
| Phase 2 Status | ✅ Phase 2: requirements.md |

### 状态
- [x] 通过
- [ ] 失败

---

## TC-203: 需求文档验证

### 描述
验证需求文档质量检查功能。

### 前置条件
- 需求文档已生成

### 测试步骤

```bash
# 验证需求文档
smc workflow validate development/projects/proj_xxx/phase2/requirements.md
```

### 预期结果

| 场景 | 预期输出 |
|------|----------|
| 完整文档 | `✅ PASSED` - 5项检查全部通过 |
| 不完整文档 | `❌ FAILED` - 列出缺失字段 |

### 需求验证检查项

1. **Clear Requirements** (hasClearRequirements) - 需求描述清晰
2. **Acceptance Criteria** (hasAcceptanceCriteria) - 有验收标准
3. **Technical Rationale** (hasTechRationale) - 技术选型有依据
4. **Success Metrics** (hasSuccessMetrics) - 有成功指标
5. **Edge Cases** (hasEdgeCases) - 考虑了边缘情况

### 状态
- [x] 通过
- [ ] 失败

---

## TC-204: 澄清问题生成

### 描述
验证基于 Phase 1 报告自动生成澄清问题。

### 前置条件
- Phase 1 报告包含完整信息

### 测试步骤

```bash
# 查看生成的需求文档
grep -A 50 "Clarification Questions" development/projects/proj_xxx/phase2/requirements.md
```

### 预期结果

生成的澄清问题应包含：
1. **Scope & Priorities** - MVP 范围和优先级
2. **Technical Decisions** - 技术决策确认
3. **Success Definition** - 成功标准定义
4. **Constraints** - 约束条件

### 状态
- [x] 通过
- [ ] 失败

---

## TC-205: approve 命令指定项目

### 描述
验证使用指定项目 ID 启动 Phase 2。

### 前置条件
- 至少有一个已完成 Phase 1 的项目

### 测试步骤

```bash
# 获取项目列表
smc workflow status

# 使用 approve 命令指定项目
smc workflow approve proj_xxx
```

### 预期结果

| 步骤 | 预期输出 |
|------|----------|
| 1 | 列出所有项目及其阶段 |
| 2 | `✅ Phase 2 initialized!` |

### 状态
- [x] 通过
- [ ] 失败

---

## TC-206: 需求文档模板结构

### 描述
验证需求文档模板包含所有必需章节。

### 前置条件
- Phase 2 已启动

### 测试步骤

```bash
# 检查文档章节
grep "^##" development/projects/proj_xxx/phase2/requirements.md
```

### 预期结果

文档应包含以下章节：
- Executive Summary
- Phase 1 Summary
- Clarification Questions & Responses
- Functional Requirements
- Non-Functional Requirements
- Success Metrics
- Edge Cases & Constraints
- Assumptions & Dependencies
- Out of Scope
- Approval Checklist
- Next Steps

### 状态
- [x] 通过
- [ ] 失败

---

## TC-207: 自动验证器检测

### 描述
验证验证器能正确识别不完整的需求文档。

### 前置条件
- 有一个需求文档

### 测试步骤

```bash
# 创建一个不完整的需求文档
cat > /tmp/incomplete-req.md << 'EOF'
# Requirements Document

## Executive Summary
Incomplete document.
EOF

# 验证不完整文档
smc workflow validate /tmp/incomplete-req.md
```

### 预期结果

验证器应返回：
- `❌ FAILED`
- 列出缺失的检查项

### 状态
- [x] 通过
- [ ] 失败

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
| TC-201 | Phase 2 启动 | ✅ 通过 | |
| TC-202 | 工作流状态查询 | ✅ 通过 | 正确显示 Phase 2 状态 |
| TC-203 | 需求文档验证 | ✅ 通过 | 所有检查项通过 |
| TC-204 | 澄清问题生成 | ✅ 通过 | 4类问题已生成 |
| TC-205 | approve 命令指定项目 | ✅ 通过 | |
| TC-206 | 需求文档模板结构 | ✅ 通过 | 所有章节存在 |
| TC-207 | 自动验证器检测 | ✅ 通过 | |

### 通过率
100% (7/7)

---

## 快速测试命令

```bash
# 完整 Phase 2 流程测试
smc workflow start "测试想法"              # Phase 1
smc workflow next                          # Phase 2
smc workflow validate development/projects/*/phase2/requirements.md
smc workflow status                        # 查看状态

# 验证测试
# 创建完整需求文档
smc workflow validate <完整需求文档路径>
# 预期: ✅ PASSED

# 创建不完整需求文档
echo "# Incomplete" > /tmp/test.md
smc workflow validate /tmp/test.md
# 预期: ❌ FAILED with blockers
```
