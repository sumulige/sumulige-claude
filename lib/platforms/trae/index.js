/**
 * Trae Platform Adapter
 *
 * Platform adapter for Trae IDE (ByteDance).
 * Handles YAML configuration with agent and model definitions.
 */

const { BasePlatformAdapter } = require('../_base/adapter');
const { UnifiedInstruction } = require('../_base/unified-instruction');
const yaml = require('yaml');

const meta = {
  name: 'trae',
  displayName: 'Trae',
  vendor: 'ByteDance',
  icon: '🎯',

  config: {
    format: 'yaml',
    paths: {
      project: 'trae_config.yaml',
      global: '~/.trae/config.yaml'
    }
  },

  instruction: {
    files: ['CLAUDE.md', '.trae/instructions.md'],
    format: 'markdown'
  }
};

class TraeAdapter extends BasePlatformAdapter {
  static meta = meta;

  constructor() {
    super('trae');
  }

  parseConfig(content) {
    return yaml.parse(content);
  }

  stringifyConfig(config) {
    return yaml.stringify(config);
  }

  parseToUnified(content) {
    const unified = UnifiedInstruction.fromMarkdown(content);
    unified.setMetadata('sourceFormat', 'trae');
    return unified;
  }

  serializeFromUnified(unified) {
    if (unified.getMetadata('sourceFormat') === 'trae') {
      return unified.getRawContent() || unified.toMarkdown();
    }
    return unified.toMarkdown();
  }

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

module.exports = {
  TraeAdapter,
  Adapter: TraeAdapter,
  meta,
  default: TraeAdapter
};
