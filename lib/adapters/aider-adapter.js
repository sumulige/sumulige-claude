/**
 * Aider Adapter
 *
 * Platform adapter for Aider CLI (aider.chat).
 * Handles YAML configuration and CONVENTIONS.md instructions.
 */

const { BasePlatformAdapter } = require('./base-adapter');
const yaml = require('yaml');

class AiderAdapter extends BasePlatformAdapter {
  constructor() {
    super('aider');
  }

  getConfigPath() {
    return {
      global: '~/.aider.conf.yml',
      project: '.aider.conf.yml'
    };
  }

  getInstructionFileName() {
    return ['CONVENTIONS.md', 'CLAUDE.md', '.aider/CONVENTIONS.md'];
  }

  getConfigFormat() {
    return 'yaml';
  }

  getProjectDirName() {
    // Aider doesn't use a dedicated project directory
    return null;
  }

  parseConfig(content) {
    return yaml.parse(content);
  }

  stringifyConfig(config) {
    return yaml.stringify(config);
  }

  /**
   * Override detectPlatform for Aider (no project dir)
   */
  detectPlatform(projectDir) {
    const fs = require('fs');
    const path = require('path');

    const configPath = this.getConfigPath();
    const projectConfig = path.join(projectDir, configPath.project);

    if (fs.existsSync(projectConfig)) {
      return { detected: true, configPath: projectConfig };
    }

    // Check for instruction files
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
   * Get default Aider configuration
   * @returns {Object}
   */
  getDefaultConfig() {
    return {
      model: 'claude-3-5-sonnet-20241022',
      'auto-commits': false,
      'dirty-commits': false,
      read: ['CONVENTIONS.md']
    };
  }
}

module.exports = { AiderAdapter };
