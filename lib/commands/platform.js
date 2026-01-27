/**
 * Platform Commands - Multi-platform AI CLI support
 *
 * Commands for managing Claude Code and Codex CLI configurations.
 */

const fs = require("fs");
const path = require("path");
const { getAdapter, getSupportedPlatforms, detectPlatforms } = require("../adapters");
const { ConfigConverter } = require("../converters/config-converter");
const { InstructionConverter } = require("../converters/instruction-converter");
const { COLORS, log } = require("./helpers");

const configConverter = new ConfigConverter();
const instructionConverter = new InstructionConverter();

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

    // Platform icons mapping
    const platformIcons = {
      claude: "🤖", codex: "🦊", opencode: "⚡", aider: "🔧",
      cursor: "📝", cline: "🤝", trae: "🎯", zed: "⚡"
    };

    for (const { platform, configPath } of detected) {
      const icon = platformIcons[platform] || "📦";
      log(`  ${icon} ${platform}`, "cyan");
      log(`     Config: ${configPath}`, "gray");

      // Try to load and show basic info
      const adapter = getAdapter(platform);
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
  // platform:list - List supported platforms
  // -------------------------------------------------------------------------
  "platform:list": () => {
    log("", "gray");
    log("📋 Supported Platforms", "blue");
    log("=====================================", "gray");
    log("", "gray");

    const platforms = getSupportedPlatforms();

    const platformInfo = {
      claude: {
        name: "Claude Code",
        vendor: "Anthropic",
        configFormat: "JSON",
        configDir: ".claude/",
        instructionFile: "CLAUDE.md",
        icon: "🤖"
      },
      codex: {
        name: "Codex CLI",
        vendor: "OpenAI",
        configFormat: "TOML",
        configDir: ".codex/",
        instructionFile: "AGENTS.md",
        icon: "🦊"
      },
      opencode: {
        name: "OpenCode",
        vendor: "opencode.ai",
        configFormat: "JSON/JSONC",
        configDir: ".opencode/",
        instructionFile: "instructions array",
        icon: "⚡"
      },
      aider: {
        name: "Aider",
        vendor: "aider.chat",
        configFormat: "YAML",
        configDir: "(project root)",
        instructionFile: "CONVENTIONS.md",
        icon: "🔧"
      },
      cursor: {
        name: "Cursor",
        vendor: "cursor.com",
        configFormat: "MDC/Markdown",
        configDir: ".cursor/",
        instructionFile: ".cursorrules",
        icon: "📝"
      },
      cline: {
        name: "Cline/Roo",
        vendor: "VS Code Extension",
        configFormat: "Markdown",
        configDir: "(project root)",
        instructionFile: ".clinerules",
        icon: "🤝"
      },
      trae: {
        name: "Trae",
        vendor: "ByteDance",
        configFormat: "YAML",
        configDir: ".trae/",
        instructionFile: "agents config",
        icon: "🎯"
      },
      zed: {
        name: "Zed",
        vendor: "Zed Industries",
        configFormat: "JSON",
        configDir: ".zed/",
        instructionFile: "embedded in settings",
        icon: "⚡"
      }
    };

    for (const platform of platforms) {
      const info = platformInfo[platform];
      if (!info) continue; // Skip unknown platforms
      const icon = info.icon || "📦";

      log(`${icon} ${info.name} (${platform})`, "cyan");
      log(`   Vendor: ${info.vendor}`, "gray");
      log(`   Config: ${info.configDir} (${info.configFormat})`, "gray");
      log(`   Instructions: ${info.instructionFile}`, "gray");
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
      log("  smc platform:convert claude codex --dry-run", "gray");
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

      // Platform-aware conversion
      const converterMap = {
        claude: { from: 'fromClaude', to: 'toClaude', stringify: 'stringifyClaude' },
        codex: { from: 'fromCodex', to: 'toCodex', stringify: 'stringifyCodex' },
        opencode: { from: 'fromOpenCode', to: 'toOpenCode', stringify: 'stringifyClaude' },
        aider: { from: 'fromAider', to: 'toAider', stringify: 'stringifyAider' },
        cursor: { from: 'fromCursor', to: 'toCursor', stringify: null }, // Returns string
        cline: { from: 'fromCline', to: 'toCline', stringify: null },
        trae: { from: 'fromTrae', to: 'toTrae', stringify: 'stringifyTrae' },
        zed: { from: 'fromZed', to: 'toZed', stringify: 'stringifyZed' }
      };

      const fromConverter = converterMap[from];
      const toConverter = converterMap[to];

      let unified = configConverter[fromConverter.from](fromConfig);
      let toConfig = configConverter[toConverter.to](unified);

      if (dryRun) {
        log("   Preview:", "gray");
        let content;
        if (typeof toConfig === 'string') {
          content = toConfig;
        } else if (toConverter.stringify) {
          content = configConverter[toConverter.stringify](toConfig);
        } else {
          content = JSON.stringify(toConfig, null, 2);
        }
        console.log(content.split("\n").map(l => "   " + l).join("\n"));
      } else {
        const result = toAdapter.saveConfig(projectDir, toConfig);
        log(`   ✅ Written: ${result.path}`, "green");
      }
    } else {
      log(`⚠️  No ${from} configuration found`, "yellow");
    }

    log("", "gray");

    // Convert instruction file
    const fromInstructions = fromAdapter.loadInstructions(projectDir);
    if (fromInstructions) {
      log("📝 Converting instructions...", "cyan");

      const projectName = path.basename(projectDir);

      // Use universal convert method
      const toContent = instructionConverter.convert(
        fromInstructions.content,
        from,
        to,
        { projectName }
      );

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
        log(`⚠️  Conversion not supported: ${from} → ${to}`, "yellow");
      }
    } else {
      log(`⚠️  No ${from} instruction file found`, "yellow");

      // Generate from scratch if converting to codex
      if (to === "codex" && !dryRun) {
        log("   Generating AGENTS.md from project...", "cyan");
        const content = instructionConverter.generateAgentsMd(projectDir, {
          projectName: path.basename(projectDir)
        });
        const result = toAdapter.saveInstructions(projectDir, content);
        log(`   ✅ Generated: ${result.path}`, "green");
      }
    }

    log("", "gray");
    log("=====================================", "gray");

    if (!dryRun) {
      log("", "gray");
      log("✅ Conversion complete!", "green");
      log("", "gray");
      log("Next steps:", "gray");
      if (to === "codex") {
        log("  1. Review .codex/config.toml", "gray");
        log("  2. Review AGENTS.md", "gray");
        log("  3. Run: codex", "gray");
      } else {
        log("  1. Review .claude/settings.json", "gray");
        log("  2. Review CLAUDE.md", "gray");
        log("  3. Run: claude", "gray");
      }
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
