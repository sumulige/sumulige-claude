/**
 * Config Converter
 *
 * Converts configuration between unified format and platform-specific formats.
 */

const TOML = require('@iarna/toml');

/**
 * Sandbox mode mappings between platforms
 */
const SANDBOX_MAPPINGS = {
  // Unified -> Claude
  toClaudeSandbox: {
    'read-only': 'strict',
    'workspace-write': 'normal',
    'danger-full-access': 'permissive'
  },
  // Unified -> Codex
  toCodexSandbox: {
    strict: 'read-only',
    normal: 'workspace-write',
    permissive: 'danger-full-access'
  }
};

/**
 * Approval policy mappings between platforms
 */
const APPROVAL_MAPPINGS = {
  // Unified -> Codex
  toCodexApproval: {
    always: 'untrusted',
    'on-error': 'on-failure',
    'on-request': 'on-request',
    never: 'never'
  },
  // Codex -> Unified
  fromCodexApproval: {
    untrusted: 'always',
    'on-failure': 'on-error',
    'on-request': 'on-request',
    never: 'never'
  }
};

class ConfigConverter {
  /**
   * Convert Claude settings.json to unified format
   * @param {Object} claudeConfig - Claude Code configuration
   * @returns {Object} Unified configuration
   */
  fromClaude(claudeConfig) {
    const unified = {
      platform: 'claude',
      env: claudeConfig.env || {},
      hooks: this.extractClaudeHooks(claudeConfig),
      mcp: claudeConfig.mcpServers || {}
    };

    return unified;
  }

  /**
   * Convert Codex config.toml to unified format
   * @param {Object} codexConfig - Codex CLI configuration
   * @returns {Object} Unified configuration
   */
  fromCodex(codexConfig) {
    const unified = {
      platform: 'codex',
      model: codexConfig.model,
      sandbox: SANDBOX_MAPPINGS.toClaudeSandbox[codexConfig.sandbox_mode] || 'normal',
      approval: APPROVAL_MAPPINGS.fromCodexApproval[codexConfig.approval_policy] || 'on-error',
      mcp: this.convertCodexMcp(codexConfig.mcp_servers || {})
    };

    return unified;
  }

  /**
   * Convert unified config to Claude settings.json format
   * @param {Object} unified - Unified configuration
   * @returns {Object} Claude configuration
   */
  toClaude(unified) {
    const claude = {
      env: unified.env || {}
    };

    // Convert hooks
    if (unified.hooks) {
      const hookEvents = ['SessionStart', 'SessionEnd', 'PreToolUse', 'PostToolUse',
                          'UserPromptSubmit', 'AgentStop', 'PreCompact'];
      for (const event of hookEvents) {
        const hooks = unified.hooks.filter(h => h.event === event);
        if (hooks.length > 0) {
          claude[event] = hooks.map(h => ({
            type: 'command',
            command: h.command
          }));
        }
      }
    }

    // Convert MCP servers
    if (unified.mcp) {
      claude.mcpServers = unified.mcp;
    }

    return claude;
  }

  /**
   * Convert unified config to Codex config.toml format
   * @param {Object} unified - Unified configuration
   * @returns {Object} Codex configuration
   */
  toCodex(unified) {
    const codex = {
      model: unified.model || 'o3',
      model_provider: 'openai',
      sandbox_mode: SANDBOX_MAPPINGS.toCodexSandbox[unified.sandbox] || 'workspace-write',
      approval_policy: APPROVAL_MAPPINGS.toCodexApproval[unified.approval] || 'on-failure',
      project: {
        project_doc_fallback_filenames: ['AGENTS.md', 'CLAUDE.md', 'TEAM_GUIDE.md'],
        project_doc_max_bytes: 65536
      },
      features: {
        shell_tool: true,
        web_search_request: true
      }
    };

    // Convert MCP servers
    if (unified.mcp && Object.keys(unified.mcp).length > 0) {
      codex.mcp_servers = {};
      for (const [name, config] of Object.entries(unified.mcp)) {
        codex.mcp_servers[name] = {
          command: config.command,
          enabled: config.enabled !== false,
          enabled_tools: config.tools || [],
          env: config.env || {}
        };
      }
    }

    return codex;
  }

  /**
   * Extract hooks from Claude config into unified format
   * @param {Object} claudeConfig - Claude configuration
   * @returns {Array}
   */
  extractClaudeHooks(claudeConfig) {
    const hooks = [];
    const hookEvents = ['SessionStart', 'SessionEnd', 'PreToolUse', 'PostToolUse',
                        'UserPromptSubmit', 'AgentStop', 'PreCompact'];

    for (const event of hookEvents) {
      const eventHooks = claudeConfig[event] || [];
      for (const hook of eventHooks) {
        if (hook.type === 'command' && hook.command) {
          hooks.push({
            event,
            command: hook.command
          });
        }
      }
    }

    return hooks;
  }

  /**
   * Convert Codex MCP config to unified format
   * @param {Object} codexMcp - Codex MCP configuration
   * @returns {Object}
   */
  convertCodexMcp(codexMcp) {
    const unified = {};

    for (const [name, config] of Object.entries(codexMcp)) {
      unified[name] = {
        command: config.command,
        enabled: config.enabled !== false,
        tools: config.enabled_tools || [],
        env: config.env || {}
      };
    }

    return unified;
  }

  /**
   * Stringify config for Codex (TOML format)
   * @param {Object} config - Codex configuration
   * @returns {string}
   */
  stringifyCodex(config) {
    return TOML.stringify(config);
  }

  /**
   * Stringify config for Claude (JSON format)
   * @param {Object} config - Claude configuration
   * @returns {string}
   */
  stringifyClaude(config) {
    return JSON.stringify(config, null, 2);
  }
}

module.exports = { ConfigConverter };
