#!/usr/bin/env node
/**
 * TODO Manager - AI 自动任务管理系统 (v2.0)
 *
 * 功能：
 * - 支持 Research → Develop → Test 生命周期
 * - 自动任务状态流转
 * - 智能任务创建建议
 * - 维护任务状态流转
 *
 * 生命周期：
 * Research (研究) → Develop (开发) → Test (测试) → Done (完成)
 */

const fs = require('fs');
const path = require('path');

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const TODOS_DIR = path.join(PROJECT_DIR, 'development', 'todos');
const INDEX_FILE = path.join(TODOS_DIR, 'INDEX.md');
const STATE_FILE = path.join(TODOS_DIR, '.state.json');

// 任务类型和状态
const TASK_TYPES = {
  RESEARCH: 'research',
  DEVELOP: 'develop',
  TEST: 'test'
};

const TASK_STAGES = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  BACKLOG: 'backlog',
  ARCHIVED: 'archived'
};

// 图标映射
const ICONS = {
  research: '📊',
  develop: '💻',
  test: '🧪'
};

// 确保目录存在
function ensureDirectories() {
  const dirs = [TODOS_DIR];

  // 为每个阶段创建类型子目录
  for (const stage of Object.values(TASK_STAGES)) {
    dirs.push(path.join(TODOS_DIR, stage));
    for (const type of Object.values(TASK_TYPES)) {
      dirs.push(path.join(TODOS_DIR, stage, type));
    }
  }

  dirs.forEach(dir => {
    try { fs.mkdirSync(dir, { recursive: true }); } catch (e) {}
  });
}

// 扫描任务文件
function scanTasks() {
  const tasks = {
    active: { research: [], develop: [], test: [] },
    completed: { research: [], develop: [], test: [] },
    backlog: { research: [], develop: [], test: [] },
    archived: { research: [], develop: [], test: [] }
  };

  for (const [stage, types] of Object.entries(tasks)) {
    for (const [type, _] of Object.entries(types)) {
      const dir = path.join(TODOS_DIR, stage, type);
      if (!fs.existsSync(dir)) continue;

      const files = fs.readdirSync(dir)
        .filter(f => f.endsWith('.md') && f !== '_README.md');

      tasks[stage][type] = files.map(f => {
        const filePath = path.join(dir, f);
        const content = fs.readFileSync(filePath, 'utf-8');
        const titleMatch = content.match(/^#\s+(.+)$/m);
        const statusMatch = content.match(/\*\*状态\*\*:\s*([✅🚧📋])/);
        const priorityMatch = content.match(/\*\*优先级\*\*:\s*(P[0-3])/);
        const typeMatch = content.match(/\*\*类型\*\*:\s*([📊💻🧪])\s*(\w+)/);

        return {
          file: f,
          title: titleMatch ? titleMatch[1] : path.basename(f, '.md'),
          status: statusMatch ? statusMatch[1] : '🚧',
          priority: priorityMatch ? priorityMatch[1] : 'P2',
          taskType: typeMatch ? typeMatch[1] : type,
          icon: typeMatch ? typeMatch[2] : ICONS[type] || '📄',
          path: `${stage}/${type}/${f}`,
          stage: stage
        };
      });
    }
  }

  return tasks;
}

// 生成任务索引
function generateIndex(tasks) {
  const now = new Date().toISOString().split('T')[0];

  // 计算总数
  const activeCount = tasks.active.research.length + tasks.active.develop.length + tasks.active.test.length;
  const completedCount = tasks.completed.research.length + tasks.completed.develop.length + tasks.completed.test.length;
  const backlogCount = tasks.backlog.research.length + tasks.backlog.develop.length + tasks.backlog.test.length;

  let md = `# 项目任务追踪系统

> **统一管理**: 研究 → 开发 → 测试
> **最后更新**: ${now}

@version: 2.0.0

---

## 📊 项目进度

| 阶段 | 进度 | 状态 |
|------|------|------|
| Phase 1: MVP 智能监控 | 80% | 🚧 进行中 |
| Phase 2: V1.5 动态调整 | 0% | 📋 待规划 |
| Phase 3: V2.0 AI 教练 | 0% | 📋 待规划 |

---

## 🔄 任务生命周期

\`\`\`
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  RESEARCH   │ → │  DEVELOP    │ → │   TEST      │
│  📊 研究     │    │  💻 开发     │    │  🧪 测试     │
└─────────────┘    └─────────────┘    └─────────────┘
\`\`\`

---

## 📁 目录结构

\`\`\`
development/todos/
├── INDEX.md           # 本文件 - 任务总览
├── _templates/        # 任务模板
├── active/            # 进行中的任务 (${activeCount})
│   ├── research/      # 📊 研究中 (${tasks.active.research.length})
│   ├── develop/       # 💻 开发中 (${tasks.active.develop.length})
│   └── test/          # 🧪 测试中 (${tasks.active.test.length})
├── completed/         # 已完成的任务 (${completedCount})
│   ├── research/
│   ├── develop/
│   └── test/
├── backlog/           # 待规划的任务 (${backlogCount})
└── archived/          # 已归档的任务
\`\`\`

---

## 🚧 当前进行中的任务

### 📊 研究任务
`;

  // 研究任务
  if (tasks.active.research.length > 0) {
    tasks.active.research.forEach(t => {
      md += `- [${t.priority}] [${t.title}](./${t.path}) - ${t.status}\n`;
    });
  } else {
    md += `暂无\n`;
  }
  md += `\n### 💻 开发任务\n`;

  // 开发任务
  if (tasks.active.develop.length > 0) {
    tasks.active.develop.forEach(t => {
      md += `- [${t.priority}] [${t.title}](./${t.path}) - ${t.status}\n`;
    });
  } else {
    md += `暂无\n`;
  }
  md += `\n### 🧪 测试任务\n`;

  // 测试任务
  if (tasks.active.test.length > 0) {
    tasks.active.test.forEach(t => {
      md += `- [${t.priority}] [${t.title}](./${t.path}) - ${t.status}\n`;
    });
  } else {
    md += `暂无\n`;
  }

  md += `\n---\n\n## ✅ 最近完成的任务\n\n### 💻 开发任务\n`;

  // 最近完成的开发任务
  if (tasks.completed.develop.length > 0) {
    tasks.completed.develop.slice(0, 5).forEach(t => {
      md += `- [${t.title}](./${t.path}) ${t.status}\n`;
    });
  } else {
    md += `暂无\n`;
  }

  md += `\n### 🧪 测试任务\n`;

  // 最近完成的测试任务
  if (tasks.completed.test.length > 0) {
    tasks.completed.test.slice(0, 3).forEach(t => {
      md += `- [${t.title}](./${t.path}) ${t.status}\n`;
    });
  } else {
    md += `暂无\n`;
  }

  md += `\n---\n\n## 📋 待办任务\n\n`;
  md += `暂无\n`;

  md += `\n---\n\n## 🎯 使用方式\n\n`;
  md += `### 查看任务\n\`\`\`bash\n`;
  md += `# 按类型查看\n`;
  md += `ls development/todos/active/research/   # 研究任务\n`;
  md += `ls development/todos/active/develop/    # 开发任务\n`;
  md += `ls development/todos/active/test/       # 测试任务\n`;
  md += `\`\`\`\n\n`;

  md += `### 创建新任务\n`;
  md += `在 Claude Code 中：\n\`\`\`\n`;
  md += `创建一个新任务：\n`;
  md += `- 类型：测试\n`;
  md += `- 标题：Dashboard 功能测试\n\`\`\`\n\n`;

  md += `### 更新任务状态\n\`\`\`\n`;
  md += `将 [任务名] 标记为完成\n\`\`\`\n\n`;

  md += `---\n\n> **维护说明**: 本系统由 AI 自动维护\n`;

  return md;
}

// 加载和保存状态
function loadState() {
  if (fs.existsSync(STATE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
    } catch (e) {
      return { tasks: {}, transitions: [] };
    }
  }
  return { tasks: {}, transitions: [] };
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// 检查是否需要自动流转
function checkAutoTransition(tasks, state) {
  const suggestions = [];

  // 检查刚完成的开发任务，建议创建测试任务
  const completedDevelop = tasks.completed.develop.filter(t => {
    const key = `completed_develop_${t.file}`;
    return !state.tasks[key]; // 首次完成
  });

  completedDevelop.forEach(t => {
    const testTaskName = t.file.replace('.md', '-test.md');
    const testPath = path.join(TODOS_DIR, 'active', 'test', testTaskName);

    if (!fs.existsSync(testPath)) {
      suggestions.push({
        type: 'create_test',
        message: `💡 建议为 "${t.title}" 创建测试任务`,
        developTask: t,
        testTask: testTaskName,
        template: `_templates/test.md`
      });
    }

    // 标记已处理
    const key = `completed_develop_${t.file}`;
    state.tasks[key] = { completed: true, notified: true };
  });

  return { suggestions, state };
}

// 更新索引
function updateIndex() {
  try {
    ensureDirectories();
    const tasks = scanTasks();
    const state = loadState();

    // 检查自动流转
    const { suggestions, state: newState } = checkAutoTransition(tasks, state);

    // 生成索引
    const index = generateIndex(tasks);
    fs.writeFileSync(INDEX_FILE, index);

    // 保存状态
    saveState(newState);

    return { tasks, suggestions, updated: true };
  } catch (e) {
    console.error('[TODO Manager] Error:', e.message);
    return { tasks: { active: { research: [], develop: [], test: [] }, completed: { research: [], develop: [], test: [] } }, suggestions: [], updated: false };
  }
}

// 主函数
function main() {
  const result = updateIndex();

  // 输出建议
  if (result.suggestions && result.suggestions.length > 0) {
    console.log('\n📋 [任务流转] 检测到 ' + result.suggestions.length + ' 个自动流转建议:\n');
    result.suggestions.forEach((s, i) => {
      console.log(`   ${i + 1}. ${s.message}`);
    });
    console.log('');
  }

  // 在 AgentStop 时输出摘要
  const eventType = process.env.CLAUDE_EVENT_TYPE || '';
  if (eventType === 'AgentStop') {
    const active = result.tasks.active;
    const activeTotal = active.research.length + active.develop.length + active.test.length;
    const completed = result.tasks.completed;
    const completedTotal = completed.research.length + completed.develop.length + completed.test.length;

    if (activeTotal > 0 || completedTotal > 0) {
      console.log(`\n📋 [任务追踪]`);
      console.log(`   进行中: ${activeTotal} 个 (📊 ${active.research.length} | 💻 ${active.develop.length} | 🧪 ${active.test.length})`);
      console.log(`   已完成: ${completedTotal} 个`);
      console.log(`   查看: ${path.relative(PROJECT_DIR, INDEX_FILE)}\n`);
    }
  }

  process.exit(0);
}

// 如果直接运行，强制更新索引
if (require.main === module) {
  if (process.argv[2] === '--force') {
    updateIndex();
    console.log('✅ Task index updated');
  } else if (process.argv[2] === '--suggest') {
    const result = updateIndex();
    if (result.suggestions.length > 0) {
      console.log('\n💡 自动流转建议:\n');
      result.suggestions.forEach((s, i) => {
        console.log(`${i + 1}. ${s.message}`);
        console.log(`   开发任务: ${s.developTask.file}`);
        console.log(`   测试任务: ${s.testTask}`);
      });
    } else {
      console.log('✅ 无待处理的流转建议');
    }
  } else {
    main();
  }
} else {
  main();
}
