# Testing Rules

> 测试规则 - 所有代码必须遵守

## 优先级说明

| 标签 | 含义 | 处理方式 |
|------|------|----------|
| 🔴 CRITICAL | 必须遵守 | 违反将阻止提交 |
| 🟠 HIGH | 应该遵守 | 代码审查必查 |
| 🟡 MEDIUM | 建议遵守 | 提升代码质量 |

---

## 🟠 HIGH: 核心原则 [TEST-001]

**测试先于代码**：使用 TDD 工作流，先写测试再实现。

## 🔴 CRITICAL: 覆盖率要求 [TEST-002]

| 代码类型 | 最低覆盖率 |
|---------|-----------|
| 普通业务逻辑 | 80% |
| 金融计算 | 100% |
| 认证逻辑 | 100% |
| 安全相关代码 | 100% |

## 🔴 CRITICAL: 提交前检查 [TEST-003]

每次提交前必须：

- [ ] 所有测试通过
- [ ] 覆盖率达标（80%+）
- [ ] 新功能有单元测试
- [ ] API 有集成测试
- [ ] 关键流程有 E2E 测试

```bash
# 提交前运行
npm test && npm run lint
```

## 🟠 HIGH: 测试类型要求 [TEST-004]

### 单元测试 (🔴 必须)

- 每个公共函数都有测试
- 测试边界情况（null, empty, max）
- 测试错误路径

### 集成测试 (🟠 必须)

- 每个 API 端点都有测试
- 测试正常响应和错误响应
- Mock 外部依赖

### E2E 测试 (🟡 关键流程)

- 登录/认证流程
- 核心业务流程
- 支付/金融流程

## 🟠 HIGH: 测试反模式 [TEST-005]

❌ **测试实现细节**
```typescript
// 不要测试内部状态
expect(component.state.count).toBe(5)
```

❌ **测试相互依赖**
```typescript
// 每个测试必须独立
test('creates user', () => { ... })
test('updates same user', () => { ... }) // 依赖前一个
```

❌ **固定等待**
```typescript
// 不要用固定时间等待
await page.waitForTimeout(5000)
```

---

## 正确/错误对比示例

### 异步测试

```typescript
// ❌ 错误：忘记 await
test('fetches user', () => {
  const user = fetchUser(1)  // Promise 未等待！
  expect(user.name).toBe('John')  // 总是失败
})

// ❌ 错误：回调地狱
test('creates user', (done) => {
  createUser({ name: 'John' }).then(user => {
    expect(user.name).toBe('John')
    done()
  })
})

// ✅ 正确：async/await
test('fetches user', async () => {
  const user = await fetchUser(1)
  expect(user.name).toBe('John')
})
```

### Mock 使用

```typescript
// ❌ 错误：Mock 真实数据库（测试太慢）
test('creates user', async () => {
  const user = await db.user.create({ data: { name: 'John' } })
  expect(user.name).toBe('John')
})

// ❌ 错误：过度 Mock（测不到真问题）
jest.mock('../services/userService')
jest.mock('../repositories/userRepo')
jest.mock('../utils/validator')
// 一切都是假的，测试毫无意义

// ✅ 正确：只 Mock 外部依赖
jest.mock('../lib/emailClient')  // 外部服务

test('creates user and sends welcome email', async () => {
  const user = await userService.create({ name: 'John', email: 'j@example.com' })

  expect(user.name).toBe('John')
  expect(emailClient.send).toHaveBeenCalledWith({
    to: 'j@example.com',
    subject: 'Welcome!'
  })
})
```

### 测试数据

```typescript
// ❌ 错误：硬编码 ID（脆弱）
test('fetches user', async () => {
  const user = await fetchUser('123e4567-e89b-12d3-a456-426614174000')
})

// ❌ 错误：依赖全局状态
let createdUserId: string

test('creates user', async () => {
  const user = await createUser({ name: 'John' })
  createdUserId = user.id  // 污染其他测试
})

test('fetches user', async () => {
  const user = await fetchUser(createdUserId)  // 依赖上一个测试
})

// ✅ 正确：每个测试独立
describe('UserService', () => {
  let testUser: User

  beforeEach(async () => {
    testUser = await createTestUser()  // 工厂函数
  })

  afterEach(async () => {
    await cleanupTestData()
  })

  test('fetches user', async () => {
    const user = await fetchUser(testUser.id)
    expect(user.name).toBe(testUser.name)
  })
})
```

### 断言方式

```typescript
// ❌ 错误：只测 truthy（不精确）
expect(result).toBeTruthy()
expect(users).toBeTruthy()
expect(count).toBeTruthy()

// ❌ 错误：测试实现细节
expect(component.state.isLoading).toBe(false)
expect(component.instance().handleClick).toBeDefined()

// ✅ 正确：测试行为和输出
expect(result).toEqual({ id: 1, name: 'John' })
expect(users).toHaveLength(3)
expect(count).toBe(42)

// ✅ 正确：测试用户可见的结果
expect(screen.getByText('Loading...')).toBeInTheDocument()
expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
expect(screen.getByRole('button', { name: 'Submit' })).toBeEnabled()
```

## 🟡 MEDIUM: CI 集成 [TEST-006]

CI 流水线必须：

1. 运行所有单元测试
2. 运行所有集成测试
3. 运行 E2E 测试（关键流程）
4. 检查覆盖率阈值
5. 上传测试报告

## 相关命令

- `/tdd` - 测试驱动开发流程
- `/e2e` - E2E 测试生成
- `/test` - 运行测试
- `/test-coverage` - 覆盖率分析
