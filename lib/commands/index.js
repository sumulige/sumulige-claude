/**
 * Commands Index - Main entry point for all CLI commands
 *
 * This module aggregates all command modules and provides a unified interface.
 * It maintains backward compatibility with the original lib/commands.js API.
 */

// Import helpers (shared utilities)
const helpers = require("./helpers");

// Import command modules
const init = require("./init");
const sync = require("./sync");
const template = require("./template");
const skillsCore = require("./skills-core");
const skillsOfficial = require("./skills-official");
const skillsManage = require("./skills-manage");
const config = require("./config");
const qualityGate = require("./quality-gate");
const workflow = require("./workflow");
const misc = require("./misc");
const integrations = require("./integrations");
const platform = require("./platform");

// ============================================================================
// Merge all commands
// ============================================================================

const commands = {
  ...init,
  ...sync,
  ...template,
  ...skillsCore,
  ...skillsOfficial,
  ...skillsManage,
  ...config,
  ...qualityGate,
  ...workflow,
  ...misc,
  ...integrations,
  ...platform,
};

// Wire up init to use merged commands for testability
const originalInit = commands.init;
commands.init = function (...args) {
  const isInteractive = args.includes("--interactive") || args.includes("-i");
  if (isInteractive) {
    return commands["init:interactive"]();
  }
  return originalInit(...args);
};

// ============================================================================
// Command Runner
// ============================================================================

/**
 * Run a command by name
 * @param {string} cmd - Command name
 * @param {Array} args - Command arguments
 */
async function runCommand(cmd, args) {
  const command = commands[cmd];
  if (command) {
    await command(...(args || []));
  }
}

// ============================================================================
// Exports
// ============================================================================

module.exports = {
  // Main exports
  commands,
  runCommand,

  // Helper functions (for testing and external use)
  ...helpers,

  // Template utilities (for backward compatibility)
  copySingleFile: template.copySingleFile,
  setExecutablePermission: template.setExecutablePermission,
  TEMPLATE_DIR: template.TEMPLATE_DIR,
};
