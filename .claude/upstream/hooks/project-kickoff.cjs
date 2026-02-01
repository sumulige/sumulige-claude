#!/usr/bin/env node
/**
 * Project Kickoff Hook - Manus-style project initialization
 *
 * 触发条件:
 * - 检测到新项目 (缺少 PROJECT_KICKOFF.md)
 * - 用户明确请求项目启动
 *
 * 功能:
 * - 检查项目是否已启动
 * - 如果未启动，提示 AI 进行项目规划
 * - 生成规划文档后，自动创建任务到 backlog/
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const TEMPLATES_DIR = path.join(PROJECT_DIR, '.claude/templates');
const KICKOFF_FILE = path.join(PROJECT_DIR, 'PROJECT_KICKOFF.md');
const PLAN_FILE = path.join(PROJECT_DIR, 'TASK_PLAN.md');
const PROPOSAL_FILE = path.join(PROJECT_DIR, 'PROJECT_PROPOSAL.md');
const HINT_FILE = path.join(PROJECT_DIR, '.claude/.kickoff-hint.txt');
const TODOS_DIR = path.join(PROJECT_DIR, 'development/todos');
const BACKLOG_DIR = path.join(TODOS_DIR, 'backlog');

// 任务类型图标
const TASK_TYPES = {
  research: { icon: '📊', dir: 'research', name: 'Research' },
  develop: { icon: '💻', dir: 'develop', name: 'Develop' },
  test: { icon: '🧪', dir: 'test', name: 'Test' }
};

// 检查项目是否已启动
function isProjectStarted() {
  return fs.existsSync(KICKOFF_FILE);
}

// 检查是否为强制启动模式
function isForceKickoff() {
  const toolInput = process.env.CLAUDE_TOOL_INPUT || '';
  return toolInput.includes('kickoff') ||
         toolInput.includes('项目启动') ||
         toolInput.includes('project plan') ||
         toolInput.includes('重新规划');
}

// 检查任务规划文档是否存在
function hasTaskPlan() {
  return fs.existsSync(PLAN_FILE);
}

// 解析 TASK_PLAN.md 中的任务
function parseTasksFromPlan() {
  if (!fs.existsSync(PLAN_FILE)) {
    return { research: [], develop: [], test: [] };
  }

  const content = fs.readFileSync(PLAN_FILE, 'utf-8');
  const tasks = { research: [], develop: [], test: [] };

  // 匹配任务项 - 支持 - [ ] 和 - [x] 格式
  const taskRegex = /-\s*\[[ x]?\]\s*(?:\[([P0-3])\])?\s*(.+)/g;
  let match;

  // 当前任务类型上下文
  let currentType = 'develop'; // 默认为开发任务

  // 检测章节标题来确定任务类型
  const lines = content.split('\n');
  lines.forEach(line => {
    const trimmed = line.trim();

    // 检测章节标题
    if (trimmed.includes('研究') || trimmed.includes('Research') || trimmed.includes('调研')) {
      currentType = 'research';
    } else if (trimmed.includes('开发') || trimmed.includes('Develop') || trimmed.includes('实现')) {
      currentType = 'develop';
    } else if (trimmed.includes('测试') || trimmed.includes('Test') || trimmed.includes('验证')) {
      currentType = 'test';
    }

    // 匹配任务项
    const taskMatch = trimmed.match(/^-\s*\[([ x])\]\s*(?:\[([P0-3])\])?\s*(.+)/);
    if (taskMatch) {
      const [, checked, priority, title] = taskMatch;
      tasks[currentType].push({
        title: title.trim(),
        priority: priority || 'P2',
        checked: checked === 'x'
      });
    }
  });

  return tasks;
}

// 创建任务文件
function createTaskFile(task, type, index) {
  const typeConfig = TASK_TYPES[type];
  const slug = titleToSlug(task.title);
  const fileName = `${index}-${slug}.md`;
  const filePath = path.join(BACKLOG_DIR, typeConfig.dir, fileName);
  const now = new Date().toISOString().split('T')[0];

  // 读取对应模板
  const templatePath = path.join(__dirname, '../../../development/todos/_templates', `${typeConfig.dir}.md`);
  let template = '';

  if (fs.existsSync(templatePath)) {
    template = fs.readFileSync(templatePath, 'utf-8');
  } else {
    // 简化模板
    template = `# ${task.title}

> **类型**: ${typeConfig.icon} ${typeConfig.name} | ${getTypeDescription(type)}
> **状态**: 待规划
> **优先级**: ${task.priority}
> **创建时间**: ${now}
> **来源**: PROJECT_KICKOFF

---

## 📋 任务描述

${task.title}

---

## 🎯 验收标准

- [ ] 验收标准 1
- [ ] 验收标准 2

---

## 📝 备注

来自项目启动规划。
`;
  }

  // 创建目录
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  // 写入任务文件
  fs.writeFileSync(filePath, template);

  return fileName;
}

// 将标题转换为文件名友好的 slug
function titleToSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\u4e00-\u9fa5a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}

// 获取任务类型描述
function getTypeDescription(type) {
  const descriptions = {
    research: '调研/设计/探索',
    develop: '实现/编码/重构',
    test: '测试/验证/QA'
  };
  return descriptions[type] || '';
}

// 从规划创建任务到 backlog
function createTasksFromPlan() {
  const tasks = parseTasksFromPlan();
  let createdCount = 0;

  // 确保目录存在
  Object.values(TASK_TYPES).forEach(type => {
    fs.mkdirSync(path.join(BACKLOG_DIR, type.dir), { recursive: true });
  });

  // 创建各类任务
  Object.entries(tasks).forEach(([type, taskList]) => {
    taskList.forEach((task, index) => {
      if (!task.checked) { // 跳过已完成任务
        const fileName = createTaskFile(task, type, index + 1);
        createdCount++;
        console.log(`   ✅ 创建 ${type} 任务: ${fileName}`);
      }
    });
  });

  return createdCount;
}

// 刷新任务索引
function refreshTaskIndex() {
  const todoManagerPath = path.join(PROJECT_DIR, '.claude/hooks/todo-manager.cjs');
  if (fs.existsSync(todoManagerPath)) {
    try {
      execSync(`node "${todoManagerPath}" --force`, {
        cwd: PROJECT_DIR,
        stdio: 'pipe'
      });
      console.log('   ✅ 任务索引已更新');
    } catch (e) {
      // 忽略错误
    }
  }
}

// 生成启动提示
function generateKickoffHint() {
  const now = new Date().toISOString().split('T')[0];

  return `
╔══════════════════════════════════════════════════════════════════════╗
║                    🚀 项目启动检测 (Project Kickoff)                 ║
╚══════════════════════════════════════════════════════════════════════╝

检测到此项目尚未完成启动流程。

根据 Manus 风格的 AI 2.0 开发范式，在开始编码前，我们需要：

═══════════════════════════════════════════════════════════════════════

📋 第一步: 项目启动清单 (PROJECT_KICKOFF.md)
   ├── 定义项目目标和成功标准
   ├── 明确技术约束和非技术约束
   └── 划定 AI/Human 责任边界

📋 第二步: 任务执行计划 (TASK_PLAN.md)
   ├── 任务分解 (WBS)
   ├── 依赖关系分析
   ├── Agent 分配策略
   └── 检查点设置

📋 第三步: 项目计划书 (PROJECT_PROPOSAL.md)
   ├── 技术架构设计
   ├── 功能需求分析
   ├── 开发迭代规划
   └── 风险评估

═══════════════════════════════════════════════════════════════════════

🎯 下一步行动:

请回答以下问题，我将为你生成完整的项目规划：

1. 项目名称是什么？
2. 用一句话描述这个项目要解决什么问题？
3. 核心目标是什么？（成功标准是什么？）
4. 有什么技术约束或偏好？（语言/框架/部署等）
5. 预期的时间框架是怎样的？

回答这些问题后，我将：
✅ 生成 PROJECT_KICKOFF.md
✅ 生成 TASK_PLAN.md
✅ 生成 PROJECT_PROPOSAL.md
✅ 🆕 自动创建任务到 development/todos/backlog/
✅ 🆕 刷新任务索引

═══════════════════════════════════════════════════════════════════════

💡 提示: 你也可以直接说 "跳过启动" 使用传统开发模式

生成日期: ${now}
`;
}

// 主函数
function main() {
  // 如果项目已启动且不是强制模式，静默退出
  if (isProjectStarted() && !isForceKickoff()) {
    process.exit(0);
  }

  // 如果已经有任务规划，自动创建任务
  if (hasTaskPlan()) {
    console.log('📋 检测到 TASK_PLAN.md，正在创建任务...');

    const createdCount = createTasksFromPlan();

    if (createdCount > 0) {
      console.log(`✅ 已创建 ${createdCount} 个任务到 backlog/`);
      refreshTaskIndex();
    } else {
      console.log('ℹ️  所有任务已完成或为空');
    }
  }

  // 生成提示文件
  const hint = generateKickoffHint();
  fs.mkdirSync(path.dirname(HINT_FILE), { recursive: true });
  fs.writeFileSync(HINT_FILE, hint);

  // 同时输出到 stdout (供 AI 直接读取)
  console.log(hint);

  process.exit(0);
}

main();
