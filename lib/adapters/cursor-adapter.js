/**
 * Cursor Adapter
 *
 * Platform adapter for Cursor IDE (cursor.com).
 * Handles MDC/Markdown rules and .cursorrules instructions.
 */

const { BasePlatformAdapter } = require('./base-adapter');
const yaml = require('yaml');

class CursorAdapter extends BasePlatformAdapter {
  constructor() {
    super('cursor');
  }

  getConfigPath() {
    return {
      global: null,  // Cursor doesn't have global config
      project: '.cursorrules'  // Legacy format, also supports .cursor/rules/
    };
  }

  getInstructionFileName() {
    return ['.cursorrules', '.cursor/rules/main.mdc', '.cursor/rules/default.mdc'];
  }

  getConfigFormat() {
    return 'markdown';
  }

  getProjectDirName() {
    return '.cursor';
  }

  parseConfig(content) {
    // MDC format: YAML frontmatter + Markdown body
    return this.parseMdc(content);
  }

  stringifyConfig(config) {
    // Convert back to MDC format
    if (config.frontmatter && Object.keys(config.frontmatter).length > 0) {
      return `---\n${yaml.stringify(config.frontmatter)}---\n\n${config.body || ''}`;
    }
    return config.body || config.instructions || '';
  }

  /**
   * Parse MDC (Markdown Component) format
   * @param {string} content - Raw content
   * @returns {{ frontmatter: Object, body: string }}
   */
  parseMdc(content) {
    const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    if (match) {
      try {
        return {
          frontmatter: yaml.parse(match[1]),
          body: match[2].trim()
        };
      } catch (e) {
        // If YAML parsing fails, treat as plain text
        return { frontmatter: {}, body: content };
      }
    }
    return { frontmatter: {}, body: content };
  }

  /**
   * Get default Cursor rules configuration
   * @returns {Object}
   */
  getDefaultConfig() {
    return {
      frontmatter: {
        description: 'Project rules from sumulige-claude',
        globs: ['**/*'],
        alwaysApply: true
      },
      body: ''
    };
  }

  /**
   * Convert instructions to MDC format
   * @param {string} instructions - Plain text instructions
   * @param {Object} [options] - Options
   * @returns {string}
   */
  toMdcFormat(instructions, options = {}) {
    const frontmatter = {
      description: options.description || 'Project rules',
      globs: options.globs || ['**/*'],
      alwaysApply: options.alwaysApply !== false
    };

    return `---\n${yaml.stringify(frontmatter)}---\n\n${instructions}`;
  }
}

module.exports = { CursorAdapter };
