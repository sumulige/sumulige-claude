/**
 * Zed Platform Adapter
 *
 * Platform adapter for Zed editor (Zed Industries).
 * Handles JSON configuration for AI assistant settings.
 */

const { BasePlatformAdapter } = require('../_base/adapter');
const { UnifiedInstruction } = require('../_base/unified-instruction');

const meta = {
  name: 'zed',
  displayName: 'Zed',
  vendor: 'Zed Industries',
  icon: '⚡',

  config: {
    format: 'json',
    paths: {
      project: '.zed/settings.json',
      global: '~/.config/zed/settings.json'
    }
  },

  instruction: {
    files: ['CLAUDE.md', '.zed/instructions.md'],
    format: 'markdown'
  }
};

class ZedAdapter extends BasePlatformAdapter {
  static meta = meta;

  constructor() {
    super('zed');
  }

  // Uses default JSON parseConfig/stringifyConfig

  parseToUnified(content) {
    const unified = UnifiedInstruction.fromMarkdown(content);
    unified.setMetadata('sourceFormat', 'zed');
    return unified;
  }

  serializeFromUnified(unified) {
    if (unified.getMetadata('sourceFormat') === 'zed') {
      return unified.getRawContent() || unified.toMarkdown();
    }
    return unified.toMarkdown();
  }

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

  getProviderMapping() {
    return {
      anthropic: 'anthropic',
      openai: 'openai',
      google: 'google',
      'zed.dev': 'zed.dev'
    };
  }
}

module.exports = {
  ZedAdapter,
  Adapter: ZedAdapter,
  meta,
  default: ZedAdapter
};
