# Development Guide - SMC Marketplace

本文档详细说明了 SMC 技能市场和自动同步系统的开发细节。

## 目录

- [架构概述](#架构概述)
- [项目结构](#项目结构)
- [添加新技能](#添加新技能)
- [同步机制原理](#同步机制原理)
- [命令开发](#命令开发)
- [调试指南](#调试指南)

---

## 架构概述

### 核心组件

```
┌─────────────────────────────────────────────────────────────┐
│                        SMC CLI                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Commands   │  │  Marketplace │  │      Config      │  │
│  │              │  │   Commands   │  │                  │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
           │                    │                    │
           ▼                    ▼                    ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  sources.yaml    │  │ sync-external.mjs│  │ update-registry  │
│                  │  │                  │  │      .mjs        │
└──────────────────┘  └──────────────────┘  └──────────────────┘
           │                    │                    │
           ▼                    ▼                    ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ External Repos   │  │  Template Skills │  │ marketplace.json  │
│  (GitHub)        │  │                  │  │                  │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

### 数据流

```
sources.yaml ──► sync-external.mjs ──► template/.claude/skills/
       │                                    │
       │                                    ▼
       └──────────────────► update-registry.mjs ──► marketplace.json
```

---

## 项目结构

```
sumulige-claude/
├── .claude-plugin/
│   └── marketplace.json          # Claude Code 插件注册表
├── .github/workflows/
│   └── sync-skills.yml           # 自动同步工作流
├── scripts/
│   ├── sync-external.mjs         # 同步引擎 (ES Module)
│   └── update-registry.mjs       # 注册表生成器 (ES Module)
├── config/
│   └── skill-categories.json     # 技能分类配置
├── lib/
│   ├── commands.js               # 基础命令 (CommonJS)
│   ├── config.js                 # 配置管理
│   ├── marketplace.js            # 市场命令 (CommonJS)
│   └── utils.js                  # 工具函数
├── template/.claude/skills/
│   ├── manus-kickoff/            # 本地技能
│   └── ...
├── sources.yaml                  # 外部技能清单
├── cli.js                        # 入口文件
└── package.json                  # 项目配置
```

---

## 添加新技能

### 1. 本地技能 (Native Skill)

直接在 `template/.claude/skills/` 下创建目录：

```bash
mkdir -p template/.claude/skills/my-skill
cd template/.claude/skills/my-skill

# 创建 SKILL.md
cat > SKILL.md << 'EOF'
# My Skill

> A brief description of what this skill does

## Usage

When to use this skill...

EOF

# 创建 metadata.yaml
cat > metadata.yaml << 'EOF'
name: my-skill
description: A brief description
version: 1.0.0
category: tools
keywords:
  - my-skill
  - example
dependencies: []
author:
  name: Your Name
  github: yourusername
license: MIT
EOF
```

在 `sources.yaml` 中声明为 native：

```yaml
- name: my-skill
  description: "A brief description"
  native: true
  target:
    category: tools
    path: template/.claude/skills/my-skill
  author:
    name: Your Name
    github: yourusername
  license: MIT
  homepage: https://github.com/yourusername/your-repo
```

### 2. 外部技能 (External Skill)

编辑 `sources.yaml` 添加外部技能：

```yaml
- name: external-skill
  description: "Skill from external repository"
  source:
    repo: owner/repo
    path: skills/external-skill
    ref: main
  target:
    category: automation
    path: template/.claude/skills/automation/external-skill
  author:
    name: Owner Name
    github: owner
  license: MIT
  homepage: https://github.com/owner/repo
  verified: false
  sync:
    include:
      - SKILL.md
      - src/
    exclude:
      - node_modules/
      - "*.lock"
```

### 3. 更新注册表

```bash
# 同步外部技能
npm run sync

# 更新市场注册表
npm run update-registry

# 或一次性执行
npm run sync:all
```

---

## 同步机制原理

### sync-external.mjs 工作流程

```
┌─────────────────────────────────────────────────────────────┐
│ 1. 解析 sources.yaml                                         │
│    - 读取技能清单                                            │
│    - 区分 native 和 external 技能                            │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. 遍历每个技能                                              │
│    - 跳过 native 技能                                        │
│    - 验证 external 技能配置                                  │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. 克隆外部仓库                                              │
│    - git clone --depth 1                                    │
│    - 使用指定的 ref (branch/tag)                            │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. 复制文件到目标目录                                        │
│    - 根据 sync.include 过滤文件                             │
│    - 根据 sync.exclude 排除文件                             │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. 生成源信息文件                                            │
│    - 写入 .source.json                                      │
│    - 记录同步时间和来源                                      │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. 清理临时文件                                              │
│    - 删除克隆的临时目录                                      │
└─────────────────────────────────────────────────────────────┘
```

### update-registry.mjs 工作流程

```
┌─────────────────────────────────────────────────────────────┐
│ 1. 扫描技能目录                                              │
│    - 递归查找所有包含 SKILL.md 或 .source.json 的目录        │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. 提取技能元数据                                            │
│    - 读取 metadata.yaml                                     │
│    - 读取 .source.json                                      │
│    - 从 SKILL.md 提取描述                                   │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. 确定技能分类                                              │
│    - 根据 metadata.category                                 │
│    - 或根据路径推断                                          │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. 构建插件注册表                                            │
│    - 按分类组织技能                                          │
│    - 添加元数据 (版本、时间戳、数量)                         │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. 写入 marketplace.json                                     │
│    - 格式化为 JSON                                          │
│    - 符合 Claude Code 插件规范                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 命令开发

### 添加新命令

#### 1. 在 `lib/commands.js` 或 `lib/marketplace.js` 添加处理函数

```javascript
const commands = {
  // ...existing commands...

  // 新命令
  'my:command': (arg1, arg2) => {
    console.log('Executing my:command with:', arg1, arg2);
    // 命令逻辑
  }
};
```

#### 2. 在 `cli.js` 的 COMMANDS 注册表添加

```javascript
const COMMANDS = {
  // ...existing commands...

  'my:command': {
    help: 'Command description',
    args: '<arg1> <arg2>'
  }
};
```

#### 3. 添加帮助示例

```javascript
// 在 showHelp() 函数的 Examples 部分
console.log('  smc my:command value1 value2');
```

### 命令分类

- **核心命令**: 直接在 `lib/commands.js` 实现
- **市场命令**: 在 `lib/marketplace.js` 实现
- **技能命令**: 在 `lib/commands.js` 的 `skill:*` 组

---

## 调试指南

### 启用详细输出

```bash
# 运行同步脚本并查看完整输出
node --trace-warnings scripts/sync-external.mjs
```

### 检查配置

```bash
# 查看市场状态
smc marketplace:status

# 列出所有技能
smc marketplace:list
```

### 常见问题

#### 1. YAML 解析错误

```bash
# 验证 YAML 语法
node -e "const yaml = require('yaml'); console.log(yaml.parse(require('fs').readFileSync('sources.yaml', 'utf8')))"
```

#### 2. Git 克隆失败

```bash
# 手动测试克隆
git clone --depth 1 https://github.com/owner/repo /tmp/test-repo
```

#### 3. 权限问题

```bash
# 检查目录权限
ls -la template/.claude/skills/

# 修复权限
chmod -R u+rwX template/.claude/skills/
```

### 调试日志

同步脚本会在 `.tmp/` 目录存储临时克隆的仓库。如果同步失败，检查此目录：

```bash
ls -la .tmp/
```

---

## 测试

### 手动测试

```bash
# 测试同步
npm run sync

# 测试注册表生成
npm run update-registry

# 测试完整流程
npm run sync:all
```

### CI/CD 测试

推送更改到 GitHub，自动触发工作流：

```bash
git add .
git commit -m "test: update sources.yaml"
git push
```

手动触发工作流：
1. 进入 GitHub 仓库页面
2. 点击 "Actions" 标签
3. 选择 "Sync External Skills" 工作流
4. 点击 "Run workflow"

---

## 发布

### 更新版本号

```bash
# 更新 package.json
npm version patch  # 或 minor, major

# 更新 marketplace.json 中的版本
npm run update-registry
```

### 发布到 npm

```bash
npm publish
```

### 创建 Git 标签

```bash
git tag v$(node -p "require('./package.json').version")
git push --tags
```
