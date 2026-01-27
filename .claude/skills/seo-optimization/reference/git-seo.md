# Git & GitHub SEO

## Commit Message 模板

### Feature

```
feat(scope): add {功能名}

{详细描述，包含：}
- 实现了什么
- 为什么需要
- 如何使用

Closes #{issue}
```

### Bug Fix

```
fix(scope): resolve {问题描述}

{Root cause}: {原因}
{Solution}: {解决方案}

Fixes #{issue}
```

### Breaking Change

```
feat(scope)!: {变更描述}

BREAKING CHANGE: {详细说明}

Migration: {迁移步骤}
```

## GitHub Repository 优化

### Description (About)

```
{一句话描述} - {核心特性1}, {核心特性2}, {核心特性3}
```

### Topics (Tags)

选择 5-10 个相关 topics：
- 技术栈: `javascript`, `typescript`, `nodejs`
- 领域: `cli`, `developer-tools`, `automation`
- 特性: `ai`, `agent`, `plugin`

### Social Preview

- 尺寸: 1280x640 像素
- 包含: 项目名 + 核心价值 + 视觉元素
- 格式: PNG (透明背景不推荐)

## CHANGELOG 格式

```markdown
## [X.Y.Z](compare-link) (YYYY-MM-DD)

### Features
- **scope**: description (#PR)

### Bug Fixes
- **scope**: description (#PR)

### Performance
- **scope**: description (#PR)

### Documentation
- description (#PR)
```

## PR Title 格式

```
<type>(<scope>): <description>

示例:
feat(auth): implement OAuth2 login flow
fix(api): handle rate limiting errors gracefully
docs(readme): add quick start guide
```
