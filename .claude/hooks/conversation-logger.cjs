#!/usr/bin/env node
/**
 * Conversation Logger - 增强版对话记录器
 *
 * 自动记录每次对话到 DAILY_CONVERSATION.md
 * 按日期分组，无需手动触发
 *
 * 功能：
 * - 捕获用户输入和 AI 输出
 * - 记录工具使用
 * - 按日期自动分组
 * - 实时追加到日志
 */

const fs = require('fs');
const path = require('path');

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const CONVERSATION_LOG = path.join(PROJECT_DIR, '.claude', 'DAILY_CONVERSATION.md');
const THINKING_DIR = path.join(PROJECT_DIR, '.claude', 'thinking-routes');
const FLOW_FILE = path.join(THINKING_DIR, '.conversation-flow.json');

// 确保目录存在
try { fs.mkdirSync(THINKING_DIR, { recursive: true }); } catch (e) {}

// 获取当前日期字符串 (YYYY-MM-DD)
function getDateStr() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 获取当前时间字符串 (HH:MM)
function getTimeStr() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// 转义 Markdown 特殊字符
function escapeMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/\|/g, '\\|')
    .replace(/\n/g, ' ')
    .slice(0, 500); // 限制长度
}

// 初始化日志文件
function initLogFile() {
  if (!fs.existsSync(CONVERSATION_LOG)) {
    const header = `# 每日对话记录

> 此文件由 conversation-logger.cjs 自动生成
> 记录与 AI 的每次对话

---
`;
    fs.writeFileSync(CONVERSATION_LOG, header, 'utf-8');
  }
}

// 追加对话到日志
function appendConversation(role, content, toolInfo = '') {
  initLogFile();

  const dateStr = getDateStr();
  const timeStr = getTimeStr();
  const roleLabel = role === 'user' ? '👤 用户' : role === 'assistant' ? '🤖 AI' : '🔧 工具';
  const safeContent = escapeMarkdown(content);

  const entry = `### ${timeStr} - ${roleLabel}
${safeContent}${toolInfo ? `\n> ${toolInfo}` : ''}

`;

  // 读取现有内容
  let logContent = fs.readFileSync(CONVERSATION_LOG, 'utf-8');

  // 检查今天是否已有日期头
  const todayHeader = `## ${dateStr}`;
  const todayIndex = logContent.indexOf(todayHeader);

  if (todayIndex === -1) {
    // 今天还没有记录，添加新的日期头
    const todaySection = `
---

## ${dateStr}

${entry}
`;
    logContent += todaySection;
  } else {
    // 找到今天的记录位置，在末尾追加
    // 使用正则确保只匹配 ## 开头的日期行，而不是 ### 开头的条目
    const afterToday = logContent.slice(todayIndex + todayHeader.length);
    const dateMatch = afterToday.match(/^## \d{4}-\d{2}-\d{2}/m);
    const nextDateIndex = dateMatch ? todayIndex + todayHeader.length + dateMatch.index : -1;

    if (nextDateIndex === -1) {
      // 今天是最后一天，直接追加到文件末尾
      logContent += entry;
    } else {
      // 在下一天之前插入
      logContent = logContent.slice(0, nextDateIndex) + entry + logContent.slice(nextDateIndex);
    }
  }

  // 写回文件
  fs.writeFileSync(CONVERSATION_LOG, logContent, 'utf-8');
}

// 从思维轨迹读取并记录完整对话
function syncFromFlowFile() {
  if (!fs.existsSync(FLOW_FILE)) {
    return;
  }

  try {
    const flow = JSON.parse(fs.readFileSync(FLOW_FILE, 'utf-8'));
    const turns = flow.turns || [];

    if (turns.length === 0) return;

    // 读取现有日志，记录已处理的 turn
    const logContent = fs.existsSync(CONVERSATION_LOG)
      ? fs.readFileSync(CONVERSATION_LOG, 'utf-8')
      : '';
    initLogFile();

    // 简单的追踪：只记录最新的几次交互
    const recentTurns = turns.slice(-5);

    recentTurns.forEach(turn => {
      const time = turn.time ? new Date(turn.time).toISOString() : '';
      const toolName = turn.toolName || '';
      const type = turn.type || '';

      // 根据 turn 类型记录
      if (type === 'potential-action' && toolName) {
        appendConversation('tool', `[${toolName}]`, turn.description || '');
      }
    });
  } catch (e) {
    // 静默处理错误
  }
}

// 主函数
function main() {
  try {
    const eventType = process.env.CLAUDE_EVENT_TYPE || '';
    const toolName = process.env.CLAUDE_TOOL_NAME || '';
    const toolInput = process.env.CLAUDE_TOOL_INPUT || '';
    const textOutput = process.env.CLAUDE_TEXT_OUTPUT || '';

    // 根据事件类型记录
    switch (eventType) {
      case 'UserPromptSubmit':
        // 用户提交输入
        if (toolInput) {
          appendConversation('user', toolInput);
        }
        break;

      case 'TextOutput':
        // AI 输出文本
        if (textOutput) {
          appendConversation('assistant', textOutput);
        }
        break;

      case 'PostToolUse':
        // 工具使用后
        if (toolName) {
          appendConversation('tool', toolInput, `使用工具: ${toolName}`);
        }
        break;

      case 'AgentStop':
        // 会话结束，同步思维轨迹
        syncFromFlowFile();
        break;
    }

  } catch (e) {
    // 静默处理错误，不干扰正常对话
  }

  process.exit(0);
}

// 如果直接运行，执行同步
if (require.main === module) {
  if (process.argv.includes('--sync')) {
    syncFromFlowFile();
    console.log('✅ 已同步对话记录');
  } else if (process.argv.includes('--view')) {
    // 查看今日对话
    if (fs.existsSync(CONVERSATION_LOG)) {
      const content = fs.readFileSync(CONVERSATION_LOG, 'utf-8');
      const today = getDateStr();
      const start = content.indexOf(`## ${today}`);
      if (start !== -1) {
        const end = content.indexOf('## ', start + 10);
        console.log(content.slice(start, end === -1 ? undefined : end));
      } else {
        console.log('📭 今天暂无对话记录');
      }
    } else {
      console.log('📭 暂无对话记录');
    }
  } else {
    main();
  }
}

module.exports = { main, syncFromFlowFile, appendConversation };
