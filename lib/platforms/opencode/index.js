/**
 * OpenCode Platform Adapter
 *
 * Platform adapter for OpenCode CLI.
 * Handles JSON/JSONC configuration.
 */

const { BasePlatformAdapter } = require('../_base/adapter');
const { UnifiedInstruction } = require('../_base/unified-instruction');

const meta = {
  name: 'opencode',
  displayName: 'OpenCode',
  vendor: 'opencode.ai',
  icon: '⚡',

  config: {
    format: 'json',
    paths: {
      project: 'opencode.json',
      global: '~/.config/opencode/opencode.json'
    }
  },

  instruction: {
    files: ['CLAUDE.md', '.opencode/INSTRUCTIONS.md'],
    format: 'markdown'
  }
};

class OpenCodeAdapter extends BasePlatformAdapter {
  static meta = meta;

  constructor() {
    super('opencode');
  }

  parseConfig(content) {
    // Support JSONC (JSON with comments)
    const stripped = content
      .replace(/\/\/.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '');
    return JSON.parse(stripped);
  }

  stringifyConfig(config) {
    return JSON.stringify(config, null, 2);
  }

  parseToUnified(content) {
    const unified = UnifiedInstruction.fromMarkdown(content);
    unified.setMetadata('sourceFormat', 'opencode');
    return unified;
  }

  serializeFromUnified(unified) {
    if (unified.getMetadata('sourceFormat') === 'opencode') {
      return unified.getRawContent() || unified.toMarkdown();
    }
    return unified.toMarkdown();
  }

  getDefaultConfig() {
    return {
      model: {
        id: 'claude-sonnet-4-20250514',
        provider: 'anthropic'
      },
      instructions: ['CLAUDE.md'],
      mcpServers: {}
    };
  }
}

module.exports = {
  OpenCodeAdapter,
  Adapter: OpenCodeAdapter,
  meta,
  default: OpenCodeAdapter
};
