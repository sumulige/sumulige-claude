#!/usr/bin/env node
/**
 * Memory Loader Hook - SessionStart Auto-Load System
 *
 * Claude Official Hook: SessionStart
 * Triggered: Once at the beginning of each session
 *
 * Features:
 * - Auto-load memory/current.md for recent context (primary)
 * - Auto-load memory/YYYY-MM-DD.md for daily notes
 * - Auto-load ANCHORS.md for module navigation
 * - Restore TODO state from .state.json
 * - Inject session context summary
 *
 * Optimized: 2026-01-27
 * - Replaced MEMORY.md with memory/current.md
 * - Simplified load priority
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
const ANCHORS_FILE = path.join(CLAUDE_DIR, 'ANCHORS.md');
const STATE_FILE = path.join(PROJECT_DIR, 'development', 'todos', '.state.json');
const SESSION_ID = process.env.CLAUDE_SESSION_ID || 'unknown';

/**
 * Load daily memory files (today + yesterday)
 */
function loadDailyMemory(days = 2) {
  const memories = [];

  if (!fs.existsSync(MEMORY_DIR)) {
    return { exists: false, files: [], entries: 0 };
  }

  const today = new Date();
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const filePath = path.join(MEMORY_DIR, `${dateStr}.md`);

    if (fs.existsSync(filePath)) {
      memories.push({
        date: dateStr,
        content: fs.readFileSync(filePath, 'utf-8')
      });
    }
  }

  return {
    exists: memories.length > 0,
    files: memories.map(m => m.date),
    entries: memories.length,
    content: memories.map(m => m.content).join('\n\n---\n\n')
  };
}

/**
 * Load current memory file (memory/current.md)
 * This is the primary memory source (replaces MEMORY.md)
 */
function loadCurrentMemory() {
  if (!fs.existsSync(CURRENT_FILE)) {
    return { exists: false, content: '', entries: 0 };
  }

  const content = fs.readFileSync(CURRENT_FILE, 'utf-8');
  const sections = content.split('## ').slice(1);

  return {
    exists: true,
    content: content,
    entries: sections.length
  };
}

/**
 * Load memory file content (combined: current + daily)
 */
function loadMemory() {
  // Load current memory (primary)
  const current = loadCurrentMemory();

  // Load daily memory (today + yesterday)
  const daily = loadDailyMemory(2);

  return {
    exists: current.exists || daily.exists,
    current: current,
    daily: daily,
    entries: current.entries + daily.entries
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
      entries: memory.entries,
      current: {
        loaded: memory.current?.exists || false,
        entries: memory.current?.entries || 0
      },
      daily: {
        loaded: memory.daily?.exists || false,
        files: memory.daily?.files || [],
        entries: memory.daily?.entries || 0
      }
    },
    anchors: {
      loaded: anchors.exists,
      modules: anchors.modules
    },
    todos: {
      loaded: todos.exists,
      active: todos.active,
      completed: todos.completed
    },
    // New: placeholder for AI-filled insights
    insights: {
      keyDecisions: [],
      newKnowledge: [],
      openQuestions: [],
      nextSteps: []
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

  // Current memory (primary)
  if (context.memory.current?.loaded && context.memory.current.entries > 0) {
    summary += `💾 Current: memory/current.md (${context.memory.current.entries} sections)\n`;
  }

  // Daily memory (temporary notes)
  if (context.memory.daily?.loaded && context.memory.daily.entries > 0) {
    const files = context.memory.daily.files.join(', ');
    summary += `📝 Daily: ${context.memory.daily.entries} files (${files})\n`;
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
  loadDailyMemory,
  loadCurrentMemory,
  loadAnchors,
  loadTodoState,
  generateSessionContext,
  formatSessionSummary,
  // Constants
  CURRENT_FILE
};
