---
name: test-workflow
description: Automated testing workflow that combines Playwright testing, Slack GIF recording, and test report generation. Use when user mentions "测试"、"test"、"Playwright" or asks for QA/testing workflows. Automatically generates: (1) Test execution with Playwright, (2) Slack-optimized GIF of test process, (3) Screenshot at each verification point, (4) Markdown test report with embedded screenshots.

see_also:
  - webapp-testing
  - slack-gif-creator
  - doc-coauthoring
---

# Test Workflow - 自动化测试工作流

完整的测试工作流技能，整合 Playwright 测试、GIF 录制和测试报告生成。

## 默认行为

当用户说"测试 xxx"时，自动执行完整流程：

```
用户输入 → 测试执行 → GIF录制 → 截图 → 测试报告
```

**无需用户明确说明** - 只要提到"测试"就默认包含所有能力。

---

## 📋 工作流程

### 阶段 1: 理解测试需求

向用户确认测试范围：
```
我将对 [目标] 进行自动化测试，包括：
  1. Playwright 测试执行
  2. 测试过程 GIF 录制 (Slack 优化)
  3. 验证点截图
  4. Markdown 测试报告

测试范围：[确认测试场景]
```

### 阶段 2: 执行测试 (Playwright)

```python
from playwright.sync_api import sync_playwright
from PIL import Image
import io
import json

# 配置
GIF_SIZE = (128, 128)  # Slack emoji 尺寸
SCREENSHOT_DIR = "./test_screenshots"
FRAMES = []  # 用于 GIF 的帧

def capture_frame(page):
    """捕获一帧用于 GIF"""
    screenshot = page.screenshot()
    img = Image.open(io.BytesIO(screenshot))
    img_resized = img.resize(GIF_SIZE)
    return img_resized

# 测试执行
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    # 执行测试步骤，每步捕获
    # ... 测试逻辑 ...

    browser.close()
```

### 阶段 3: 生成 GIF (Slack 优化)

```python
# GIF 规格 (Slack 要求)
- 尺寸: 128x128 (emoji) 或 480x480 (message)
- FPS: 10-20
- 颜色: 48-64 种
- 时长: < 3 秒

FRAMES[0].save(
    "test_process.gif",
    save_all=True,
    append_images=FRAMES[1:],
    duration=100,  # 10fps
    optimize=True,
    colors=48
)
```

### 阶段 4: 生成测试报告 (Markdown)

```markdown
# 测试报告 - [功能名称]

## 测试概述
- 测试时间: 2026-01-15 14:30
- 测试人员: AI Automation
- 测试环境: Chrome / localhost:3000

## 测试过程
![测试过程](test_process.gif)

## 测试用例

### 用例 1: 用户登录
**预期**: 用户成功登录
**实际**: ✅ 通过
**截图**:
![登录成功](screenshots/login.png)

### 用例 2: 数据验证
**预期**: 显示用户数据
**实际**: ✅ 通过
**截图**:
![数据显示](screenshots/data.png)

## 测试结果
| 用例 | 状态 | 说明 |
|------|------|------|
| 用户登录 | ✅ | 正常跳转 |
| 数据验证 | ✅ | 数据正确 |

## 总结
- 通过: 2/2
- 失败: 0
- 测试结论: PASS
```

---

## 🎯 触发条件

**自动触发场景** (无需用户详细说明)：

| 用户说 | 解释 |
|--------|------|
| "测试登录功能" | 完整流程 |
| "用 Playwright 测试" | 完整流程 |
| "test the checkout" | 完整流程 |
| "跑一下测试" | 完整流程 |

**Claude 应主动执行**，不要问用户是否需要 GIF 或报告。

---

## 📦 输出文件

```
test_output/
├── test_process.gif      # Slack GIF
├── test_report.md        # 测试报告
└── screenshots/
    ├── step1_login.png
    ├── step2_data.png
    └── step3_result.png
```

---

## ⚙️ 配置选项

用户可以自定义规格：

```python
# 用户可以指定
- GIF 尺寸: 默认 128x128，可选 480x480
- 截图格式: 默认 PNG
- 报告格式: 默认 Markdown，可选 HTML
```

---

## 🔗 关联技能

本技能协调以下技能：

- **webapp-testing**: Playwright 测试执行
- **slack-gif-creator**: GIF 生成和优化
- **doc-coauthoring**: 报告文档结构

---

## 💡 设计理念

**"说测试，就要全套"**

用户不应该需要说明"我要 GIF"、"我要报告"、"我要截图"。

提到"测试" = 默认包含所有输出。
