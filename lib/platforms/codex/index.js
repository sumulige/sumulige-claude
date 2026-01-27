/**
 * Codex CLI Platform Adapter
 *
 * Platform adapter for OpenAI's Codex CLI.
 * Self-contained: metadata, TOML config handling, AGENTS.md instruction handling.
 */

const { BasePlatformAdapter } = require('../_base/adapter');
const { UnifiedInstruction } = require('../_base/unified-instruction');
const TOML = require('@iarna/toml');

const meta = {
  name: 'codex',
  displayName: 'Codex CLI',
  vendor: 'OpenAI',
  icon: '🦊',

  config: {
    format: 'toml',
    paths: {
      project: '.codex/config.toml',
      global: '~/.codex/config.toml'
    }
  },

  instruction: {
    files: ['AGENTS.md', 'CLAUDE.md', 'TEAM_GUIDE.md'],
    format: 'markdown'
  }
};

class CodexAdapter extends BasePlatformAdapter {
  static meta = meta;

  constructor() {
    super('codex');
  }

  parseConfig(content) {
    return TOML.parse(content);
  }

  stringifyConfig(config) {
    return TOML.stringify(config);
  }

  parseToUnified(content) {
    const unified = UnifiedInstruction.fromMarkdown(content);
    unified.setMetadata('sourceFormat', 'codex');

    // Extract Codex-specific sections
    const codexSettingsMatch = content.match(/## Codex-Specific Settings[\s\S]*?(?=\n## |$)/);
    if (codexSettingsMatch) {
      unified.setMetadata('hasCodexSettings', true);
    }

    return unified;
  }

  serializeFromUnified(unified) {
    if (unified.getMetadata('sourceFormat') === 'codex') {
      return unified.getRawContent() || unified.toMarkdown();
    }

    const lines = [];
    const title = unified.title || 'Project - Agent Instructions';

    lines.push(`# ${title}`);
    lines.push('');
    lines.push('> Auto-generated for Codex CLI compatibility.');
    lines.push(`> Last updated: ${new Date().toISOString().split('T')[0]}`);
    lines.push('');

    for (const [key, section] of Object.entries(unified.sections)) {
      lines.push(`## ${section.originalName || key}`);
      lines.push('');
      lines.push(section.content);
      lines.push('');
    }

    // Add Codex-specific footer
    lines.push('---');
    lines.push('');
    lines.push('## Codex-Specific Settings');
    lines.push('');
    lines.push('- **Sandbox Mode**: workspace-write');
    lines.push('- **Approval Policy**: on-failure');
    lines.push('- **Context Window**: 64KB default');

    return lines.join('\n').trim();
  }

  getDefaultConfig() {
    return {
      model: 'o3',
      model_provider: 'openai',
      sandbox_mode: 'workspace-write',
      approval_policy: 'on-failure',
      project: {
        project_doc_fallback_filenames: ['AGENTS.md', 'CLAUDE.md'],
        project_doc_max_bytes: 65536
      },
      features: {
        shell_tool: true,
        web_search_request: true
      }
    };
  }
}

module.exports = {
  CodexAdapter,
  Adapter: CodexAdapter,
  meta,
  default: CodexAdapter
};
