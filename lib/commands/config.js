/**
 * Config Commands Module
 *
 * Extracted from lib/commands.js (lines 2224-2983)
 * Contains: config, config:validate, config:backup, config:rollback, config:diff commands
 */

const fs = require("fs");
const path = require("path");

// ============================================================================
// Commands
// ============================================================================

const commands = {
  config: (action, key, value) => {
    const { loadConfig, saveConfig, CONFIG_FILE } = require("../config");
    const COLORS = {
      reset: "\x1b[0m",
      green: "\x1b[32m",
      blue: "\x1b[34m",
      yellow: "\x1b[33m",
      gray: "\x1b[90m",
      red: "\x1b[31m",
    };

    const log = (msg, color = "reset") => {
      console.log(`${COLORS[color]}${msg}${COLORS.reset}`);
    };

    if (!action) {
      // Show current config
      const config = loadConfig();
      log("", "gray");
      log("⚙️  SMC Configuration", "blue");
      log("=====================================", "gray");
      log("", "gray");
      log(`File: ${CONFIG_FILE}`, "gray");
      log("", "gray");
      log(JSON.stringify(config, null, 2));
      log("", "gray");
      log("=====================================", "gray");
      log("", "gray");
      log("Commands:", "gray");
      log("  smc config get <key>     Get a config value", "gray");
      log("  smc config set <key> <value>  Set a config value", "gray");
      log("", "gray");
      return;
    }

    if (action === "get") {
      if (!key) {
        log("Usage: smc config get <key>", "yellow");
        return;
      }
      const config = loadConfig();
      const keys = key.split(".");
      let configValue = config;
      for (const k of keys) {
        configValue = configValue?.[k];
      }
      if (configValue !== undefined) {
        log(`${key}: ${JSON.stringify(configValue, null, 2)}`, "green");
      } else {
        log(`Key not found: ${key}`, "yellow");
      }
    } else if (action === "set") {
      if (!key || value === undefined) {
        log("Usage: smc config set <key> <value>", "yellow");
        return;
      }
      const config = loadConfig();
      const keys = key.split(".");
      let target = config;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!target[keys[i]]) target[keys[i]] = {};
        target = target[keys[i]];
      }
      // Parse value (try JSON, fallback to string)
      try {
        target[keys[keys.length - 1]] = JSON.parse(value);
      } catch {
        target[keys[keys.length - 1]] = value;
      }
      saveConfig(config);
      log(`✅ Set ${key} = ${target[keys[keys.length - 1]]}`, "green");
    } else {
      log(`Unknown action: ${action}`, "red");
      log("Valid actions: get, set", "gray");
    }
  },

  "config:validate": () => {
    const { ConfigValidator } = require("../config-validator");
    const validator = new ConfigValidator();

    console.log("🔍 Validating configuration...");
    console.log("");

    let hasErrors = false;
    let hasWarnings = false;

    // Check global config
    const globalConfigPath = path.join(
      process.env.HOME,
      ".claude",
      "config.json",
    );
    console.log(`Global: ${globalConfigPath}`);
    const globalResult = validator.validateFile(globalConfigPath);

    if (globalResult.valid) {
      console.log("  ✅ Valid");
    } else {
      if (globalResult.errors.length > 0) {
        hasErrors = true;
        console.log(`  ❌ ${globalResult.errors.length} error(s)`);
        globalResult.errors.forEach((e) => {
          console.log(`     [${e.severity}] ${e.path}: ${e.message}`);
        });
      }
      if (globalResult.warnings.length > 0) {
        hasWarnings = true;
        console.log(`  ⚠️  ${globalResult.warnings.length} warning(s)`);
        globalResult.warnings.forEach((e) => {
          console.log(`     [${e.severity}] ${e.path}: ${e.message}`);
        });
      }
      if (
        globalResult.errors.length === 0 &&
        globalResult.warnings.length === 0
      ) {
        console.log("  ❌ Validation failed");
      }
    }
    console.log("");

    // Check project config if in project
    const projectDir = process.cwd();
    const projectConfigPath = path.join(projectDir, ".claude", "settings.json");
    if (fs.existsSync(projectConfigPath)) {
      console.log(`Project: ${projectConfigPath}`);
      const projectResult = validator.validateFile(
        projectConfigPath,
        "settings",
      );
      if (projectResult.valid) {
        console.log("  ✅ Valid");
      } else {
        if (projectResult.errors.length > 0) {
          hasErrors = true;
          console.log(`  ❌ ${projectResult.errors.length} error(s)`);
          projectResult.errors.forEach((e) => {
            console.log(`     [${e.severity}] ${e.path}: ${e.message}`);
          });
        }
        if (projectResult.warnings.length > 0) {
          hasWarnings = true;
          console.log(`  ⚠️  ${projectResult.warnings.length} warning(s)`);
          projectResult.warnings.forEach((e) => {
            console.log(`     [${e.severity}] ${e.path}: ${e.message}`);
          });
        }
        if (
          projectResult.errors.length === 0 &&
          projectResult.warnings.length === 0
        ) {
          console.log("  ❌ Validation failed");
        }
      }
    }
    console.log("");

    if (hasErrors) {
      console.log("❌ Configuration validation failed");
      process.exit(1);
    } else if (hasWarnings) {
      console.log("⚠️  Configuration has warnings (but is valid)");
    } else {
      console.log("✅ All configurations are valid");
    }
  },

  "config:backup": () => {
    const { ConfigManager } = require("../config-manager");
    const manager = new ConfigManager();
    const backupPath = manager._createBackup();
    console.log("✅ Config backed up to:", backupPath);
  },

  "config:rollback": (version) => {
    const { ConfigManager } = require("../config-manager");
    const manager = new ConfigManager();

    const backups = manager.listBackups();
    if (backups.length === 0) {
      console.log("❌ No backups available");
      return;
    }

    if (!version) {
      console.log("Available backups:");
      backups.forEach((b, i) => {
        console.log(
          `  ${i + 1}. ${b.version} (${new Date(b.timestamp).toLocaleString()})`,
        );
      });
      console.log("");
      console.log("Usage: smc config:rollback <version>");
      return;
    }

    try {
      const result = manager.rollback(version);
      console.log("✅ Rolled back to:", result.restoredFrom);
    } catch (e) {
      console.log("❌", e.message);
    }
  },

  "config:diff": (file1, file2) => {
    const { ConfigManager } = require("../config-manager");
    const manager = new ConfigManager();

    if (!file1) {
      const backups = manager.listBackups();
      if (backups.length === 0) {
        console.log("❌ No backups available");
        return;
      }
      file1 = path.join(manager.backupDir, backups[0].file);
      file2 = null; // Current config
    }

    const changes = manager.diff(file1, file2);
    if (changes.length === 0) {
      console.log("✅ No differences found");
      return;
    }

    console.log("📊 Config Diff:");
    console.log("");
    for (const change of changes) {
      const icon = { added: "+", removed: "-", changed: "~" }[change.type];
      console.log(`  ${icon} ${change.path}`);
      if (change.type !== "removed") {
        console.log(`     from: ${JSON.stringify(change.from)}`);
      }
      if (change.type !== "added") {
        console.log(`     to:   ${JSON.stringify(change.to)}`);
      }
    }
  },
};

module.exports = commands;
