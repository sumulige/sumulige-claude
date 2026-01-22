#!/usr/bin/env node
/**
 * Auto Handoff Hook - PreCompact Context Preservation
 *
 * Claude Official Hook: PreCompact
 * Triggered: Before conversation context is compressed
 *
 * Features:
 * - Auto-generate handoff document before context compression
 * - Preserve critical context that might be lost during compaction
 * - Save current state including progress, blockers, and next steps
 *
 * Environment Variables:
 * - CLAUDE_PROJECT_DIR: Project directory path
 * - CLAUDE_SESSION_ID: Unique session identifier
 * - CLAUDE_CONVERSATION_ID: Conversation identifier
 */

const fs = require('fs');
const path = require('path');

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const CLAUDE_DIR = path.join(PROJECT_DIR, '.claude');
const HANDOFFS_DIR = path.join(CLAUDE_DIR, 'handoffs');
const SESSION_STATE_FILE = path.join(CLAUDE_DIR, '.session-state.json');
const STATE_FILE = path.join(PROJECT_DIR, 'development', 'todos', '.state.json');
const SESSION_ID = process.env.CLAUDE_SESSION_ID || 'unknown';
const CONVERSATION_ID = process.env.CLAUDE_CONVERSATION_ID || 'unknown';

/**
 * Ensure handoffs directory exists
 */
function ensureHandoffsDir() {
  if (!fs.existsSync(HANDOFFS_DIR)) {
    fs.mkdirSync(HANDOFFS_DIR, { recursive: true });
  }
}

/**
 * Load current session state
 */
function loadSessionState() {
  if (!fs.existsSync(SESSION_STATE_FILE)) {
    return {
      session: { project: path.basename(PROJECT_DIR) },
      memory: { entries: 0 },
      todos: { active: 0, completed: 0 }
    };
  }

  try {
    return JSON.parse(fs.readFileSync(SESSION_STATE_FILE, 'utf-8'));
  } catch (e) {
    return {
      session: { project: path.basename(PROJECT_DIR) },
      memory: { entries: 0 },
      todos: { active: 0, completed: 0 }
    };
  }
}

/**
 * Load active TODOs
 */
function loadActiveTodos() {
  const todosDir = path.join(PROJECT_DIR, 'development', 'todos', 'active');
  if (!fs.existsSync(todosDir)) {
    return [];
  }

  try {
    const files = fs.readdirSync(todosDir)
      .filter(f => f.endsWith('.md') && f !== '_README.md');

    return files.map(f => {
      const content = fs.readFileSync(path.join(todosDir, f), 'utf-8');
      const titleMatch = content.match(/^#\s+(.+)$/m);
      return {
        file: f,
        title: titleMatch ? titleMatch[1] : path.basename(f, '.md')
      };
    });
  } catch (e) {
    return [];
  }
}

/**
 * Get recently modified files
 */
function getRecentlyModifiedFiles(hours = 24) {
  const recentFiles = [];
  const cutoff = Date.now() - (hours * 60 * 60 * 1000);

  // Check common source directories
  const sourceDirs = ['src', 'lib', '.claude', 'development'];

  for (const dir of sourceDirs) {
    const fullPath = path.join(PROJECT_DIR, dir);
    if (!fs.existsSync(fullPath)) continue;

    try {
      const walkDir = (dirPath, depth = 0) => {
        if (depth > 3) return; // Limit depth

        const items = fs.readdirSync(dirPath, { withFileTypes: true });
        for (const item of items) {
          const itemPath = path.join(dirPath, item.name);

          if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
            walkDir(itemPath, depth + 1);
          } else if (item.isFile()) {
            try {
              const stat = fs.statSync(itemPath);
              if (stat.mtimeMs > cutoff) {
                const relativePath = path.relative(PROJECT_DIR, itemPath);
                recentFiles.push({
                  path: relativePath,
                  modified: stat.mtime.toISOString()
                });
              }
            } catch (e) {
              // Ignore stat errors
            }
          }
        }
      };

      walkDir(fullPath);
    } catch (e) {
      // Ignore directory errors
    }
  }

  // Sort by modification time (most recent first)
  recentFiles.sort((a, b) => b.modified.localeCompare(a.modified));

  return recentFiles.slice(0, 20); // Return top 20
}

/**
 * Generate handoff document
 */
function generateHandoff(sessionState) {
  const now = new Date();
  const todos = loadActiveTodos();
  const recentFiles = getRecentlyModifiedFiles();

  let content = `# Handoff: Pre-Compact Context Preservation

> Auto-generated before context compression
> Date: ${now.toISOString()}
> Session: ${SESSION_ID}
> Conversation: ${CONVERSATION_ID}

---

## Session Info

- **Project**: ${sessionState.session?.project || 'unknown'}
- **Version**: ${sessionState.session?.version || 'unknown'}
- **Start Time**: ${sessionState.session?.startTime || 'unknown'}

---

## Memory State

- **Entries Loaded**: ${sessionState.memory?.entries || 0}
- **Anchors Modules**: ${sessionState.anchors?.modules || 0}

---

## Active TODOs (${todos.length})

`;

  if (todos.length > 0) {
    todos.forEach(todo => {
      content += `- [ ] ${todo.title} (\`${todo.file}\`)\n`;
    });
  } else {
    content += `*No active TODOs*\n`;
  }

  content += `

---

## Recently Modified Files (Last 24h)

`;

  if (recentFiles.length > 0) {
    recentFiles.slice(0, 10).forEach(f => {
      content += `- \`${f.path}\` (${f.modified.split('T')[0]})\n`;
    });
    if (recentFiles.length > 10) {
      content += `- *...and ${recentFiles.length - 10} more files*\n`;
    }
  } else {
    content += `*No recently modified files*\n`;
  }

  content += `

---

## Context Preservation Notes

**Important**: This handoff was auto-generated before context compaction.
The following information should be re-loaded after compaction:

1. Read \`.claude/MEMORY.md\` for recent session context
2. Check \`development/todos/INDEX.md\` for task status
3. Review recent git commits for code changes

---

## Recovery Commands

\`\`\`bash
# View recent memory
cat .claude/MEMORY.md | head -100

# Check active TODOs
ls development/todos/active/

# View recent changes
git log --oneline -10
git status
\`\`\`

---

*Auto-generated by auto-handoff.cjs at ${now.toISOString()}*
`;

  return content;
}

/**
 * Save handoff document
 */
function saveHandoff(content) {
  ensureHandoffsDir();

  const now = new Date();
  const filename = `handoff_${now.toISOString().replace(/[:.]/g, '-')}.md`;
  const filepath = path.join(HANDOFFS_DIR, filename);

  fs.writeFileSync(filepath, content);

  // Also save as latest handoff for easy access
  const latestPath = path.join(HANDOFFS_DIR, 'LATEST.md');
  fs.writeFileSync(latestPath, content);

  // Clean up old handoffs (keep last 10)
  const files = fs.readdirSync(HANDOFFS_DIR)
    .filter(f => f.startsWith('handoff_') && f.endsWith('.md'))
    .sort()
    .reverse();

  if (files.length > 10) {
    files.slice(10).forEach(f => {
      try {
        fs.unlinkSync(path.join(HANDOFFS_DIR, f));
      } catch (e) {
        // Ignore deletion errors
      }
    });
  }

  return filename;
}

/**
 * Update handoffs index
 */
function updateHandoffsIndex() {
  const indexPath = path.join(HANDOFFS_DIR, 'INDEX.md');

  const files = fs.readdirSync(HANDOFFS_DIR)
    .filter(f => f.startsWith('handoff_') && f.endsWith('.md'))
    .sort()
    .reverse();

  let content = `# Handoffs Index

> Auto-generated context preservation documents
> Updated: ${new Date().toISOString()}

---

## Recent Handoffs (${files.length})

`;

  files.slice(0, 20).forEach(f => {
    const filepath = path.join(HANDOFFS_DIR, f);
    const stat = fs.statSync(filepath);
    content += `- [${f}](./${f}) - ${stat.mtime.toISOString()}\n`;
  });

  content += `

---

## Latest Handoff

See [LATEST.md](./LATEST.md) for the most recent context snapshot.

---

*Index maintained by auto-handoff.cjs*
`;

  fs.writeFileSync(indexPath, content);
}

/**
 * Main execution
 */
function main() {
  try {
    const sessionState = loadSessionState();
    const content = generateHandoff(sessionState);
    const filename = saveHandoff(content);
    updateHandoffsIndex();

    console.log(`\n⚡ PreCompact: Context preserved → ${filename}`);
    console.log(`   Recovery: .claude/handoffs/LATEST.md\n`);

    process.exit(0);
  } catch (e) {
    // Silent failure - don't interrupt compaction
    console.error(`PreCompact handoff error: ${e.message}`);
    process.exit(0);
  }
}

// Run
if (require.main === module) {
  main();
}

module.exports = {
  loadSessionState,
  loadActiveTodos,
  getRecentlyModifiedFiles,
  generateHandoff,
  saveHandoff,
  updateHandoffsIndex
};
