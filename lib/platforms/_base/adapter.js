/**
 * Base Platform Adapter (Refactored)
 *
 * Abstract base class for AI CLI platform adapters.
 * Key improvements:
 * - Static metadata declaration (replaces platform.js platformInfo)
 * - Unified instruction format support (parseToUnified/serializeFromUnified)
 * - Self-contained: each platform directory has all logic
 */

const fs = require('fs');
const path = require('path');
const { UnifiedInstruction } = require('./unified-instruction');

class BasePlatformAdapter {
  /**
   * Static metadata - override in subclass
   * @type {Object}
   */
  static meta = {
    name: 'base',
    displayName: 'Base Platform',
    vendor: 'Unknown',
    icon: '📦',
    config: {
      format: 'json',
      paths: { project: null, global: null }
    },
    instruction: {
      files: [],
      format: 'markdown'
    }
  };

  constructor(platform) {
    this.platform = platform || this.constructor.meta.name;
  }

  // ===========================================================================
  // Metadata accessors (from static meta)
  // ===========================================================================

  /**
   * Get platform metadata
   * @returns {Object}
   */
  getMeta() {
    return this.constructor.meta;
  }

  /**
   * Get configuration file paths
   * @returns {{ global: string|null, project: string|null }}
   */
  getConfigPath() {
    return this.constructor.meta.config.paths;
  }

  /**
   * Get instruction file names (priority order)
   * @returns {string[]}
   */
  getInstructionFileName() {
    return this.constructor.meta.instruction.files;
  }

  /**
   * Get configuration file format
   * @returns {string}
   */
  getConfigFormat() {
    return this.constructor.meta.config.format;
  }

  /**
   * Get project directory name
   * @returns {string|null}
   */
  getProjectDirName() {
    const projectPath = this.constructor.meta.config.paths.project;
    if (!projectPath) return null;

    // Extract directory from path like ".claude/settings.json" -> ".claude"
    const dir = path.dirname(projectPath);
    return dir === '.' ? null : dir;
  }

  // ===========================================================================
  // Config parsing (override in subclass)
  // ===========================================================================

  /**
   * Parse configuration content
   * @param {string} content - Raw config content
   * @returns {Object}
   */
  parseConfig(content) {
    // Default: JSON
    return JSON.parse(content);
  }

  /**
   * Stringify configuration object
   * @param {Object} config - Config object
   * @returns {string}
   */
  stringifyConfig(config) {
    // Default: JSON
    return JSON.stringify(config, null, 2);
  }

  // ===========================================================================
  // Unified instruction support (override in subclass)
  // ===========================================================================

  /**
   * Parse instruction content to unified format
   * @param {string} content - Raw instruction content
   * @returns {UnifiedInstruction}
   */
  parseToUnified(content) {
    // Default: Markdown parsing
    return UnifiedInstruction.fromMarkdown(content);
  }

  /**
   * Serialize unified instruction to platform format
   * @param {UnifiedInstruction} unified - Unified instruction
   * @returns {string}
   */
  serializeFromUnified(unified) {
    // Default: Markdown output
    return unified.toMarkdown();
  }

  // ===========================================================================
  // Detection and loading (common implementation)
  // ===========================================================================

  /**
   * Detect if this platform is configured in project
   * @param {string} projectDir - Project directory
   * @returns {{ detected: boolean, configPath: string|null }}
   */
  detectPlatform(projectDir) {
    const configPaths = this.getConfigPath();

    // Check project config file
    if (configPaths.project) {
      const projectConfig = path.join(projectDir, configPaths.project);
      if (fs.existsSync(projectConfig)) {
        return { detected: true, configPath: projectConfig };
      }
    }

    // Check project directory
    const projectDirName = this.getProjectDirName();
    if (projectDirName) {
      const projectDirPath = path.join(projectDir, projectDirName);
      if (fs.existsSync(projectDirPath)) {
        return { detected: true, configPath: projectDirPath };
      }
    }

    // Check instruction files
    const instructionFiles = this.getInstructionFileName();
    for (const fileName of instructionFiles) {
      const filePath = path.join(projectDir, fileName);
      if (fs.existsSync(filePath)) {
        return { detected: true, configPath: filePath };
      }
    }

    return { detected: false, configPath: null };
  }

  /**
   * Load configuration from project
   * @param {string} projectDir - Project directory
   * @returns {Object|null}
   */
  loadConfig(projectDir) {
    const configPaths = this.getConfigPath();
    if (!configPaths.project) return null;

    const projectConfig = path.join(projectDir, configPaths.project);
    if (!fs.existsSync(projectConfig)) return null;

    try {
      const content = fs.readFileSync(projectConfig, 'utf-8');
      return this.parseConfig(content);
    } catch (e) {
      console.warn(`Failed to parse ${this.platform} config:`, e.message);
      return null;
    }
  }

  /**
   * Save configuration to project
   * @param {string} projectDir - Project directory
   * @param {Object} config - Config object
   * @returns {{ success: boolean, path: string }}
   */
  saveConfig(projectDir, config) {
    const configPaths = this.getConfigPath();
    if (!configPaths.project) {
      throw new Error(`${this.platform} does not support project config`);
    }

    const projectConfig = path.join(projectDir, configPaths.project);
    const projectDirPath = path.dirname(projectConfig);

    // Ensure directory exists
    if (projectDirPath !== '.' && !fs.existsSync(projectDirPath)) {
      fs.mkdirSync(projectDirPath, { recursive: true });
    }

    const content = this.stringifyConfig(config);
    fs.writeFileSync(projectConfig, content);

    return { success: true, path: projectConfig };
  }

  /**
   * Load instruction file from project
   * @param {string} projectDir - Project directory
   * @returns {{ content: string, path: string }|null}
   */
  loadInstructions(projectDir) {
    const instructionFiles = this.getInstructionFileName();

    for (const fileName of instructionFiles) {
      const filePath = path.join(projectDir, fileName);
      if (fs.existsSync(filePath)) {
        return {
          content: fs.readFileSync(filePath, 'utf-8'),
          path: filePath
        };
      }
    }

    return null;
  }

  /**
   * Save instruction file to project
   * @param {string} projectDir - Project directory
   * @param {string} content - Instruction content
   * @param {string} [fileName] - Optional specific file name
   * @returns {{ success: boolean, path: string }}
   */
  saveInstructions(projectDir, content, fileName) {
    const targetFile = fileName || this.getInstructionFileName()[0];
    if (!targetFile) {
      throw new Error(`${this.platform} does not support instruction files`);
    }

    const filePath = path.join(projectDir, targetFile);
    const dirPath = path.dirname(filePath);

    // Ensure directory exists
    if (dirPath !== '.' && !fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    fs.writeFileSync(filePath, content);
    return { success: true, path: filePath };
  }

  // ===========================================================================
  // Conversion helpers
  // ===========================================================================

  /**
   * Convert instruction from this platform to another
   * @param {string} content - Source instruction content
   * @param {BasePlatformAdapter} targetAdapter - Target platform adapter
   * @returns {string}
   */
  convertInstructionTo(content, targetAdapter) {
    const unified = this.parseToUnified(content);
    return targetAdapter.serializeFromUnified(unified);
  }
}

module.exports = { BasePlatformAdapter };
