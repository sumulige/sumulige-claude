/**
 * Cline/Roo Platform Adapter
 *
 * Platform adapter for Cline/Roo VS Code extension.
 * Handles .clinerules markdown instructions.
 */

const fs = require('fs');
const path = require('path');
const { BasePlatformAdapter } = require('../_base/adapter');
const { UnifiedInstruction } = require('../_base/unified-instruction');

const meta = {
  name: 'cline',
  displayName: 'Cline/Roo',
  vendor: 'VS Code Extension',
  icon: '🤝',

  config: {
    format: 'markdown',
    paths: {
      project: '.clinerules',
      global: null  // Uses VS Code settings
    }
  },

  instruction: {
    files: ['.clinerules', 'CLAUDE.md', '.cline/rules.md'],
    format: 'markdown'
  }
};

class ClineAdapter extends BasePlatformAdapter {
  static meta = meta;

  constructor() {
    super('cline');
  }

  // Override: Cline doesn't use a project directory
  getProjectDirName() {
    return null;
  }

  parseConfig(content) {
    return { instructions: content };
  }

  stringifyConfig(config) {
    return config.instructions || '';
  }

  // Override detectPlatform for Cline (no project dir)
  detectPlatform(projectDir) {
    const configPaths = this.getConfigPath();
    const projectConfig = path.join(projectDir, configPaths.project);

    if (fs.existsSync(projectConfig)) {
      return { detected: true, configPath: projectConfig };
    }

    return { detected: false, configPath: null };
  }

  parseToUnified(content) {
    const unified = UnifiedInstruction.fromMarkdown(content);
    unified.setMetadata('sourceFormat', 'cline');
    return unified;
  }

  serializeFromUnified(unified) {
    // Cline uses plain markdown, similar to CLAUDE.md
    if (unified.getMetadata('sourceFormat') === 'cline') {
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
  ClineAdapter,
  Adapter: ClineAdapter,
  meta,
  default: ClineAdapter
};
