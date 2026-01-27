/**
 * OpenCode Adapter
 *
 * Platform adapter for OpenCode CLI (opencode.ai).
 * Handles JSON/JSONC configuration with multi-provider support.
 */

const { BasePlatformAdapter } = require('./base-adapter');

class OpenCodeAdapter extends BasePlatformAdapter {
  constructor() {
    super('opencode');
  }

  getConfigPath() {
    return {
      global: '~/.config/opencode/opencode.json',
      project: 'opencode.json'
    };
  }

  getInstructionFileName() {
    // OpenCode uses instructions array in config, but can reference CLAUDE.md
    return ['CLAUDE.md', '.opencode/INSTRUCTIONS.md'];
  }

  getConfigFormat() {
    return 'json';
  }

  getProjectDirName() {
    return '.opencode';
  }

  parseConfig(content) {
    // Support JSONC (JSON with Comments)
    const stripped = content
      .replace(/\/\/.*$/gm, '')  // Remove single-line comments
      .replace(/\/\*[\s\S]*?\*\//g, '');  // Remove multi-line comments
    return JSON.parse(stripped);
  }

  stringifyConfig(config) {
    return JSON.stringify(config, null, 2);
  }

  /**
   * Get default OpenCode configuration
   * @returns {Object}
   */
  getDefaultConfig() {
    return {
      '$schema': 'https://opencode.ai/config.json',
      model: 'anthropic/claude-sonnet-4-20250514',
      instructions: ['CLAUDE.md'],
      tools: {
        bash: true,
        edit: true,
        write: true
      },
      permission: {
        bash: 'ask',
        edit: 'allow',
        write: 'allow'
      }
    };
  }

  /**
   * Get permission mapping
   * @returns {Object}
   */
  getPermissionMapping() {
    return {
      ask: 'ask',
      allow: 'allow',
      deny: 'deny'
    };
  }
}

module.exports = { OpenCodeAdapter };
