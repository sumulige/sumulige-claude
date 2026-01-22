---
description: Run tests with TDD workflow, E2E, and coverage support
---

# /test

统一的测试命令，合并了 TDD、E2E、覆盖率分析。

## 使用方式

```bash
/test              # 运行单元测试（默认）
/test --e2e        # 运行 E2E 测试
/test --coverage   # 生成覆盖率报告
/test --tdd        # TDD 开发模式
/test --all        # 完整测试套件
```

## 关联 Skill

此命令加载 `test-master` skill。

---

## 工作流程

### Step 1: 检测测试框架

```bash
cat package.json | grep -E '"test"|"jest"|"vitest"|"playwright"'
```

### Step 2: 运行测试

```bash
# 单元测试
npm test

# E2E 测试
npx playwright test

# 覆盖率
npm test -- --coverage
```

### Step 3: TDD 模式（--tdd）

遵循 RED → GREEN → REFACTOR 循环：

1. **RED** - 写失败的测试
2. **GREEN** - 最小实现让测试通过
3. **REFACTOR** - 优化代码，保持测试通过

### Step 4: E2E 模式（--e2e）

使用 Playwright + Page Object Model：

```
tests/e2e/
├── pages/         # Page Objects
├── fixtures/      # 测试数据
└── specs/         # 测试用例
```

### Step 5: 覆盖率报告（--coverage）

```markdown
# Coverage Report

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Statements | 85% | 80% | ✅ |
| Branches | 72% | 70% | ✅ |
| Functions | 88% | 80% | ✅ |
| Lines | 85% | 80% | ✅ |

## Uncovered Code
[需要添加测试的代码]
```

---

## 覆盖率目标

| 类型 | 目标 | 最低 |
|------|------|------|
| 语句 | 90% | 80% |
| 分支 | 85% | 70% |
| 函数 | 90% | 80% |
| 行 | 90% | 80% |
