# Security Rules

> 安全规则 - 所有提交必须遵守

## 优先级说明

| 标签 | 含义 | 处理方式 |
|------|------|----------|
| 🔴 CRITICAL | 必须遵守 | 违反将阻止提交 |
| 🟠 HIGH | 应该遵守 | 代码审查必查 |

**注意**：安全规则全部为 🔴 CRITICAL 或 🟠 HIGH，无低优先级项。

---

## 🔴 CRITICAL: 提交前强制检查 [SEC-001]

每次提交代码前必须确认：

- [ ] **无硬编码密钥** - API keys, passwords, tokens 必须用环境变量
- [ ] **输入验证** - 所有用户输入已验证和清理
- [ ] **SQL 注入防护** - 使用参数化查询
- [ ] **XSS 防护** - HTML 输出已转义
- [ ] **CSRF 保护** - 表单提交有 token 验证
- [ ] **认证授权** - 敏感操作有权限检查
- [ ] **速率限制** - API 端点有请求限制
- [ ] **错误信息** - 不泄露敏感数据

## 🔴 CRITICAL: 密钥管理 [SEC-002]

```typescript
// ❌ 永远不要这样做
const apiKey = "sk-proj-xxxxx"
const password = "admin123"

// ✅ 正确方式
const apiKey = process.env.OPENAI_API_KEY
if (!apiKey) {
  throw new Error('OPENAI_API_KEY not configured')
}
```

## 🔴 CRITICAL: 安全响应协议 [SEC-003]

发现安全问题时：

1. **立即停止** 当前工作
2. **调用** security-reviewer skill
3. **修复** CRITICAL 问题后才能继续
4. **轮换** 任何已暴露的密钥
5. **审查** 整个代码库是否有类似问题

## 🟠 HIGH: 敏感文件管理 [SEC-004]

以下文件永远不应提交：

```
.env
.env.local
.env.production
*.pem
*.key
credentials.json
secrets.yaml
```

确保 `.gitignore` 包含这些模式。

---

## 正确/错误对比示例

### SQL 注入防护

```typescript
// ❌ 错误：字符串拼接（SQL 注入风险）
const query = `SELECT * FROM users WHERE id = ${userId}`
db.query(query)

// ❌ 错误：模板字符串（同样危险）
db.query(`SELECT * FROM users WHERE email = '${email}'`)

// ✅ 正确：参数化查询
db.query('SELECT * FROM users WHERE id = $1', [userId])

// ✅ 正确：使用 ORM
await prisma.user.findUnique({ where: { id: userId } })
```

### XSS 防护

```tsx
// ❌ 错误：直接渲染用户内容
<div dangerouslySetInnerHTML={{ __html: userComment }} />

// ❌ 错误：URL 中注入
<a href={`javascript:${userInput}`}>Click</a>

// ✅ 正确：使用 DOMPurify 清理
import DOMPurify from 'dompurify'
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userComment) }} />

// ✅ 更好：直接渲染文本（自动转义）
<div>{userComment}</div>

// ✅ 正确：URL 验证
const safeUrl = url.startsWith('https://') ? url : '#'
<a href={safeUrl}>Link</a>
```

### 认证授权

```typescript
// ❌ 错误：仅前端检查权限
if (user.role === 'admin') {
  showAdminPanel()
}

// ❌ 错误：信任客户端传来的 userId
app.delete('/users/:id', (req, res) => {
  userService.delete(req.params.id)  // 谁都能删任何人！
})

// ✅ 正确：后端验证权限
app.delete('/users/:id', authenticate, authorize('admin'), (req, res) => {
  // 只有 admin 角色才能到达这里
  userService.delete(req.params.id)
})

// ✅ 正确：用户只能操作自己的资源
app.delete('/users/:id', authenticate, (req, res) => {
  if (req.user.id !== req.params.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' })
  }
  userService.delete(req.params.id)
})
```

### 错误信息处理

```typescript
// ❌ 错误：暴露内部细节
app.use((err, req, res, next) => {
  res.status(500).json({
    error: err.message,
    stack: err.stack,  // 泄露代码路径！
    query: req.query,  // 泄露请求参数！
  })
})

// ❌ 错误：暴露数据库错误
catch (err) {
  res.json({ error: `Database error: ${err.message}` })
}

// ✅ 正确：通用错误 + 内部日志
app.use((err, req, res, next) => {
  // 内部记录详细错误
  logger.error('Request failed', {
    error: err,
    requestId: req.id,
    path: req.path
  })

  // 返回通用错误给客户端
  res.status(500).json({
    error: 'Internal server error',
    requestId: req.id  // 用于追踪
  })
})
```

### 速率限制

```typescript
// ❌ 错误：无速率限制（DDoS/暴力破解风险）
app.post('/login', (req, res) => {
  // 攻击者可以无限尝试密码
})

// ✅ 正确：添加速率限制
import rateLimit from 'express-rate-limit'

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 分钟
  max: 5,                     // 最多 5 次
  message: 'Too many login attempts, please try again later'
})

app.post('/login', loginLimiter, (req, res) => {
  // 现在受保护了
})
