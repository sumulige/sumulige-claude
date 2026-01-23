# React & Node.js Best Practices

> AI Agent 编写正确代码的知识包 - 灵感来自 Supabase Agent Skills

## 规则分类（按优先级）

| 优先级 | 类别 | 说明 |
|--------|------|------|
| 🔴 Critical | 安全 & 性能 | 必须遵守，违反将阻止提交 |
| 🟠 High | 架构 & 模式 | 应该遵守，影响可维护性 |
| 🟡 Medium | 代码质量 | 建议遵守，提升代码质量 |
| 🟢 Low | 风格偏好 | 可选遵守，团队约定 |

---

## 🔴 Critical: 安全规则

### SEC-001: 环境变量处理

```typescript
// ❌ 错误：硬编码密钥
const apiKey = "sk-proj-xxxxx"
const dbUrl = "postgres://user:pass@localhost/db"

// ✅ 正确：环境变量
const apiKey = process.env.API_KEY
if (!apiKey) throw new Error('API_KEY not configured')

// ✅ 正确：使用 zod 验证环境变量
import { z } from 'zod'
const envSchema = z.object({
  API_KEY: z.string().min(1),
  DATABASE_URL: z.string().url(),
})
const env = envSchema.parse(process.env)
```

### SEC-002: 用户输入验证

```typescript
// ❌ 错误：信任用户输入
app.post('/user', (req, res) => {
  db.query(`SELECT * FROM users WHERE id = ${req.body.id}`)
})

// ✅ 正确：参数化查询 + 验证
import { z } from 'zod'
const userIdSchema = z.string().uuid()

app.post('/user', (req, res) => {
  const id = userIdSchema.parse(req.body.id)
  db.query('SELECT * FROM users WHERE id = $1', [id])
})
```

### SEC-003: 敏感数据不入日志

```typescript
// ❌ 错误：记录敏感信息
console.log('User login:', { email, password, token })
logger.info('Payment:', { cardNumber, cvv })

// ✅ 正确：脱敏处理
console.log('User login:', { email, password: '[REDACTED]' })
logger.info('Payment:', { cardLast4: card.slice(-4) })
```

### SEC-004: XSS 防护

```tsx
// ❌ 错误：直接渲染用户内容
<div dangerouslySetInnerHTML={{ __html: userContent }} />

// ✅ 正确：使用 DOMPurify 或避免 dangerouslySetInnerHTML
import DOMPurify from 'dompurify'
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userContent) }} />

// ✅ 更好：直接渲染文本
<div>{userContent}</div>
```

---

## 🔴 Critical: 性能规则

### PERF-001: 避免 useEffect 瀑布

```tsx
// ❌ 错误：串行请求
useEffect(() => {
  fetchUser().then(user => {
    fetchPosts(user.id).then(posts => {
      fetchComments(posts[0].id)
    })
  })
}, [])

// ✅ 正确：并行请求
useEffect(() => {
  Promise.all([
    fetchUser(),
    fetchPosts(),
    fetchComments()
  ]).then(([user, posts, comments]) => {
    // 处理数据
  })
}, [])

// ✅ 更好：使用 React Query / SWR
const { data: user } = useQuery('user', fetchUser)
const { data: posts } = useQuery(['posts', user?.id], () => fetchPosts(user.id), {
  enabled: !!user
})
```

### PERF-002: 大列表虚拟化

```tsx
// ❌ 错误：渲染 10000 条数据
{items.map(item => <ListItem key={item.id} {...item} />)}

// ✅ 正确：虚拟化
import { FixedSizeList } from 'react-window'

<FixedSizeList
  height={600}
  itemCount={items.length}
  itemSize={50}
>
  {({ index, style }) => (
    <ListItem style={style} {...items[index]} />
  )}
</FixedSizeList>
```

### PERF-003: 避免 N+1 查询

```typescript
// ❌ 错误：N+1 查询
const users = await db.query('SELECT * FROM users')
for (const user of users) {
  user.posts = await db.query('SELECT * FROM posts WHERE user_id = $1', [user.id])
}

// ✅ 正确：JOIN 或批量查询
const users = await db.query(`
  SELECT u.*, json_agg(p.*) as posts
  FROM users u
  LEFT JOIN posts p ON p.user_id = u.id
  GROUP BY u.id
`)
```

---

## 🟠 High: 架构规则

### ARCH-001: 组件职责单一

```tsx
// ❌ 错误：组件做太多事
function UserDashboard() {
  const [user, setUser] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 请求数据...
  }, [])

  const handleSubmit = async (data) => {
    // 提交表单...
  }

  return (
    <div>
      {/* 200 行 JSX */}
    </div>
  )
}

// ✅ 正确：拆分职责
// hooks/useUser.ts
function useUser(id: string) {
  return useQuery(['user', id], () => fetchUser(id))
}

// components/UserDashboard.tsx
function UserDashboard({ userId }) {
  const { data: user, isLoading } = useUser(userId)

  if (isLoading) return <Skeleton />

  return (
    <div>
      <UserHeader user={user} />
      <UserPosts userId={userId} />
      <UserStats userId={userId} />
    </div>
  )
}
```

### ARCH-002: 错误边界

```tsx
// ❌ 错误：无错误处理
function App() {
  return <UserDashboard />
}

// ✅ 正确：添加错误边界
import { ErrorBoundary } from 'react-error-boundary'

function App() {
  return (
    <ErrorBoundary
      fallback={<ErrorPage />}
      onError={(error) => reportError(error)}
    >
      <UserDashboard />
    </ErrorBoundary>
  )
}
```

### ARCH-003: API 路由分层

```typescript
// ❌ 错误：路由中混合业务逻辑
app.post('/users', async (req, res) => {
  const { email, password } = req.body
  const hashedPassword = await bcrypt.hash(password, 10)
  const user = await db.query('INSERT INTO users...')
  await sendEmail(email, 'Welcome!')
  res.json(user)
})

// ✅ 正确：分层架构
// routes/users.ts
router.post('/', validateBody(createUserSchema), userController.create)

// controllers/userController.ts
async create(req, res) {
  const user = await userService.create(req.body)
  res.status(201).json(user)
}

// services/userService.ts
async create(data: CreateUserDTO) {
  const user = await userRepository.create(data)
  await emailService.sendWelcome(user.email)
  return user
}
```

---

## 🟡 Medium: 代码质量

### QUAL-001: 类型安全优先

```typescript
// ❌ 错误：any 类型
function processData(data: any) {
  return data.items.map((item: any) => item.name)
}

// ✅ 正确：明确类型
interface DataResponse {
  items: Array<{ id: string; name: string }>
}

function processData(data: DataResponse) {
  return data.items.map(item => item.name)
}
```

### QUAL-002: 避免魔法值

```typescript
// ❌ 错误：魔法数字
if (status === 200) { ... }
if (user.role === 1) { ... }
setTimeout(fn, 86400000)

// ✅ 正确：常量
const HTTP_OK = 200
const ROLE_ADMIN = 1
const ONE_DAY_MS = 24 * 60 * 60 * 1000

if (status === HTTP_OK) { ... }
if (user.role === ROLE_ADMIN) { ... }
setTimeout(fn, ONE_DAY_MS)
```

### QUAL-003: 不可变更新

```typescript
// ❌ 错误：变异状态
function updateUser(user, name) {
  user.name = name
  return user
}

// ✅ 正确：不可变
function updateUser(user, name) {
  return { ...user, name }
}

// ❌ 错误：变异数组
items.push(newItem)
items.sort()

// ✅ 正确：创建新数组
const newItems = [...items, newItem]
const sortedItems = [...items].sort()
```

---

## 🟢 Low: 风格偏好

### STYLE-001: 导入顺序

```typescript
// ✅ 推荐顺序
// 1. 外部依赖
import React from 'react'
import { useQuery } from '@tanstack/react-query'

// 2. 内部模块（绝对路径）
import { Button } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'

// 3. 相对路径
import { UserAvatar } from './UserAvatar'
import styles from './User.module.css'

// 4. 类型（单独）
import type { User } from '@/types'
```

### STYLE-002: 命名约定

| 类型 | 约定 | 示例 |
|------|------|------|
| 组件 | PascalCase | `UserProfile.tsx` |
| Hook | camelCase + use 前缀 | `useAuth.ts` |
| 工具函数 | camelCase | `formatDate.ts` |
| 常量 | SCREAMING_SNAKE | `MAX_RETRY_COUNT` |
| 类型/接口 | PascalCase | `UserResponse` |

---

## 检查清单

### 提交前必查（🔴 Critical）

- [ ] 无硬编码密钥/凭证
- [ ] 所有用户输入已验证
- [ ] 无 SQL 注入风险
- [ ] 无 XSS 漏洞
- [ ] 无 N+1 查询
- [ ] 大列表已虚拟化

### 代码审查（🟠 High）

- [ ] 组件职责单一
- [ ] 有错误边界
- [ ] API 分层清晰
- [ ] 异步错误处理完善

### 质量提升（🟡 Medium）

- [ ] 无 any 类型
- [ ] 无魔法值
- [ ] 使用不可变更新

---

## 相关工具

```bash
# 类型检查
npx tsc --noEmit

# 安全审计
npm audit
npx snyk test

# 代码质量
npx eslint . --ext .ts,.tsx
npx knip  # 未使用代码检测
```

---

## 使用方式

AI Agent 在编写 React/Node.js 代码时应：

1. **优先检查 Critical 规则** - 违反则必须修复
2. **参考正确/错误示例** - 理解为什么这样做
3. **使用检查清单** - 提交前自查

---

**原则**：安全 > 性能 > 可维护性 > 风格
