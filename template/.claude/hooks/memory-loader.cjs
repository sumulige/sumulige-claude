#!/usr/bin/env node
/**
 * Memory Loader Hook - SessionStart Auto-Load System
 *
 * Claude Official Hook: SessionStart
 * Triggered: Once at the beginning of each session
 *
 * Features:
 * - Auto-load MEMORY.md for recent context
 * - Auto-load ANCHORS.md for module navigation
 * - Restore TODO state from .state.json
 * - Inject session context summary
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
const ANCHORS_FILE = path.join(CLAUDE_DIR, 'ANCHORS.md');
const STATE_FILE = path.join(PROJECT_DIR, 'development', 'todos', '.state.json');
const SESSION_ID = process.env.CLAUDE_SESSION_ID || 'unknown';

/**
 * Load memory file content (recent entries only)
 */
function loadMemory(days = 7) {
  if (!fs.existsSync(MEMORY_FILE)) {
    return { exists: false, content: '', entries: 0 };
  }

  const content = fs.readFileSync(MEMORY_FILE, 'utf-8');
  const entries = content.split('## ').slice(1, days + 1);

  return {
    exists: true,
    content: entries.length > 0 ? '## ' + entries.join('## ') : '',
    entries: entries.length
  };
}

/**
 * Load anchors file for quick navigation
 */
function loadAnchors() {
  if (!fs.existsSync(ANCHORS_FILE)) {
    return { exists: false, content: '', modules: 0 };
  }

  const content = fs.readFileSync(ANCHORS_FILE, 'utf-8');
  const moduleMatches = content.match(/##\s+[\w-]+/g) || [];

  return {
    exists: true,
    content: content,
    modules: moduleMatches.length
  };
}

/**
 * Load TODO state
 */
function loadTodoState() {
  if (!fs.existsSync(STATE_FILE)) {
    return { exists: false, active: 0, completed: 0 };
  }

  try {
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
    return {
      exists: true,
      active: state.active?.length || 0,
      completed: state.completed?.length || 0,
      lastUpdated: state.lastUpdated || null
    };
  } catch (e) {
    return { exists: false, active: 0, completed: 0 };
  }
}

/**
 * Get project info
 */
function getProjectInfo() {
  const pkgPath = path.join(PROJECT_DIR, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    return { name: path.basename(PROJECT_DIR), version: 'unknown' };
  }

  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    return {
      name: pkg.name || path.basename(PROJECT_DIR),
      version: pkg.version || 'unknown'
    };
  } catch (e) {
    return { name: path.basename(PROJECT_DIR), version: 'unknown' };
  }
}

/**
 * Generate session start context
 */
function generateSessionContext() {
  const memory = loadMemory();
  const anchors = loadAnchors();
  const todos = loadTodoState();
  const project = getProjectInfo();

  const timestamp = new Date().toISOString();

  // Build context object
  const context = {
    session: {
      id: SESSION_ID,
      startTime: timestamp,
      project: project.name,
      version: project.version
    },
    memory: {
      loaded: memory.exists,
      entries: memory.entries
    },
    anchors: {
      loaded: anchors.exists,
      modules: anchors.modules
    },
    todos: {
      loaded: todos.exists,
      active: todos.active,
      completed: todos.completed
    }
  };

  // Save session state
  const sessionStateFile = path.join(CLAUDE_DIR, '.session-state.json');
  try {
    fs.writeFileSync(sessionStateFile, JSON.stringify(context, null, 2));
  } catch (e) {
    // Ignore write errors
  }

  return context;
}

/**
 * Format session summary for output
 */
function formatSessionSummary(context) {
  let summary = '';

  summary += `\n📂 Session: ${context.session.project} v${context.session.version}\n`;

  if (context.memory.loaded && context.memory.entries > 0) {
    summary += `💾 Memory: ${context.memory.entries} entries loaded\n`;
  }

  if (context.anchors.loaded && context.anchors.modules > 0) {
    summary += `🔖 Anchors: ${context.anchors.modules} modules indexed\n`;
  }

  if (context.todos.loaded && (context.todos.active > 0 || context.todos.completed > 0)) {
    summary += `📋 TODOs: ${context.todos.active} active, ${context.todos.completed} completed\n`;
  }

  return summary;
}

/**
 * Main execution
 */
function main() {
  try {
    const context = generateSessionContext();

    // Only output summary if there's meaningful context
    const hasContext = context.memory.entries > 0 ||
                       context.anchors.modules > 0 ||
                       context.todos.active > 0;

    if (hasContext) {
      console.log(formatSessionSummary(context));
    }

    process.exit(0);
  } catch (e) {
    // Silent failure - don't interrupt session
    process.exit(0);
  }
}

// Run
if (require.main === module) {
  main();
}

module.exports = {
  loadMemory,
  loadAnchors,
  loadTodoState,
  generateSessionContext,
  formatSessionSummary
};
