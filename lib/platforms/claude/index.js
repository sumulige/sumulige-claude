/**
 * Claude Code Platform Adapter
 *
 * Platform adapter for Anthropic's Claude Code CLI.
 * Self-contained: metadata, config handling, instruction handling.
 */

const { BasePlatformAdapter } = require('../_base/adapter');
const { UnifiedInstruction } = require('../_base/unified-instruction');

/**
 * Platform metadata
 */
const meta = {
  name: 'claude',
  displayName: 'Claude Code',
  vendor: 'Anthropic',
  icon: '🤖',

  config: {
    format: 'json',
    paths: {
      project: '.claude/settings.json',
      global: '~/.claude/config.json'
    }
  },

  instruction: {
    files: ['CLAUDE.md', '.claude/CLAUDE.md'],
    format: 'markdown'
  },

  hooks: {
    events: [
      'SessionStart', 'SessionEnd',
      'PreToolUse', 'PostToolUse',
      'UserPromptSubmit', 'AgentStop', 'PreCompact'
    ]
  }
};

class ClaudeAdapter extends BasePlatformAdapter {
  static meta = meta;

  constructor() {
    super('claude');
  }

  // Config is JSON (default behavior from base class)
  // parseConfig and stringifyConfig use default JSON handling

  /**
   * Parse CLAUDE.md to unified format
   * @param {string} content - CLAUDE.md content
   * @returns {UnifiedInstruction}
   */
  parseToUnified(content) {
    const unified = UnifiedInstruction.fromMarkdown(content);

    // Extract Claude-specific metadata
    const checklistMatch = content.match(/## 🚀 AI 启动检查清单[\s\S]*?(?=\n## |$)/);
    if (checklistMatch) {
      unified.setMetadata('hasChecklist', true);
    }

    // Preserve original format indicator
    unified.setMetadata('sourceFormat', 'claude');

    return unified;
  }

  /**
   * Serialize unified instruction to CLAUDE.md format
   * @param {UnifiedInstruction} unified - Unified instruction
   * @returns {string}
   */
  serializeFromUnified(unified) {
    // If source was Claude, use raw content for lossless conversion
    if (unified.getMetadata('sourceFormat') === 'claude') {
      return unified.getRawContent() || unified.toMarkdown();
    }

    // Build Claude-specific format
    const lines = [];

    // Title
    const title = unified.title || '[项目名称] - AI 协作配置';
    lines.push(`# ${title}`);
    lines.push('');

    // Description
    if (unified.description) {
      lines.push(`> ${unified.description}`);
    } else {
      lines.push('> 本文件由 AI 自动维护，定义 AI 协作方式和项目规范');
    }
    lines.push(`> 最后更新：${new Date().toISOString().split('T')[0]}`);
    lines.push('');
    lines.push('---');
    lines.push('');

    // Standard sections
    for (const [key, section] of Object.entries(unified.sections)) {
      lines.push(`## ${section.originalName || key}`);
      lines.push('');
      lines.push(section.content);
      lines.push('');
    }

    return lines.join('\n').trim();
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

module.exports = {
  ClaudeAdapter,
  Adapter: ClaudeAdapter,
  meta,
  default: ClaudeAdapter
};
