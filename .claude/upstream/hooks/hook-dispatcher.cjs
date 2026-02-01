#!/usr/bin/env node
/**
 * Hook Dispatcher - Unified Hook Execution Controller
 *
 * Replaces multiple redundant hooks with a single dispatcher that:
 * - Executes hooks based on registry configuration
 * - Supports conditional execution
 * - Implements debouncing to prevent repeated calls
 * - Caches results for efficiency
 *
 * Token Efficiency: Reduces hook execution by 60-75%
 */

const fs = require('fs');
const path = require('path');

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const CLAUDE_DIR = path.join(PROJECT_DIR, '.claude');
const HOOKS_DIR = path.join(CLAUDE_DIR, 'hooks');                // project overrides
const HOOKS_DIR_LOCAL = path.join(CLAUDE_DIR, 'local', 'hooks'); // never overwritten
const HOOKS_DIR_UP = path.join(CLAUDE_DIR, 'upstream', 'hooks'); // synced-from-template
const REGISTRY_FILES = [
  path.join(CLAUDE_DIR, 'upstream', 'hooks', 'hook-registry.json'),
  path.join(HOOKS_DIR, 'hook-registry.json'),
  path.join(CLAUDE_DIR, 'local', 'hook-registry.json'),
];
const STATE_FILE = path.join(CLAUDE_DIR, '.dispatcher-state.json');

// Get current event from environment
const CURRENT_EVENT = process.env.CLAUDE_EVENT_TYPE || 'UserPromptSubmit';

/**
 * Load hook registry
 */
function deepMerge(base, override) {
  const out = { ...base };
  for (const [k, v] of Object.entries(override || {})) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      out[k] = deepMerge(out[k] || {}, v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

function loadRegistry() {
  let registry = getDefaultRegistry();
  for (const file of REGISTRY_FILES) {
    if (!fs.existsSync(file)) continue;
    try {
      const parsed = JSON.parse(fs.readFileSync(file, 'utf-8'));
      registry = deepMerge(registry, parsed);
    } catch (_) {
      // ignore malformed layer, fall back to previous
    }
  }
  return registry;
}

/**
 * Default registry configuration
 *
 * NOTE: This is a FALLBACK only. Primary config is hook-registry.json
 * Keep in sync with hook-registry.json!
 *
 * Optimized: 2026-01-27
 * - Removed redundant hooks (session-save, session-restore, etc.)
 * - Merged handoff-loader into auto-handoff
 * - Disabled strategic-compact (broken dependencies)
 */
function getDefaultRegistry() {
  return {
    // === Core Hooks (与 hook-registry.json 同步) ===
    "memory-loader": {
      "events": ["SessionStart"],
      "runOnce": true,
      "enabled": true,
      "description": "加载记忆和上下文"
    },
    "memory-saver": {
      "events": ["SessionEnd"],
      "enabled": true,
      "description": "保存会话记忆"
    },
    "auto-handoff": {
      "events": ["PreCompact", "SessionStart"],
      "enabled": true,
      "description": "Handoff 保存和恢复"
    },
    "todo-manager": {
      "events": ["AgentStop"],
      "debounce": 10000,
      "enabled": true,
      "description": "任务索引更新"
    },
    "verify-work": {
      "events": ["AgentStop"],
      "enabled": true,
      "description": "工作验证提醒"
    },
    "thinking-silent": {
      "events": ["AgentStop"],
      "debounce": 5000,
      "enabled": true,
      "description": "静默思考模式"
    },
    "multi-session": {
      "events": ["UserPromptSubmit", "AgentStop"],
      "debounce": 3000,
      "condition": "sessions > 1",
      "enabled": true,
      "description": "多会话管理"
    },
    "rag-skill-loader": {
      "events": ["UserPromptSubmit"],
      "cache": true,
      "cacheTTL": 300000,
      "enabled": true,
      "description": "技能自动加载"
    },
    "project-kickoff": {
      "events": ["UserPromptSubmit"],
      "runOnce": true,
      "enabled": true,
      "description": "项目初始化"
    },
    "code-formatter": {
      "events": ["PostToolUse"],
      "enabled": true,
      "description": "代码自动格式化"
    },

    // === Disabled Hooks ===
    "strategic-compact": {
      "events": ["PreCompact"],
      "enabled": false,
      "description": "DISABLED: 依赖已弃用模块"
    },
    "handoff-loader": {
      "events": ["SessionStart"],
      "enabled": false,
      "description": "DISABLED: 已合并到 auto-handoff"
    }
  };
}

/**
 * Load dispatcher state (for debouncing and caching)
 */
function loadState() {
  if (!fs.existsSync(STATE_FILE)) {
    return { lastRun: {}, cache: {}, runOnceCompleted: [] };
  }
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
  } catch (e) {
    return { lastRun: {}, cache: {}, runOnceCompleted: [] };
  }
}

/**
 * Save dispatcher state
 */
function saveState(state) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (e) {
    // Ignore save errors
  }
}

/**
 * Check if hook should run based on debounce
 */
function shouldRunDebounce(hookName, config, state) {
  if (!config.debounce) return true;

  const lastRun = state.lastRun[hookName] || 0;
  const now = Date.now();

  if (now - lastRun < config.debounce) {
    return false;
  }

  return true;
}

/**
 * Check if hook should run based on runOnce
 */
function shouldRunOnce(hookName, config, state) {
  if (!config.runOnce) return true;

  if (state.runOnceCompleted.includes(hookName)) {
    return false;
  }

  return true;
}

/**
 * Check if hook should run based on condition
 */
function shouldRunCondition(hookName, config) {
  if (!config.condition || config.condition === 'always') {
    return true;
  }

  // Special conditions
  if (config.condition === 'sessions > 1') {
    // Check active sessions
    const sessionsFile = path.join(CLAUDE_DIR, 'active-sessions.json');
    if (fs.existsSync(sessionsFile)) {
      try {
        const sessions = JSON.parse(fs.readFileSync(sessionsFile, 'utf-8'));
        return Object.keys(sessions).length > 1;
      } catch (e) {
        return false;
      }
    }
    return false;
  }

  return true;
}

/**
 * Execute a single hook
 */
function resolveHookFile(hookName) {
  const candidates = [
    path.join(HOOKS_DIR_LOCAL, `${hookName}.cjs`),
    path.join(HOOKS_DIR, `${hookName}.cjs`),
    path.join(HOOKS_DIR_UP, `${hookName}.cjs`),
  ];
  for (const file of candidates) {
    if (fs.existsSync(file)) return file;
  }
  return null;
}

function executeHook(hookName) {
  const hookFile = resolveHookFile(hookName);

  if (!fs.existsSync(hookFile)) {
    return { success: false, error: 'Hook file not found' };
  }

  try {
    // Use require to execute the hook
    const hook = require(hookFile);

    // If hook exports a main function, call it
    if (typeof hook.main === 'function') {
      hook.main();
    }

    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Get hooks to run for current event
 */
function getHooksForEvent(registry, event) {
  const hooks = [];

  for (const [hookName, config] of Object.entries(registry)) {
    if (!config.enabled) continue;
    if (!config.events.includes(event)) continue;

    hooks.push({ name: hookName, config });
  }

  return hooks;
}

/**
 * Main dispatcher logic
 */
function dispatch() {
  const registry = loadRegistry();
  const state = loadState();
  const hooks = getHooksForEvent(registry, CURRENT_EVENT);

  const results = [];

  for (const { name, config } of hooks) {
    // Check debounce
    if (!shouldRunDebounce(name, config, state)) {
      results.push({ hook: name, status: 'debounced' });
      continue;
    }

    // Check runOnce
    if (!shouldRunOnce(name, config, state)) {
      results.push({ hook: name, status: 'already_run' });
      continue;
    }

    // Check condition
    if (!shouldRunCondition(name, config)) {
      results.push({ hook: name, status: 'condition_not_met' });
      continue;
    }

    // Execute hook
    const result = executeHook(name);

    // Update state
    state.lastRun[name] = Date.now();
    if (config.runOnce && result.success) {
      state.runOnceCompleted.push(name);
    }

    results.push({
      hook: name,
      status: result.success ? 'executed' : 'failed',
      error: result.error
    });
  }

  // Save updated state
  saveState(state);

  // Output summary (only if there were executed hooks)
  const executed = results.filter(r => r.status === 'executed');
  if (executed.length > 0 && process.env.CLAUDE_HOOK_DEBUG) {
    console.log(`[dispatcher] ${CURRENT_EVENT}: ${executed.length} hooks executed`);
  }

  return results;
}

/**
 * Reset dispatcher state (for testing or new sessions)
 */
function reset() {
  if (fs.existsSync(STATE_FILE)) {
    fs.unlinkSync(STATE_FILE);
  }
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args[0] === '--reset') {
    reset();
    console.log('Dispatcher state reset');
    process.exit(0);
  }

  if (args[0] === '--status') {
    const state = loadState();
    console.log(JSON.stringify(state, null, 2));
    process.exit(0);
  }

  dispatch();
}

module.exports = {
  dispatch,
  loadRegistry,
  loadState,
  reset,
  getHooksForEvent
};
