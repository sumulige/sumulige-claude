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
const { computeStats } = require("./guardrail");

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
  agent: async (...args) => {
    const orchestrator = require("../agent-orchestrator");
    const fs = require('fs');
    const path = require('path');

    // Parse options
    const options = { dryRun: false, verbose: false, list: false, createTodo: false };
    const taskParts = [];

    for (const arg of args) {
      if (arg === "--dry-run") options.dryRun = true;
      else if (arg === "--verbose" || arg === "-v") options.verbose = true;
      else if (arg === "--list" || arg === "-l") options.list = true;
      else if (arg === "--create-todo" || arg === "-t") options.createTodo = true;
      else taskParts.push(arg);
    }

    const task = taskParts.join(" ");

    // Load guardrails if present
    let guardrails = null;
    const guardPath = path.join(process.cwd(), 'config', 'memory-guardrails.json');
    if (fs.existsSync(guardPath)) {
      try {
        guardrails = JSON.parse(fs.readFileSync(guardPath, 'utf-8'));
      } catch {
        // ignore parse errors
      }
    }

    // List agents
    if (options.list || !task) {
      console.log("🤖 Agent Orchestration System");
      console.log("");
      console.log("Available Agents:");
      console.log("");

      const agents = orchestrator.listAgents();
      agents.forEach((agent) => {
        console.log(`  ${agent.name.padEnd(12)} ${agent.model.padEnd(8)} ${agent.role}`);
      });

      console.log("");
      console.log("Usage:");
      console.log('  smc agent "Design a REST API"');
      console.log('  smc agent "实现用户登录" --verbose');
      console.log('  smc agent "Review code" --dry-run');
      console.log('  smc agent "添加支付功能" --create-todo');
      console.log("");
      console.log("Options:");
      console.log("  --verbose, -v      Show detailed output");
      console.log("  --dry-run          Only show routing, don't execute");
      console.log("  --list, -l         List available agents");
      console.log("  --create-todo, -t  Create todo files from tasks");
      console.log("");
      return;
    }

    // Execute
    console.log("🤖 Agent Orchestration");
    console.log("");

    // Echo task and available agents (helps UX and keeps tests stable)
    console.log(`Task: ${task}`);
    console.log("Available Agents:");
    orchestrator.listAgents().forEach((agent) => {
      console.log(`  ${agent.name.padEnd(12)} ${agent.model.padEnd(8)} ${agent.role}`);
    });
    console.log("");

    try {
      const result = await orchestrator.dispatch(task, {
        dryRun: options.dryRun,
        verbose: options.verbose,
      });

      const { routing, execution } = result;

      console.log(`📍 Routed to: ${routing.agent}`);
      console.log(`📊 Confidence: ${(routing.confidence * 100).toFixed(0)}%`);
      console.log(`💡 Reason: ${routing.reason}`);
      console.log("");

      if (routing.alternatives?.length) {
        console.log(`🔄 Alternatives: ${routing.alternatives.join(", ")}`);
        console.log("");
      }

      console.log("─".repeat(60));
      console.log("");
      console.log(execution.instruction);
      console.log("");
      console.log("─".repeat(60));
      console.log("");

      // Trace summary
      if (execution.traceId || execution.requestId) {
        console.log("Trace:");
        if (execution.traceId) console.log(`  trace_id: ${execution.traceId}`);
        if (execution.spanId) console.log(`  span_id: ${execution.spanId}`);
        if (execution.parentSpanId) console.log(`  parent_span_id: ${execution.parentSpanId}`);
        if (execution.requestId) console.log(`  request_id: ${execution.requestId}`);
        console.log("");
      }

      // Runtime 策略/降级可视化
      if (execution.runtime) {
        const rt = execution.runtime;
        const strat = rt.retrieve?.strategy || {};
        console.log("Runtime:");
        console.log(`  degraded: ${execution.degraded ? "yes" : "no"}`);
        console.log(`  rerank: ${strat.rerank === false ? "disabled" : "on"}`);
        console.log(`  cachePrefer: ${strat.cachePrefer ? "yes" : "no"}`);
        console.log(`  maxHops: ${strat.maxHops || "default"}`);
        if (execution.hints?.length) {
          console.log(`  hints: ${execution.hints.join(", ")}`);
        }
        console.log("");
      }

      // Metrics summary (one-liner for logs)
      const sampleEnv = process.env.SMC_METRICS_SAMPLE;
      const sampleRate = sampleEnv ? parseFloat(sampleEnv) : 0.1;
      const guardrailPath = path.join(process.cwd(), ".claude", "agent-logs", "guardrail-window.json");
      let p99RecentLine = "n/a";
      let thresholdP99 = "n/a";
      if (fs.existsSync(guardrailPath)) {
        try {
          const stats = computeStats();
          if (stats.p99_latency_ms_recent != null) p99RecentLine = `${stats.p99_latency_ms_recent}ms`;
          if (stats.threshold_p99_ms != null) thresholdP99 = `${stats.threshold_p99_ms}ms`;
        } catch {/* ignore */}
      }
      console.log(`Metrics Summary: trace=${execution.traceId || "n/a"} sample=${Number.isFinite(sampleRate)?sampleRate:"default"} p99_recent=${p99RecentLine} threshold=${thresholdP99}`);
      console.log("");

      // 如果指定了 --create-todo，从输出中提取任务并创建 todo 文件
      if (options.createTodo && !options.dryRun) {
        const todoBridge = require("../agent-orchestrator/todo-bridge");
        const tasks = todoBridge.extractTasksFromInstruction(execution.instruction);

        if (tasks.length > 0) {
          console.log("📁 创建任务文件...");
          const created = await todoBridge.createTodosFromAnalysis(tasks);

          if (created.length > 0) {
            console.log(`✅ 已创建 ${created.length} 个任务文件`);
            created.forEach((c) => {
              console.log(`   - development/todos/active/${c.filename}`);
            });
          } else {
            console.log("ℹ️  任务文件已存在");
          }
          console.log("");
        }
      }

      console.log("💡 Copy the above instruction to Claude Code, or pipe:");
      console.log(`   smc agent "${task.slice(0, 20)}..." | pbcopy`);
    } catch (error) {
      console.error("❌ Error:", error.message);
    }
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

    // Guardrail window quick view
    const guardrailPath = path.join(process.cwd(), ".claude", "agent-logs", "guardrail-window.json");
    if (fs.existsSync(guardrailPath)) {
      const stats = computeStats();
      console.log("Guardrail:");
      console.log(`  samples: ${stats.samples}`);
      if (stats.p50_latency_ms != null) console.log(`  p50: ${stats.p50_latency_ms} ms`);
      if (stats.p90_latency_ms != null) console.log(`  p90: ${stats.p90_latency_ms} ms`);
      if (stats.p99_latency_ms != null) console.log(`  p99: ${stats.p99_latency_ms} ms`);
      if (stats.threshold_p99_ms) console.log(`  threshold p99: ${stats.threshold_p99_ms} ms`);
      if (stats.exceeded !== null) console.log(`  exceeded: ${stats.exceeded ? "⚠️ yes" : "no"}`);
      if (stats.p99_latency_ms_recent != null) console.log(`  p99_recent(${stats.ttl_sec}s): ${stats.p99_latency_ms_recent} ms`);
      if (stats.hit_rate_recent != null) console.log(`  hit_rate_recent: ${(stats.hit_rate_recent * 100).toFixed(1)}%`);
      if (stats.threshold_hit_rate_min != null) console.log(`  threshold hit_rate_min: ${(stats.threshold_hit_rate_min * 100).toFixed(1)}%`);
      if (stats.exceeded_count_recent !== null) console.log(`  exceeded_recent: ${stats.exceeded_count_recent} (ttl ${stats.ttl_sec}s)`);
      if (Array.isArray(stats.exceeded_samples_recent) && stats.exceeded_samples_recent.length) {
        console.log(`  recent_exceeded_at: ${stats.exceeded_samples_recent.join(", ")}`);
      }
      if (stats.window_size) console.log(`  window size: ${stats.window_size}`);
      if (stats.window_file) console.log(`  window: ${stats.window_file}`);
      if (stats.last_updated) console.log(`  updated: ${stats.last_updated}`);
      console.log("");

      if (stats.threshold_p99_effective_ms && stats.p99_latency_ms_recent != null) {
        const ratio = stats.p99_latency_ms_recent / stats.threshold_p99_effective_ms;
        const lamp = ratio > 1 ? "🚨" : ratio > 0.8 ? "⚠️" : "✅";
        console.log(`Guardrail Lamp: ${lamp} (p99_recent ${stats.p99_latency_ms_recent} / threshold ${stats.threshold_p99_effective_ms})`);
        console.log("");
      }
      if (stats.threshold_hit_rate_min != null && stats.hit_rate_recent != null) {
        const lamp = stats.hit_rate_recent < stats.threshold_hit_rate_min ? "🚨" : stats.hit_rate_recent < stats.threshold_hit_rate_min + 0.05 ? "⚠️" : "✅";
        console.log(`HitRate Lamp: ${lamp} (recent ${(stats.hit_rate_recent*100).toFixed(1)}% / min ${(stats.threshold_hit_rate_min*100).toFixed(1)}%)`);
        console.log("");
      }
    }

    // Metrics quick view
    const sampleEnv = process.env.SMC_METRICS_SAMPLE;
    const sampleRate = sampleEnv ? parseFloat(sampleEnv) : 0.1;
    console.log("Metrics:");
    console.log(`  sample_rate: ${Number.isFinite(sampleRate) ? sampleRate : 'default'}`);
    if (process.env.SMC_METRICS_FILE) console.log(`  file: ${process.env.SMC_METRICS_FILE}`);
    if (process.env.SMC_TRACE_ID) console.log(`  trace_id: ${process.env.SMC_TRACE_ID}`);
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

      const extractCount = (patterns) => {
        for (const pattern of patterns) {
          const match = content.match(pattern);
          if (match && match[1] != null) {
            const value = Number.parseInt(match[1], 10);
            if (Number.isFinite(value)) return value;
          }
        }
        return null;
      };

      const activeCount = extractCount([
        /## 🚧 进行中的任务\s*\((\d+)\)/,
        /active\/[^\n]*\((\d+)\)/,
        /\|\s+🚧 进行中[^|]*\|\s+`active\/`\s+\|\s+(\d+)/,
      ]);
      const completedCount = extractCount([
        /## ✅ 最近完成的任务\s*\((\d+)\)/,
        /completed\/[^\n]*\((\d+)\)/,
        /\|\s+✅ 已完成[^|]*\|\s+`completed\/`\s+\|\s+(\d+)/,
      ]);
      const backlogCount = extractCount([
        /## 📋 待办任务\s*\((\d+)\)/,
        /backlog\/[^\n]*\((\d+)\)/,
        /\|\s+📋 待办[^|]*\|\s+`backlog\/`\s+\|\s+(\d+)/,
      ]);
      const countsFound =
        activeCount !== null || completedCount !== null || backlogCount !== null;

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
      if (!countsFound) {
        console.log("  ⚠️  未能解析 INDEX.md 统计，建议刷新索引");
        console.log("  Run: node .claude/hooks/todo-manager.cjs --force");
      }
      console.log(`  🚧 Active:    ${activeCount ?? 0}`);
      console.log(`  ✅ Completed: ${completedCount ?? 0}`);
      console.log(`  📋 Backlog:   ${backlogCount ?? 0}`);
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
