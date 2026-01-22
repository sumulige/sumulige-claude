# Security Rules

> 安全规则 - 所有提交必须遵守

## 提交前强制检查

每次提交代码前必须确认：

- [ ] **无硬编码密钥** - API keys, passwords, tokens 必须用环境变量
- [ ] **输入验证** - 所有用户输入已验证和清理
- [ ] **SQL 注入防护** - 使用参数化查询
- [ ] **XSS 防护** - HTML 输出已转义
- [ ] **CSRF 保护** - 表单提交有 token 验证
- [ ] **认证授权** - 敏感操作有权限检查
- [ ] **速率限制** - API 端点有请求限制
- [ ] **错误信息** - 不泄露敏感数据

## 密钥管理

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

## 安全响应协议

发现安全问题时：

1. **立即停止** 当前工作
2. **调用** security-reviewer skill
3. **修复** CRITICAL 问题后才能继续
4. **轮换** 任何已暴露的密钥
5. **审查** 整个代码库是否有类似问题

## 敏感文件

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
