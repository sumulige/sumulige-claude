/**
 * Claude Code Adapter
 *
 * Platform adapter for Anthropic's Claude Code CLI.
 * Handles JSON configuration and CLAUDE.md instructions.
 */

const { BasePlatformAdapter } = require('./base-adapter');

class ClaudeAdapter extends BasePlatformAdapter {
  constructor() {
    super('claude');
  }

  getConfigPath() {
    return {
      global: '~/.claude/config.json',
      project: '.claude/settings.json'
    };
  }

  getInstructionFileName() {
    return ['CLAUDE.md', '.claude/CLAUDE.md'];
  }

  getConfigFormat() {
    return 'json';
  }

  getProjectDirName() {
    return '.claude';
  }

  parseConfig(content) {
    return JSON.parse(content);
  }

  stringifyConfig(config) {
    return JSON.stringify(config, null, 2);
  }

  /**
   * Get hook event mapping for Claude Code
   * @returns {Object}
   */
  getHookEventMapping() {
    return {
      SessionStart: 'SessionStart',
      SessionEnd: 'SessionEnd',
      PreToolUse: 'PreToolUse',
      PostToolUse: 'PostToolUse',
      UserPromptSubmit: 'UserPromptSubmit',
      AgentStop: 'AgentStop',
      PreCompact: 'PreCompact'
    };
  }

  /**
   * Format hooks configuration for Claude Code settings.json
   * @param {Array} hooks - Unified hook definitions
   * @returns {Object}
   */
  formatHookConfig(hooks) {
    const config = {};

    for (const hook of hooks) {
      const event = hook.event;
      if (!config[event]) {
        config[event] = [];
      }
      config[event].push({
        type: 'command',
        command: hook.command
      });
    }

    return config;
  }
}

module.exports = { ClaudeAdapter };
