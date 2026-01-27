#!/usr/bin/env node
/**
 * Memory Saver Hook - SessionEnd Auto-Save System
 *
 * Claude Official Hook: SessionEnd
 * Triggered: Once at the end of each session
 *
 * Features:
 * - Auto-save session summary to memory/current.md (simplified)
 * - Save daily notes to memory/YYYY-MM-DD.md
 * - Archive session state (keep last 5)
 * - Sync TODO state changes
 *
 * Optimized: 2026-01-27
 * - Removed MEMORY.md (replaced by memory/current.md)
 * - Simplified archive (20 -> 5)
 * - Unified output format
 *
 * Environment Variables:
 * - CLAUDE_PROJECT_DIR: Project directory path
 * - CLAUDE_SESSION_ID: Unique session identifier
 */

const fs = require('fs');
const path = require('path');

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const CLAUDE_DIR = path.join(PROJECT_DIR, '.claude');
const MEMORY_DIR = path.join(CLAUDE_DIR, 'memory');
const CURRENT_FILE = path.join(MEMORY_DIR, 'current.md');
const SESSIONS_DIR = path.join(CLAUDE_DIR, 'sessions');
const SESSION_STATE_FILE = path.join(CLAUDE_DIR, '.session-state.json');
const STATE_FILE = path.join(PROJECT_DIR, 'development', 'todos', '.state.json');
const SESSION_ID = process.env.CLAUDE_SESSION_ID || 'unknown';
const DAILY_MEMORY_RETENTION_DAYS = 14;
const MAX_SESSION_ARCHIVES = 5;

/**
 * Ensure directories exist
 */
function ensureDirectories() {
  [CLAUDE_DIR, SESSIONS_DIR, MEMORY_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

/**
 * Clean old daily memory files (keep last N days)
 */
function cleanOldMemoryFiles(retentionDays = DAILY_MEMORY_RETENTION_DAYS) {
  if (!fs.existsSync(MEMORY_DIR)) {
    return;
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  try {
    const files = fs.readdirSync(MEMORY_DIR)
      .filter(f => /^\d{4}-\d{2}-\d{2}\.md$/.test(f));

    files.forEach(filename => {
      const dateStr = filename.replace('.md', '');
      const fileDate = new Date(dateStr);

      if (fileDate < cutoffDate) {
        try {
          fs.unlinkSync(path.join(MEMORY_DIR, filename));
        } catch (e) {
          // Ignore deletion errors
        }
      }
    });
  } catch (e) {
    // Ignore cleanup errors
  }
}

/**
 * Save session summary to daily memory file (memory/YYYY-MM-DD.md)
 */
function saveToDailyMemory(sessionState) {
  ensureDirectories();

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
  const dailyFile = path.join(MEMORY_DIR, `${dateStr}.md`);

  const duration = sessionState?.session?.startTime
    ? calculateDuration(sessionState.session.startTime)
    : 'unknown';

  // Build entry content
  let entry = `## ${timeStr} - Session End\n\n`;
  entry += `- **Duration**: ${duration}\n`;
  entry += `- **Project**: ${sessionState?.session?.project || 'unknown'}\n`;

  // Add insights if available
  const insights = sessionState?.insights || {};

  if (insights.keyDecisions?.length > 0) {
    entry += `\n### 关键决策\n`;
    insights.keyDecisions.forEach(d => {
      entry += `- ${d}\n`;
    });
  }

  if (insights.newKnowledge?.length > 0) {
    entry += `\n### 学到的新东西\n`;
    insights.newKnowledge.forEach(k => {
      entry += `- ${k}\n`;
    });
  }

  if (insights.nextSteps?.length > 0) {
    entry += `\n### 下一步\n`;
    insights.nextSteps.forEach(s => {
      entry += `- [ ] ${s}\n`;
    });
  }

  entry += '\n';

  // Read or create daily file
  let content = '';
  if (fs.existsSync(dailyFile)) {
    content = fs.readFileSync(dailyFile, 'utf-8');
  } else {
    content = `# ${dateStr}\n\n`;
  }

  // Append entry
  content += entry;

  fs.writeFileSync(dailyFile, content);

  // Clean old files
  cleanOldMemoryFiles();

  return dailyFile;
}

/**
 * Load session state from SessionStart
 */
function loadSessionState() {
  if (!fs.existsSync(SESSION_STATE_FILE)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(SESSION_STATE_FILE, 'utf-8'));
  } catch (e) {
    return null;
  }
}

/**
 * Calculate session duration
 */
function calculateDuration(startTime) {
  if (!startTime) return 'unknown';

  const start = new Date(startTime);
  const now = new Date();
  const diffMs = now - start;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'less than 1 minute';
  if (diffMins < 60) return `${diffMins} minutes`;

  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  return `${hours}h ${mins}m`;
}

/**
 * Get active todos from development/todos/active/
 */
function getActiveTodos() {
  const activePath = path.join(PROJECT_DIR, 'development', 'todos', 'active');
  if (!fs.existsSync(activePath)) {
    return [];
  }

  try {
    const files = fs.readdirSync(activePath).filter(f => f.endsWith('.md'));
    return files.map(f => {
      const filePath = path.join(activePath, f);
      const content = fs.readFileSync(filePath, 'utf-8');
      const titleMatch = content.match(/^#\s+(.+)/m);
      const statusMatch = content.match(/\*\*状态\*\*:\s*(.+)/);
      return {
        file: f,
        title: titleMatch ? titleMatch[1] : f.replace('.md', ''),
        status: statusMatch ? statusMatch[1].trim() : '进行中'
      };
    });
  } catch (e) {
    return [];
  }
}

/**
 * Get project info from package.json and CLAUDE.md
 */
function getProjectContext() {
  const context = {
    name: 'unknown',
    version: 'unknown',
    codeStyle: 'Linus Torvalds 编程哲学',
    qualityMetrics: '800行/文件, 8文件/目录'
  };

  // From package.json
  const pkgPath = path.join(PROJECT_DIR, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      context.name = pkg.name || context.name;
      context.version = pkg.version || context.version;
    } catch (e) {}
  }

  return context;
}

/**
 * Save current session state to memory/current.md
 * This is the primary memory file (replaces MEMORY.md)
 */
function saveToCurrentMemory(sessionState) {
  ensureDirectories();

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
  const duration = sessionState?.session?.startTime
    ? calculateDuration(sessionState.session.startTime)
    : 'unknown';

  const insights = sessionState?.insights || {};
  const todos = sessionState?.todos || {};
  const projectContext = getProjectContext();
  const activeTodos = getActiveTodos();

  let content = `# Current Session State

> Auto-updated by memory-saver.cjs
> Last updated: ${now.toISOString()}

## 项目概览

- **项目**: ${projectContext.name} v${projectContext.version}
- **代码风格**: ${projectContext.codeStyle}
- **质量指标**: ${projectContext.qualityMetrics}

## 会话信息

- **Session ID**: ${SESSION_ID}
- **持续时间**: ${duration}
- **日期**: ${dateStr} ${timeStr}

## 活跃任务

`;

  if (activeTodos.length > 0) {
    activeTodos.forEach(todo => {
      content += `- **${todo.title}** - ${todo.status}\n`;
    });
  } else {
    content += `- 无活跃任务\n`;
  }

  content += `\n## TODOs 统计\n\n`;
  content += `- **Active**: ${todos.active || activeTodos.length}\n`;
  content += `- **Completed**: ${todos.completed || 0}\n\n`;

  if (insights.keyDecisions?.length > 0) {
    content += `## 关键决策\n\n`;
    insights.keyDecisions.forEach(d => {
      content += `- ${d}\n`;
    });
    content += '\n';
  }

  if (insights.newKnowledge?.length > 0) {
    content += `## 学到的新东西\n\n`;
    insights.newKnowledge.forEach(k => {
      content += `- ${k}\n`;
    });
    content += '\n';
  }

  if (insights.nextSteps?.length > 0) {
    content += `## 下一步\n\n`;
    insights.nextSteps.forEach(s => {
      content += `- [ ] ${s}\n`;
    });
    content += '\n';
  }

  content += `---

## Recovery

\`\`\`bash
# View daily notes
cat .claude/memory/${dateStr}.md

# View handoff (if recent)
cat .claude/handoffs/LATEST.md

# Check TODOs
cat development/todos/INDEX.md
\`\`\`
`;

  fs.writeFileSync(CURRENT_FILE, content);
  return CURRENT_FILE;
}

/**
 * Archive session state
 */
function archiveSession(sessionState) {
  ensureDirectories();

  const now = new Date();
  const filename = `session_${now.toISOString().replace(/[:.]/g, '-')}.json`;
  const filepath = path.join(SESSIONS_DIR, filename);

  const archiveData = {
    ...sessionState,
    endTime: now.toISOString(),
    duration: sessionState?.session?.startTime
      ? calculateDuration(sessionState.session.startTime)
      : 'unknown'
  };

  fs.writeFileSync(filepath, JSON.stringify(archiveData, null, 2));

  // Clean up old sessions (keep last 5)
  const files = fs.readdirSync(SESSIONS_DIR)
    .filter(f => f.startsWith('session_') && f.endsWith('.json'))
    .sort()
    .reverse();

  if (files.length > MAX_SESSION_ARCHIVES) {
    files.slice(MAX_SESSION_ARCHIVES).forEach(f => {
      try {
        fs.unlinkSync(path.join(SESSIONS_DIR, f));
      } catch (e) {
        // Ignore deletion errors
      }
    });
  }

  return filename;
}

/**
 * Update TODO state sync timestamp
 */
function syncTodoState() {
  if (!fs.existsSync(STATE_FILE)) {
    return;
  }

  try {
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
    state.lastSynced = new Date().toISOString();
    state.sessionId = SESSION_ID;
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (e) {
    // Ignore sync errors
  }
}

/**
 * Clean up session state file
 */
function cleanupSessionState() {
  if (fs.existsSync(SESSION_STATE_FILE)) {
    try {
      fs.unlinkSync(SESSION_STATE_FILE);
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

/**
 * Format session end summary
 */
function formatEndSummary(sessionState, dailyFile) {
  let summary = '';

  const duration = sessionState?.session?.startTime
    ? calculateDuration(sessionState.session.startTime)
    : 'unknown';

  summary += `\n✅ Session ended (${duration})\n`;
  summary += `💾 Current: memory/current.md\n`;

  if (dailyFile) {
    const dailyFilename = path.basename(dailyFile);
    summary += `📝 Daily: memory/${dailyFilename}\n`;
  }

  return summary;
}

/**
 * Main execution
 */
function main() {
  try {
    const sessionState = loadSessionState();

    if (sessionState) {
      // Save to current memory (primary, replaces MEMORY.md)
      saveToCurrentMemory(sessionState);

      // Save to daily memory (date-sharded files)
      const dailyFile = saveToDailyMemory(sessionState);

      // Archive session (simplified, keep 5)
      archiveSession(sessionState);

      // Sync TODO state
      syncTodoState();

      // Output summary
      console.log(formatEndSummary(sessionState, dailyFile));
    }

    // Clean up session state file
    cleanupSessionState();

    process.exit(0);
  } catch (e) {
    // Silent failure - don't interrupt session end
    cleanupSessionState();
    process.exit(0);
  }
}

// Run
if (require.main === module) {
  main();
}

module.exports = {
  loadSessionState,
  saveToCurrentMemory,
  saveToDailyMemory,
  cleanOldMemoryFiles,
  archiveSession,
  syncTodoState,
  calculateDuration,
  formatEndSummary,
  // Constants
  CURRENT_FILE,
  MAX_SESSION_ARCHIVES
};
