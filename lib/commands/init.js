/**
 * Init Commands - Initialization and interactive setup
 *
 * Extracted from lib/commands.js (lines 132-333)
 * Source: sumulige-claude/lib/commands.js
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const readline = require("readline");
const {
  loadConfig,
  CONFIG_DIR,
  CONFIG_FILE,
  SKILLS_DIR,
  ensureDir,
  saveConfig,
} = require("../config");
const { COLORS, log, createLogger } = require("./helpers");

// ============================================================================
// Init Command (lines 132-179)
// ============================================================================

/**
 * Initialize Sumulige Claude
 * @param {...string} args - Command arguments
 */
function init(...args) {
  const isInteractive = args.includes("--interactive") || args.includes("-i");

  if (isInteractive) {
    return initInteractive();
  }

  console.log("🚀 Initializing Sumulige Claude...");

  // Create config directory
  ensureDir(CONFIG_DIR);

  // Create config file
  if (!fs.existsSync(CONFIG_FILE)) {
    saveConfig(loadConfig());
    console.log("✅ Created config:", CONFIG_FILE);
  } else {
    console.log("ℹ️  Config already exists:", CONFIG_FILE);
  }

  // Create skills directory
  ensureDir(SKILLS_DIR);
  console.log("✅ Created skills directory:", SKILLS_DIR);

  // Install openskills if not installed
  try {
    execSync("openskills --version", { stdio: "ignore" });
    console.log("✅ OpenSkills already installed");
  } catch {
    console.log("📦 Installing OpenSkills...");
    try {
      execSync("npm i -g openskills", { stdio: "inherit" });
      console.log("✅ OpenSkills installed");
    } catch (e) {
      console.log(
        "⚠️  Failed to install OpenSkills. Run: npm i -g openskills",
      );
    }
  }

  console.log("");
  console.log("🎉 Sumulige Claude initialized!");
  console.log("");
  console.log("Next steps:");
  console.log("  smc sync                # Sync to current project");
  console.log("  smc skills:official     # View available skills");
  console.log("  smc init --interactive  # Interactive setup");
}

// ============================================================================
// Interactive Init Command (lines 193-333)
// ============================================================================

/**
 * Interactive initialization wizard
 */
function initInteractive() {
  const log = createLogger();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt) => {
    return new Promise((resolve) => {
      rl.question(prompt, resolve);
    });
  };

  (async () => {
    log("", "gray");
    log("🎯 SMC Interactive Setup", "blue");
    log("=====================================", "gray");
    log("", "gray");

    // Step 1: Create config
    log("Step 1: Configuration", "cyan");
    ensureDir(CONFIG_DIR);
    if (!fs.existsSync(CONFIG_FILE)) {
      saveConfig(loadConfig());
      log("✅ Created config", "green");
    } else {
      log("✅ Config exists", "green");
    }
    log("", "gray");

    // Step 2: Install OpenSkills
    log("Step 2: OpenSkills", "cyan");
    try {
      execSync("openskills --version", { stdio: "ignore" });
      log("✅ OpenSkills already installed", "green");
    } catch {
      log("Installing OpenSkills...", "gray");
      try {
        execSync("npm i -g openskills", { stdio: "pipe" });
        log("✅ OpenSkills installed", "green");
      } catch (e) {
        log("⚠️  Failed to install OpenSkills", "yellow");
      }
    }
    log("", "gray");

    // Step 3: Select skills to install
    log("Step 3: Choose Skills to Install", "cyan");
    log("", "gray");
    log("Available skill groups:", "gray");
    log("  1. 📄 Documents (docx, pdf, pptx, xlsx)", "gray");
    log("  2. 🎨 Creative (frontend-design, algorithmic-art)", "gray");
    log("  3. 🛠️ Development (mcp-builder, webapp-testing)", "gray");
    log("  4. 📋 Workflow (doc-coauthoring, internal-comms)", "gray");
    log("  5. ✨ All recommended skills", "gray");
    log("  6. ⏭️  Skip skill installation", "gray");
    log("", "gray");

    const skillChoice = await question("Select (1-6) [default: 6]: ");

    const installSkills = async (source) => {
      try {
        execSync(`openskills install ${source} -y`, { stdio: "pipe" });
        execSync("openskills sync -y", { stdio: "pipe" });
        log("✅ Skills installed", "green");
      } catch (e) {
        log("⚠️  Skill installation failed", "yellow");
      }
    };

    switch (skillChoice.trim()) {
      case "1":
        log("Installing document skills...", "gray");
        await installSkills("anthropics/skills");
        break;
      case "2":
        log("Installing creative skills...", "gray");
        await installSkills("anthropics/skills");
        break;
      case "3":
        log("Installing development skills...", "gray");
        await installSkills("anthropics/skills");
        break;
      case "4":
        log("Installing workflow skills...", "gray");
        await installSkills("anthropics/skills");
        break;
      case "5":
        log("Installing all recommended skills...", "gray");
        await installSkills("anthropics/skills");
        break;
      default:
        log("⏭️  Skipped skill installation", "yellow");
        break;
    }
    log("", "gray");

    // Step 4: Sync to current project
    log("Step 4: Sync to Current Project", "cyan");
    const shouldSync = await question(
      "Sync .claude/ to current directory? [Y/n]: ",
    );
    if (shouldSync.toLowerCase() !== "n") {
      try {
        execSync("smc sync", { stdio: "inherit" });
      } catch (e) {
        log(
          "⚠️  Sync failed (this is normal if not in a project directory)",
          "yellow",
        );
      }
    } else {
      log("⏭️  Skipped sync", "yellow");
    }
    log("", "gray");

    rl.close();

    log("=====================================", "gray");
    log("🎉 Setup complete!", "green");
    log("", "gray");
    log("Useful commands:", "gray");
    log("  smc status              Show configuration status", "gray");
    log("  smc skills:official     List available skills", "gray");
    log("  smc doctor              Check system health", "gray");
    log("", "gray");
  })();
}

// ============================================================================
// Exports
// ============================================================================

module.exports = {
  init,
  "init:interactive": initInteractive,
};
