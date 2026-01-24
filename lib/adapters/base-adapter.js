/**
 * Base Platform Adapter
 *
 * Abstract base class for AI CLI platform adapters.
 * Provides common interface for Claude Code, Codex CLI, and future platforms.
 */

const fs = require('fs');
const path = require('path');

class BasePlatformAdapter {
  constructor(platform) {
    this.platform = platform;
  }

  /**
   * Get configuration file paths
   * @returns {{ global: string, project: string }}
   */
  getConfigPath() {
    throw new Error('Not implemented: getConfigPath');
  }

  /**
   * Get instruction file names (priority order)
   * @returns {string[]}
   */
  getInstructionFileName() {
    throw new Error('Not implemented: getInstructionFileName');
  }

  /**
   * Get configuration file format
   * @returns {'json' | 'toml'}
   */
  getConfigFormat() {
    throw new Error('Not implemented: getConfigFormat');
  }

  /**
   * Get project directory name
   * @returns {string}
   */
  getProjectDirName() {
    throw new Error('Not implemented: getProjectDirName');
  }

  /**
   * Parse configuration content
   * @param {string} content - Raw config content
   * @returns {Object}
   */
  parseConfig(content) {
    throw new Error('Not implemented: parseConfig');
  }

  /**
   * Stringify configuration object
   * @param {Object} config - Config object
   * @returns {string}
   */
  stringifyConfig(config) {
    throw new Error('Not implemented: stringifyConfig');
  }

  /**
   * Detect if this platform is configured in project
   * @param {string} projectDir - Project directory
   * @returns {{ detected: boolean, configPath: string | null }}
   */
  detectPlatform(projectDir) {
    const configPath = this.getConfigPath();
    const projectConfig = path.join(projectDir, configPath.project);
    const projectDirPath = path.join(projectDir, this.getProjectDirName());

    if (fs.existsSync(projectConfig)) {
      return { detected: true, configPath: projectConfig };
    }

    if (fs.existsSync(projectDirPath)) {
      return { detected: true, configPath: projectDirPath };
    }

    // Check for instruction file
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
   * @returns {Object | null}
   */
  loadConfig(projectDir) {
    const configPath = this.getConfigPath();
    const projectConfig = path.join(projectDir, configPath.project);

    if (!fs.existsSync(projectConfig)) {
      return null;
    }

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
    const configPath = this.getConfigPath();
    const projectConfig = path.join(projectDir, configPath.project);
    const projectDirPath = path.dirname(projectConfig);

    // Ensure directory exists
    if (!fs.existsSync(projectDirPath)) {
      fs.mkdirSync(projectDirPath, { recursive: true });
    }

    const content = this.stringifyConfig(config);
    fs.writeFileSync(projectConfig, content);

    return { success: true, path: projectConfig };
  }

  /**
   * Load instruction file from project
   * @param {string} projectDir - Project directory
   * @returns {{ content: string, path: string } | null}
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
    const filePath = path.join(projectDir, targetFile);

    fs.writeFileSync(filePath, content);
    return { success: true, path: filePath };
  }
}

module.exports = { BasePlatformAdapter };
