#!/usr/bin/env node
/**
 * Plan Gate - 强制规划门控
 *
 * PreToolUse 钩子：在任何 Write/Edit 之前检查是否有批准的计划
 *
 * 硬阻止模式：无批准计划直接阻止操作
 */

const fs = require('fs');
const path = require('path');

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const HOME_DIR = process.env.HOME || require('os').homedir();

// 检查两个位置的计划目录
const PLANS_DIRS = [
  path.join(PROJECT_DIR, '.claude/plans'),    // 项目级计划
  path.join(HOME_DIR, '.claude/plans')         // 全局计划
];
const GATE_CONFIG_FILE = path.join(PROJECT_DIR, '.claude/quality-gate.json');

// 豁免模式：这些文件不需要计划
const EXEMPT_PATTERNS = [
  /\.md$/,                    // Markdown 文档
  /\.json$/,                  // JSON 配置
  /\.test\./,                 // 测试文件
  /\.spec\./,                 // 测试文件
  /__tests__/,                // 测试目录
  /node_modules/,             // 依赖
  /\.claude\//,               // Claude 配置
  /\.git\//,                  // Git 目录
  /package-lock\.json$/,      // 锁文件
  /yarn\.lock$/,              // 锁文件
  /pnpm-lock\.yaml$/,         // 锁文件
];

/**
 * 检查文件是否豁免
 */
function isExempt(filePath) {
  if (!filePath) return true;
  return EXEMPT_PATTERNS.some(pattern => pattern.test(filePath));
}

/**
 * 获取配置
 */
function getConfig() {
  try {
    if (fs.existsSync(GATE_CONFIG_FILE)) {
      const config = JSON.parse(fs.readFileSync(GATE_CONFIG_FILE, 'utf-8'));
      return config.planGate || { enabled: true, mode: 'block' };
    }
  } catch (e) {
    // 默认配置
  }
  return { enabled: true, mode: 'block' };
}

/**
 * 检查是否有批准的计划
 */
function hasApprovedPlan() {
  for (const plansDir of PLANS_DIRS) {
    // 确保计划目录存在
    if (!fs.existsSync(plansDir)) {
      continue;
    }

    try {
      const planFiles = fs.readdirSync(plansDir)
        .filter(f => f.endsWith('.md'));

      for (const planFile of planFiles) {
        const content = fs.readFileSync(path.join(plansDir, planFile), 'utf-8');

        // 检查计划是否被批准（最近 24 小时内）
        const stat = fs.statSync(path.join(plansDir, planFile));
        const ageHours = (Date.now() - stat.mtimeMs) / (1000 * 60 * 60);

        // 只接受 24 小时内的批准计划
        if (ageHours > 24) {
          continue;
        }

        // 检查计划是否被批准
        if (content.includes('## Approved Plan') ||
            content.includes('status: approved') ||
            content.includes('User has approved')) {
          return true;
        }
      }
    } catch (e) {
      // 读取失败，继续检查下一个目录
    }
  }

  return false;
}

/**
 * 从环境变量获取工具输入
 */
function getToolInput() {
  const toolName = process.env.CLAUDE_TOOL_NAME || '';
  const toolInput = process.env.CLAUDE_TOOL_INPUT || '{}';

  try {
    const input = JSON.parse(toolInput);
    return {
      tool: toolName,
      filePath: input.file_path || input.path || ''
    };
  } catch (e) {
    return { tool: toolName, filePath: '' };
  }
}

/**
 * 主函数
 */
function main() {
  const config = getConfig();

  // 如果禁用，直接通过
  if (!config.enabled) {
    process.exit(0);
  }

  const { tool, filePath } = getToolInput();

  // 只检查 Write 和 Edit 工具
  if (!['Write', 'Edit'].includes(tool)) {
    process.exit(0);
  }

  // 检查是否豁免
  if (isExempt(filePath)) {
    process.exit(0);
  }

  // 检查是否有批准的计划
  if (hasApprovedPlan()) {
    process.exit(0);
  }

  // 无计划，根据模式处理
  if (config.mode === 'block') {
    // 硬阻止：输出错误信息并退出非零状态
    console.error(`
╔══════════════════════════════════════════════════════════════╗
║  ⛔ Plan Gate: 操作被阻止                                     ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  无批准的实施计划。                                           ║
║                                                              ║
║  请先运行:  /plan                                            ║
║  创建并批准实施计划后再进行代码修改。                          ║
║                                                              ║
║  目标文件: ${filePath.slice(0, 45).padEnd(45)}║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`);
    process.exit(1);
  } else {
    // 警告模式
    console.warn(`⚠️  Plan Gate 警告: 建议先运行 /plan 创建实施计划`);
    process.exit(0);
  }
}

main();
