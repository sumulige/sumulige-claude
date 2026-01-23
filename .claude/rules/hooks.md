# Hooks 最佳实践

> 自动化钩子使用指南 - 融合自 everything-claude-code

## 优先级说明

| 标签 | 含义 | 处理方式 |
|------|------|----------|
| 🔴 CRITICAL | 安全相关 | 必须配置 |
| 🟠 HIGH | 质量保障 | 强烈推荐 |
| 🟡 MEDIUM | 效率提升 | 建议配置 |
| 🟢 LOW | 便利功能 | 可选配置 |

---

## 🟠 HIGH: Hook 类型 [HOOK-001]

| 类型 | 触发时机 | 用途 |
|------|---------|------|
| PreToolUse | 工具执行前 | 验证、准备、确认 |
| PostToolUse | 工具执行后 | 格式化、检查、通知 |
| Stop | 会话结束时 | 总结、清理、保存 |

## 🔴 CRITICAL: 推荐的 Hook 配置 [HOOK-002]

### PreToolUse Hooks

**1. Git Push 审查** (🔴 安全)

在 `git push` 前确认分支和状态：

```javascript
// hooks/git-push-review.cjs
module.exports = {
  event: 'PreToolUse',
  condition: (input) => {
    return input.tool === 'Bash' &&
           input.input?.command?.includes('git push')
  },
  action: async (input, context) => {
    // 获取当前分支
    const branch = execSync('git branch --show-current').toString().trim()

    // 检查是否推送到 main/master
    if (branch === 'main' || branch === 'master') {
      return {
        decision: 'ask',
        message: `即将推送到 ${branch} 分支，确认继续？`
      }
    }

    return { decision: 'allow' }
  }
}
```

**2. 敏感文件保护** (🔴 安全)

防止修改关键配置文件：

```javascript
// hooks/protect-sensitive.cjs
const PROTECTED_PATTERNS = [
  '.env',
  'credentials',
  'secrets',
  '*.pem',
  '*.key'
]

module.exports = {
  event: 'PreToolUse',
  condition: (input) => {
    return ['Write', 'Edit'].includes(input.tool)
  },
  action: async (input, context) => {
    const filePath = input.input?.file_path || ''

    for (const pattern of PROTECTED_PATTERNS) {
      if (filePath.includes(pattern) ||
          filePath.endsWith(pattern.replace('*', ''))) {
        return {
          decision: 'ask',
          message: `即将修改敏感文件 ${filePath}，确认继续？`
        }
      }
    }

    return { decision: 'allow' }
  }
}
```

### PostToolUse Hooks

**1. 自动格式化**

写入文件后自动运行 Prettier：

```javascript
// hooks/auto-format.cjs
const { execSync } = require('child_process')

const FORMATTABLE_EXTENSIONS = [
  '.js', '.jsx', '.ts', '.tsx',
  '.json', '.md', '.css', '.scss'
]

module.exports = {
  event: 'PostToolUse',
  condition: (input, output) => {
    if (!['Write', 'Edit'].includes(input.tool)) return false

    const filePath = input.input?.file_path || ''
    return FORMATTABLE_EXTENSIONS.some(ext => filePath.endsWith(ext))
  },
  action: async (input, output, context) => {
    const filePath = input.input?.file_path

    try {
      execSync(`npx prettier --write "${filePath}"`, {
        stdio: 'pipe'
      })
      return { message: `已格式化: ${filePath}` }
    } catch (error) {
      // Prettier 未安装或格式化失败，静默处理
      return null
    }
  }
}
```

**2. TypeScript 类型检查**

编辑 TS 文件后检查类型：

```javascript
// hooks/type-check.cjs
const { execSync } = require('child_process')

module.exports = {
  event: 'PostToolUse',
  condition: (input, output) => {
    if (!['Write', 'Edit'].includes(input.tool)) return false

    const filePath = input.input?.file_path || ''
    return filePath.endsWith('.ts') || filePath.endsWith('.tsx')
  },
  action: async (input, output, context) => {
    try {
      execSync('npx tsc --noEmit', {
        stdio: 'pipe',
        timeout: 30000
      })
      return { message: '类型检查通过' }
    } catch (error) {
      const stderr = error.stderr?.toString() || ''
      if (stderr.includes('error')) {
        return {
          message: `类型错误:\n${stderr.slice(0, 500)}`
        }
      }
      return null
    }
  }
}
```

**3. Console.log 警告**

检测遗留的调试语句：

```javascript
// hooks/console-warning.cjs
const fs = require('fs')

module.exports = {
  event: 'PostToolUse',
  condition: (input, output) => {
    if (!['Write', 'Edit'].includes(input.tool)) return false

    const filePath = input.input?.file_path || ''
    return filePath.endsWith('.ts') ||
           filePath.endsWith('.tsx') ||
           filePath.endsWith('.js') ||
           filePath.endsWith('.jsx')
  },
  action: async (input, output, context) => {
    const filePath = input.input?.file_path

    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      const consoleMatches = content.match(/console\.(log|debug|info)\(/g)

      if (consoleMatches && consoleMatches.length > 0) {
        return {
          message: `警告: 文件中有 ${consoleMatches.length} 个 console 语句，提交前请移除`
        }
      }
    } catch (error) {
      // 文件读取失败，静默处理
    }

    return null
  }
}
```

### Stop Hooks

**会话总结**

会话结束时生成进度总结：

```javascript
// hooks/session-summary.cjs
module.exports = {
  event: 'Stop',
  action: async (context) => {
    const summary = {
      timestamp: new Date().toISOString(),
      filesModified: context.modifiedFiles || [],
      tasksCompleted: context.completedTasks || [],
      pendingTasks: context.pendingTasks || []
    }

    // 保存到会话日志
    const logPath = '.claude/session-logs/latest.json'
    fs.writeFileSync(logPath, JSON.stringify(summary, null, 2))

    return {
      message: `会话已保存，修改了 ${summary.filesModified.length} 个文件`
    }
  }
}
```

## Hook 编写原则

### 1. 快速执行

```
Hook 不应阻塞主流程超过 2 秒
使用超时保护
异步操作不要等待
```

### 2. 静默失败

```
Hook 失败不应中断主流程
记录错误但继续执行
提供有意义的错误信息
```

### 3. 最小权限

```
只请求必要的权限
不修改不相关的文件
不执行危险命令
```

### 4. 可配置

```
支持通过环境变量配置
允许禁用特定 hook
提供合理的默认值
```

## 现有 Hooks 清单

当前项目 `.claude/hooks/` 已有：

| Hook | 功能 |
|------|------|
| code-formatter.cjs | 代码格式化 |
| multi-session.cjs | 多会话管理 |
| project-kickoff.cjs | 项目初始化 |
| rag-skill-loader.cjs | RAG 技能加载 |
| session-restore.cjs | 会话恢复 |
| session-save.cjs | 会话保存 |
| todo-manager.cjs | TODO 管理 |
| verify-work.cjs | 工作验证 |

## 调试 Hooks

```bash
# 启用 hook 调试日志
export CLAUDE_HOOK_DEBUG=true

# 查看 hook 执行日志
tail -f .claude/logs/hooks.log
```

---

**记住**：Hooks 是强大的自动化工具，但要谨慎使用。过多的 hooks 会影响性能，过于激进的 hooks 会干扰正常工作流程。
