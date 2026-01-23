/**
 * Shared helpers for command modules
 *
 * Extracted from lib/commands.js for modular architecture
 * Source: sumulige-claude/lib/commands.js (lines 33-124, 3531-3563)
 */

const fs = require("fs");
const path = require("path");

// ANSI color codes for consistent terminal output
const COLORS = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  yellow: "\x1b[33m",
  gray: "\x1b[90m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
};

/**
 * Colored console output
 * @param {string} msg - Message to print
 * @param {string} color - Color name from COLORS
 */
function log(msg, color = "reset") {
  console.log(`${COLORS[color]}${msg}${COLORS.reset}`);
}

/**
 * Simple YAML parser for basic key: value format
 * @param {string} content - YAML content
 * @returns {Object} Parsed object
 */
function parseSimpleYaml(content) {
  const result = {};
  content.split("\n").forEach((line) => {
    const match = line.match(/^(\w+):\s*(.*)$/);
    if (match) {
      const value = match[2].trim();
      if (value === "[]") {
        result[match[1]] = [];
      } else if (value.startsWith("[")) {
        try {
          result[match[1]] = JSON.parse(value.replace(/'/g, '"'));
        } catch (e) {
          result[match[1]] = [];
        }
      } else {
        result[match[1]] = value;
      }
    }
  });
  return result;
}

/**
 * Get home directory cross-platform
 * @returns {string} Home directory path
 */
function getHomeDir() {
  return process.env.HOME || process.env.USERPROFILE;
}

/**
 * Get global Claude config directory
 * @returns {string} Global .claude directory path
 */
function getGlobalClaudeDir() {
  return path.join(getHomeDir(), ".claude");
}

/**
 * Get global skills directory
 * @returns {string} Global skills directory path
 */
function getGlobalSkillsDir() {
  return path.join(getGlobalClaudeDir(), "skills");
}

/**
 * Get project skills directory
 * @param {string} projectDir - Project root directory
 * @returns {string} Project skills directory path
 */
function getProjectSkillsDir(projectDir = process.cwd()) {
  return path.join(projectDir, ".claude", "skills");
}

/**
 * Get official skills registry file path
 * @returns {string} Path to official-skills.json
 */
function getOfficialSkillsFile() {
  return path.join(__dirname, "../../config/official-skills.json");
}

/**
 * Get sources.yaml file path
 * @returns {string} Path to sources.yaml
 */
function getSourcesFile() {
  return path.join(__dirname, "../../sources.yaml");
}

/**
 * Ensure directory exists
 * @param {string} dirPath - Directory path to create
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Recursively delete a directory
 * @param {string} dir - Directory to delete
 */
function rimraf(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * Convert kebab-case to Title Case
 * @param {string} str - String to convert
 * @returns {string} Title cased string
 */
function toTitleCase(str) {
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * List skill directories from a path
 * @param {string} skillsDir - Skills directory path
 * @returns {string[]} Array of skill directory names
 */
function listSkillDirs(skillsDir) {
  if (!fs.existsSync(skillsDir)) return [];

  return fs.readdirSync(skillsDir).filter((f) => {
    const dir = path.join(skillsDir, f);
    return (
      fs.statSync(dir).isDirectory() &&
      !f.startsWith(".") &&
      f !== "template" &&
      f !== "examples"
    );
  });
}

// ============================================================================
// File Operations (from commands.js lines 33-124)
// ============================================================================

/**
 * Count files in a directory recursively
 * @param {string} dirPath - Directory path
 * @returns {number} Number of files
 */
function countFiles(dirPath) {
  let count = 0;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      // Skip certain directories
      if (
        entry.name !== "node_modules" &&
        entry.name !== ".git" &&
        entry.name !== "sessions"
      ) {
        count += countFiles(fullPath);
      }
    } else {
      count++;
    }
  }
  return count;
}

/**
 * Set executable permission for script files
 * @param {string} filePath - File path
 */
function setExecutablePermission(filePath) {
  if (filePath.endsWith(".sh") || filePath.endsWith(".cjs")) {
    try {
      fs.chmodSync(filePath, 0o755);
    } catch (e) {
      // Ignore permission errors
    }
  }
}

/**
 * Copy a single file with backup support
 * @param {string} srcPath - Source file path
 * @param {string} destPath - Destination file path
 * @param {string} mode - Copy mode (CopyMode enum)
 * @param {string} backupDir - Backup directory path
 * @param {string} displayName - Display name for logging
 */
function copySingleFile(srcPath, destPath, mode, backupDir, displayName) {
  const { CopyMode } = require("../utils");

  if (!fs.existsSync(srcPath)) return;

  // File doesn't exist at destination - just copy
  if (!fs.existsSync(destPath)) {
    fs.copyFileSync(srcPath, destPath);
    setExecutablePermission(destPath);
    console.log(`   ✅ ${displayName}`);
    return;
  }

  // File exists - handle based on mode
  switch (mode) {
    case CopyMode.SAFE:
      // Skip existing files
      console.log(`   ⊝ ${displayName} (kept existing)`);
      break;

    case CopyMode.FORCE:
      // Overwrite without backup
      fs.copyFileSync(srcPath, destPath);
      setExecutablePermission(destPath);
      console.log(`   ✅ ${displayName} (overwritten)`);
      break;

    case CopyMode.BACKUP:
    default:
      // Backup then overwrite
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .split("T")[0];
      const backupFileName =
        path.basename(destPath).replace(/\.[^.]+$/, "") +
        "." +
        timestamp +
        ".bak";
      const backupPath = path.join(backupDir, backupFileName);

      fs.mkdirSync(backupDir, { recursive: true });
      fs.copyFileSync(destPath, backupPath);
      setExecutablePermission(backupPath);

      fs.copyFileSync(srcPath, destPath);
      setExecutablePermission(destPath);
      console.log(`   ✅ ${displayName} (backed up)`);
      break;
  }
}

// ============================================================================
// Content Generators (from commands.js lines 3531-3563)
// ============================================================================

/**
 * Generate AGENTS.md content from config
 * @param {Object} config - Configuration object with agents
 * @returns {string} Generated markdown content
 */
function generateAgentsMd(config) {
  const agentsList = Object.entries(config.agents)
    .map(([name, agent]) => {
      const model = agent.model || config.model;
      return `### ${name}\n- **Model**: ${model}\n- **Role**: ${agent.role}`;
    })
    .join("\n\n");

  return `# AGENTS

<skills_system priority="1">

## Agent Orchestration

This project uses **Sumulige Claude** for multi-agent collaboration.

${agentsList}

## Usage

\`\`\`bash
# View agent status
sumulige-claude status

# Run agent task
sumulige-claude agent <task>

# List skills
sumulige-claude skill:list
\`\`\`

</skills_system>
`;
}

/**
 * Create a logger factory with color support
 * @returns {Function} Logger function
 */
function createLogger() {
  return (msg, color = "reset") => {
    console.log(`${COLORS[color]}${msg}${COLORS.reset}`);
  };
}

module.exports = {
  COLORS,
  log,
  createLogger,
  parseSimpleYaml,
  getHomeDir,
  getGlobalClaudeDir,
  getGlobalSkillsDir,
  getProjectSkillsDir,
  getOfficialSkillsFile,
  getSourcesFile,
  ensureDir,
  rimraf,
  toTitleCase,
  listSkillDirs,
  countFiles,
  copySingleFile,
  setExecutablePermission,
  generateAgentsMd,
};
