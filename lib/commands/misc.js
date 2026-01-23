/**
 * Misc Commands - Version, agent, status, changelog
 *
 * Extracted from lib/commands.js for modular architecture
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { loadConfig } = require("../config");
const { checkUpdate, getCurrentVersion } = require("../version-check");
const { COLORS, log } = require("./helpers");

// ============================================================================
// Commands
// ============================================================================

const commands = {
  // -------------------------------------------------------------------------
  version: async () => {
    const current = getCurrentVersion();
    console.log(`v${current}`);

    // Check for updates asynchronously
    setImmediate(async () => {
      await checkUpdate({ force: false });
    });
  },

  // -------------------------------------------------------------------------
  agent: (task) => {
    if (!task) {
      console.log("Usage: sumulige-claude agent <task>");
      console.log("");
      console.log('Example: sumulige-claude agent "Build a React dashboard"');
      return;
    }

    const config = loadConfig();
    console.log("🤖 Starting Agent Orchestration...");
    console.log("");
    console.log("Task:", task);
    console.log("");
    console.log("Available Agents:");
    Object.entries(config.agents).forEach(([name, agent]) => {
      const model = agent.model || config.model;
      console.log(`  - ${name}: ${model} (${agent.role})`);
    });
    console.log("");
    console.log(
      "💡 In Claude Code, use /skill <name> to invoke specific agent capabilities",
    );
  },

  // -------------------------------------------------------------------------
  status: () => {
    const config = loadConfig();
    console.log("📊 Sumulige Claude Status");
    console.log("");
    console.log("Config:", path.join(process.env.HOME || process.env.USERPROFILE, ".config", "sumulige-claude", "config.json"));
    console.log("");
    console.log("Agents:");
    Object.entries(config.agents).forEach(([name, agent]) => {
      const model = agent.model || config.model;
      console.log(`  ${name.padEnd(12)} ${model.padEnd(20)} (${agent.role})`);
    });
    console.log("");
    console.log("Skills:", config.skills.join(", "));
    console.log("");
    console.log(
      "ThinkingLens:",
      config.thinkingLens.enabled ? "✅ Enabled" : "❌ Disabled",
    );
    console.log("");

    // Show project todos status
    const projectDir = process.cwd();
    const todosIndex = path.join(
      projectDir,
      "development",
      "todos",
      "INDEX.md",
    );

    if (fs.existsSync(todosIndex)) {
      const content = fs.readFileSync(todosIndex, "utf-8");

      const totalMatch = content.match(/Total:\s+`([^`]+)`\s+(\d+)%/);
      const p0Match = content.match(
        /P0[^`]*`([^`]+)`\s+(\d+)%\s+\((\d+)\/(\d+)\)/,
      );
      const p1Match = content.match(
        /P1[^`]*`([^`]+)`\s+(\d+)%\s+\((\d+)\/(\d+)\)/,
      );
      const p2Match = content.match(
        /P2[^`]*`([^`]+)`\s+(\d+)%\s+\((\d+)\/(\d+)\)/,
      );

      const activeMatch = content.match(
        /\|\s+🚧 进行中[^|]*\|\s+`active\/`\s+\|\s+(\d+)/,
      );
      const completedMatch = content.match(
        /\|\s+✅ 已完成[^|]*\|\s+`completed\/`\s+\|\s+(\d+)/,
      );
      const backlogMatch = content.match(
        /\|\s+📋 待办[^|]*\|\s+`backlog\/`\s+\|\s+(\d+)/,
      );

      console.log("📋 Project Tasks:");
      console.log("");
      if (totalMatch) {
        console.log(`  Total: ${totalMatch[1]} ${totalMatch[2]}%`);
      }
      if (p0Match) {
        console.log(
          `  P0:   ${p0Match[1]} ${p0Match[2]}% (${p0Match[3]}/${p0Match[4]})`,
        );
      }
      if (p1Match) {
        console.log(
          `  P1:   ${p1Match[1]} ${p1Match[2]}% (${p1Match[3]}/${p1Match[4]})`,
        );
      }
      if (p2Match) {
        console.log(
          `  P2:   ${p2Match[1]} ${p2Match[2]}% (${p2Match[3]}/${p2Match[4]})`,
        );
      }
      console.log("");
      console.log(`  🚧 Active:    ${activeMatch ? activeMatch[1] : 0}`);
      console.log(`  ✅ Completed: ${completedMatch ? completedMatch[1] : 0}`);
      console.log(`  📋 Backlog:   ${backlogMatch ? backlogMatch[1] : 0}`);
      console.log("");
      console.log(`  View: cat development/todos/INDEX.md`);
    } else {
      console.log("📋 Project Tasks: (not initialized)");
      console.log("  Run: node .claude/hooks/todo-manager.cjs --force");
    }
  },

  // -------------------------------------------------------------------------
  changelog: (...args) => {
    // Parse options
    const options = { from: null, to: null, json: false, help: false };
    for (let i = 0; i < args.length; i++) {
      if (args[i] === "--from" && args[i + 1]) options.from = args[++i];
      if (args[i] === "--to" && args[i + 1]) options.to = args[++i];
      if (args[i] === "--json") options.json = true;
      if (args[i] === "--help" || args[i] === "-h") options.help = true;
    }

    if (options.help) {
      log("", "gray");
      log("📝 Changelog Generator", "blue");
      log("=====================================", "gray");
      log("", "gray");
      log("Generate changelog from git commits.", "gray");
      log("", "gray");
      log("Usage:", "gray");
      log("  smc changelog [options]", "gray");
      log("", "gray");
      log("Options:", "gray");
      log("  --from <tag>    Start from this tag (default: last tag)", "gray");
      log("  --to <tag>      End at this tag (default: HEAD)", "gray");
      log("  --json          Output as JSON", "gray");
      log("  --help, -h      Show this help", "gray");
      log("", "gray");
      log("Examples:", "gray");
      log(
        "  smc changelog                    # Changelog since last tag",
        "gray",
      );
      log("  smc changelog --from v1.0.0      # Since v1.0.0", "gray");
      log(
        "  smc changelog --from v1.0 --to v1.1  # Range between tags",
        "gray",
      );
      log("  smc changelog --json             # JSON output", "gray");
      log("", "gray");
      return;
    }

    // Check if we're in a git repo
    const projectDir = process.cwd();
    try {
      execSync("git rev-parse --git-dir", { stdio: "ignore", cwd: projectDir });
    } catch {
      log("❌ Not a git repository", "red");
      return;
    }

    log("", "gray");
    log("📝 Generating Changelog", "blue");
    log("=====================================", "gray");
    log("", "gray");

    // Get version range
    let fromRef = options.from;
    let toRef = options.to || "HEAD";

    if (!fromRef) {
      // Try to get the last tag
      try {
        const lastTag = execSync("git describe --tags --abbrev=0", {
          cwd: projectDir,
          stdio: "pipe",
          encoding: "utf-8",
        }).trim();
        fromRef = lastTag;
        log(`From: ${lastTag} (last tag)`, "gray");
      } catch {
        // No tags found, use first commit
        try {
          const firstCommit = execSync("git rev-list --max-parents=0 HEAD", {
            cwd: projectDir,
            stdio: "pipe",
            encoding: "utf-8",
          }).trim();
          fromRef = firstCommit;
          log(`From: ${firstCommit.substring(0, 8)} (first commit)`, "gray");
        } catch {
          fromRef = "HEAD~10"; // Fallback to last 10 commits
          log(`From: HEAD~10 (default)`, "gray");
        }
      }
    } else {
      log(`From: ${fromRef}`, "gray");
    }

    log(`To: ${toRef}`, "gray");
    log("", "gray");

    // Get commit log
    const range = `${fromRef}..${toRef}`;
    let commits = [];
    try {
      const logOutput = execSync(
        `git log ${range} --pretty=format:"%H%x1F%s%x1F%an%x1F%ad" --date=short`,
        { cwd: projectDir, stdio: "pipe", encoding: "utf-8" },
      );
      commits = logOutput
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((line) => {
          const [hash, subject, author, date] = line.split("\x1F");
          return { hash, subject, author, date };
        });
    } catch (e) {
      // Empty range or invalid refs
      commits = [];
    }

    if (commits.length === 0) {
      log("⚠️  No commits found in range", "yellow");
      log("", "gray");
      return;
    }

    log(`Found ${commits.length} commit(s)`, "gray");
    log("", "gray");

    // Parse conventional commits
    const categories = {
      feat: { name: "Features", icon: "✨", commits: [] },
      fix: { name: "Bug Fixes", icon: "🐛", commits: [] },
      docs: { name: "Documentation", icon: "📝", commits: [] },
      style: { name: "Styles", icon: "💄", commits: [] },
      refactor: { name: "Refactor", icon: "♻️", commits: [] },
      perf: { name: "Performance", icon: "⚡", commits: [] },
      test: { name: "Tests", icon: "🧪", commits: [] },
      build: { name: "Build", icon: "📦", commits: [] },
      ci: { name: "CI", icon: "🤖", commits: [] },
      chore: { name: "Chores", icon: "🧹", commits: [] },
      other: { name: "Other", icon: "📌", commits: [] },
    };

    const conventionalCommitRegex = /^(\w+)(?:\(([^)]+)\))?:?\s*(.+)$/;

    commits.forEach((commit) => {
      const match = commit.subject.match(conventionalCommitRegex);
      if (match) {
        const [, type, scope, description] = match;
        const category = categories[type] || categories.other;
        category.commits.push({
          hash: commit.hash.substring(0, 8),
          description: description.trim(),
          scope: scope || null,
          author: commit.author,
          date: commit.date,
        });
      } else {
        categories.other.commits.push({
          hash: commit.hash.substring(0, 8),
          description: commit.subject,
          scope: null,
          author: commit.author,
          date: commit.date,
        });
      }
    });

    if (options.json) {
      // JSON output
      const jsonOutput = {};
      for (const [key, category] of Object.entries(categories)) {
        if (category.commits.length > 0) {
          jsonOutput[key] = {
            name: category.name,
            icon: category.icon,
            commits: category.commits,
          };
        }
      }
      console.log(JSON.stringify(jsonOutput, null, 2));
      return;
    }

    // Markdown output
    const today = new Date().toISOString().split("T")[0];

    // Check if CHANGELOG.md exists and append
    const changelogFile = path.join(projectDir, "CHANGELOG.md");

    let existingContent = "";
    if (fs.existsSync(changelogFile)) {
      existingContent = fs.readFileSync(changelogFile, "utf-8");
    }

    // Generate new entry
    let newEntry = `## [Unreleased] (${today})\n\n`;

    for (const [key, category] of Object.entries(categories)) {
      if (category.commits.length > 0) {
        newEntry += `### ${category.icon} ${category.name}\n\n`;
        category.commits.forEach((commit) => {
          const scopeStr = commit.scope ? `**${commit.scope}**: ` : "";
          newEntry += `- ${scopeStr}${commit.description} (${commit.hash})\n`;
        });
        newEntry += "\n";
      }
    }

    // Write or append
    if (existingContent) {
      // Check if unreleased section exists
      const unreleasedRegex = /## \[Unreleased\].*?\n\n([\s\S]*?)(?=## \[|$)/;
      const match = existingContent.match(unreleasedRegex);

      if (match) {
        // Replace existing unreleased section
        const updatedContent = existingContent.replace(
          unreleasedRegex,
          newEntry.trimEnd() + "\n\n",
        );
        fs.writeFileSync(changelogFile, updatedContent);
        log("✅ Updated [Unreleased] section in CHANGELOG.md", "green");
      } else {
        // Prepend to existing content
        const newContent = newEntry + existingContent;
        fs.writeFileSync(changelogFile, newContent);
        log("✅ Added to CHANGELOG.md", "green");
      }
    } else {
      // Create new CHANGELOG.md
      const header = `# Changelog

All notable changes to this project will be documented in this file.

`;
      fs.writeFileSync(changelogFile, header + newEntry);
      log("✅ Created CHANGELOG.md", "green");
    }

    log("", "gray");
    log("📄 Preview:", "gray");
    log("", "gray");
    console.log(newEntry);

    log("=====================================", "gray");
    log("", "gray");
  },
};

module.exports = commands;
