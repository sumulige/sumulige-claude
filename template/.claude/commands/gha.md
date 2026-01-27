---
description: Analyze GitHub Actions CI failures
---

# /gha

分析 GitHub Actions CI 失败，自动检测问题并建议修复方案。

## 使用方式

```bash
/gha <workflow-url>   # 分析指定的 workflow run
/gha --last           # 分析最近失败的 workflow
/gha --flaky          # 检测 flaky tests
/gha --history        # 查看失败历史趋势
```

## 工作流程

### Step 1: 获取 Workflow 信息

```bash
# 获取最近的 workflow runs
gh run list --limit 10

# 获取失败的 run 详情
gh run view <run-id> --log-failed
```

### Step 2: 分析失败原因

检测以下常见问题：

| 问题类型 | 检测方式 | 建议 |
|---------|---------|------|
| **Flaky Test** | 同一测试随机失败 | 添加重试或修复竞态 |
| **Timeout** | 超时错误 | 优化性能或增加限制 |
| **Dependency** | 安装失败 | 检查版本锁定 |
| **Build Error** | 编译错误 | 检查代码变更 |
| **Network** | 网络超时 | 添加重试机制 |
| **Permission** | 权限错误 | 检查 GITHUB_TOKEN |

### Step 3: 生成报告

```markdown
# GHA Analysis Report

## Workflow: [workflow-name]
**Run ID**: [run-id]
**Status**: ❌ Failed
**Duration**: [time]
**Triggered by**: [event]

## Failure Summary

### Job: [job-name]
**Step**: [step-name]
**Error Type**: [类型]

### Error Log
```
[关键错误日志]
```

## Root Cause Analysis

1. **主要原因**: [分析]
2. **相关 Commit**: [commit-sha]
3. **影响范围**: [范围]

## Recommendations

1. [ ] [建议修复 1]
2. [ ] [建议修复 2]

## Quick Fix

```bash
# 快速修复命令
[修复命令]
```

## Similar Failures
- [link to similar run 1]
- [link to similar run 2]
```

### Step 4: 可选操作

```bash
# 重新运行失败的 workflow
gh run rerun <run-id> --failed

# 查看特定 job 日志
gh run view <run-id> --job <job-id> --log
```

---

## 常见问题快速诊断

### Flaky Test 检测

```bash
# 检查最近 10 次运行中同一测试的失败率
gh run list --workflow=test.yml --limit 10 --json conclusion,databaseId
```

### 依赖问题

```bash
# 检查 lockfile 变更
git diff HEAD~1 -- package-lock.json yarn.lock pnpm-lock.yaml
```

### 权限问题

检查 workflow 文件中的 permissions：
```yaml
permissions:
  contents: read
  pull-requests: write
```

---

## 集成 /fix

如果是代码问题，自动调用 `/fix` 修复：

```bash
/gha --last    # 分析失败
/fix --build   # 修复构建错误
/test          # 本地验证
/commit        # 提交修复
```
