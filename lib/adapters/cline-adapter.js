/**
 * Cline/Roo Adapter
 *
 * Platform adapter for Cline/Roo VS Code extension.
 * Handles .clinerules markdown instructions.
 */

const { BasePlatformAdapter } = require('./base-adapter');

class ClineAdapter extends BasePlatformAdapter {
  constructor() {
    super('cline');
  }

  getConfigPath() {
    return {
      global: null,  // VS Code settings.json
      project: '.clinerules'
    };
  }

  getInstructionFileName() {
    return ['.clinerules', 'CLAUDE.md', '.cline/rules.md'];
  }

  getConfigFormat() {
    return 'markdown';
  }

  getProjectDirName() {
    // Cline doesn't use a dedicated project directory
    return null;
  }

  parseConfig(content) {
    return { instructions: content };
  }

  stringifyConfig(config) {
    return config.instructions || '';
  }

  /**
   * Override detectPlatform for Cline (no project dir)
   */
  detectPlatform(projectDir) {
    const fs = require('fs');
    const path = require('path');

    const configPath = this.getConfigPath();
    const projectConfig = path.join(projectDir, configPath.project);

    if (fs.existsSync(projectConfig)) {
      return { detected: true, configPath: projectConfig };
    }

    return { detected: false, configPath: null };
  }

  /**
   * Get default Cline configuration
   * @returns {Object}
   */
  getDefaultConfig() {
    return {
      instructions: ''
    };
  }
}

module.exports = { ClineAdapter };
