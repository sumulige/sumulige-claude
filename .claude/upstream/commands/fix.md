---
description: Quick fix for build, lint, and type errors
---

# /fix

快速修复构建错误、lint 错误、类型错误。

## 使用方式

```bash
/fix              # 自动检测并修复（默认）
/fix --build      # 修复构建错误
/fix --lint       # 修复 lint 错误
/fix --type       # 修复类型错误
/fix --all        # 修复所有错误
```

## 关联 Skill

此命令加载 `quick-fix` skill（使用 haiku 模型，快速响应）。

---

## 工作流程

### Step 1: 错误检测

```bash
# 构建错误
npm run build 2>&1 | head -100

# 类型错误
npx tsc --noEmit 2>&1 | head -50

# Lint 错误
npx eslint . --format json 2>&1 | head -100
```

### Step 2: 错误分类

| 类型 | 示例 | 策略 |
|------|------|------|
| 类型错误 | `TS2345` | 添加类型或断言 |
| 导入错误 | `Cannot find module` | 检查路径 |
| 语法错误 | `Unexpected token` | 修复语法 |
| Lint 错误 | `no-unused-vars` | 删除或使用 |

### Step 3: 增量修复

```
原则：每次只修复一个错误

1. 读取第一个错误
2. 定位文件和行号
3. 应用最小修复
4. 重新编译验证
5. 重复直到全部修复
```

### Step 4: 输出报告

```markdown
# Quick Fix Report

## Errors Found: X
## Fixed: Y
## Remaining: Z

| File | Line | Error | Fix |
|------|------|-------|-----|

## Build Status
✅ SUCCESS / ❌ FAILED
```

---

## 原则

- **快速** - 使用轻量模型
- **最小** - 只做必要修改
- **安全** - 不确定的不修复
