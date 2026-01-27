/**
 * Aider Platform Adapter
 *
 * Platform adapter for Aider CLI.
 * Handles YAML configuration and CONVENTIONS.md instructions.
 */

const { BasePlatformAdapter } = require('../_base/adapter');
const { UnifiedInstruction } = require('../_base/unified-instruction');
const yaml = require('yaml');

const meta = {
  name: 'aider',
  displayName: 'Aider',
  vendor: 'aider.chat',
  icon: '🔧',

  config: {
    format: 'yaml',
    paths: {
      project: '.aider.conf.yml',
      global: '~/.aider.conf.yml'
    }
  },

  instruction: {
    files: ['CONVENTIONS.md', 'CLAUDE.md', '.aider/CONVENTIONS.md'],
    format: 'markdown'
  }
};

class AiderAdapter extends BasePlatformAdapter {
  static meta = meta;

  constructor() {
    super('aider');
  }

  parseConfig(content) {
    return yaml.parse(content);
  }

  stringifyConfig(config) {
    return yaml.stringify(config);
  }

  // Override: Aider doesn't use a project directory
  getProjectDirName() {
    return null;
  }

  parseToUnified(content) {
    const unified = UnifiedInstruction.fromMarkdown(content);
    unified.setMetadata('sourceFormat', 'aider');
    return unified;
  }

  serializeFromUnified(unified) {
    if (unified.getMetadata('sourceFormat') === 'aider') {
      return unified.getRawContent() || unified.toMarkdown();
    }

    const lines = [];
    lines.push('# Coding Conventions');
    lines.push('');
    lines.push(`> Conventions for ${unified.title || 'this project'}`);
    lines.push('> Auto-generated for Aider compatibility');
    lines.push('');

    for (const [key, section] of Object.entries(unified.sections)) {
      lines.push(`## ${section.originalName || key}`);
      lines.push('');
      lines.push(section.content);
      lines.push('');
    }

    lines.push('---');
    lines.push('');
    lines.push('## Aider Integration');
    lines.push('');
    lines.push('```bash');
    lines.push('aider --read CONVENTIONS.md');
    lines.push('```');

    return lines.join('\n').trim();
  }

  getDefaultConfig() {
    return {
      model: 'claude-3-sonnet',
      read: ['CONVENTIONS.md'],
      'auto-commits': false,
      'dirty-commits': false
    };
  }
}

module.exports = {
  AiderAdapter,
  Adapter: AiderAdapter,
  meta,
  default: AiderAdapter
};
