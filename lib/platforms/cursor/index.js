/**
 * Cursor Platform Adapter
 *
 * Platform adapter for Cursor IDE.
 * Handles MDC format (.cursorrules with YAML frontmatter).
 */

const { BasePlatformAdapter } = require('../_base/adapter');
const { UnifiedInstruction } = require('../_base/unified-instruction');
const yaml = require('yaml');

const meta = {
  name: 'cursor',
  displayName: 'Cursor',
  vendor: 'cursor.com',
  icon: '📝',

  config: {
    format: 'markdown',
    paths: {
      project: '.cursorrules',
      global: null
    }
  },

  instruction: {
    files: ['.cursorrules', '.cursor/rules/main.mdc', '.cursor/rules/default.mdc'],
    format: 'mdc'  // Markdown with YAML frontmatter
  }
};

class CursorAdapter extends BasePlatformAdapter {
  static meta = meta;

  constructor() {
    super('cursor');
  }

  /**
   * Parse MDC format (YAML frontmatter + Markdown body)
   */
  parseConfig(content) {
    return this.parseMdc(content);
  }

  stringifyConfig(config) {
    if (config.frontmatter && Object.keys(config.frontmatter).length > 0) {
      return `---\n${yaml.stringify(config.frontmatter)}---\n\n${config.body || ''}`;
    }
    return config.body || config.instructions || '';
  }

  parseMdc(content) {
    const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    if (match) {
      try {
        return {
          frontmatter: yaml.parse(match[1]),
          body: match[2].trim()
        };
      } catch (e) {
        return { frontmatter: {}, body: content };
      }
    }
    return { frontmatter: {}, body: content };
  }

  parseToUnified(content) {
    const mdc = this.parseMdc(content);
    const unified = UnifiedInstruction.fromMarkdown(mdc.body);

    // Store frontmatter as metadata
    unified.setMetadata('sourceFormat', 'cursor');
    unified.setMetadata('frontmatter', mdc.frontmatter);
    unified.setMetadata('globs', mdc.frontmatter?.globs || ['**/*']);
    unified.setMetadata('alwaysApply', mdc.frontmatter?.alwaysApply !== false);

    return unified;
  }

  serializeFromUnified(unified) {
    const frontmatter = {
      description: unified.description || 'Project rules from sumulige-claude',
      globs: unified.getMetadata('globs') || ['**/*'],
      alwaysApply: unified.getMetadata('alwaysApply') !== false
    };

    // Use raw content if source was Cursor
    let body;
    if (unified.getMetadata('sourceFormat') === 'cursor') {
      body = unified.getRawContent() || unified.toMarkdown();
      // If raw content includes frontmatter, return as-is
      if (body.startsWith('---')) {
        return body;
      }
    } else {
      body = unified.toMarkdown();
    }

    return `---\n${yaml.stringify(frontmatter)}---\n\n${body}`;
  }

  getDefaultConfig() {
    return {
      frontmatter: {
        description: 'Project rules',
        globs: ['**/*'],
        alwaysApply: true
      },
      body: ''
    };
  }
}

module.exports = {
  CursorAdapter,
  Adapter: CursorAdapter,
  meta,
  default: CursorAdapter
};
