# Coding Style Rules

> 代码风格规则 - 所有代码必须遵守

## 优先级说明

| 标签 | 含义 | 处理方式 |
|------|------|----------|
| 🔴 CRITICAL | 必须遵守 | 违反将阻止提交 |
| 🟠 HIGH | 应该遵守 | 代码审查必查 |
| 🟡 MEDIUM | 建议遵守 | 提升代码质量 |
| 🟢 LOW | 可选遵守 | 团队约定 |

---

## 🔴 CRITICAL: 不可变性 [CS-001]

**始终创建新对象，永不变异：**

```javascript
// ❌ 错误：变异
function updateUser(user, name) {
  user.name = name  // 变异！
  return user
}

// ✅ 正确：不可变
function updateUser(user, name) {
  return {
    ...user,
    name
  }
}
```

## 🟠 HIGH: 文件组织 [CS-002]

**多个小文件 > 少数大文件：**

| 规则 | 阈值 |
|------|------|
| 典型文件 | 200-400 行 |
| 最大文件 | 800 行 |
| 组织方式 | 按功能/领域，而非按类型 |

原则：高内聚，低耦合

## 🔴 CRITICAL: 错误处理 [CS-003]

**始终全面处理错误：**

```typescript
try {
  const result = await riskyOperation()
  return result
} catch (error) {
  console.error('Operation failed:', error)
  throw new Error('用户友好的详细错误信息')
}
```

## 🔴 CRITICAL: 输入验证 [CS-004]

**始终验证用户输入：**

```typescript
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  age: z.number().int().min(0).max(150)
})

const validated = schema.parse(input)
```

## 🟡 MEDIUM: 代码质量检查清单 [CS-005]

完成工作前确认：

- [ ] 代码可读、命名良好
- [ ] 函数小（< 50 行）
- [ ] 文件聚焦（< 800 行）
- [ ] 无深嵌套（> 4 层）
- [ ] 适当的错误处理
- [ ] 无 console.log 语句
- [ ] 无硬编码值
- [ ] 无变异（使用不可变模式）

## 🟢 LOW: 命名规范 [CS-006]

| 类型 | 规范 | 示例 |
|------|------|------|
| 变量 | camelCase | `userName`, `isActive` |
| 常量 | SCREAMING_SNAKE | `MAX_RETRY`, `API_URL` |
| 函数 | camelCase, 动词开头 | `getUserById`, `validateInput` |
| 类/组件 | PascalCase | `UserProfile`, `DataService` |
| 文件 | kebab-case 或 PascalCase | `user-service.ts`, `UserProfile.tsx` |

## 🟠 HIGH: 禁止的模式 [CS-007]

```typescript
// ❌ 魔法数字
if (status === 200) { ... }

// ✅ 使用常量
const HTTP_OK = 200
if (status === HTTP_OK) { ... }

// ❌ 变量名不清晰
const x = getUser()
const tmp = process(data)

// ✅ 描述性命名
const currentUser = getUser()
const processedData = process(data)

// ❌ 直接变异数组
arr.push(item)
arr.sort()

// ✅ 创建新数组
const newArr = [...arr, item]
const sortedArr = [...arr].sort()
```

## 相关命令

- `/code-review` - 代码审查
- `/refactor-clean` - 重构清理
