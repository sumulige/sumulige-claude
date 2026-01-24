/**
 * Platform Adapters Registry
 *
 * Provides unified access to all supported AI CLI platform adapters.
 */

const { BasePlatformAdapter } = require('./base-adapter');
const { ClaudeAdapter } = require('./claude-adapter');
const { CodexAdapter } = require('./codex-adapter');

// Adapter registry
const adapters = {
  claude: new ClaudeAdapter(),
  codex: new CodexAdapter()
};

/**
 * Get adapter by platform name
 * @param {string} platform - Platform name ('claude' | 'codex')
 * @returns {BasePlatformAdapter}
 */
function getAdapter(platform) {
  const adapter = adapters[platform];
  if (!adapter) {
    throw new Error(`Unknown platform: ${platform}. Supported: ${Object.keys(adapters).join(', ')}`);
  }
  return adapter;
}

/**
 * Get all supported platforms
 * @returns {string[]}
 */
function getSupportedPlatforms() {
  return Object.keys(adapters);
}

/**
 * Detect all platforms configured in a project
 * @param {string} projectDir - Project directory
 * @returns {{ platform: string, adapter: BasePlatformAdapter, configPath: string }[]}
 */
function detectPlatforms(projectDir) {
  const detected = [];

  for (const [platform, adapter] of Object.entries(adapters)) {
    const result = adapter.detectPlatform(projectDir);
    if (result.detected) {
      detected.push({
        platform,
        adapter,
        configPath: result.configPath
      });
    }
  }

  return detected;
}

module.exports = {
  BasePlatformAdapter,
  ClaudeAdapter,
  CodexAdapter,
  getAdapter,
  getSupportedPlatforms,
  detectPlatforms,
  adapters
};
