---
description: Safe code refactoring and cleanup
---

# /refactor

安全的代码重构和清理。

## 使用方式

```bash
/refactor              # 分析并建议清理（默认）
/refactor --dead       # 查找死代码
/refactor --deps       # 查找未使用依赖
/refactor --duplicate  # 查找重复代码
/refactor --execute    # 执行清理（需确认）
```

## 关联 Skill

此命令加载 `quality-guard` skill（清理模式）。

---

## 工作流程

### Step 1: 运行分析工具

```bash
# 未使用的文件、导出、依赖
npx knip

# 未使用的 npm 依赖
npx depcheck

# 未使用的 TypeScript 导出
npx ts-prune

# 未使用的 eslint-disable
npx eslint . --report-unused-disable-directives
```

### Step 2: 风险分类

| 风险 | 类型 | 处理 |
|------|------|------|
| 🟢 SAFE | 未使用导出、测试文件 | 可直接删除 |
| 🟡 CAREFUL | 动态导入可能使用 | 需验证 |
| 🔴 RISKY | 公共 API、配置文件 | 谨慎处理 |

### Step 3: 生成报告

```markdown
# Refactor Report

## Dead Code
| File | Type | Risk | Reason |
|------|------|------|--------|

## Unused Dependencies
| Package | Size | Last Used |
|---------|------|-----------|

## Duplicate Code
| Location 1 | Location 2 | Lines |
|------------|------------|-------|

## Recommended Actions
1. [ ] Remove unused-package (SAFE)
2. [ ] Delete src/old.ts (SAFE)
3. [ ] Review src/utils.ts (CAREFUL)

## Impact
- Files to delete: X
- Dependencies to remove: Y
- Lines of code: -Z
```

### Step 4: 执行清理（--execute）

```
⚠️ 执行前：
1. 创建备份分支
2. 确保测试通过
3. 逐个删除，每删一个运行测试
4. 记录到 DELETION_LOG.md
```

---

## 安全检查清单

删除前：
- [ ] grep 所有引用
- [ ] 检查动态导入
- [ ] 查看 git 历史
- [ ] 运行所有测试

删除后：
- [ ] 构建成功
- [ ] 测试通过
- [ ] 提交变更
