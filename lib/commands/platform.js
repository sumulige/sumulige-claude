/**
 * Platform Commands - Multi-platform AI CLI support
 *
 * Commands for managing multi-platform AI coding assistant configurations.
 * Uses the new PlatformRegistry architecture for automatic discovery.
 */

const fs = require("fs");
const path = require("path");
const {
  registry,
  getAdapter,
  getSupportedPlatforms,
  detectPlatforms,
  convertInstructions
} = require("../platforms/_base");
const { COLORS, log } = require("./helpers");

const commands = {
  // -------------------------------------------------------------------------
  // platform:detect - Detect configured platforms in project
  // -------------------------------------------------------------------------
  "platform:detect": () => {
    const projectDir = process.cwd();

    log("", "gray");
    log("🔍 Platform Detection", "blue");
    log("=====================================", "gray");
    log("", "gray");

    const detected = detectPlatforms(projectDir);

    if (detected.length === 0) {
      log("No AI CLI platforms detected in this project.", "yellow");
      log("", "gray");
      log("To initialize:", "gray");
      log("  smc template           # Claude Code", "gray");
      log("  smc template --codex   # Codex CLI", "gray");
      log("  smc template --all     # Both platforms", "gray");
      return;
    }

    log(`Detected ${detected.length} platform(s):`, "green");
    log("", "gray");

    for (const { platform, configPath } of detected) {
      const adapter = getAdapter(platform);
      const meta = adapter.constructor.meta;
      const icon = meta?.icon || "📦";

      log(`  ${icon} ${meta?.displayName || platform} (${platform})`, "cyan");
      log(`     Config: ${configPath}`, "gray");

      // Try to load and show basic info
      const config = adapter.loadConfig(projectDir);
      if (config) {
        if (platform === "codex" && config.model) {
          log(`     Model: ${config.model}`, "gray");
        }
        if (platform === "codex" && config.sandbox_mode) {
          log(`     Sandbox: ${config.sandbox_mode}`, "gray");
        }
      }

      const instructions = adapter.loadInstructions(projectDir);
      if (instructions) {
        log(`     Instructions: ${instructions.path}`, "gray");
      }

      log("", "gray");
    }

    log("=====================================", "gray");
    log("", "gray");
  },

  // -------------------------------------------------------------------------
  // platform:list - List supported platforms (from registry)
  // -------------------------------------------------------------------------
  "platform:list": () => {
    log("", "gray");
    log("📋 Supported Platforms", "blue");
    log("=====================================", "gray");
    log("", "gray");

    // Get platform info directly from registry
    const platformMetas = registry.listWithMeta();

    for (const meta of platformMetas) {
      const icon = meta.icon || "📦";
      const configDir = meta.config?.paths?.project
        ? path.dirname(meta.config.paths.project) + "/"
        : "(project root)";

      log(`${icon} ${meta.displayName} (${meta.name})`, "cyan");
      log(`   Vendor: ${meta.vendor}`, "gray");
      log(`   Config: ${configDir} (${meta.config?.format || "unknown"})`, "gray");
      log(`   Instructions: ${meta.instruction?.files?.[0] || "N/A"}`, "gray");
      log("", "gray");
    }

    log("=====================================", "gray");
    log("", "gray");
  },

  // -------------------------------------------------------------------------
  // platform:convert - Convert between platform configurations
  // -------------------------------------------------------------------------
  "platform:convert": (...args) => {
    const [from, to, ...options] = args;
    const dryRun = options.includes("--dry-run");
    const projectDir = process.cwd();

    // Validate arguments
    if (!from || !to) {
      log("", "gray");
      log("❌ Usage: smc platform:convert <from> <to> [--dry-run]", "red");
      log("", "gray");
      log("Examples:", "gray");
      log("  smc platform:convert claude codex", "gray");
      log("  smc platform:convert codex claude", "gray");
      log("  smc platform:convert claude cursor --dry-run", "gray");
      log("", "gray");
      return;
    }

    const supported = getSupportedPlatforms();
    if (!supported.includes(from)) {
      log(`❌ Unknown source platform: ${from}`, "red");
      log(`   Supported: ${supported.join(", ")}`, "gray");
      return;
    }
    if (!supported.includes(to)) {
      log(`❌ Unknown target platform: ${to}`, "red");
      log(`   Supported: ${supported.join(", ")}`, "gray");
      return;
    }

    log("", "gray");
    log(`🔄 Converting: ${from} → ${to}`, "blue");
    if (dryRun) {
      log("   (dry run - no files will be written)", "yellow");
    }
    log("=====================================", "gray");
    log("", "gray");

    const fromAdapter = getAdapter(from);
    const toAdapter = getAdapter(to);

    // Convert configuration
    const fromConfig = fromAdapter.loadConfig(projectDir);
    if (fromConfig) {
      log("📄 Converting configuration...", "cyan");

      // Use adapter's config conversion (via default config as baseline)
      const toConfig = toAdapter.getDefaultConfig();

      // Copy relevant fields where possible
      if (fromConfig.model && toConfig.model !== undefined) {
        toConfig.model = fromConfig.model;
      }

      if (dryRun) {
        log("   Preview:", "gray");
        const content = toAdapter.stringifyConfig(toConfig);
        console.log(content.split("\n").map(l => "   " + l).join("\n"));
      } else {
        const result = toAdapter.saveConfig(projectDir, toConfig);
        log(`   ✅ Written: ${result.path}`, "green");
      }
    } else {
      log(`⚠️  No ${from} configuration found`, "yellow");
    }

    log("", "gray");

    // Convert instruction file using unified format
    const fromInstructions = fromAdapter.loadInstructions(projectDir);
    if (fromInstructions) {
      log("📝 Converting instructions...", "cyan");

      // Use the new unified conversion
      const toContent = convertInstructions(fromInstructions.content, from, to);

      if (toContent) {
        if (dryRun) {
          log("   Preview (first 500 chars):", "gray");
          console.log(toContent.slice(0, 500).split("\n").map(l => "   " + l).join("\n"));
          if (toContent.length > 500) {
            log("   ... (truncated)", "gray");
          }
        } else {
          const result = toAdapter.saveInstructions(projectDir, toContent);
          log(`   ✅ Written: ${result.path}`, "green");
        }
      } else {
        log(`⚠️  Conversion failed: ${from} → ${to}`, "yellow");
      }
    } else {
      log(`⚠️  No ${from} instruction file found`, "yellow");
    }

    log("", "gray");
    log("=====================================", "gray");

    if (!dryRun) {
      log("", "gray");
      log("✅ Conversion complete!", "green");
      log("", "gray");

      const toMeta = toAdapter.constructor.meta;
      log("Next steps:", "gray");
      log(`  1. Review ${toMeta?.config?.paths?.project || "config file"}`, "gray");
      log(`  2. Review ${toMeta?.instruction?.files?.[0] || "instruction file"}`, "gray");
      log(`  3. Run your ${toMeta?.displayName || to} CLI`, "gray");
      log("", "gray");
    }
  },

  // -------------------------------------------------------------------------
  // platform:sync - Sync configuration to all platforms
  // -------------------------------------------------------------------------
  "platform:sync": (...args) => {
    const projectDir = process.cwd();

    // Parse --platforms option
    let targetPlatforms = getSupportedPlatforms();
    const platformsIndex = args.indexOf("--platforms");
    if (platformsIndex !== -1 && args[platformsIndex + 1]) {
      targetPlatforms = args[platformsIndex + 1].split(",").map(p => p.trim());
    }

    log("", "gray");
    log("🔄 Platform Sync", "blue");
    log("=====================================", "gray");
    log("", "gray");

    // Detect primary platform (the one with config)
    const detected = detectPlatforms(projectDir);
    if (detected.length === 0) {
      log("❌ No platform configuration found.", "red");
      log("", "gray");
      log("Initialize first:", "gray");
      log("  smc template           # Claude Code", "gray");
      log("  smc template --codex   # Codex CLI", "gray");
      return;
    }

    // Use first detected as source
    const sourcePlatform = detected[0].platform;
    log(`Source platform: ${sourcePlatform}`, "cyan");
    log(`Target platforms: ${targetPlatforms.join(", ")}`, "cyan");
    log("", "gray");

    // Sync to other platforms
    for (const target of targetPlatforms) {
      if (target === sourcePlatform) {
        log(`⊝ Skipping ${target} (source)`, "gray");
        continue;
      }

      log(`→ Syncing to ${target}...`, "cyan");

      // Run conversion
      commands["platform:convert"](sourcePlatform, target);
    }

    log("", "gray");
    log("✅ Sync complete!", "green");
    log("", "gray");
  }
};

module.exports = commands;
