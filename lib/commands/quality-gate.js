/**
 * Quality Gate Commands - Code quality checking
 *
 * Extracted from lib/commands.js for modular architecture
 */

const fs = require("fs");
const path = require("path");
const { ensureDir } = require("../config");

// ============================================================================
// Commands
// ============================================================================

const commands = {
  // -------------------------------------------------------------------------
  "qg:check": async (severity = "warn") => {
    const { QualityGate } = require("../quality-gate");
    const gate = new QualityGate({ projectDir: process.cwd() });
    const result = await gate.check({ severity });
    process.exit(result.passed ? 0 : 1);
  },

  // -------------------------------------------------------------------------
  "qg:rules": () => {
    const registry = require("../quality-rules").registry;
    const rules = registry.getAll();

    console.log("📋 Available Quality Rules");
    console.log("");
    console.log("Rules are checked when running quality gate:");
    console.log("");

    const byCategory = {};
    for (const rule of rules) {
      if (!byCategory[rule.category]) byCategory[rule.category] = [];
      byCategory[rule.category].push(rule);
    }

    for (const [category, catRules] of Object.entries(byCategory)) {
      console.log(`${category.toUpperCase()}:`);
      for (const rule of catRules) {
        const status = rule.enabled ? "✅" : "⊝";
        const sev = { info: "I", warn: "W", error: "E", critical: "X" }[
          rule.severity
        ];
        console.log(`  ${status} ${rule.id} [${sev}] - ${rule.name}`);
      }
      console.log("");
    }
  },

  // -------------------------------------------------------------------------
  "qg:init": () => {
    const projectDir = process.cwd();
    const configDir = path.join(projectDir, ".claude");
    const targetPath = path.join(configDir, "quality-gate.json");
    const sourcePath = path.join(__dirname, "../../config/quality-gate.json");

    if (fs.existsSync(targetPath)) {
      console.log("⚠️  quality-gate.json already exists");
      return;
    }

    ensureDir(configDir);
    fs.copyFileSync(sourcePath, targetPath);
    console.log("✅ Created .claude/quality-gate.json");
    console.log("");
    console.log("To enable Git hooks:");
    console.log("  ln -s .claude/hooks/pre-commit.cjs .git/hooks/pre-commit");
    console.log("  ln -s .claude/hooks/pre-push.cjs .git/hooks/pre-push");
  },
};

module.exports = commands;
