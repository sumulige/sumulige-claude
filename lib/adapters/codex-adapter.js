/**
 * Codex CLI Adapter
 *
 * Platform adapter for OpenAI's Codex CLI.
 * Handles TOML configuration and AGENTS.md instructions.
 */

const { BasePlatformAdapter } = require('./base-adapter');
const TOML = require('@iarna/toml');

class CodexAdapter extends BasePlatformAdapter {
  constructor() {
    super('codex');
  }

  getConfigPath() {
    return {
      global: '~/.codex/config.toml',
      project: '.codex/config.toml'
    };
  }

  getInstructionFileName() {
    return ['AGENTS.md', 'AGENTS.override.md'];
  }

  getConfigFormat() {
    return 'toml';
  }

  getProjectDirName() {
    return '.codex';
  }

  parseConfig(content) {
    return TOML.parse(content);
  }

  stringifyConfig(config) {
    return TOML.stringify(config);
  }

  /**
   * Get default Codex configuration
   * @returns {Object}
   */
  getDefaultConfig() {
    return {
      model: 'o3',
      model_provider: 'openai',
      sandbox_mode: 'workspace-write',
      approval_policy: 'on-failure',
      project: {
        project_doc_fallback_filenames: ['AGENTS.md', 'CLAUDE.md', 'TEAM_GUIDE.md'],
        project_doc_max_bytes: 65536
      },
      features: {
        shell_tool: true,
        web_search_request: true
      }
    };
  }

  /**
   * Map sandbox mode from unified format to Codex format
   * @param {string} mode - Unified sandbox mode
   * @returns {string}
   */
  mapSandboxMode(mode) {
    const mapping = {
      strict: 'read-only',
      normal: 'workspace-write',
      permissive: 'danger-full-access'
    };
    return mapping[mode] || 'workspace-write';
  }

  /**
   * Map approval policy from unified format to Codex format
   * @param {string} policy - Unified approval policy
   * @returns {string}
   */
  mapApprovalPolicy(policy) {
    const mapping = {
      always: 'untrusted',
      'on-error': 'on-failure',
      'on-request': 'on-request',
      never: 'never'
    };
    return mapping[policy] || 'on-failure';
  }

  /**
   * Convert MCP servers configuration to Codex format
   * @param {Object} mcpServers - Unified MCP config
   * @returns {Object}
   */
  formatMcpServers(mcpServers) {
    if (!mcpServers) return {};

    const codexMcp = {};
    for (const [name, config] of Object.entries(mcpServers)) {
      codexMcp[name] = {
        command: config.command,
        enabled: config.enabled !== false,
        enabled_tools: config.tools || [],
        env: config.env || {}
      };
    }
    return codexMcp;
  }

  /**
   * Convert unified config to Codex format
   * @param {Object} unifiedConfig - Unified configuration
   * @returns {Object}
   */
  toCodexConfig(unifiedConfig) {
    const config = this.getDefaultConfig();

    if (unifiedConfig.model) {
      config.model = unifiedConfig.model;
    }

    if (unifiedConfig.sandbox) {
      config.sandbox_mode = this.mapSandboxMode(unifiedConfig.sandbox);
    }

    if (unifiedConfig.approval) {
      config.approval_policy = this.mapApprovalPolicy(unifiedConfig.approval);
    }

    if (unifiedConfig.mcp) {
      config.mcp_servers = this.formatMcpServers(unifiedConfig.mcp);
    }

    return config;
  }
}

module.exports = { CodexAdapter };
