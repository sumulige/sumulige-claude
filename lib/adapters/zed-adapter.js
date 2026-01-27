/**
 * Zed Adapter
 *
 * Platform adapter for Zed editor (Zed Industries).
 * Handles JSON configuration for AI assistant settings.
 */

const { BasePlatformAdapter } = require('./base-adapter');

class ZedAdapter extends BasePlatformAdapter {
  constructor() {
    super('zed');
  }

  getConfigPath() {
    return {
      global: '~/.config/zed/settings.json',
      project: '.zed/settings.json'
    };
  }

  getInstructionFileName() {
    // Zed embeds instructions in settings
    return ['CLAUDE.md', '.zed/instructions.md'];
  }

  getConfigFormat() {
    return 'json';
  }

  getProjectDirName() {
    return '.zed';
  }

  parseConfig(content) {
    return JSON.parse(content);
  }

  stringifyConfig(config) {
    return JSON.stringify(config, null, 2);
  }

  /**
   * Get default Zed configuration
   * @returns {Object}
   */
  getDefaultConfig() {
    return {
      agent: {
        default_model: {
          provider: 'anthropic',
          model: 'claude-sonnet-4'
        },
        notify_when_agent_waiting: true,
        play_sound_when_agent_done: false,
        message_editor_min_lines: 4,
        expand_edit_card: true,
        always_allow_tool_actions: false
      }
    };
  }

  /**
   * Get provider mapping
   * @returns {Object}
   */
  getProviderMapping() {
    return {
      anthropic: 'anthropic',
      openai: 'openai',
      google: 'google',
      'zed.dev': 'zed.dev'
    };
  }
}

module.exports = { ZedAdapter };
