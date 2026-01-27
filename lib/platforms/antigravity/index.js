/**
 * Antigravity Platform Adapter
 *
 * Platform adapter for Google Antigravity IDE.
 * Handles Markdown rules in .agent/rules/ directory.
 */

const { BasePlatformAdapter } = require('../_base/adapter');
const { UnifiedInstruction } = require('../_base/unified-instruction');

const meta = {
  name: 'antigravity',
  displayName: 'Antigravity',
  vendor: 'Google',
  icon: '🚀',

  config: {
    format: 'json',
    paths: {
      project: '.agent/settings.json',
      global: '~/.gemini/antigravity/settings.json'
    }
  },

  instruction: {
    files: ['.agent/rules/main.md', '.agent/rules/rules.md', 'CLAUDE.md'],
    format: 'markdown'
  }
};

class AntigravityAdapter extends BasePlatformAdapter {
  static meta = meta;

  constructor() {
    super('antigravity');
  }

  parseConfig(content) {
    // Antigravity uses JSON for settings
    try {
      return JSON.parse(content);
    } catch (e) {
      // If content is markdown (rules file), wrap it
      return { instructions: content };
    }
  }

  stringifyConfig(config) {
    if (typeof config === 'string') {
      return config;
    }
    if (config.instructions && Object.keys(config).length === 1) {
      return config.instructions;
    }
    return JSON.stringify(config, null, 2);
  }

  parseToUnified(content) {
    // Handle both JSON settings and Markdown rules
    let markdown = content;
    if (content.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(content);
        markdown = parsed.instructions || '';
      } catch (e) {
        // Not valid JSON, treat as markdown
      }
    }

    const unified = UnifiedInstruction.fromMarkdown(markdown);
    unified.setMetadata('sourceFormat', 'antigravity');
    return unified;
  }

  serializeFromUnified(unified) {
    // Use raw content if source was Antigravity
    if (unified.getMetadata('sourceFormat') === 'antigravity') {
      return unified.getRawContent() || unified.toMarkdown();
    }
    return unified.toMarkdown();
  }

  getDefaultConfig() {
    return {
      instructions: ''
    };
  }
}

module.exports = {
  AntigravityAdapter,
  Adapter: AntigravityAdapter,
  meta,
  default: AntigravityAdapter
};
