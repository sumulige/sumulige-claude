#!/usr/bin/env node
/**
 * Memory Saver Hook - SessionEnd Auto-Save System
 *
 * Claude Official Hook: SessionEnd
 * Triggered: Once at the end of each session
 *
 * Features:
 * - Auto-save session summary to MEMORY.md
 * - Sync TODO state changes
 * - Archive session state
 * - Generate session statistics
 *
 * Environment Variables:
 * - CLAUDE_PROJECT_DIR: Project directory path
 * - CLAUDE_SESSION_ID: Unique session identifier
 */

const fs = require('fs');
const path = require('path');

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const CLAUDE_DIR = path.join(PROJECT_DIR, '.claude');
const MEMORY_FILE = path.join(CLAUDE_DIR, 'MEMORY.md');
const MEMORY_DIR = path.join(CLAUDE_DIR, 'memory');
const SESSION_STATE_FILE = path.join(CLAUDE_DIR, '.session-state.json');
const SESSIONS_DIR = path.join(CLAUDE_DIR, 'sessions');
const STATE_FILE = path.join(PROJECT_DIR, 'development', 'todos', '.state.json');
const SESSION_ID = process.env.CLAUDE_SESSION_ID || 'unknown';
const DAILY_MEMORY_RETENTION_DAYS = 14;

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
 * Save session summary to MEMORY.md
 */
function saveToMemory(sessionState) {
  ensureDirectories();

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const duration = sessionState?.session?.startTime
    ? calculateDuration(sessionState.session.startTime)
    : 'unknown';

  // Generate session entry
  const entry = `### Session ${now.toISOString()}

- **Duration**: ${duration}
- **Project**: ${sessionState?.session?.project || 'unknown'}
- **Memory entries**: ${sessionState?.memory?.entries || 0}
- **TODOs**: ${sessionState?.todos?.active || 0} active, ${sessionState?.todos?.completed || 0} completed

`;

  // Read existing memory
  let content = '';
  if (fs.existsSync(MEMORY_FILE)) {
    content = fs.readFileSync(MEMORY_FILE, 'utf-8');
  }

  // Check if today's section exists
  const todaySection = `## ${dateStr}`;
  if (content.includes(todaySection)) {
    // Append to today's section
    const parts = content.split(todaySection);
    const beforeToday = parts[0];
    const afterHeader = parts[1];

    // Find next section or end
    const nextSectionMatch = afterHeader.match(/\n## \d{4}-\d{2}-\d{2}/);
    if (nextSectionMatch) {
      const insertPoint = nextSectionMatch.index;
      const todayContent = afterHeader.slice(0, insertPoint);
      const restContent = afterHeader.slice(insertPoint);
      content = beforeToday + todaySection + todayContent + entry + restContent;
    } else {
      content = beforeToday + todaySection + afterHeader + entry;
    }
  } else {
    // Create new day section at the top
    const header = content.startsWith('#') ? '' : '# Memory\n\n<!-- Project memory updated by AI -->\n\n';
    const existingContent = content.replace(/^# Memory\n+(?:<!-- [^>]+ -->\n+)?/, '');
    content = header + `${todaySection}\n\n${entry}` + existingContent;
  }

  // Keep only last 7 days
  const sections = content.split(/(?=\n## \d{4}-\d{2}-\d{2})/);
  const header = sections[0];
  const daySections = sections.slice(1, 8); // Keep 7 days max
  content = header + daySections.join('');

  fs.writeFileSync(MEMORY_FILE, content.trim() + '\n');
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

  // Clean up old sessions (keep last 20)
  const files = fs.readdirSync(SESSIONS_DIR)
    .filter(f => f.startsWith('session_') && f.endsWith('.json'))
    .sort()
    .reverse();

  if (files.length > 20) {
    files.slice(20).forEach(f => {
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
function formatEndSummary(sessionState, archiveFile, dailyFile) {
  let summary = '';

  const duration = sessionState?.session?.startTime
    ? calculateDuration(sessionState.session.startTime)
    : 'unknown';

  summary += `\n✅ Session ended (${duration})\n`;

  if (dailyFile) {
    const dailyFilename = path.basename(dailyFile);
    summary += `📝 Daily notes: memory/${dailyFilename}\n`;
  }

  summary += `💾 Long-term: MEMORY.md\n`;
  summary += `📁 Archived: ${archiveFile}\n`;

  return summary;
}

/**
 * Main execution
 */
function main() {
  try {
    const sessionState = loadSessionState();

    if (sessionState) {
      // Save to daily memory (new: date-sharded files)
      const dailyFile = saveToDailyMemory(sessionState);

      // Save to long-term memory (existing: MEMORY.md)
      saveToMemory(sessionState);

      // Archive session
      const archiveFile = archiveSession(sessionState);

      // Sync TODO state
      syncTodoState();

      // Output summary
      console.log(formatEndSummary(sessionState, archiveFile, dailyFile));
    }

    // Clean up
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
  saveToMemory,
  saveToDailyMemory,
  cleanOldMemoryFiles,
  archiveSession,
  syncTodoState,
  calculateDuration,
  formatEndSummary
};
