# Technical SEO

## Meta Tags 完整模板

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- Basic SEO -->
  <title>{项目名} - {核心价值} | {品牌}</title>
  <meta name="description" content="{150-160字描述，包含核心关键词}">
  <meta name="keywords" content="{关键词1}, {关键词2}, {关键词3}">
  <meta name="author" content="{作者}">

  <!-- Canonical -->
  <link rel="canonical" href="{规范URL}">

  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="{URL}">
  <meta property="og:title" content="{标题}">
  <meta property="og:description" content="{描述}">
  <meta property="og:image" content="{图片URL 1200x630}">
  <meta property="og:site_name" content="{站点名}">
  <meta property="og:locale" content="zh_CN">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="{URL}">
  <meta name="twitter:title" content="{标题}">
  <meta name="twitter:description" content="{描述}">
  <meta name="twitter:image" content="{图片URL}">

  <!-- Favicon -->
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
</head>
```

## 结构化数据

### SoftwareApplication

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "{项目名}",
  "description": "{描述}",
  "url": "{URL}",
  "applicationCategory": "DeveloperApplication",
  "operatingSystem": "Any",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "author": {
    "@type": "Person",
    "name": "{作者}"
  }
}
```

### Organization

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "{组织名}",
  "url": "{URL}",
  "logo": "{Logo URL}",
  "sameAs": [
    "https://github.com/{org}",
    "https://twitter.com/{handle}"
  ]
}
```

## 性能优化

### Core Web Vitals 目标

| 指标 | 目标 | 说明 |
|------|------|------|
| LCP | < 2.5s | 最大内容绘制 |
| FID | < 100ms | 首次输入延迟 |
| CLS | < 0.1 | 累计布局偏移 |

### 图片优化

- 使用 WebP/AVIF 格式
- 提供响应式图片 (srcset)
- 添加 alt 属性
- 懒加载非首屏图片

### 资源优化

- Gzip/Brotli 压缩
- CSS/JS 最小化
- 关键 CSS 内联
- 预加载关键资源
