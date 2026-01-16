# Development Guide - 开发指南

> 从零开始理解项目架构，逐步深入开发细节

---

## Level 1: 项目概述 (5 分钟)

### 这是一个什么项目？

**一句话**：为 Claude Code 添加多 Agent 编排能力的 CLI 工具。

**核心功能**：
1. **多 Agent 协作** - 5 个专业 AI Agent 配合工作
2. **技能管理** - 发现、安装、管理可复用的 AI 技能
3. **项目模板** - 一键部署配置好的 AI 开发环境
4. **质量门禁** - 自动代码质量检查

### 技术栈

```
语言：     JavaScript (CommonJS + ES Modules)
运行时：   Node.js >= 16.0
测试：     Jest
发布：     npm
依赖：     ajv, ajv-formats (配置验证)
```

---

## Level 2: 项目结构 (10 分钟)

### 目录树

```
sumulige-claude/
├── cli.js                        # 入口文件
│
├── lib/                          # 核心代码 (CommonJS)
│   ├── commands.js               # 命令实现
│   ├── config.js                 # 配置管理
│   ├── marketplace.js            # 技能市场
│   ├── config-schema.js          # 配置 Schema
│   ├── config-validator.js       # 配置验证
│   ├── config-manager.js         # 配置管理器
│   ├── quality-rules.js          # 质量规则
│   ├── quality-gate.js           # 质量门禁
│   ├── errors.js                 # 错误类型
│   └── utils.js                  # 工具函数
│
├── template/.claude/             # 项目模板
│   ├── commands/                 # 斜杠命令
│   ├── skills/                   # 技能库
│   ├── hooks/                    # 自动化钩子
│   └── settings.json             # 默认配置
│
├── scripts/                      # 工具脚本 (ES Modules)
│   ├── sync-external.mjs         # 同步外部技能
│   └── update-registry.mjs       # 更新技能注册表
│
├── config/                       # 配置文件
│   ├── defaults.json             # 默认配置
│   ├── quality-gate.json         # 质量门禁配置
│   └── skill-categories.json     # 技能分类
│
├── sources.yaml                  # 外部技能清单
├── .claude-plugin/               # Claude Code 插件
│   └── marketplace.json          # 技能注册表
│
└── package.json                  # 项目配置
```

### 模块职责

| 模块 | 职责 | 类型 |
|------|------|------|
| `cli.js` | 命令入口、分发 | CommonJS |
| `lib/commands.js` | 核心命令实现 | CommonJS |
| `lib/marketplace.js` | 技能市场命令 | CommonJS |
| `lib/config*.js` | 配置系统 | CommonJS |
| `lib/quality*.js` | 质量门禁系统 | CommonJS |
| `scripts/*.mjs` | 工具脚本 | ES Module |

---

## Level 3: 命令系统 (15 分钟)

### 命令分发的数据流

```
用户输入
    │
    ▼
┌─────────────┐
│   cli.js    │  解析命令
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────┐
│  COMMANDS 注册表                │
│  {                             │
│    'init': { help, args },     │
│    'sync': { help, args },     │
│    ...                          │
│  }                             │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  runCommand(cmd, args)          │
│  ├─ 核心命令 → lib/commands.js  │
│  ├─ 市场命令 → lib/marketplace.js│
│  └─ 技能命令 → lib/commands.js  │
└─────────────────────────────────┘
```

### 添加新命令

**Step 1**: 在 `lib/commands.js` 添加实现

```javascript
const commands = {
  // 新命令
  'my:command': (arg1) => {
    console.log('执行命令，参数:', arg1);
    // 你的逻辑
  }
};
```

**Step 2**: 在 `cli.js` 注册

```javascript
const COMMANDS = {
  'my:command': {
    help: '命令描述',
    args: '<arg1>'
  }
};
```

**Step 3**: 测试

```bash
node cli.js my:command test
```

---

## Level 4: 技能系统 (20 分钟)

### 什么是技能？

**技能 = 知识 + 指令 + 资源**

```
my-skill/
├── SKILL.md           # 知识和指令
├── metadata.yaml      # 技能元数据
├── scripts/           # 可执行脚本 (资源)
└── templates/         # 模板文件 (资源)
```

### 添加本地技能

```bash
# 1. 创建技能目录
mkdir -p template/.claude/skills/my-skill

# 2. 创建 SKILL.md
cat > template/.claude/skills/my-skill/SKILL.md << 'EOF'
# My Skill

> 技能描述

## 使用场景

当用户需要...时使用此技能。

EOF

# 3. 创建 metadata.yaml
cat > template/.claude/skills/my-skill/metadata.yaml << 'EOF'
name: my-skill
description: 技能描述
version: 1.0.0
category: tools
keywords:
  - my-skill
author:
  name: Your Name
  github: yourusername
license: MIT
EOF
```

### 添加外部技能

编辑 `sources.yaml`:

```yaml
- name: external-skill
  description: "来自外部仓库的技能"
  source:
    repo: owner/repo
    path: skills/external-skill
    ref: main
  target:
    category: automation
    path: template/.claude/skills/automation/external-skill
  sync:
    include:
      - SKILL.md
      - src/
    exclude:
      - node_modules/
```

运行同步：

```bash
npm run sync:all
```

---

## Level 5: 同步机制 (25 分钟)

### 自动同步工作流

```
┌─────────────────────────────────────────────────────────────┐
│  sources.yaml                                               │
│  ├─ native 技能 (本地)                                      │
│  └─ external 技能 (GitHub)                                  │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│  sync-external.mjs                                          │
│  ├─ 克隆外部仓库                                            │
│  ├─ 过滤文件 (include/exclude)                              │
│  └─ 复制到 template/.claude/skills/                         │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│  update-registry.mjs                                        │
│  ├─ 扫描技能目录                                            │
│  ├─ 提取元数据                                              │
│  └─ 生成 marketplace.json                                   │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│  .claude-plugin/marketplace.json                            │
│  (Claude Code 读取的注册表)                                  │
└─────────────────────────────────────────────────────────────┘
```

### GitHub Actions 自动同步

`.github/workflows/sync-skills.yml`:

```yaml
name: Sync External Skills
on:
  schedule:
    - cron: '0 0 * * *'  # 每天运行
  workflow_dispatch:      # 手动触发
jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: npm run sync:all
      - run: git config user.name "github-actions[bot]"
      - run: git add .claude-plugin/
      - run: git commit -m "chore: sync skills"
      - run: git push
```

---

## Level 6: 配置系统 (30 分钟)

### 三层配置

```
┌─────────────────────────────────────────────────────────────┐
│  全局配置 (~/.claude/config.json)                           │
│  ├─ Agent 定义                                              │
│  ├─ 默认模型                                                │
│  └─ 技能列表                                                │
├─────────────────────────────────────────────────────────────┤
│  项目配置 (./.claude/settings.json)                         │
│  ├─ Hook 配置                                               │
│  └─ 项目覆盖设置                                            │
├─────────────────────────────────────────────────────────────┤
│  质量配置 (./.claude/quality-gate.json)                     │
│  ├─ 规则启用设置                                            │
│  └─ 门禁触发条件                                            │
└─────────────────────────────────────────────────────────────┘
```

### 配置验证流程

```
┌─────────────────────────────────────────────────────────────┐
│  config-schema.js                                           │
│  ├─ CONFIG_SCHEMA (JSON Schema)                             │
│  ├─ SETTINGS_SCHEMA                                         │
│  └─ QUALITY_GATE_SCHEMA                                     │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│  config-validator.js                                        │
│  ├─ AJV 验证器                                              │
│  ├─ validate(config, schema)                                │
│  └─ validateFile(path, schema)                              │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│  config-manager.js                                          │
│  ├─ backup() - 创建备份                                     │
│  ├─ rollback() - 回滚配置                                   │
│  ├─ diff() - 配置对比                                       │
│  └─ _expandEnvVars() - 环境变量展开                          │
└─────────────────────────────────────────────────────────────┘
```

### 环境变量展开

配置支持环境变量语法：

```json
{
  "apiKey": "${API_KEY:default-key}",
  "endpoint": "${ENDPOINT:-https://api.example.com}"
}
```

---

## Level 7: 质量门禁 (35 分钟)

### 质量检查流程

```
git commit
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  pre-commit hook                                            │
│  ├─ 读取 .claude/quality-gate.json                          │
│  └─ 调用 quality-gate.js                                   │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│  quality-gate.js                                            │
│  ├─ 加载启用的规则                                          │
│  ├─ 遍历暂存的文件                                          │
│  └─ 执行每个规则的 check()                                  │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│  quality-rules.js                                           │
│  ├─ file-size-limit (文件大小)                              │
│  ├─ line-count-limit (行数)                                │
│  ├─ no-console-logs (无 console)                            │
│  ├─ todo-comments (TODO 检查)                               │
│  ├─ directory-depth (目录深度)                              │
│  ├─ no-empty-files (无空文件)                               │
│  ├─ no-trailing-whitespace (无尾随空格)                      │
│  └─ function-length (函数长度)                              │
└──────────────┬──────────────────────────────────────────────┘
               │
       ┌───────┴────────┐
       ▼                 ▼
    通过 ✅          失败 ❌
       │                 │
       ▼                 ▼
    允许提交        阻止提交
```

### 添加自定义规则

编辑 `lib/quality-rules.js`:

```javascript
RuleRegistry.register('my-rule', {
  name: 'My Custom Rule',
  description: '规则描述',
  severity: 'warn',

  check(file, config) {
    const content = fs.readFileSync(file, 'utf8');
    const issues = [];

    // 你的检查逻辑
    if (content.includes('TODO')) {
      issues.push({
        line: 1,
        message: 'Found TODO',
        fix: 'Resolve TODOs'
      });
    }

    return issues;
  }
});
```

---

## 快速参考

### 开发工作流

```bash
# 1. 修改代码
vim lib/commands.js

# 2. 运行测试
npm test

# 3. 本地测试
node cli.js my-command

# 4. 更新版本
npm version patch

# 5. 发布
npm run sync:all
git add .
git commit -m "chore: release"
git push --follow-tags
npm publish
```

### 调试技巧

```bash
# 详细输出
node --trace-warnings cli.js my-command

# 检查配置
node cli.js config:validate

# 质量检查
node cli.js qg:check
```

---

*更多细节查看 [README.md](../README.md) | [Q&A.md](../Q&A.md) | [AGENTS.md](../AGENTS.md)*
