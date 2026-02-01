#!/usr/bin/env node
/**
 * Live Quality Gate - 实时质量检查
 *
 * PostToolUse 钩子：每次 Write/Edit 后立即检查代码质量
 *
 * 检查项：
 * 1. 文件行数 ≤ 800
 * 2. 函数长度 ≤ 50 行
 * 3. 无硬编码密钥
 * 4. 无 console.log
 * 5. 基础代码规范
 */

const fs = require('fs');
const path = require('path');

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const GATE_CONFIG_FILE = path.join(PROJECT_DIR, '.claude/quality-gate.json');

// 默认规则配置
const DEFAULT_RULES = {
  maxFileLines: 800,
  maxFunctionLines: 50,
  forbiddenPatterns: [
    {
      pattern: /console\.(log|debug|info)\s*\(/g,
      message: '禁止 console.log/debug/info',
      severity: 'warn'
    },
    {
      pattern: /api[_-]?key\s*[:=]\s*['"][^'"]{10,}['"]/gi,
      message: '检测到可能的硬编码 API Key',
      severity: 'error'
    },
    {
      pattern: /password\s*[:=]\s*['"][^'"]+['"]/gi,
      message: '检测到可能的硬编码密码',
      severity: 'error'
    },
    {
      pattern: /secret\s*[:=]\s*['"][^'"]{10,}['"]/gi,
      message: '检测到可能的硬编码 Secret',
      severity: 'error'
    },
    {
      pattern: /TODO:|FIXME:|HACK:|XXX:/g,
      message: '存在待处理标记',
      severity: 'info'
    }
  ]
};

// 豁免模式
const EXEMPT_PATTERNS = [
  /\.md$/,
  /\.json$/,
  /\.test\./,
  /\.spec\./,
  /__tests__/,
  /node_modules/,
  /\.min\./,
  /\.bundle\./,
  /dist\//,
  /build\//
];

/**
 * 获取配置
 */
function getConfig() {
  try {
    if (fs.existsSync(GATE_CONFIG_FILE)) {
      const config = JSON.parse(fs.readFileSync(GATE_CONFIG_FILE, 'utf-8'));
      return { ...DEFAULT_RULES, ...(config.liveQuality || {}) };
    }
  } catch (e) {
    // 使用默认配置
  }
  return DEFAULT_RULES;
}

/**
 * 检查文件是否豁免
 */
function isExempt(filePath) {
  if (!filePath) return true;
  return EXEMPT_PATTERNS.some(pattern => pattern.test(filePath));
}

/**
 * 检测函数长度（简单实现）
 */
function detectLongFunctions(content, maxLines) {
  const issues = [];
  const lines = content.split('\n');

  // 简单的函数检测：匹配 function 或箭头函数
  const functionPatterns = [
    /function\s+(\w+)\s*\(/g,
    /(\w+)\s*[:=]\s*(?:async\s+)?function\s*\(/g,
    /(\w+)\s*[:=]\s*(?:async\s+)?\([^)]*\)\s*=>/g,
    /(\w+)\s*[:=]\s*(?:async\s+)?\w+\s*=>/g
  ];

  let braceDepth = 0;
  let functionStart = -1;
  let functionName = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 检测函数开始
    for (const pattern of functionPatterns) {
      pattern.lastIndex = 0;
      const match = pattern.exec(line);
      if (match && functionStart === -1) {
        functionStart = i;
        functionName = match[1] || 'anonymous';
      }
    }

    // 计算大括号深度
    const openBraces = (line.match(/{/g) || []).length;
    const closeBraces = (line.match(/}/g) || []).length;

    if (functionStart !== -1) {
      braceDepth += openBraces - closeBraces;

      if (braceDepth <= 0 && openBraces > 0) {
        // 函数结束
        const functionLength = i - functionStart + 1;
        if (functionLength > maxLines) {
          issues.push({
            line: functionStart + 1,
            message: `函数 '${functionName}' 超过 ${maxLines} 行 (当前 ${functionLength} 行)`,
            severity: 'warn'
          });
        }
        functionStart = -1;
        functionName = '';
        braceDepth = 0;
      }
    }
  }

  return issues;
}

/**
 * 检查代码质量
 */
function checkQuality(filePath, config) {
  const issues = [];

  if (!fs.existsSync(filePath)) {
    return issues;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  // 1. 检查文件行数
  if (lines.length > config.maxFileLines) {
    issues.push({
      severity: 'error',
      message: `文件超过 ${config.maxFileLines} 行 (当前 ${lines.length} 行)`
    });
  }

  // 2. 检查禁止模式
  for (const rule of config.forbiddenPatterns) {
    const pattern = typeof rule.pattern === 'string'
      ? new RegExp(rule.pattern, 'g')
      : rule.pattern;

    pattern.lastIndex = 0;
    const matches = content.match(pattern);
    if (matches && matches.length > 0) {
      issues.push({
        severity: rule.severity || 'warn',
        message: `${rule.message} (${matches.length} 处)`
      });
    }
  }

  // 3. 检查函数长度（仅对 JS/TS 文件）
  if (/\.(js|ts|jsx|tsx)$/.test(filePath)) {
    const longFunctions = detectLongFunctions(content, config.maxFunctionLines);
    issues.push(...longFunctions);
  }

  return issues;
}

/**
 * 格式化输出
 */
function formatOutput(filePath, issues) {
  if (issues.length === 0) {
    return null;
  }

  const errors = issues.filter(i => i.severity === 'error');
  const warns = issues.filter(i => i.severity === 'warn');
  const infos = issues.filter(i => i.severity === 'info');

  const relativePath = path.relative(PROJECT_DIR, filePath);

  let output = `\n╔══════════════════════════════════════════════════════════════╗\n`;
  output += `║  📊 Live Quality Check: ${relativePath.slice(0, 35).padEnd(35)}║\n`;
  output += `╠══════════════════════════════════════════════════════════════╣\n`;

  if (errors.length > 0) {
    output += `║  ❌ 错误 (${errors.length}):                                              ║\n`;
    for (const issue of errors) {
      output += `║     • ${issue.message.slice(0, 52).padEnd(52)}║\n`;
    }
  }

  if (warns.length > 0) {
    output += `║  ⚠️  警告 (${warns.length}):                                              ║\n`;
    for (const issue of warns) {
      output += `║     • ${issue.message.slice(0, 52).padEnd(52)}║\n`;
    }
  }

  if (infos.length > 0) {
    output += `║  ℹ️  信息 (${infos.length}):                                              ║\n`;
    for (const issue of infos) {
      output += `║     • ${issue.message.slice(0, 52).padEnd(52)}║\n`;
    }
  }

  output += `╚══════════════════════════════════════════════════════════════╝\n`;

  return output;
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
  const { tool, filePath } = getToolInput();

  // 只检查 Write 和 Edit 工具
  if (!['Write', 'Edit'].includes(tool)) {
    process.exit(0);
  }

  // 检查是否豁免
  if (isExempt(filePath)) {
    process.exit(0);
  }

  const config = getConfig();
  const issues = checkQuality(filePath, config);
  const output = formatOutput(filePath, issues);

  if (output) {
    console.log(output);
  }

  // 始终返回成功（警告不阻止操作）
  process.exit(0);
}

main();
