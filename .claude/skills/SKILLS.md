# 技能索引 (Skills Index)

> Sumulige Claude 技能库总览

@version: 1.7.0
@updated: 2026-01-26

## 目录

- [核心技能](#核心技能)
- [开发技能](#开发技能)
- [设计技能](#设计技能)
- [文档技能](#文档技能)
- [工作流技能](#工作流技能)

---

## 核心技能

| 技能 | 模型 | 说明 |
|------|------|------|
| [quality-guard](./quality-guard/) | Sonnet | 代码审查 + 安全扫描 + 清理 |
| [test-master](./test-master/) | Sonnet | TDD + E2E + 覆盖率 |
| [design-brain](./design-brain/) | Opus | 规划 + 架构设计 |
| [quick-fix](./quick-fix/) | Haiku | 快速错误修复 |

## 开发技能

| 技能 | 说明 |
|------|------|
| [react-best-practices](./react-best-practices/) | React/Next.js 45 条性能规则 |
| [react-node-practices](./react-node-practices/) | React + Node.js 最佳实践 |
| [mcp-builder](./mcp-builder/) | MCP Server 构建指南 |
| [web-artifacts-builder](./web-artifacts-builder/) | React/Tailwind 复杂 Artifact |

## 设计技能

| 技能 | 说明 |
|------|------|
| [frontend-design](./frontend-design/) | 前端界面设计 |
| [canvas-design](./canvas-design/) | 视觉艺术创作 |
| [algorithmic-art](./algorithmic-art/) | p5.js 生成艺术 |
| [threejs-fundamentals](./threejs-fundamentals/) | 3D 场景基础 |
| [web-design-guidelines](./web-design-guidelines/) | Vercel UI 规范 |
| [brand-guidelines](./brand-guidelines/) | Anthropic 品牌规范 |
| [theme-factory](./theme-factory/) | 10 套预设主题 |
| [slack-gif-creator](./slack-gif-creator/) | Slack GIF 制作 |

## 文档技能

| 技能 | 说明 |
|------|------|
| [doc-coauthoring](./doc-coauthoring/) | 文档协作工作流 |
| [internal-comms](./internal-comms/) | 内部沟通模板 |
| [pdf](./pdf/) | PDF 处理 |
| [docx](./docx/) | Word 文档处理 |
| [pptx](./pptx/) | PPT 演示文稿 |

## 工作流技能

| 技能 | 说明 |
|------|------|
| [manus-kickoff](./manus-kickoff/) | 项目启动流程 |
| [skill-creator](./skill-creator/) | 技能创建指南 |
| [test-workflow](./test-workflow/) | 测试工作流 |

---

## 示例技能

| 技能 | 说明 | 难度 |
|------|------|------|
| [basic-task](./examples/basic-task.md) | 基础任务处理模板 | 初级 |
| [feature-development](./examples/feature-development.md) | 功能开发工作流 | 中级 |
| [bug-fix-workflow](./examples/bug-fix-workflow.md) | Bug 修复流程 | 中级 |

---

## 技能模板

### 标准技能结构

```
skill-name/
├── SKILL.md          # 技能定义（必需）
├── metadata.yaml     # 技能元数据（必需）
├── templates/        # 模板文件（可选）
│   └── default.md
└── examples/         # 示例文件（可选）
    └── basic.md
```

### SKILL.md 模板

参考 [template/SKILL.md](./template/SKILL.md)

### metadata.yaml 模板

```yaml
name: skill-name
version: 1.0.0
author: @username
description: 技能描述

tags:
  - category1
  - category2

triggers:
  - keyword1
  - keyword2

dependencies: []  # 依赖的其他技能

difficulty: beginner  # beginner | intermediate | advanced
```

---

## 创建新技能

### 使用 CLI 命令

```bash
oh-my-claude skill:create my-skill
```

### 手动创建

1. 复制模板：
```bash
cp -r .claude/skills/template .claude/skills/my-skill
```

2. 编辑 SKILL.md

3. 更新 metadata.yaml

4. 更新本索引

---

## 技能依赖管理

### 定义依赖

在 metadata.yaml 中声明：

```yaml
dependencies:
  - manus-kickoff
  - code-review
```

### 依赖解析

当使用技能时，系统会：
1. 检查依赖是否已安装
2. 按顺序加载依赖技能
3. 提示缺失的依赖

### 循环依赖检测

系统会自动检测并警告循环依赖。

---

## RAG 集成

技能会自动注册到 RAG 索引中 (`.claude/rag/skill-index.json`)，实现智能发现。

---

## 更新日志

### 1.0.0 (2026-01-11)
- 初始版本
- 添加 Manus Kickoff 技能
- 添加 3 个示例技能
- 添加技能模板
