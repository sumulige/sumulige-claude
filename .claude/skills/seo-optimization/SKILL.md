---
name: seo-optimization
description: SEO best practices for Git, documentation, and web projects
---

# SEO Optimization

> 搜索引擎优化最佳实践 - Git、文档、Web 全覆盖

## 触发场景

| 场景 | 触发时机 |
|------|----------|
| **Commit** | 写提交信息时 |
| **Release** | 发布新版本时 |
| **README** | 创建/更新 README 时 |
| **Web** | 创建网页/Landing Page 时 |

---

## 1. Git Commit SEO

### Conventional Commits 格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 关键词（提升可搜索性）

| Type | 用途 | SEO 价值 |
|------|------|----------|
| `feat` | 新功能 | 高 - 功能搜索 |
| `fix` | Bug 修复 | 高 - 问题搜索 |
| `docs` | 文档 | 中 - 文档搜索 |
| `perf` | 性能优化 | 中 - 性能搜索 |
| `refactor` | 重构 | 低 |
| `chore` | 杂项 | 低 |

### Subject 最佳实践

```
✅ feat: add user authentication with OAuth2
✅ fix: resolve memory leak in WebSocket connection
✅ docs: add API reference for payment module

❌ feat: add feature
❌ fix: fix bug
❌ update code
```

**规则**：
- 动词开头（add, fix, update, remove, implement）
- 50 字符内
- 包含核心关键词
- 不用句号结尾

---

## 2. GitHub Release SEO

### 标题格式

```
v{version} - {简短描述}

示例:
v1.10.0 - Multi-Platform Support (8 → 10 AI CLIs)
v2.0.0 - Complete Architecture Rewrite
```

### Release Notes 结构

```markdown
## Highlights

{1-2 句话总结最重要的变化}

## What's New

### Features
- **{功能名}**: {描述} (#PR)

### Bug Fixes
- Fix {问题描述} (#PR)

### Breaking Changes
- {破坏性变更说明}

## Statistics
- Files changed: X
- Lines added: +Y
- Lines removed: -Z

## Installation

\`\`\`bash
npm install package@version
\`\`\`
```

---

## 3. README SEO

### 首段优化（最重要）

```markdown
# {项目名}

**{项目名}** is {英文一句话描述}. {核心价值}.

Supports **{平台数}** including {平台列表}.
Features {特性1}, {特性2}, and {特性3}.
```

**关键点**：
- 首段必须包含项目名 2-3 次
- 包含核心关键词
- 150-200 字符内
- 被 GitHub 和搜索引擎索引

### Badge 优化

```markdown
[![npm version](https://img.shields.io/npm/v/{pkg}.svg)](https://npmjs.com/package/{pkg})
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platforms-{N}%20supported-blue.svg)](#platforms)
```

### H2 标题关键词

```markdown
## Quick Start        ← 安装搜索
## Features           ← 功能搜索
## Installation       ← 安装搜索
## Usage              ← 使用搜索
## API Reference      ← API 搜索
## Contributing       ← 贡献搜索
## License            ← 许可搜索
```

---

## 4. Technical SEO (Web)

### Meta Tags 检查清单

```html
<!-- 必须 -->
<title>{项目} - {核心价值} | {品牌}</title>
<meta name="description" content="{150字描述}">

<!-- Open Graph -->
<meta property="og:title" content="{标题}">
<meta property="og:description" content="{描述}">
<meta property="og:image" content="{预览图 1200x630}">
<meta property="og:url" content="{URL}">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{标题}">
<meta name="twitter:description" content="{描述}">
<meta name="twitter:image" content="{预览图}">
```

### 结构化数据 (JSON-LD)

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "{项目名}",
  "description": "{描述}",
  "applicationCategory": "DeveloperApplication",
  "operatingSystem": "Any",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  }
}
</script>
```

---

## 5. SEO 检查清单

### 发布前检查

- [ ] Commit message 使用 conventional commits
- [ ] CHANGELOG 包含当前版本
- [ ] README 首段包含项目名和关键词
- [ ] Release notes 有清晰的分类
- [ ] 版本号遵循 semver

### 文档检查

- [ ] 标题使用 H1-H6 层级
- [ ] 首段包含核心关键词
- [ ] 有明确的行动号召（Quick Start）
- [ ] Badge 链接正确

### Web 检查

- [ ] title 50-60 字符
- [ ] description 150-160 字符
- [ ] Open Graph 图片 1200x630
- [ ] 移动端友好
