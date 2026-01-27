/**
 * Windsurf Platform Adapter
 *
 * Platform adapter for Windsurf IDE (Codeium).
 * Handles Markdown format (.windsurfrules or .windsurf/rules/rules.md).
 */

const { BasePlatformAdapter } = require('../_base/adapter');
const { UnifiedInstruction } = require('../_base/unified-instruction');

const meta = {
  name: 'windsurf',
  displayName: 'Windsurf',
  vendor: 'Codeium',
  icon: '🏄',

  config: {
    format: 'markdown',
    paths: {
      project: '.windsurf/rules/rules.md',
      global: '~/.windsurf/global_rules.md'
    }
  },

  instruction: {
    files: ['.windsurfrules', '.windsurf/rules/rules.md', 'CLAUDE.md'],
    format: 'markdown'
  }
};

class WindsurfAdapter extends BasePlatformAdapter {
  static meta = meta;

  constructor() {
    super('windsurf');
  }

  parseConfig(content) {
    // Windsurf uses plain markdown
    return {
      instructions: content
    };
  }

  stringifyConfig(config) {
    return config.instructions || '';
  }

  parseToUnified(content) {
    const unified = UnifiedInstruction.fromMarkdown(content);
    unified.setMetadata('sourceFormat', 'windsurf');
    return unified;
  }

  serializeFromUnified(unified) {
    // Use raw content if source was Windsurf
    if (unified.getMetadata('sourceFormat') === 'windsurf') {
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
  WindsurfAdapter,
  Adapter: WindsurfAdapter,
  meta,
  default: WindsurfAdapter
};
