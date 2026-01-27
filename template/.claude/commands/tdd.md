---
description: Guide Test-Driven Development workflow (Red-Green-Refactor)
---

# /tdd - Test-Driven Development Workflow

Guide the complete TDD cycle: write tests first, then implement.

## Usage

```
/tdd                    # Start TDD workflow for new feature
/tdd <feature-name>     # Start TDD for specific feature
/tdd --from-todo        # Start TDD from active todo task
/tdd --continue         # Continue from current step
```

---

## Integration with /todos

`/tdd` 与任务系统 `/todos` 无缝集成：

```
/todos: 创建任务 "实现用户认证"
    ↓
/tdd --from-todo: 从任务开始 TDD 流程
    ├── Step 1: 读取任务描述作为 User Story
    ├── Step 2-6: TDD 循环（自动更新任务进度）
    └── Step 7: 完成后标记任务状态
    ↓
/todos: 任务自动标记为完成
```

### 进度映射

| TDD Step | Todo 进度 |
|----------|-----------|
| Step 1: User Story | `[x] Planning` |
| Step 2-5: RED → GREEN | `[x] In progress` |
| Step 6: Refactor | `[x] Testing` |
| Step 7: Coverage OK | `[x] Review` → **Complete** |

### 从 Todo 开始 TDD

```
/tdd --from-todo
```

1. 读取 `development/todos/active/` 中的任务
2. 用户选择要开发的任务
3. 提取任务描述作为 User Story
4. 开始 TDD 循环
5. 完成后自动更新任务状态

---

## The 7-Step TDD Cycle

### Step 1: Define Requirements (User Story)

Before writing any code, define what you're building.

**If using `--from-todo`:**
1. 读取任务文件中的描述和子任务
2. 将子任务转换为验收标准
3. 确认或补充需求

**Otherwise:**
```markdown
## User Story

As a [user type],
I want to [action],
So that [benefit].

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3
```

**Ask the user:** What feature are we building? What are the acceptance criteria?

**Todo 进度更新:** `[x] Planning`

---

### Step 2: Write Tests First (RED)

Create test file BEFORE implementation:

```javascript
// Example: tests/feature.test.js
describe('Feature Name', () => {
  // Happy path
  test('should do X when Y', () => {
    // Arrange
    const input = ...;

    // Act
    const result = feature(input);

    // Assert
    expect(result).toBe(expected);
  });

  // Edge cases
  test('should handle empty input', () => { ... });
  test('should handle null input', () => { ... });

  // Error cases
  test('should throw error when invalid', () => { ... });
});
```

**Test Categories to Cover:**

| Category | Examples |
|----------|----------|
| Happy path | Normal successful operation |
| Edge cases | Empty, null, max values, boundaries |
| Error cases | Invalid input, network failures |
| Security | Injection, auth bypass attempts |

---

### Step 3: Run Tests - Expect Failure

```bash
npm test
# or
/test
```

**Expected Result:** Tests should FAIL (RED)

If tests pass without implementation, your tests are not testing the right thing!

---

### Step 4: Minimal Implementation (GREEN)

Write the **minimum code** to make tests pass:

```javascript
// Example: lib/feature.js
function feature(input) {
  // Only implement what's needed to pass tests
  // No premature optimization
  // No extra features
}
```

**Rules:**
- Only write code that makes a failing test pass
- Don't add features not covered by tests
- Keep it simple and stupid (KISS)

**Todo 进度更新:** `[x] In progress`

---

### Step 5: Run Tests - Expect Pass

```bash
npm test
# or
/test
```

**Expected Result:** All tests should PASS (GREEN)

If tests fail:
1. Check the failing test
2. Fix the implementation
3. Re-run until green

---

### Step 6: Refactor (Keep Green)

Improve code quality while keeping tests green:

**Refactoring Checklist:**
- [ ] Remove code duplication
- [ ] Improve naming (variables, functions)
- [ ] Extract helper functions
- [ ] Simplify complex logic
- [ ] Add error handling if missing

**After each refactor:**

```bash
npm test  # Must still be GREEN
```

**Todo 进度更新:** `[x] Testing`

---

### Step 7: Verify Coverage

```bash
npm run test:coverage
# or
/test --coverage
```

**Coverage Requirements** (from `.claude/rules/testing.md`):

| Code Type | Minimum Coverage |
|-----------|------------------|
| General business logic | 80% |
| Financial calculations | 100% |
| Authentication logic | 100% |
| Security-related code | 100% |

**Todo 进度更新:** `[x] Review` → **Complete**

---

## Test Types Guide

### Unit Tests (Required)

Test individual functions/components in isolation:

```javascript
// Mock dependencies
jest.mock('../lib/database');

test('processOrder calculates total correctly', () => {
  const order = { items: [{ price: 10, qty: 2 }] };
  expect(processOrder(order).total).toBe(20);
});
```

### Integration Tests (Required for APIs)

Test API endpoints with real/mock database:

```javascript
describe('POST /api/users', () => {
  test('creates user and returns 201', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ name: 'Test', email: 'test@example.com' });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
  });
});
```

### E2E Tests (Required for Critical Flows)

Test complete user workflows:

```javascript
// Using Playwright
test('user can complete checkout', async ({ page }) => {
  await page.goto('/products');
  await page.click('[data-testid="add-to-cart"]');
  await page.click('[data-testid="checkout"]');
  await page.fill('[name="card"]', '4242424242424242');
  await page.click('[type="submit"]');
  await expect(page.locator('.success')).toBeVisible();
});
```

---

## Anti-Patterns to Avoid

| Anti-Pattern | Problem | Solution |
|--------------|---------|----------|
| Testing implementation | Brittle tests | Test behavior/output |
| Shared test state | Flaky tests | Isolate each test |
| Magic numbers | Unclear intent | Use named constants |
| No assertions | False positives | Always assert |
| Testing private methods | Over-coupling | Test public API |

---

## TDD Workflow Diagram

```
         +-------+
         | START |
         +---+---+
             |
             v
    +--------+--------+
    | 1. User Story   |
    +--------+--------+
             |
             v
    +--------+--------+
    | 2. Write Tests  | <----+
    +--------+--------+      |
             |               |
             v               |
    +--------+--------+      |
    | 3. Run Tests    |      |
    |    (RED)        |      |
    +--------+--------+      |
             |               |
             v               |
    +--------+--------+      |
    | 4. Implement    |      |
    +--------+--------+      |
             |               |
             v               |
    +--------+--------+      |
    | 5. Run Tests    |      |
    |    (GREEN)      |------+ (if fail)
    +--------+--------+
             |
             v
    +--------+--------+
    | 6. Refactor     |
    +--------+--------+
             |
             v
    +--------+--------+
    | 7. Coverage OK? |--NO--> Add more tests
    +--------+--------+
             |
            YES
             |
             v
         +-------+
         |  DONE |
         +-------+
```

---

## Quick Reference

```bash
# Create test file
touch tests/feature.test.js

# Run tests (watch mode)
npm test -- --watch

# Run with coverage
npm run test:coverage

# Run specific test
npm test -- --grep "feature name"
```

---

## Next Steps After TDD

When TDD cycle is complete:

```
1. 更新 Todo 状态（如果从 todo 开始）
   → 移动任务文件到 development/todos/completed/

2. /verify    # Run full verification before commit

3. /commit    # Create commit

4. /pr        # Create pull request
```

### 完整工作流示例

```
# 1. 创建任务
/todos create "实现用户登录功能"

# 2. 用 TDD 开发
/tdd --from-todo
→ 选择 "用户登录功能" 任务
→ 执行 7 步 TDD 循环

# 3. TDD 完成后，任务自动更新
→ development/todos/active/user-login.md
   移动到 completed/

# 4. 验证并提交
/verify
/commit
```
