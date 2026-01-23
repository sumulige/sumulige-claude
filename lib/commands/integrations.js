/**
 * Integration Commands - Knowledge, NotebookLM, Audit
 *
 * Extracted from lib/commands.js for modular architecture
 */

// ============================================================================
// Commands
// ============================================================================

const commands = {
  // ==========================================================================
  // Knowledge Commands
  // ==========================================================================

  knowledge: async (...args) => {
    const {
      handleKnowledgeCommand,
    } = require("../../.claude/workflow/knowledge-engine");
    await handleKnowledgeCommand(args);
  },

  // ==========================================================================
  // NotebookLM Commands
  // ==========================================================================

  notebooklm: async (...args) => {
    const {
      handleNotebookLMCommand,
    } = require("../../.claude/workflow/notebooklm/browser");
    await handleNotebookLMCommand(args);
  },

  // ==========================================================================
  // Security Audit Commands
  // ==========================================================================

  audit: async (...args) => {
    const { audit, generateReport, passes } = require("../permission-audit");

    const isGlobal = args.includes("--global");
    const isCi = args.includes("--ci");
    const isReport = args.includes("--report");

    console.log("🔍 Running permission audit...\n");

    const results = audit({ global: isGlobal });

    if (isReport) {
      console.log(generateReport(results));
    } else {
      const { issues } = results;
      const total = issues.critical.length + issues.high.length + issues.medium.length;

      if (total === 0) {
        console.log("✅ No security issues found!\n");
        console.log(`Scanned ${results.scanned} settings file(s)`);
      } else {
        console.log(`Found ${total} potential issue(s):\n`);

        if (issues.critical.length > 0) {
          console.log(`🔴 Critical: ${issues.critical.length}`);
          issues.critical.forEach(i => console.log(`   - ${i.desc}: ${i.permission}`));
        }

        if (issues.high.length > 0) {
          console.log(`🟠 High: ${issues.high.length}`);
          issues.high.forEach(i => console.log(`   - ${i.desc}: ${i.permission}`));
        }

        if (issues.medium.length > 0) {
          console.log(`🟡 Medium: ${issues.medium.length}`);
          issues.medium.forEach(i => console.log(`   - ${i.desc}: ${i.permission}`));
        }

        console.log("\nRun 'smc audit --report' for detailed analysis.");
      }
    }

    if (isCi && !passes(results)) {
      process.exit(1);
    }
  },
};

module.exports = commands;
