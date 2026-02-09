# AGENTS.md - Agent 系统详解

> 从零开始理解多 Agent 协作系统

## Technical Co-Founder Working Agreement (Always-on)

- You are my Technical Co-Founder. I am the Product Owner (PO). 你负责执行，我负责决策。
- Keep me in control: stop at key decision points (A-G): tech stack, data model, external services/cost, auth/security/privacy, deploy/domain, UI direction, milestones/timeline.
- Before building, list assumptions as a checklist; I can veto line-by-line. 未确认假设时不要实现。
- If Skill `technical-cofounder` is present: use phase gate `PHASE=1..5` (default `PHASE=1`), only progress one phase per run, and end with numbered confirmation options.
- 中文为主，保留关键英文术语；先讲人话，再给技术细节。

---

## Layer 1: 什么是 Agent？ (5 分钟)

### 最简单的解释

**Agent = AI 角色 + 职责 + 专长**

就像一个真实团队：
- 不是让一个人做所有事
- 每个人专精某个领域
- 大家协作完成任务

### 类比：餐厅团队

```
没有分工的餐厅                    有分工的餐厅
────────────────                  ────────────────
┌─────────────────┐              ┌─────────────────┐
│   老板 (全能)   │              │   服务员        │ ← 接待顾客
│                 │              │   厨师          │ ← 做菜
│ ├─ 买菜         │              │   采购员        │ ← 买食材
│ ├─ 做菜         │              │   清洁工        │ ← 打扫
│ ├─ 端菜         │              │                 │
│ ├─ 收钱         │              │                 │
│ └─ 打扫         │              │                 │
└─────────────────┘              └─────────────────┘

结果：累死、效率低                结果：专业、高效
```

### Claude Code 中同样适用

```
传统 Claude              Sumulige Claude Agents
───────────              ────────────────────────
┌─────────────────┐      ┌─────────────────────────┐
│   Claude        │      │  Conductor (协调)       │
│   (通用 AI)      │      │  Architect (架构)       │
│                 │      │  Builder (实现)         │
│ ├─ 理解需求     │      │  Reviewer (审查)        │
│ ├─ 设计架构     │      │  Librarian (文档)       │
│ ├─ 写代码       │      │                         │
│ ├─ 审查代码     │      │                         │
│ └─ 写文档       │      │                         │
└─────────────────┘      └─────────────────────────┘
```

---

## Layer 2: 5 个 Agent 介绍 (10 分钟)

### 架构图

```
                    用户需求
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Conductor - 协调者                                          │
│  "理解需求，分配任务"                                         │
│  ├─ 解析用户意图                                             │
│  ├─ 查询项目知识库 (RAG)                                      │
│  ├─ 分配给合适的 Agent                                       │
│  └─ 协调整体进度                                             │
└────────────┬────────────────────────────────────────────────┘
             │
     ┌───────┴───────────┬───────────────┐
     ▼                   ▼               ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│  Architect  │   │   Builder   │   │  Reviewer   │
│  架构师      │   │  构建师      │   │  审查师     │
├─────────────┤   ├─────────────┤   ├─────────────┤
│ 设计系统架构 │   │ 实现功能代码 │   │ 检查代码质量 │
│ 技术选型     │   │ 编写测试     │   │ 安全检查     │
│ 接口定义     │   │ 代码优化     │   │ 性能评估     │
└─────────────┘   └─────────────┘   └─────────────┘
             │                   │               │
             └───────────────────┴───────────────┘
                                   │
                                   ▼
                        ┌─────────────────────┐
                        │   Librarian         │
                        │  图书管理员         │
                        ├─────────────────────┤
                        │ 整理文档            │
                        │ 更新知识库          │
                        │ 维护项目记忆        │
                        └─────────────────────┘
```

### 每个 Agent 详解

#### 1. Conductor - 协调者

**职责**：团队的"项目经理"

```
输入："帮我实现一个用户登录功能"
       │
       ▼
┌─────────────────────────────────────┐
│  Conductor 思考过程：                │
│  ├─ 这是新功能还是修改？             │
│  ├─ 需要哪些技术？                   │
│  ├─ 有没有相关的历史决策？           │
│  └─ 应该先找谁？Architect 还是 Builder? │
└─────────────────────────────────────┘
       │
       ▼
分配给 Architect："设计登录系统的架构"
```

#### 2. Architect - 架构师

**职责**：系统的"设计师"

```
输入：设计用户登录系统
       │
       ▼
┌─────────────────────────────────────┐
│  Architect 产出：                    │
│  ├─ 技术选型 (JWT vs Session)        │
│  ├─ 数据库设计 (users 表)            │
│  ├─ API 设计 (/auth/login)           │
│  └─ 安全考虑 (密码加密、限流)        │
└─────────────────────────────────────┘
```

#### 3. Builder - 构建师

**职责**：代码的"工程师"

```
输入：实现登录 API
       │
       ▼
┌─────────────────────────────────────┐
│  Builder 产出：                      │
│  ├─ 控制器代码                       │
│  ├─ 服务层逻辑                       │
│  ├─ 数据库操作                       │
│  └─ 单元测试                         │
└─────────────────────────────────────┘
```

#### 4. Reviewer - 审查师

**职责**：代码的"质检员"

```
输入：审查登录功能代码
       │
       ▼
┌─────────────────────────────────────┐
│  Reviewer 检查：                     │
│  ├─ 代码风格是否统一                 │
│  ├─ 是否有安全隐患                   │
│  ├─ 错误处理是否完善                 │
│  └─ 性能是否可优化                   │
└─────────────────────────────────────┘
```

#### 5. Librarian - 图书管理员

**职责**：知识的"守护者"

```
每次协作后：
       │
       ▼
┌─────────────────────────────────────┐
│  Librarian 记录：                    │
│  ├─ 重要的架构决策 → RAG/            │
│  ├─ 代码风格约定 → RAG/              │
│  ├─ 会议讨论结果 → MEMBERS.md        │
│  └─ TODO 列表 → development/todos/   │
└─────────────────────────────────────┘
```

---

## Layer 3: Agent 工作流程 (15 分钟)

### 完整流程示例

**用户需求**："添加用户评论功能"

```
┌─────────────────────────────────────────────────────────────┐
│  第一步：Conductor 接收需求                                  │
├─────────────────────────────────────────────────────────────┤
│  用户："添加用户评论功能"                                     │
│  Conductor 分析：                                            │
│  ├─ 查询 RAG：项目用 MongoDB + Express                       │
│  ├─ 查询 Sessions：之前有用户认证功能                        │
│  ├─ 决策：需要 Architect 设计数据库和 API                     │
│  └─ 分配任务 → Architect                                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  第二步：Architect 设计                                      │
├─────────────────────────────────────────────────────────────┤
│  输出：                                                      │
│  ├─ 数据模型：Comment { id, userId, content, createdAt }     │
│  ├─ API：GET /posts/:id/comments, POST /comments            │
│  ├─ 关系：Comment 属于 Post 和 User                         │
│  └─ 安全：需要验证用户身份，防止 XSS                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  第三步：Builder 实现                                        │
├─────────────────────────────────────────────────────────────┤
│  创建文件：                                                  │
│  ├─ models/Comment.js                                       │
│  ├─ controllers/commentController.js                        │
│  ├─ routes/commentRoutes.js                                 │
│  └─ tests/comment.test.js                                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  第四步：Reviewer 审查                                      │
├─────────────────────────────────────────────────────────────┤
│  发现问题：                                                  │
│  ├─ ⚠️ 缺少内容长度验证                                       │
│  ├─ ⚠️ 没有处理分页                                          │
│  └─ ✅ SQL 注入防护正确                                      │
│                                                             │
│  返回 Builder 修复                                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  第五步：Librarian 归档                                      │
├─────────────────────────────────────────────────────────────┤
│  更新：                                                      │
│  ├─ RAG/decisions/ - 评论系统架构决策                         │
│  ├─ .claude/sessions/ - 对话记录                              │
│  └─ development/todos/ - 待办事项                            │
└─────────────────────────────────────────────────────────────┘
```

### 触发方式

Agents 可以通过以下方式触发：

| 方式 | 说明 | 示例 |
|------|------|------|
| **手动命令** | 直接调用特定 Agent | `/architect 设计 API` |
| **自动路由** | Conductor 自动分配 | "实现登录" → 自动分给 Builder |
| **Hook 触发** | 事件自动触发 | pre-commit → Reviewer |
| **技能匹配** | RAG 自动找到相关技能 | "API 测试" → api-tester skill |

---

## Layer 4: 配置和自定义 (20 分钟)

### Agent 配置文件

位置：`~/.claude/config.json`

```json
{
  "version": "1.1.1",
  "model": "claude-opus-4.5",

  "agents": {
    "conductor": {
      "role": "任务协调与分解 - 理解需求并分配给合适的 Agent",
      "model": "claude-opus-4.5"
    },
    "architect": {
      "role": "架构设计 - 设计系统架构和技术选型",
      "model": "claude-sonnet-4.5"
    },
    "builder": {
      "role": "代码实现 - 编写高质量代码和测试",
      "model": "claude-sonnet-4.5"
    },
    "reviewer": {
      "role": "代码审查 - 检查代码质量和安全问题",
      "model": "claude-opus-4.5"
    },
    "librarian": {
      "role": "文档管理 - 整理文档和知识库",
      "model": "claude-haiku-4.5"
    }
  }
}
```

### 自定义 Agent

你可以添加自己的 Agent：

```json
{
  "agents": {
    "conductor": { ... },
    "architect": { ... },
    "builder": { ... },
    "reviewer": { ... },
    "librarian": { ... },

    // 自定义 Agent
    "security": {
      "role": "安全专家 - 检查安全漏洞和合规性",
      "model": "claude-opus-4.5"
    },
    "performance": {
      "role": "性能优化 - 分析和优化性能瓶颈",
      "model": "claude-sonnet-4.5"
    }
  }
}
```

### 模型选择策略

```
复杂决策任务 ──▶ Opus (最聪明，最贵)
    ├─ Conductor (需要全局理解)
    ├─ Architect (需要深度思考)
    └─ Reviewer (需要严谨分析)

标准实现任务 ──▶ Sonnet (平衡性能和成本)
    ├─ Builder (大部分编码工作)
    └─ Architect (简单设计)

简单辅助任务 ──▶ Haiku (快速响应)
    └─ Librarian (文档整理)
```

---

## Layer 5: 技能系统 (25 分钟)

### Skills 和 Agents 的关系

```
┌─────────────────────────────────────────────────────────────┐
│  Agent = 角色 + 协作逻辑                                     │
│  Skill = 领域知识 + 执行方法                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Agent 使用 Skill 完成任务                                    │
│                                                             │
│  Builder (Agent)                                            │
│     │                                                        │
│     ├─► frontend-design (Skill)  → 生成 UI 组件               │
│     ├─► xlsx (Skill)             → 生成 Excel 报表            │
│     ├─► pdf (Skill)              → 生成 PDF 文档             │
│     └─► pptx (Skill)             → 生成 PPT 演示             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 技能市场

```bash
# 查看可用技能
smc marketplace:list

# 安装技能
smc marketplace:install dev-browser

# 创建自己的技能
smc skill:create my-specialty
```

### 技能分类

| 分类 | 技能示例 | 使用场景 |
|------|---------|---------|
| **开发工具** | api-tester, webapp-testing | API 测试、UI 测试 |
| **文档处理** | docx, pdf, pptx, xlsx | Office 文档操作 |
| **设计** | canvas-design, frontend-design | 视觉设计、UI 组件 |
| **自动化** | slack-gif-creator, test-workflow | 自动化流程 |

---

## 快速参考

### 命令速查

```bash
# Agent 编排
smc agent "实现用户认证"

# 查看技能
smc skill:list
smc marketplace:list

# 安装技能
smc marketplace:install <skill-name>
```

### 配置位置

```
~/.claude/config.json           # Agent 定义
./.claude/settings.json         # 项目 Agent 配置
./.claude/skills/               # 项目技能
```

---

*更多细节查看 [README.md](./README.md) | [Q&A.md](./Q&A.md)*

<skills_system priority="1">

## Available Skills

<!-- SKILLS_TABLE_START -->
<usage>
When users ask you to perform tasks, check if any of the available skills below can help complete the task more effectively. Skills provide specialized capabilities and domain knowledge.

How to use skills:
- Invoke: Bash("openskills read <skill-name>")
- The skill content will load with detailed instructions on how to complete the task
- Base directory provided in output for resolving bundled resources (references/, scripts/, assets/)

Usage notes:
- Only use skills listed in <available_skills> below
- Do not invoke a skill that is already loaded in your context
- Each skill invocation is stateless
</usage>

<available_skills>

<skill>
<name>agent-browser</name>
<description>Browser automation CLI for AI agents. Use when the user needs to interact with websites, including navigating pages, filling forms, clicking buttons, taking screenshots, extracting data, testing web apps, or automating any browser task. Triggers include requests to "open a website", "fill out a form", "click a button", "take a screenshot", "scrape data from a page", "test this web app", "login to a site", "automate browser actions", or any task requiring programmatic web interaction.</description>
<location>project</location>
</skill>

<skill>
<name>algorithmic-art</name>
<description>Creating algorithmic art using p5.js with seeded randomness and interactive parameter exploration. Use this when users request creating art using code, generative art, algorithmic art, flow fields, or particle systems. Create original algorithmic art rather than copying existing artists' work to avoid copyright violations.</description>
<location>project</location>
</skill>

<skill>
<name>api-tester</name>
<description></description>
<location>project</location>
</skill>

<skill>
<name>brand-guidelines</name>
<description>Applies Anthropic's official brand colors and typography to any sort of artifact that may benefit from having Anthropic's look-and-feel. Use it when brand colors or style guidelines, visual formatting, or company design standards apply.</description>
<location>project</location>
</skill>

<skill>
<name>canvas-design</name>
<description>Create beautiful visual art in .png and .pdf documents using design philosophy. You should use this skill when the user asks to create a poster, piece of art, design, or other static piece. Create original visual designs, never copying existing artists' work to avoid copyright violations.</description>
<location>project</location>
</skill>

<skill>
<name>code-reviewer-123</name>
<description></description>
<location>project</location>
</skill>

<skill>
<name>design-audit</name>
<description></description>
<location>project</location>
</skill>

<skill>
<name>design-brain</name>
<description></description>
<location>project</location>
</skill>

<skill>
<name>doc-coauthoring</name>
<description>Guide users through a structured workflow for co-authoring documentation. Use when user wants to write documentation, proposals, technical specs, decision docs, or similar structured content. This workflow helps users efficiently transfer context, refine content through iteration, and verify the doc works for readers. Trigger when user mentions writing docs, creating proposals, drafting specs, or similar documentation tasks.</description>
<location>project</location>
</skill>

<skill>
<name>docx</name>
<description>"Use this skill whenever the user wants to create, read, edit, or manipulate Word documents (.docx files). Triggers include: any mention of \"Word doc\", \"word document\", \".docx\", or requests to produce professional documents with formatting like tables of contents, headings, page numbers, or letterheads. Also use when extracting or reorganizing content from .docx files, inserting or replacing images in documents, performing find-and-replace in Word files, working with tracked changes or comments, or converting content into a polished Word document. If the user asks for a \"report\", \"memo\", \"letter\", \"template\", or similar deliverable as a Word or .docx file, use this skill. Do NOT use for PDFs, spreadsheets, Google Docs, or general coding tasks unrelated to document generation."</description>
<location>project</location>
</skill>

<skill>
<name>frontend-design</name>
<description>Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, artifacts, posters, or applications (examples include websites, landing pages, dashboards, React components, HTML/CSS layouts, or when styling/beautifying any web UI). Generates creative, polished code and UI design that avoids generic AI aesthetics.</description>
<location>project</location>
</skill>

<skill>
<name>internal-comms</name>
<description>A set of resources to help me write all kinds of internal communications, using the formats that my company likes to use. Claude should use this skill whenever asked to write some sort of internal communications (status reports, leadership updates, 3P updates, company newsletters, FAQs, incident reports, project updates, etc.).</description>
<location>project</location>
</skill>

<skill>
<name>manus-kickoff</name>
<description></description>
<location>project</location>
</skill>

<skill>
<name>mcp-builder</name>
<description>Guide for creating high-quality MCP (Model Context Protocol) servers that enable LLMs to interact with external services through well-designed tools. Use when building MCP servers to integrate external APIs or services, whether in Python (FastMCP) or Node/TypeScript (MCP SDK).</description>
<location>project</location>
</skill>

<skill>
<name>my-skill</name>
<description></description>
<location>project</location>
</skill>

<skill>
<name>pdf</name>
<description>Use this skill whenever the user wants to do anything with PDF files. This includes reading or extracting text/tables from PDFs, combining or merging multiple PDFs into one, splitting PDFs apart, rotating pages, adding watermarks, creating new PDFs, filling PDF forms, encrypting/decrypting PDFs, extracting images, and OCR on scanned PDFs to make them searchable. If the user mentions a .pdf file or asks to produce one, use this skill.</description>
<location>project</location>
</skill>

<skill>
<name>pptx</name>
<description>"Use this skill any time a .pptx file is involved in any way — as input, output, or both. This includes: creating slide decks, pitch decks, or presentations; reading, parsing, or extracting text from any .pptx file (even if the extracted content will be used elsewhere, like in an email or summary); editing, modifying, or updating existing presentations; combining or splitting slide files; working with templates, layouts, speaker notes, or comments. Trigger whenever the user mentions \"deck,\" \"slides,\" \"presentation,\" or references a .pptx filename, regardless of what they plan to do with the content afterward. If a .pptx file needs to be opened, created, or touched, use this skill."</description>
<location>project</location>
</skill>

<skill>
<name>quality-guard</name>
<description></description>
<location>project</location>
</skill>

<skill>
<name>quick-fix</name>
<description></description>
<location>project</location>
</skill>

<skill>
<name>react-best-practices</name>
<description>React and Next.js performance optimization guidelines from Vercel Engineering. This skill should be used when writing, reviewing, or refactoring React/Next.js code to ensure optimal performance patterns. Triggers on tasks involving React components, Next.js pages, data fetching, bundle optimization, or performance improvements.</description>
<location>project</location>
</skill>

<skill>
<name>seo-optimization</name>
<description>SEO best practices for Git, documentation, and web projects</description>
<location>project</location>
</skill>

<skill>
<name>skill-creator</name>
<description>Guide for creating effective skills. This skill should be used when users want to create a new skill (or update an existing skill) that extends Claude's capabilities with specialized knowledge, workflows, or tool integrations.</description>
<location>project</location>
</skill>

<skill>
<name>slack-gif-creator</name>
<description>Knowledge and utilities for creating animated GIFs optimized for Slack. Provides constraints, validation tools, and animation concepts. Use when users request animated GIFs for Slack like "make me a GIF of X doing Y for Slack."</description>
<location>project</location>
</skill>

<skill>
<name>technical-cofounder</name>
<description>Technical Co-Founder workflow for building a real, launchable product with strict phase gates (Discovery → Planning → Building → Polish → Handoff). Use when the user wants to build/ship an app/product/MVP for real usage or public launch.</description>
<location>project</location>
</skill>

<skill>
<name>template</name>
<description>Replace with description of the skill and when Claude should use it.</description>
<location>project</location>
</skill>

<skill>
<name>test-skill-name</name>
<description></description>
<location>project</location>
</skill>

<skill>
<name>theme-factory</name>
<description>Toolkit for styling artifacts with a theme. These artifacts can be slides, docs, reportings, HTML landing pages, etc. There are 10 pre-set themes with colors/fonts that you can apply to any artifact that has been creating, or can generate a new theme on-the-fly.</description>
<location>project</location>
</skill>

<skill>
<name>threejs-fundamentals</name>
<description>Three.js scene setup, cameras, renderer, Object3D hierarchy, coordinate systems. Use when setting up 3D scenes, creating cameras, configuring renderers, managing object hierarchies, or working with transforms.</description>
<location>project</location>
</skill>

<skill>
<name>web-artifacts-builder</name>
<description>Suite of tools for creating elaborate, multi-component claude.ai HTML artifacts using modern frontend web technologies (React, Tailwind CSS, shadcn/ui). Use for complex artifacts requiring state management, routing, or shadcn/ui components - not for simple single-file HTML/JSX artifacts.</description>
<location>project</location>
</skill>

<skill>
<name>web-design-guidelines</name>
<description>Review UI code for Web Interface Guidelines compliance. Use when asked to "review my UI", "check accessibility", "audit design", "review UX", or "check my site against best practices".</description>
<location>project</location>
</skill>

<skill>
<name>webapp-testing</name>
<description>Toolkit for interacting with and testing local web applications using Playwright. Supports verifying frontend functionality, debugging UI behavior, capturing browser screenshots, and viewing browser logs.</description>
<location>project</location>
</skill>

<skill>
<name>xlsx</name>
<description>"Use this skill any time a spreadsheet file is the primary input or output. This means any task where the user wants to: open, read, edit, or fix an existing .xlsx, .xlsm, .csv, or .tsv file (e.g., adding columns, computing formulas, formatting, charting, cleaning messy data); create a new spreadsheet from scratch or from other data sources; or convert between tabular file formats. Trigger especially when the user references a spreadsheet file by name or path — even casually (like \"the xlsx in my downloads\") — and wants something done to it or produced from it. Also trigger for cleaning or restructuring messy tabular data files (malformed rows, misplaced headers, junk data) into proper spreadsheets. The deliverable must be a spreadsheet file. Do NOT trigger when the primary deliverable is a Word document, HTML report, standalone Python script, database pipeline, or Google Sheets API integration, even if tabular data is involved."</description>
<location>project</location>
</skill>

</available_skills>
<!-- SKILLS_TABLE_END -->

</skills_system>
