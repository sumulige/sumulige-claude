#!/usr/bin/env python3
"""
Test Workflow Demo - Login Function Test
自动化测试工作流演示：登录功能测试
"""

import asyncio
import json
from pathlib import Path
from datetime import datetime
from playwright.async_api import async_playwright

try:
    from PIL import Image
    import io
    HAS_PIL = True
except ImportError:
    HAS_PIL = False
    print("⚠️  PIL not installed, GIF generation will be skipped")

# ============================================================================
# Configuration
# ============================================================================

CONFIG = {
    "base_url": "http://localhost:3000",
    "gif_size": (128, 128),
    "output_dir": Path("test_output"),
    "screenshot_dir": Path("test_output/screenshots"),
    "gif_path": Path("test_output/test_process.gif"),
    "report_path": Path("test_output/test_report.md"),
}

# ============================================================================
# Test Frames
# ============================================================================

test_frames = []

async def capture_frame(page):
    """Capture current page state as a frame for GIF"""
    if not HAS_PIL:
        return None
    screenshot_bytes = await page.screenshot(type="png")
    img = Image.open(io.BytesIO(screenshot_bytes))
    return img.resize(CONFIG["gif_size"])

# ============================================================================
# Test Steps
# ============================================================================

async def test_login(page):
    """Test login functionality"""

    print("\n🧪 Starting Login Test...")
    print("=" * 50)

    test_cases = []

    # Step 1: Navigate to login page
    print("\n[1/5] Navigating to login page...")
    try:
        await page.goto(f"{CONFIG['base_url']}/login.html")
        await page.wait_for_load_state("networkidle")

        # Capture frame
        frame = await capture_frame(page)
        if frame:
            test_frames.append(frame)

        # Screenshot
        await page.screenshot(path=str(CONFIG["screenshot_dir"] / "01_login_page.png"))
        print("   ✅ Login page loaded")
        test_cases.append({"name": "打开登录页面", "status": "✅ 通过", "screenshot": "01_login_page.png"})
    except Exception as e:
        print(f"   ❌ Failed: {e}")
        test_cases.append({"name": "打开登录页面", "status": "❌ 失败", "error": str(e)})

    # Step 2: Fill in username
    print("\n[2/5] Entering username...")
    try:
        await page.fill("input[name='username']", "admin")
        frame = await capture_frame(page)
        if frame:
            test_frames.append(frame)
        await page.screenshot(path=str(CONFIG["screenshot_dir"] / "02_username_filled.png"))
        print("   ✅ Username entered: admin")
        test_cases.append({"name": "输入用户名", "status": "✅ 通过", "screenshot": "02_username_filled.png"})
    except Exception as e:
        print(f"   ❌ Failed: {e}")
        test_cases.append({"name": "输入用户名", "status": "❌ 失败", "error": str(e)})

    # Step 3: Fill in password
    print("\n[3/5] Entering password...")
    try:
        await page.fill("input[name='password']", "password123")
        frame = await capture_frame(page)
        if frame:
            test_frames.append(frame)
        await page.screenshot(path=str(CONFIG["screenshot_dir"] / "03_password_filled.png"))
        print("   ✅ Password entered: ***")
        test_cases.append({"name": "输入密码", "status": "✅ 通过", "screenshot": "03_password_filled.png"})
    except Exception as e:
        print(f"   ❌ Failed: {e}")
        test_cases.append({"name": "输入密码", "status": "❌ 失败", "error": str(e)})

    # Step 4: Click login button
    print("\n[4/5] Clicking login button...")
    try:
        async with page.expect_navigation(timeout=5000):
            await page.click("button[type='submit']")
        frame = await capture_frame(page)
        if frame:
            test_frames.append(frame)
        await page.screenshot(path=str(CONFIG["screenshot_dir"] / "04_login_clicked.png"))
        print("   ✅ Login button clicked")
        test_cases.append({"name": "点击登录按钮", "status": "✅ 通过", "screenshot": "04_login_clicked.png"})
    except Exception as e:
        print(f"   ❌ Failed: {e}")
        test_cases.append({"name": "点击登录按钮", "status": "❌ 失败", "error": str(e)})

    # Step 5: Verify successful login
    print("\n[5/5] Verifying login success...")
    try:
        await page.wait_for_selector(".user-dashboard", timeout=5000)
        frame = await capture_frame(page)
        if frame:
            test_frames.append(frame)
        await page.screenshot(path=str(CONFIG["screenshot_dir"] / "05_login_success.png"))
        welcome_text = await page.text_content(".welcome-message")
        print(f"   ✅ Login successful: {welcome_text}")
        test_cases.append({"name": "验证登录成功", "status": "✅ 通过", "screenshot": "05_login_success.png"})
    except Exception as e:
        print(f"   ❌ Failed: {e}")
        test_cases.append({"name": "验证登录成功", "status": "❌ 失败", "error": str(e)})

    print("\n" + "=" * 50)

    passed = sum(1 for t in test_cases if "✅" in t["status"])
    total = len(test_cases)

    if passed == total:
        print(f"🎉 All tests passed! ({passed}/{total})")
    else:
        print(f"⚠️  Some tests failed: {passed}/{total} passed")

    return {"test_cases": test_cases, "passed": passed, "total": total}

# ============================================================================
# GIF Generation
# ============================================================================

def generate_test_gif():
    """Generate Slack-optimized GIF from test frames"""

    if not HAS_PIL:
        print("\n📹 Skipping GIF generation (PIL not installed)")
        return

    print("\n📹 Generating test GIF...")

    if not test_frames:
        print("   ⚠️  No frames captured")
        return

    duration = 100  # 100ms per frame = 10fps

    test_frames[0].save(
        CONFIG["gif_path"],
        save_all=True,
        append_images=test_frames[1:],
        duration=duration,
        loop=0,
        optimize=True
    )

    file_size = CONFIG["gif_path"].stat().st_size if CONFIG["gif_path"].exists() else 0
    print(f"   ✅ GIF saved: {CONFIG['gif_path']}")
    print(f"   📊 Frames: {len(test_frames)}, Size: {file_size} bytes")

# ============================================================================
# Test Report Generation
# ============================================================================

def generate_test_report(test_results):
    """Generate Markdown test report with embedded screenshots"""

    print("\n📄 Generating test report...")

    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Build test cases table
    test_cases_rows = ""
    for i, tc in enumerate(test_results["test_cases"], 1):
        test_cases_rows += f"| {i} | {tc['name']} | {tc['status']} |"

        if "screenshot" in tc:
            test_cases_rows += f" [查看](screenshots/{tc['screenshot']})"
        elif "error" in tc:
            test_cases_rows += f" `{tc['error']}`"

        test_cases_rows += " |\n"

    report = f"""# 测试报告 - 登录功能

## 测试概述

| 项目 | 内容 |
|------|------|
| 测试时间 | {timestamp} |
| 测试人员 | AI Automation (test-workflow) |
| 测试环境 | Chrome / {CONFIG['base_url']} |
| 测试类型 | 功能测试 |

---

## 测试过程

![测试过程动画](test_process.gif)

---

## 测试用例详情

"""

    # Add detailed test case sections
    for i, tc in enumerate(test_results["test_cases"], 1):
        report += f"### 用例 {i}: {tc['name']}\n\n"
        report += f"**状态**: {tc['status']}\n\n"

        if "screenshot" in tc:
            report += f"**截图**:\n"
            report += f"![{tc['name']}](screenshots/{tc['screenshot']})\n\n"
        if "error" in tc:
            report += f"**错误**: `{tc['error']}`\n\n"
        report += "---\n\n"

    report += f"""## 测试结果汇总

| # | 用例名称 | 状态 | 详情 |
|---|----------|------|------|
{test_cases_rows}---

## 测试结论

| 指标 | 结果 |
|------|------|
| 总用例数 | {test_results['total']} |
| 通过数 | {test_results['passed']} |
| 失败数 | {test_results['total'] - test_results['passed']} |
| **通过率** | **{int(test_results['passed']/test_results['total']*100)}%** |

### 结论

{"✅ **登录功能测试通过**" if test_results['passed'] == test_results['total'] else "⚠️ **部分测试失败，请检查**"}

---

## 附录

### 测试环境

- **浏览器**: Chromium (Playwright)
- **GIF 规格**: 128x128 @ 10fps (Slack 优化)
- **截图格式**: PNG

### 输出文件

```
test_output/
├── test_process.gif      # 测试过程动画
├── test_report.md        # 本报告
└── screenshots/          # 验证点截图
```

---

*本报告由 test-workflow 技能自动生成*
"""

    CONFIG["report_path"].write_text(report, encoding="utf-8")
    print(f"   ✅ Report saved: {CONFIG['report_path']}")

# ============================================================================
# Main Test Runner
# ============================================================================

async def main():
    """Main test execution"""

    print("\n" + "=" * 60)
    print("🚀 TEST WORKFLOW - 自动化测试工作流演示")
    print("=" * 60)
    print(f"   功能: 登录功能测试")
    print(f"   输出: GIF + 截图 + 测试报告")
    print(f"   时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    # Create output directories
    CONFIG["output_dir"].mkdir(exist_ok=True)
    CONFIG["screenshot_dir"].mkdir(exist_ok=True)

    # Run test with Playwright
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        try:
            test_results = await test_login(page)
        except Exception as e:
            print(f"\n❌ Test failed with exception: {e}")
            test_results = {
                "test_cases": [{"name": "测试执行", "status": "❌ 失败", "error": str(e)}],
                "passed": 0,
                "total": 1
            }
        finally:
            await browser.close()

    # Generate GIF
    generate_test_gif()

    # Generate report
    generate_test_report(test_results)

    print("\n" + "=" * 60)
    print("✅ 测试工作流完成！")
    print("=" * 60)
    print(f"\n📁 输出目录: {CONFIG['output_dir'].absolute()}")
    print(f"\n生成的文件:")
    print(f"  📹 {CONFIG['gif_path']}")
    print(f"  📄 {CONFIG['report_path']}")

    screenshot_count = len(list(CONFIG["screenshot_dir"].glob("*.png")))
    print(f"  📸 {screenshot_count} 张截图")

if __name__ == "__main__":
    asyncio.run(main())
