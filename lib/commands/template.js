/**
 * Template Commands - Project template deployment and kickoff
 *
 * Extracted from lib/commands.js for modular architecture
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { ensureDir } = require("../config");
const { copyRecursive, CopyMode } = require("../utils");
const { TEMPLATE_VERSION } = require("../migrations");
const { COLORS, log } = require("./helpers");

const TEMPLATE_DIR = path.join(__dirname, "../../template");

/**
 * Copy a single file with backup support
 * @param {string} srcPath - Source file path
 * @param {string} destPath - Destination file path
 * @param {string} mode - Copy mode (CopyMode enum)
 * @param {string} backupDir - Backup directory path
 * @param {string} displayName - Display name for logging
 */
function copySingleFile(srcPath, destPath, mode, backupDir, displayName) {
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

// ============================================================================
// Commands
// ============================================================================

const commands = {
  // -------------------------------------------------------------------------
  template: (...args) => {
    // Parse arguments
    let targetPath = process.cwd();
    let copyMode = CopyMode.BACKUP; // Default: backup before overwrite
    let showHelp = false;

    for (const arg of args) {
      if (arg === "--safe") {
        copyMode = CopyMode.SAFE;
      } else if (arg === "--force") {
        copyMode = CopyMode.FORCE;
      } else if (arg === "--help" || arg === "-h") {
        showHelp = true;
      } else if (!arg.startsWith("--")) {
        targetPath = path.resolve(arg);
      }
    }

    // Show help message
    if (showHelp) {
      console.log("");
      console.log("📋 smc template - Deploy Claude Code project template");
      console.log("");
      console.log("USAGE:");
      console.log("  smc template [path] [options]");
      console.log("");
      console.log("ARGUMENTS:");
      console.log(
        "  path        Target directory (default: current directory)",
      );
      console.log("");
      console.log("OPTIONS:");
      console.log("  --safe      Skip existing files (no overwrite)");
      console.log(
        "  --force     Overwrite without backup (use for new projects)",
      );
      console.log("  --help, -h  Show this help message");
      console.log("");
      console.log("DEFAULT BEHAVIOR:");
      console.log("  Backup existing files before overwriting.");
      console.log("  Backups stored in: .claude/backup/");
      console.log("  Backup format: filename.YYYY-MM-DD.bak");
      console.log("");
      console.log("EXAMPLES:");
      console.log(
        "  smc template                 # Deploy to current dir (with backup)",
      );
      console.log("  smc template ./my-project    # Deploy to specific dir");
      console.log("  smc template --safe          # Skip existing files");
      console.log("  smc template --force         # Overwrite everything");
      console.log("");
      console.log("COMPARISON:");
      console.log("  smc template  = Full deployment (overwrites with backup)");
      console.log("  smc sync       = Incremental update (only adds missing)");
      console.log("");
      return;
    }

    const targetDir = targetPath;
    const backupDir = path.join(targetDir, ".claude", "backup");
    const stats = { copied: 0, skipped: 0, backedup: 0, backups: [] };

    console.log("🚀 Initializing Claude Code project template...");
    console.log("   Target:", targetDir);
    console.log(
      "   Mode:",
      copyMode === CopyMode.SAFE
        ? "SAFE (skip existing)"
        : copyMode === CopyMode.FORCE
          ? "FORCE (overwrite)"
          : "BACKUP (backup before overwrite)",
    );
    console.log("");

    // Warn if existing .claude directory found
    const existingClaudeDir = path.join(targetDir, ".claude");
    if (fs.existsSync(existingClaudeDir)) {
      if (copyMode === CopyMode.FORCE) {
        console.log(
          "⚠️  Existing .claude/ directory found -- will be overwritten!",
        );
        console.log("");
      } else if (copyMode === CopyMode.BACKUP) {
        console.log("ℹ️  Existing files will be backed up to: .claude/backup/");
        console.log("");
      }
    }

    // Check template directory exists
    if (!fs.existsSync(TEMPLATE_DIR)) {
      console.log("❌ Template not found at:", TEMPLATE_DIR);
      console.log("   Please reinstall sumulige-claude");
      process.exit(1);
    }

    // Create directory structure
    console.log("📁 Creating directory structure...");
    const dirs = [
      path.join(targetDir, ".claude"),
      path.join(targetDir, "prompts"),
      path.join(targetDir, "development/todos/active"),
      path.join(targetDir, "development/todos/completed"),
      path.join(targetDir, "development/todos/backlog"),
      path.join(targetDir, "development/todos/archived"),
      backupDir,
    ];

    dirs.forEach(ensureDir);
    console.log("   ✅ Directories created");
    console.log("");

    // Copy files
    console.log("📋 Copying template files...");

    const claudeTemplateDir = path.join(TEMPLATE_DIR, ".claude");
    const targetClaudeDir = path.join(targetDir, ".claude");

    // Files to copy
    const filesToCopy = [
      {
        src: "CLAUDE-template.md",
        dest: "CLAUDE.md",
        name: ".claude/CLAUDE.md",
      },
      { src: "README.md", dest: "README.md", name: ".claude/README.md" },
      {
        src: "settings.json",
        dest: "settings.json",
        name: ".claude/settings.json",
      },
      {
        src: "boris-optimizations.md",
        dest: "boris-optimizations.md",
        name: ".claude/boris-optimizations.md",
      },
    ];

    filesToCopy.forEach(({ src, dest, name }) => {
      const srcPath = path.join(claudeTemplateDir, src);
      const destPath = path.join(targetClaudeDir, dest);
      if (fs.existsSync(srcPath)) {
        const action = copySingleFile(
          srcPath,
          destPath,
          copyMode,
          backupDir,
          name,
        );
        if (action === "copied") stats.copied++;
        else if (action === "skipped") stats.skipped++;
        else if (action === "backedup") {
          stats.copied++;
          stats.backedup++;
        }
      }
    });

    // Directories to copy recursively
    const dirsToCopy = [
      { src: "hooks", name: ".claude/hooks/" },
      { src: "commands", name: ".claude/commands/" },
      { src: "skills", name: ".claude/skills/" },
      { src: "templates", name: ".claude/templates/" },
      { src: "thinking-routes", name: ".claude/thinking-routes/" },
      { src: "rag", name: ".claude/rag/" },
    ];

    dirsToCopy.forEach(({ src, name }) => {
      const srcPath = path.join(claudeTemplateDir, src);
      if (fs.existsSync(srcPath)) {
        const result = copyRecursive(
          srcPath,
          path.join(targetClaudeDir, src),
          copyMode,
          backupDir,
        );
        const fileCount = result.copied + result.skipped + result.backedup;
        const suffix = result.skipped > 0 ? ` (${result.skipped} skipped)` : "";
        console.log(`   ✅ ${name} (${fileCount} files${suffix})`);
        stats.copied += result.copied;
        stats.skipped += result.skipped;
        stats.backedup += result.backedup;
      }
    });

    // Copy prompts
    const promptsDir = path.join(TEMPLATE_DIR, "prompts");
    if (fs.existsSync(promptsDir)) {
      const result = copyRecursive(
        promptsDir,
        path.join(targetDir, "prompts"),
        copyMode,
        backupDir,
      );
      const fileCount = result.copied + result.skipped + result.backedup;
      const suffix = result.skipped > 0 ? ` (${result.skipped} skipped)` : "";
      console.log(`   ✅ prompts/ (${fileCount} files${suffix})`);
      stats.copied += result.copied;
      stats.skipped += result.skipped;
      stats.backedup += result.backedup;
    }

    // Copy todos
    const todosDir = path.join(TEMPLATE_DIR, "development", "todos");
    if (fs.existsSync(todosDir)) {
      const result = copyRecursive(
        todosDir,
        path.join(targetDir, "development", "todos"),
        copyMode,
        backupDir,
      );
      const fileCount = result.copied + result.skipped + result.backedup;
      const suffix = result.skipped > 0 ? ` (${result.skipped} skipped)` : "";
      console.log(`   ✅ development/todos/ (${fileCount} files${suffix})`);
      stats.copied += result.copied;
      stats.skipped += result.skipped;
      stats.backedup += result.backedup;
    }

    // Root files
    const rootFiles = [
      "project-paradigm.md",
      "thinkinglens-silent.md",
      "CLAUDE-template.md",
    ];
    rootFiles.forEach((file) => {
      const src = path.join(TEMPLATE_DIR, file);
      const dest = path.join(targetDir, file);
      if (fs.existsSync(src)) {
        const action = copySingleFile(src, dest, copyMode, backupDir, file);
        if (action === "copied") stats.copied++;
        else if (action === "skipped") stats.skipped++;
        else if (action === "backedup") {
          stats.copied++;
          stats.backedup++;
        }
      }
    });

    // Create memory files
    console.log("");
    console.log("📝 Creating memory files...");
    if (!fs.existsSync(path.join(targetClaudeDir, "MEMORY.md"))) {
      fs.writeFileSync(
        path.join(targetClaudeDir, "MEMORY.md"),
        "# Memory\n\n<!-- Project memory updated by AI -->\n",
      );
      console.log("   ✅ MEMORY.md");
    } else {
      console.log("   ⊝ MEMORY.md (already exists)");
    }
    if (!fs.existsSync(path.join(targetClaudeDir, "PROJECT_LOG.md"))) {
      fs.writeFileSync(
        path.join(targetClaudeDir, "PROJECT_LOG.md"),
        "# Project Log\n\n<!-- Build history and decisions -->\n",
      );
      console.log("   ✅ PROJECT_LOG.md");
    } else {
      console.log("   ⊝ PROJECT_LOG.md (already exists)");
    }

    // Create ANCHORS.md
    const anchorsPath = path.join(targetClaudeDir, "ANCHORS.md");
    if (!fs.existsSync(anchorsPath)) {
      const anchorsContent = `# [Project Name] - Skill Anchors Index

> This file is auto-maintained by AI as a quick index for the skill system
> Last updated: ${new Date().toISOString().split("T")[0]}

---

## 🚀 AI Startup: Memory Loading Order

\`\`\`
1. ANCHORS.md (this file)     → Quick locate modules
2. PROJECT_LOG.md            → Understand build history
3. MEMORY.md                 → View latest changes
4. CLAUDE.md                 → Load core knowledge
5. prompts/                  → View tutorials
6. .claude/rag/skill-index.json → RAG skill index ⭐
7. Specific files            → Deep dive into implementation
\`\`\`

---

## Current Anchor Mapping

### Teaching Resources
| Anchor | File Path | Purpose |
|--------|-----------|---------|
| \`[doc:paradigm]\` | \`prompts/project-paradigm.md\` | General development paradigm ⭐ |
| \`[doc:claude-template]\` | \`.claude/CLAUDE.md\` | CLAUDE.md template for new projects |

### RAG System
| Anchor | File Path | Purpose |
|--------|-----------|---------|
| \`[system:rag-index]\` | \`.claude/rag/skill-index.json\` | Dynamic skill index ⭐ |

---

## Add Your Anchors Here...

`;
      fs.writeFileSync(anchorsPath, anchorsContent);
      console.log("   ✅ .claude/ANCHORS.md");
    } else {
      console.log("   ⊝ .claude/ANCHORS.md (already exists)");
    }

    // Write version file
    const { setProjectVersion } = require("../migrations");
    setProjectVersion(targetDir, TEMPLATE_VERSION);
    console.log(`   ✅ .claude/.version (v${TEMPLATE_VERSION})`);

    // Show summary
    console.log("");
    console.log("📊 Summary:");
    console.log(`   ✅ Copied: ${stats.copied} files`);
    if (stats.skipped > 0) {
      console.log(`   ⊝ Skipped: ${stats.skipped} files (already exist)`);
    }
    if (stats.backedup > 0) {
      console.log(`   💾 Backed up: ${stats.backedup} files → .claude/backup/`);
    }

    // Initialize Sumulige Claude if installed
    console.log("");
    console.log("🤖 Initializing Sumulige Claude...");
    try {
      execSync("sumulige-claude sync", { cwd: targetDir, stdio: "pipe" });
      console.log("   ✅ Sumulige Claude synced");
    } catch (e) {
      console.log(
        "   ⚠️  Sumulige Claude not available (run: npm i -g sumulige-claude)",
      );
    }

    console.log("");
    console.log("✅ Template initialization complete!");
    console.log("");
    console.log("📦 What was included:");
    console.log("   • AI autonomous memory system (ThinkingLens)");
    console.log("   • Slash commands (/commit, /test, /review, etc.)");
    console.log("   • Skills system with templates");
    console.log("   • RAG dynamic skill index");
    console.log("   • Hooks for automation");
    console.log("   • TODO management system v2.0 (R-D-T lifecycle)");
    console.log("");
    console.log("Next steps:");
    console.log("   1. Edit .claude/CLAUDE.md with your project info");
    console.log("   2. Run: claude  # Start Claude Code");
    console.log("   3. Try: /commit, /test, /review");
    console.log("");
  },

  // -------------------------------------------------------------------------
  kickoff: () => {
    const projectDir = process.cwd();
    const kickoffFile = path.join(projectDir, "PROJECT_KICKOFF.md");
    const hintFile = path.join(projectDir, ".claude", ".kickoff-hint.txt");

    console.log("🚀 Project Kickoff - Manus 风格项目启动");
    console.log("");

    if (fs.existsSync(kickoffFile)) {
      console.log("ℹ️  项目已经完成启动流程");
      console.log("   文件:", kickoffFile);
      console.log("");
      console.log("如需重新规划，请先删除以下文件：");
      console.log("   - PROJECT_KICKOFF.md");
      console.log("   - TASK_PLAN.md");
      console.log("   - PROJECT_PROPOSAL.md");
      return;
    }

    // Run kickoff hook
    const kickoffHook = path.join(
      projectDir,
      ".claude",
      "hooks",
      "project-kickoff.cjs",
    );
    if (fs.existsSync(kickoffHook)) {
      try {
        execSync(`node "${kickoffHook}"`, {
          cwd: projectDir,
          env: { ...process.env, CLAUDE_PROJECT_DIR: projectDir },
          stdio: "inherit",
        });
      } catch (e) {
        // Hook may output and exit, this is normal
      }

      // Show hint file if exists
      if (fs.existsSync(hintFile)) {
        const hint = fs.readFileSync(hintFile, "utf-8");
        console.log(hint);
      }
    } else {
      console.log("⚠️  启动 Hook 不存在");
      console.log("   请先运行: sumulige-claude template");
      console.log("   或: sumulige-claude sync");
    }
  },

  // -------------------------------------------------------------------------
  ultrathink: () => {
    log("", "gray");
    log("🧠 UltraThink Mode", "blue");
    log("=====================================", "gray");
    log("", "gray");
    log("✅ Deep thinking enabled", "green");
    log("", "gray");
    log("Usage:", "gray");
    log('  Mention "ultrathink" or "深度思考" in conversation', "gray");
    log("", "gray");
    log("=====================================", "gray");
    log("", "gray");
  },
};

// Export helpers for other modules
module.exports = {
  ...commands,
  copySingleFile,
  setExecutablePermission,
  TEMPLATE_DIR,
};
