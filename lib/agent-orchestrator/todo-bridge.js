/**
 * Todo Bridge - 连接 Agent 和 Todo 系统
 *
 * 提供从 Agent 分析结果自动创建 Todo 文件的功能
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const TODOS_DIR = path.join(PROJECT_DIR, 'development', 'todos');
const LOG_DIR = path.join(PROJECT_DIR, '.claude', 'agent-logs');
const ERROR_LOG = path.join(LOG_DIR, 'todo-errors.log');

function logTodoError(context, error) {
  const message = `[todo-bridge] ${context}: ${error && error.message ? error.message : String(error)}`;
  try {
    console.error(`❌ ${message}`);
  } catch {}
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    const details = error && error.stack ? error.stack : String(error);
    fs.appendFileSync(ERROR_LOG, `${new Date().toISOString()} ${context}: ${details}\n`);
  } catch {}
}

/**
 * 将字符串转换为文件名安全的 slug
 */
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[\u4e00-\u9fa5]/g, (char) => {
      // 简单的中文转拼音映射（常用字）
      const pinyin = {
        '实': 'shi', '现': 'xian', '用': 'yong', '户': 'hu',
        '认': 'ren', '证': 'zheng', '登': 'deng', '录': 'lu',
        '注': 'zhu', '册': 'ce', '功': 'gong', '能': 'neng',
        '设': 'she', '计': 'ji', '架': 'jia', '构': 'gou',
        '审': 'shen', '查': 'cha', '代': 'dai', '码': 'ma',
        '测': 'ce', '试': 'shi', '修': 'xiu', '复': 'fu',
        '优': 'you', '化': 'hua', '添': 'tian', '加': 'jia',
        '删': 'shan', '除': 'chu', '更': 'geng', '新': 'xin',
        '创': 'chuang', '建': 'jian', '接': 'jie', '口': 'kou',
        '数': 'shu', '据': 'ju', '库': 'ku', '配': 'pei',
        '置': 'zhi', '文': 'wen', '档': 'dang', '部': 'bu',
        '署': 'shu', '发': 'fa', '布': 'bu', '系': 'xi',
        '统': 'tong', '服': 'fu', '务': 'wu', '安': 'an',
        '全': 'quan', '性': 'xing', '能': 'neng', '模': 'mo',
        '块': 'kuai', '组': 'zu', '件': 'jian'
      };
      return pinyin[char] || char;
    })
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

/**
 * 生成 Todo 文件模板
 */
function generateTodoTemplate(task) {
  const now = new Date().toISOString().split('T')[0];
  const priority = task.priority || 'P1';
  const agent = task.agent || 'builder';

  let md = `# ${task.title}

**状态**: 🚧 进行中
**优先级**: ${priority}
**Agent**: ${agent}
**创建时间**: ${now}

## 描述

${task.description || task.title}

`;

  if (task.subtasks && task.subtasks.length > 0) {
    md += `## 子任务

${task.subtasks.map(s => `- [ ] ${s}`).join('\n')}

`;
  }

  md += `## 进度

- [ ] Planning
- [ ] In progress
- [ ] Testing
- [ ] Review

## 备注

> 由 Conductor Agent 自动创建
`;

  return md;
}

/**
 * 确保目录存在
 */
function ensureDirectories() {
  const dirs = [
    TODOS_DIR,
    path.join(TODOS_DIR, 'active'),
    path.join(TODOS_DIR, 'completed'),
    path.join(TODOS_DIR, 'backlog'),
    path.join(TODOS_DIR, 'archived')
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

/**
 * 从 Conductor 分析结果创建 Todo 文件
 * @param {Array} tasks - 任务数组
 * @returns {Array} 创建的文件路径
 */
async function createTodosFromAnalysis(tasks) {
  ensureDirectories();

  const created = [];

  for (const task of tasks) {
    const content = generateTodoTemplate(task);
    const filename = slugify(task.title) + '.md';
    const filepath = path.join(TODOS_DIR, 'active', filename);

    // 检查是否已存在
    if (fs.existsSync(filepath)) {
      console.log(`  跳过已存在: ${filename}`);
      continue;
    }

    fs.writeFileSync(filepath, content);
    created.push({
      filename,
      filepath,
      title: task.title
    });
  }

  // 刷新索引
  await refreshTodoIndex();

  return created;
}

/**
 * 获取 todo-manager.cjs 路径（优先项目目录，回退全局）
 */
function getTodoManagerPath() {
  const localPath = path.join(PROJECT_DIR, '.claude/hooks/todo-manager.cjs');
  if (fs.existsSync(localPath)) return localPath;

  const globalPath = path.join(process.env.HOME || '', '.claude/hooks/todo-manager.cjs');
  if (fs.existsSync(globalPath)) return globalPath;

  return null;
}

/**
 * 刷新 Todo 索引
 */
async function refreshTodoIndex() {
  try {
    const todoManagerPath = getTodoManagerPath();
    if (!todoManagerPath) {
      // 静默处理，不打扰用户
      return;
    }
    execFileSync(process.execPath, [todoManagerPath, '--force'], {
      cwd: PROJECT_DIR,
      stdio: 'ignore'
    });
  } catch (e) {
    logTodoError('refreshTodoIndex failed', e);
  }
}

/**
 * 从 Agent 输出中提取任务
 * @param {string} instruction - Agent 生成的指令
 * @returns {Array} 任务数组
 */
function extractTasksFromInstruction(instruction) {
  const tasks = [];

  // 首先尝试定位 "## 任务分解" 部分
  const taskSectionMatch = instruction.match(/## 任务分解\s*\n([\s\S]*?)(?=\n## |$)/);
  const content = taskSectionMatch ? taskSectionMatch[1] : instruction;

  // 匹配任务块格式: [Agent] 任务标题
  // 后面可能跟着 - 开头的子任务
  const lines = content.split('\n');
  let currentTask = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // 匹配 [Agent] 任务标题 格式
    const agentMatch = trimmed.match(/^\[(\w+)\]\s*(.+)$/);
    if (agentMatch) {
      // 保存前一个任务
      if (currentTask && currentTask.title) {
        tasks.push(currentTask);
      }

      const agent = agentMatch[1].toLowerCase();
      const title = agentMatch[2].trim();

      // 跳过模板占位符
      if (title.startsWith('<') || title.includes('[子任务') || title.includes('[步骤')) {
        currentTask = null;
        continue;
      }

      currentTask = {
        agent,
        title,
        description: title,
        subtasks: [],
        priority: agent === 'architect' ? 'P0' : 'P1'
      };
      continue;
    }

    // 匹配子任务: - 子任务内容
    const subtaskMatch = trimmed.match(/^[-•]\s*(.+)$/);
    if (subtaskMatch && currentTask) {
      const subtask = subtaskMatch[1].trim();
      // 跳过模板占位符
      if (!subtask.startsWith('<') && !subtask.includes('[子步骤') && !subtask.includes('[检查点')) {
        currentTask.subtasks.push(subtask);
      }
    }
  }

  // 保存最后一个任务
  if (currentTask && currentTask.title) {
    tasks.push(currentTask);
  }

  // 如果没有匹配到结构化格式，尝试提取编号列表
  if (tasks.length === 0) {
    const numberedRegex = /^\d+\.\s*(.+)$/gm;
    let num;
    while ((num = numberedRegex.exec(instruction)) !== null) {
      const title = num[1].trim();
      // 跳过模板占位符
      if (!title.startsWith('[') && !title.startsWith('<')) {
        tasks.push({
          agent: 'builder',
          title,
          description: title,
          subtasks: [],
          priority: 'P1'
        });
      }
    }
  }

  return tasks;
}

/**
 * 从 Kickoff 输出中提取子任务
 * @param {string} output - Kickoff 输出文本
 * @returns {Array} 任务数组
 */
function extractTasksFromKickoff(output) {
  const tasks = [];
  if (!output) return tasks;

  const lines = output.split('\n');
  let current = null;
  let index = 0;

  const pushCurrent = () => {
    if (current && current.title) tasks.push(current);
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const match = trimmed.match(/^#{2,3}\s*子任务\s*(\d+)?\s*[:：\-]?\s*(.*)$/);
    if (match) {
      pushCurrent();
      index += 1;
      const suffix = match[1] ? match[1].trim() : `${index}`;
      const titleText = match[2] ? match[2].trim() : '';
      const title = titleText || `子任务${suffix}`;
      current = {
        agent: 'builder',
        title,
        description: title,
        subtasks: [],
        priority: 'P1'
      };
      continue;
    }

    const subtaskMatch = trimmed.match(/^[-•]\s*(.+)$/);
    if (subtaskMatch && current) {
      const subtask = subtaskMatch[1].trim();
      if (subtask) current.subtasks.push(subtask);
    }
  }

  pushCurrent();

  if (tasks.length === 0) {
    return extractTasksFromInstruction(output);
  }
  return tasks;
}

/**
 * 解析 Conductor 的任务分解输出
 * @param {Object} conductorResult - Conductor 的分析结果
 * @returns {Array} 标准化的任务数组
 */
function parseConductorOutput(conductorResult) {
  const { instruction } = conductorResult;

  // 尝试从结构化输出提取
  const tasks = extractTasksFromInstruction(instruction);

  if (tasks.length > 0) {
    return tasks;
  }

  // 降级：将整个任务作为单个 todo
  return [{
    agent: 'conductor',
    title: '执行任务分析',
    description: instruction.slice(0, 200),
    subtasks: [],
    priority: 'P1'
  }];
}

/**
 * 创建单个 Todo
 * @param {Object} task - 任务对象 { title, description, priority, agent, subtasks }
 * @param {string} status - 状态目录 (active/backlog)
 */
function createSingleTodo(task, status = 'active') {
  ensureDirectories();

  const content = generateTodoTemplate(task);
  const filename = slugify(task.title) + '.md';
  const filepath = path.join(TODOS_DIR, status, filename);

  if (!fs.existsSync(filepath)) {
    fs.writeFileSync(filepath, content);
    return { created: true, filepath, filename };
  }

  return { created: false, filepath, filename, reason: 'exists' };
}

/**
 * 更新 Todo 状态（不移动文件）
 * @param {string} filepath - 任务文件路径
 * @param {string} toStatus - 新状态
 */
function updateTodoStatus(filepath, toStatus) {
  if (!filepath || !fs.existsSync(filepath)) {
    return { updated: false, reason: 'not found' };
  }

  let content = fs.readFileSync(filepath, 'utf-8');

  const statusMap = {
    'active': '🚧 进行中',
    'completed': '✅ 已完成',
    'backlog': '📋 待规划',
    'archived': '📦 已归档'
  };

  const label = statusMap[toStatus];
  if (!label) {
    return { updated: false, reason: 'invalid status' };
  }

  if (/\*\*状态\*\*:/u.test(content)) {
    content = content.replace(/\*\*状态\*\*:\s*[^\n]+/u, `**状态**: ${label}`);
  } else {
    content = content.replace(/^#\s+.*\n/, (m) => `${m}\n**状态**: ${label}\n`);
  }

  if (toStatus === 'completed' && !content.includes('**完成时间**')) {
    const now = new Date().toISOString().split('T')[0];
    if (content.includes('## 进度')) {
      content = content.replace(/## 进度/, `**完成时间**: ${now}\n\n## 进度`);
    } else {
      content = content + `\n\n**完成时间**: ${now}\n`;
    }
  }

  fs.writeFileSync(filepath, content);
  return { updated: true, filepath };
}

/**
 * 移动 Todo 到新状态
 * @param {string} filename - 文件名
 * @param {string} fromStatus - 原状态
 * @param {string} toStatus - 新状态
 */
function moveTodo(filename, fromStatus, toStatus) {
  const fromPath = path.join(TODOS_DIR, fromStatus, filename);
  const toPath = path.join(TODOS_DIR, toStatus, filename);

  if (fs.existsSync(fromPath)) {
    // 确保目标目录存在
    ensureDirectories();

    // 读取并更新状态
    let content = fs.readFileSync(fromPath, 'utf-8');

    const statusMap = {
      'active': '🚧 进行中',
      'completed': '✅ 已完成',
      'backlog': '📋 待规划',
      'archived': '📦 已归档'
    };

    if (statusMap[toStatus]) {
      content = content.replace(
        /\*\*状态\*\*:\s*[^\n]+/,
        `**状态**: ${statusMap[toStatus]}`
      );
    }

    // 如果是完成，添加完成时间
    if (toStatus === 'completed') {
      const now = new Date().toISOString().split('T')[0];
      content = content.replace(
        /## 进度/,
        `**完成时间**: ${now}\n\n## 进度`
      );
    }

    fs.writeFileSync(toPath, content);
    fs.unlinkSync(fromPath);

    return { moved: true, from: fromPath, to: toPath };
  }

  return { moved: false, reason: 'not found' };
}

module.exports = {
  slugify,
  generateTodoTemplate,
  createTodosFromAnalysis,
  refreshTodoIndex,
  extractTasksFromInstruction,
  extractTasksFromKickoff,
  parseConductorOutput,
  createSingleTodo,
  updateTodoStatus,
  moveTodo,
  TODOS_DIR
};
