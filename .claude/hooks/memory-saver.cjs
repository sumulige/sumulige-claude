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
const SESSION_STATE_FILE = path.join(CLAUDE_DIR, '.session-state.json');
const SESSIONS_DIR = path.join(CLAUDE_DIR, 'sessions');
const STATE_FILE = path.join(PROJECT_DIR, 'development', 'todos', '.state.json');
const SESSION_ID = process.env.CLAUDE_SESSION_ID || 'unknown';

/**
 * Ensure directories exist
 */
function ensureDirectories() {
  [CLAUDE_DIR, SESSIONS_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
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
function formatEndSummary(sessionState, archiveFile) {
  let summary = '';

  const duration = sessionState?.session?.startTime
    ? calculateDuration(sessionState.session.startTime)
    : 'unknown';

  summary += `\n✅ Session ended (${duration})\n`;
  summary += `💾 Memory saved to MEMORY.md\n`;
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
      // Save to memory
      saveToMemory(sessionState);

      // Archive session
      const archiveFile = archiveSession(sessionState);

      // Sync TODO state
      syncTodoState();

      // Output summary
      console.log(formatEndSummary(sessionState, archiveFile));
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
  archiveSession,
  syncTodoState,
  calculateDuration,
  formatEndSummary
};
