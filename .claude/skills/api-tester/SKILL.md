---
name: api-tester
description: API testing and HTTP request validation tool for REST/GraphQL endpoints
see_also:
  - mcp-builder
  - webapp-testing
---

# API Tester

> Test and validate REST/GraphQL APIs with automated request/response checking

**Version**: 1.0.0
**Author**: sumulige
**Tags**: [api, testing, http, rest, graphql]
**Difficulty**: 中级

---

## 概述

API Tester 是一个用于测试和验证 API 接口的技能。支持 REST 和 GraphQL，可以自动检查响应状态码、数据结构和性能指标。

## 适用场景

- 测试 REST API 端点
- 验证 API 响应格式
- 检查 HTTP 状态码
- 测试 API 认证
- 性能基准测试

## 触发关键词

```
api test, "test the api", "check endpoint", http request, "validate api",
graphql query, rest api, postman, curl
```

## 使用方法

### 基础用法

```bash
# 测试 GET 请求
curl -X GET https://api.example.com/users

# 测试 POST 请求
curl -X POST https://api.example.com/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John"}'
```

### 验证响应

```javascript
// 检查状态码
response.status === 200

// 验证数据结构
response.data.users.forEach(user => {
  assert(user.id, 'User must have id');
  assert(user.email, 'User must have email');
});
```

## 输出格式

```
✅ GET /api/users - 200 OK (142ms)
✅ POST /api/users - 201 Created (89ms)
❌ GET /api/users/999 - 404 Not Found (45ms)
```

## 注意事项

- 使用测试环境 API，避免生产数据修改
- 检查 API 速率限制
- 验证认证 Token 有效性
- 处理分页响应

## 相关技能

- [mcp-builder](../mcp-builder/) - MCP 服务器构建
- [webapp-testing](../webapp-testing/) - Web 应用测试

## 更新日志

### 1.0.0 (2026-01-15)
- 初始版本
- 添加 REST/GraphQL 支持
