# 技能索引 (Skills Index)

> Sumulige Claude 技能库总览

@version: 2.0.0
@updated: 2026-01-23

## 目录

- [工作流类](#工作流类) (5)
- [开发类](#开发类) (9)
- [设计类](#设计类) (6)
- [工具类](#工具类) (6)
- [示例与模板](#示例与模板)

---

## 工作流类

| 技能 | 说明 | 难度 |
|------|------|------|
| [manus-kickoff](./manus-kickoff/) | Manus 风格项目启动流程 | 中级 |
| [doc-coauthoring](./doc-coauthoring/) | 结构化文档协作工作流 | 中级 |
| [internal-comms](./internal-comms/) | 内部沟通文档模板 | 初级 |
| [design-brain](./design-brain/) | 系统架构设计规划 | 高级 |
| [skill-creator](./skill-creator/) | 创建新技能的指南 | 中级 |

---

## 开发类

| 技能 | 说明 | 难度 |
|------|------|------|
| [react-node-practices](./react-node-practices/) | React & Node.js 最佳实践 | 中级 |
| [react-best-practices](./react-best-practices/) | React/Next.js 性能优化 | 中级 |
| [mcp-builder](./mcp-builder/) | MCP 服务器开发指南 | 高级 |
| [webapp-testing](./webapp-testing/) | Playwright 测试工具包 | 中级 |
| [test-master](./test-master/) | TDD 测试大师 | 中级 |
| [test-workflow](./test-workflow/) | CI 测试工作流 | 中级 |
| [quality-guard](./quality-guard/) | 代码质量守护 | 中级 |
| [quick-fix](./quick-fix/) | 快速修复构建错误 | 初级 |
| [threejs-fundamentals](./threejs-fundamentals/) | Three.js 3D 基础 | 高级 |

---

## 设计类

| 技能 | 说明 | 难度 |
|------|------|------|
| [frontend-design](./frontend-design/) | 高质量前端界面设计 | 中级 |
| [canvas-design](./canvas-design/) | 视觉艺术设计 | 中级 |
| [algorithmic-art](./algorithmic-art/) | p5.js 生成艺术 | 高级 |
| [web-artifacts-builder](./web-artifacts-builder/) | 复杂 Web 组件构建 | 高级 |
| [web-design-guidelines](./web-design-guidelines/) | UI 设计规范审查 | 中级 |
| [brand-guidelines](./brand-guidelines/) | Anthropic 品牌规范 | 初级 |

---

## 工具类

| 技能 | 说明 | 难度 |
|------|------|------|
| [docx](./docx/) | Word 文档处理 | 初级 |
| [pdf](./pdf/) | PDF 操作工具包 | 初级 |
| [pptx](./pptx/) | PowerPoint 演示文稿 | 初级 |
| [xlsx](./xlsx/) | Excel 电子表格 | 初级 |
| [slack-gif-creator](./slack-gif-creator/) | Slack GIF 创建 | 初级 |
| [theme-factory](./theme-factory/) | 主题样式工厂 | 中级 |

---

## 示例与模板

| 技能 | 说明 | 难度 |
|------|------|------|
| [examples/basic-task](./examples/basic-task.md) | 基础任务处理模板 | 初级 |
| [examples/feature-development](./examples/feature-development.md) | 功能开发工作流 | 中级 |
| [examples/bug-fix-workflow](./examples/bug-fix-workflow.md) | Bug 修复流程 | 中级 |
| [template](./template/) | 技能模板 | 初级 |

---

## 技能结构

### 标准目录结构

```
skill-name/
├── SKILL.md          # 技能定义（必需）
├── metadata.yaml     # 技能元数据（必需）
├── templates/        # 模板文件（可选）
│   └── default.md
└── examples/         # 示例文件（可选）
    └── basic.md
```

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
smc skill:create my-skill
```

### 手动创建

1. 复制模板：
```bash
cp -r .claude/skills/template .claude/skills/my-skill
```

2. 编辑 SKILL.md

3. 更新 metadata.yaml

---

## RAG 集成

技能会自动注册到 RAG 索引中 (`.claude/rag/skill-index.json`)，实现智能发现。

---

## 更新日志

### 2.0.0 (2026-01-23)
- 完整重构技能索引
- 26 个技能按 4 类分组
- 移除测试占位符技能
- 更新 RAG skill-index.json

### 1.0.0 (2026-01-11)
- 初始版本
- 添加 Manus Kickoff 技能
- 添加 3 个示例技能
