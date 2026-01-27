/**
 * Platform Adapters Registry - Backward Compatibility Layer
 *
 * @deprecated Use lib/platforms/_base instead.
 *
 * This file re-exports from the new platform architecture for backward compatibility.
 * New code should import from '../platforms/_base' directly.
 */

// Re-export from new architecture
const {
  registry,
  getAdapter,
  getSupportedPlatforms,
  detectPlatforms,
  convertInstructions,
  BasePlatformAdapter
} = require('../platforms/_base');

// Force discovery to populate registry.adapters for backward compatibility
getSupportedPlatforms();

// Re-export individual adapters for backward compatibility
const ClaudeAdapter = registry.adapters.get('claude')?.Adapter;
const CodexAdapter = registry.adapters.get('codex')?.Adapter;
const OpenCodeAdapter = registry.adapters.get('opencode')?.Adapter;
const AiderAdapter = registry.adapters.get('aider')?.Adapter;
const CursorAdapter = registry.adapters.get('cursor')?.Adapter;
const ClineAdapter = registry.adapters.get('cline')?.Adapter;
const TraeAdapter = registry.adapters.get('trae')?.Adapter;
const ZedAdapter = registry.adapters.get('zed')?.Adapter;

// Legacy adapters object
const adapters = {};
for (const [name, entry] of registry.adapters) {
  adapters[name] = entry.instance;
}

module.exports = {
  // Base class
  BasePlatformAdapter,

  // Individual adapter classes
  ClaudeAdapter,
  CodexAdapter,
  OpenCodeAdapter,
  AiderAdapter,
  CursorAdapter,
  ClineAdapter,
  TraeAdapter,
  ZedAdapter,

  // Functions
  getAdapter,
  getSupportedPlatforms,
  detectPlatforms,
  convertInstructions,

  // Legacy
  adapters,
  registry
};
