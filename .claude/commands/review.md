---
description: Comprehensive code review with security and quality checks
---

# /review

统一的代码审查命令，合并了代码质量、安全检查、清理建议。

## 使用方式

```bash
/review              # 快速审查（默认）
/review --security   # 安全深扫
/review --clean      # 代码清理建议
/review --all        # 完整审查
```

## 关联 Skill

此命令加载 `quality-guard` skill。

---

## 工作流程

### Step 1: 获取变更

```bash
git status
git diff
git diff --staged
```

### Step 2: 代码质量检查

- [ ] 函数 < 50 行
- [ ] 文件 < 800 行
- [ ] 嵌套深度 < 4 层
- [ ] 命名清晰、语义化
- [ ] 无 console.log 语句
- [ ] 错误处理完善

### Step 3: 安全检查（--security）

- [ ] 无硬编码凭证
- [ ] 无 SQL 注入风险
- [ ] 无 XSS 漏洞
- [ ] 输入验证完整
- [ ] 无不安全依赖

### Step 4: 清理建议（--clean）

```bash
npx knip           # 未使用的导出
npx depcheck       # 未使用的依赖
npx ts-prune       # 未使用的 TS 导出
```

### Step 5: 输出报告

```markdown
# Review Report

## Summary
- 🔴 CRITICAL: X
- 🟠 HIGH: X
- 🟡 MEDIUM: X

## Issues
| File | Line | Severity | Issue | Fix |
|------|------|----------|-------|-----|

## Verdict
✅ APPROVED / ⚠️ NEEDS ATTENTION / ❌ BLOCKED
```

---

## 严重程度

| 级别 | 处理 |
|------|------|
| 🔴 CRITICAL | 必须修复，阻止提交 |
| 🟠 HIGH | 应该修复 |
| 🟡 MEDIUM | 建议修复 |
| 🟢 LOW | 可选 |
