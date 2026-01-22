# Claude Code Hooks 模板库

> 标准化 hook 开发，防止常见错误

---

## 📋 目录

- [快速开始](#快速开始)
- [Hook 类型](#hook-类型)
- [最佳实践](#最佳实践)
- [常见错误](#常见错误)
- [检查清单](#检查清单)

---

## 🚀 快速开始

### 1. 选择模板

```bash
# UserPromptSubmit hook (用户提交提示时触发)
cp user-prompt-submit.cjs.template my-hook.cjs

# UserResponseSubmit hook (AI 返回响应后触发)
cp user-response-submit.cjs.template my-hook.cjs

# Shell hook
cp hook.sh.template my-hook.sh
```

### 2. 修改配置

```javascript
// 修改配置区域
const CONFIG = {
  enabled: true,
  verbose: false,  // 开发时设为 true
};
```

### 3. 实现逻辑

在标记区域添加你的代码：

```javascript
// ===== 在这里实现你的 hook 逻辑 =====

// 你的代码

// ===== Hook 逻辑结束 =====
```

### 4. 测试

```bash
# 添加执行权限
chmod +x my-hook.cjs

# 测试（模拟环境变量）
CLAUDE_PROJECT_DIR=/path/to/project node my-hook.cjs

# 开启调试模式
VERBOSE=true CLAUDE_PROJECT_DIR=/path/to/project node my-hook.cjs
```

---

## 📦 Hook 类型

### UserPromptSubmit

用户每次提交提示时触发。

**可用环境变量:**
- `CLAUDE_PROJECT_DIR` - 项目根目录
- `CLAUDE_TOOL_NAME` - 当前调用的工具名
- `CLAUDE_TOOL_INPUT` - 工具输入内容

**使用场景:**
- 追踪用户操作
- 记录工具调用
- 触发自动化流程

### UserResponseSubmit

AI 返回响应后触发。

**可用环境变量:**
- `CLAUDE_PROJECT_DIR` - 项目根目录
- `CLAUDE_RESPONSE_CONTENT` - 响应内容

**使用场景:**
- 分析响应内容
- 统计 token 使用
- 自动保存代码

---

## ✅ 最佳实践

### 1. 环境变量处理

```javascript
// ✅ 正确 - 提供 fallback
const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();

// ❌ 错误 - 直接使用可能 undefined
const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR;
```

### 2. 静默退出

```javascript
// ✅ 正确 - 非项目环境时静默退出
if (!process.env.CLAUDE_PROJECT_DIR) {
  process.exit(0);
}

// ❌ 错误 - 会抛出异常
if (!process.env.CLAUDE_PROJECT_DIR) {
  throw new Error('No project dir');
}
```

### 3. 错误处理

```javascript
// ✅ 正确 - 捕获所有错误
try {
  // 你的逻辑
} catch (error) {
  log('Error:', error.message);
}

// ❌ 错误 - 未捕获错误会显示给用户
// 直接执行可能失败的操作
```

### 4. 文件操作

```javascript
// ✅ 正确 - 安全的文件操作
function safeWriteFile(filePath, content) {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf-8');
    return true;
  } catch (e) {
    return false;  // 静默失败
  }
}

// ❌ 错误 - 可能因为目录不存在而失败
fs.writeFileSync(filePath, content);
```

### 5. 输出控制

```javascript
// ✅ 正确 - 使用 stderr 记录日志
function log(...args) {
  console.error('[Hook]', ...args);
}

// ❌ 错误 - stdout 会干扰响应
console.log(...args);
```

---

## 🐛 常见错误

### 错误 1: 未检查环境变量

```javascript
// ❌ 问题代码
const dir = path.join(process.env.CLAUDE_PROJECT_DIR, 'subdir');

// ✅ 修复
const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
if (!process.env.CLAUDE_PROJECT_DIR) {
  process.exit(0);
}
const dir = path.join(PROJECT_DIR, 'subdir');
```

### 错误 2: 未捕获异常

```javascript
// ❌ 问题代码
function main() {
  const data = JSON.parse(fs.readFileSync('data.json'));  // 文件不存在会崩溃
}

// ✅ 修复
function main() {
  try {
    const data = JSON.parse(fs.readFileSync('data.json') || '{}');
  } catch (e) {
    // 静默处理
  }
}
```

### 错误 3: 输出到 stdout

```javascript
// ❌ 问题代码
console.log('Processing...');  // 会出现在用户对话中

// ✅ 修复
function log(...args) {
  if (CONFIG.verbose) {
    console.error('[Hook]', ...args);  // stderr 不影响对话
  }
}
```

### 错误 4: 忘记退出码

```javascript
// ❌ 问题代码
main();  // 可能返回非零退出码

// ✅ 修复
try {
  main();
} catch (e) {
  // ...
}
process.exit(0);  // 始终返回成功
```

---

## 📝 Hook 开发检查清单

在提交新 hook 前，确保：

- [ ] **环境变量**: 使用 `|| process.cwd()` 提供 fallback
- [ ] **静默退出**: 非项目环境时 `process.exit(0)`
- [ ] **错误处理**: 所有可能失败的操作都在 try-catch 中
- [ ] **文件操作**: 使用安全函数，目录不存在时自动创建
- [ ] **输出控制**: 调试信息使用 stderr，生产环境静默
- [ ] **退出码**: 始终返回 0，不影响 Claude Code
- [ ] **执行权限**: Shell hooks 有 `chmod +x`
- [ ] **测试**: 在有/无 CLAUDE_PROJECT_DIR 环境下都测试过

---

## 🔧 调试技巧

### 开启调试模式

```bash
# 临时开启
VERBOSE=true CLAUDE_PROJECT_DIR=/path/to/project node my-hook.cjs

# 或修改配置
const CONFIG = {
  verbose: true,  // 开启调试
};
```

### 查看日志

```bash
# 追踪执行
node my-hook.cjs 2>&1 | tee hook-debug.log

# 检查退出码
node my-hook.cjs; echo "Exit code: $?"
```

### 常用测试命令

```bash
# 模拟完整环境
CLAUDE_PROJECT_DIR=$(pwd) \
CLAUDE_TOOL_NAME=Edit \
CLAUDE_TOOL_INPUT="test input" \
node my-hook.cjs

# 测试错误处理
CLAUDE_PROJECT_DIR="" node my-hook.cjs
```

---

## 📚 现有 Hooks 参考

| Hook | 功能 | 关键技术 |
|------|------|----------|
| `todo-manager.cjs` | 任务管理 | 目录扫描、状态流转 |
| `thinking-silent.cjs` | 对话追踪 | 静默执行、定期同步 |
| `code-formatter.cjs` | 代码格式化 | 文件监听、外部调用 |
| `multi-session.cjs` | 多会话管理 | 会话追踪、状态恢复 |

---

> **维护**: 添加新 hook 时，请基于模板创建并更新本文档
