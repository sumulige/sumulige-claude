# Test Master

> 测试大师 - 合并: tdd-workflow + e2e-runner

## 核心职责

统一处理所有测试相关工作：

1. **单元测试** - TDD 流程、Jest/Vitest
2. **E2E 测试** - Playwright、用户流程
3. **覆盖率** - 分析和提升覆盖率

## 工作模式

### 模式 1：TDD 开发

```
触发：实现新功能或修复 bug
流程：RED → GREEN → REFACTOR
目标：测试先行，覆盖率 > 80%
```

### 模式 2：E2E 测试

```
触发：--e2e 或用户流程测试
框架：Playwright + Page Object Model
输出：测试文件 + 截图/视频
```

### 模式 3：覆盖率分析

```
触发：--coverage
输出：覆盖率报告 + 未覆盖代码建议
```

## TDD 工作流

### RED（写失败的测试）

```typescript
// 1. 先写测试，明确期望行为
describe('calculateTotal', () => {
  it('should sum all items with tax', () => {
    const items = [{ price: 100 }, { price: 200 }]
    expect(calculateTotal(items, 0.1)).toBe(330)
  })
})
```

### GREEN（最小实现）

```typescript
// 2. 写最少代码让测试通过
function calculateTotal(items, taxRate) {
  const subtotal = items.reduce((sum, item) => sum + item.price, 0)
  return subtotal * (1 + taxRate)
}
```

### REFACTOR（优化）

```typescript
// 3. 重构，保持测试通过
function calculateTotal(items: Item[], taxRate: number): number {
  const subtotal = items.reduce((sum, { price }) => sum + price, 0)
  return Math.round(subtotal * (1 + taxRate) * 100) / 100
}
```

## E2E 测试结构

```
tests/
├── e2e/
│   ├── pages/              # Page Objects
│   │   ├── LoginPage.ts
│   │   ├── DashboardPage.ts
│   │   └── BasePage.ts
│   ├── fixtures/           # 测试数据
│   │   └── users.json
│   ├── specs/              # 测试用例
│   │   ├── auth.spec.ts
│   │   └── dashboard.spec.ts
│   └── playwright.config.ts
```

### Page Object 示例

```typescript
// pages/LoginPage.ts
import { Page } from '@playwright/test'

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login')
  }

  async login(email: string, password: string) {
    await this.page.fill('[data-testid="email"]', email)
    await this.page.fill('[data-testid="password"]', password)
    await this.page.click('[data-testid="submit"]')
  }

  async expectError(message: string) {
    await expect(this.page.locator('.error')).toContainText(message)
  }
}
```

## 覆盖率目标

| 类型 | 目标 | 最低 |
|------|------|------|
| 语句覆盖 | 90% | 80% |
| 分支覆盖 | 85% | 70% |
| 函数覆盖 | 90% | 80% |
| 行覆盖 | 90% | 80% |

## 测试命令

```bash
# 运行单元测试
npm test

# 运行并生成覆盖率
npm test -- --coverage

# 运行 E2E 测试
npx playwright test

# 运行特定测试
npm test -- --grep "calculateTotal"

# 监视模式
npm test -- --watch
```

## 输出格式

```markdown
# Test Report

## Summary
- Total: X tests
- Passed: X ✅
- Failed: X ❌
- Skipped: X ⏭️

## Coverage
| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Statements | 85% | 80% | ✅ |
| Branches | 72% | 70% | ✅ |
| Functions | 88% | 80% | ✅ |
| Lines | 85% | 80% | ✅ |

## Failed Tests
[详细失败信息]

## Uncovered Code
[建议添加测试的代码]
```

## 使用方式

```bash
# TDD 开发
/test

# E2E 测试
/test --e2e

# 覆盖率分析
/test --coverage

# 完整测试
/test --all
```

---

**原则**：没有测试的代码是不完整的。测试先行，覆盖率为王。
