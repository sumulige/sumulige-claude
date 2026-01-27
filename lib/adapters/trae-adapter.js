/**
 * Trae Adapter
 *
 * Platform adapter for Trae IDE (ByteDance).
 * Handles YAML configuration with agent and model definitions.
 */

const { BasePlatformAdapter } = require('./base-adapter');
const yaml = require('yaml');

class TraeAdapter extends BasePlatformAdapter {
  constructor() {
    super('trae');
  }

  getConfigPath() {
    return {
      global: '~/.trae/config.yaml',
      project: 'trae_config.yaml'
    };
  }

  getInstructionFileName() {
    // Trae uses agents configuration in YAML
    return ['CLAUDE.md', '.trae/instructions.md'];
  }

  getConfigFormat() {
    return 'yaml';
  }

  getProjectDirName() {
    return '.trae';
  }

  parseConfig(content) {
    return yaml.parse(content);
  }

  stringifyConfig(config) {
    return yaml.stringify(config);
  }

  /**
   * Get default Trae configuration
   * @returns {Object}
   */
  getDefaultConfig() {
    return {
      agents: {
        trae_agent: {
          enable_lakeview: true,
          model: 'trae_agent_model',
          max_steps: 200,
          tools: ['bash', 'str_replace_based_edit_tool']
        }
      },
      models: {
        trae_agent_model: {
          model_provider: 'anthropic',
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          temperature: 0.5
        }
      }
    };
  }

  /**
   * Get model provider mapping
   * @returns {Object}
   */
  getProviderMapping() {
    return {
      anthropic: 'anthropic',
      openai: 'openai',
      google: 'google',
      aws: 'aws_bedrock',
      azure: 'azure'
    };
  }
}

module.exports = { TraeAdapter };
