/**
 * Platform Registry - Auto-discovery and registration
 *
 * Scans lib/platforms/ directory and automatically registers all platforms.
 * Adding a new platform = create directory + implement adapter, no registry changes needed.
 */

const fs = require('fs');
const path = require('path');
const { BasePlatformAdapter } = require('./adapter');
const { UnifiedInstruction } = require('./unified-instruction');

class PlatformRegistry {
  constructor() {
    this.adapters = new Map();
    this._discovered = false;
  }

  /**
   * Auto-discover and register all platforms
   * @private
   */
  _discover() {
    if (this._discovered) return;

    const platformsDir = path.join(__dirname, '..');

    try {
      const dirs = fs.readdirSync(platformsDir);

      for (const dir of dirs) {
        // Skip _base and hidden directories
        if (dir.startsWith('_') || dir.startsWith('.')) continue;

        const fullPath = path.join(platformsDir, dir);

        // Skip non-directories
        if (!fs.statSync(fullPath).isDirectory()) continue;

        // Try to load the platform
        try {
          const platformModule = require(fullPath);

          // Support multiple export formats
          const Adapter = platformModule.default ||
                          platformModule.Adapter ||
                          platformModule[`${dir.charAt(0).toUpperCase()}${dir.slice(1)}Adapter`];

          const meta = platformModule.meta || Adapter?.meta;

          if (!Adapter || !meta) {
            console.warn(`Platform ${dir}: missing Adapter or meta export`);
            continue;
          }

          // Validate adapter extends BasePlatformAdapter
          if (!(Adapter.prototype instanceof BasePlatformAdapter) &&
              Adapter !== BasePlatformAdapter) {
            // Allow duck-typing for flexibility
          }

          // Register
          const instance = new Adapter();
          this.adapters.set(meta.name, {
            Adapter,
            meta,
            instance
          });

        } catch (e) {
          console.warn(`Failed to load platform ${dir}:`, e.message);
        }
      }

      this._discovered = true;
    } catch (e) {
      console.error('Platform discovery failed:', e.message);
    }
  }

  /**
   * Ensure discovery has been run
   * @private
   */
  _ensureDiscovered() {
    if (!this._discovered) {
      this._discover();
    }
  }

  /**
   * Get adapter instance by platform name
   * @param {string} name - Platform name
   * @returns {BasePlatformAdapter|undefined}
   */
  get(name) {
    this._ensureDiscovered();
    return this.adapters.get(name)?.instance;
  }

  /**
   * Get adapter class by platform name
   * @param {string} name - Platform name
   * @returns {typeof BasePlatformAdapter|undefined}
   */
  getClass(name) {
    this._ensureDiscovered();
    return this.adapters.get(name)?.Adapter;
  }

  /**
   * Get platform metadata by name
   * @param {string} name - Platform name
   * @returns {Object|undefined}
   */
  getMeta(name) {
    this._ensureDiscovered();
    return this.adapters.get(name)?.meta;
  }

  /**
   * List all registered platform names
   * @returns {string[]}
   */
  list() {
    this._ensureDiscovered();
    return Array.from(this.adapters.keys());
  }

  /**
   * List all platforms with their metadata
   * @returns {Object[]}
   */
  listWithMeta() {
    this._ensureDiscovered();
    return Array.from(this.adapters.values()).map(a => a.meta);
  }

  /**
   * Check if platform is registered
   * @param {string} name - Platform name
   * @returns {boolean}
   */
  has(name) {
    this._ensureDiscovered();
    return this.adapters.has(name);
  }

  /**
   * Detect all platforms configured in a project
   * @param {string} projectDir - Project directory
   * @returns {Array<{ platform: string, adapter: BasePlatformAdapter, configPath: string }>}
   */
  detectPlatforms(projectDir) {
    this._ensureDiscovered();
    const detected = [];

    for (const [platform, { instance }] of this.adapters) {
      const result = instance.detectPlatform(projectDir);
      if (result.detected) {
        detected.push({
          platform,
          adapter: instance,
          configPath: result.configPath
        });
      }
    }

    return detected;
  }

  /**
   * Convert instructions between platforms
   * @param {string} content - Source instruction content
   * @param {string} fromPlatform - Source platform name
   * @param {string} toPlatform - Target platform name
   * @returns {string}
   */
  convertInstructions(content, fromPlatform, toPlatform) {
    const fromAdapter = this.get(fromPlatform);
    const toAdapter = this.get(toPlatform);

    if (!fromAdapter) {
      throw new Error(`Unknown source platform: ${fromPlatform}`);
    }
    if (!toAdapter) {
      throw new Error(`Unknown target platform: ${toPlatform}`);
    }

    return fromAdapter.convertInstructionTo(content, toAdapter);
  }

  /**
   * Get count of registered platforms
   * @returns {number}
   */
  get size() {
    this._ensureDiscovered();
    return this.adapters.size;
  }

  /**
   * Force re-discovery (useful for hot-reload scenarios)
   */
  refresh() {
    this.adapters.clear();
    this._discovered = false;
    this._discover();
  }
}

// Singleton instance
const registry = new PlatformRegistry();

// Export both registry and base classes
module.exports = {
  // Registry (singleton)
  registry,

  // Convenience functions (delegate to registry)
  getAdapter: (name) => registry.get(name),
  getMeta: (name) => registry.getMeta(name),
  getSupportedPlatforms: () => registry.list(),
  detectPlatforms: (projectDir) => registry.detectPlatforms(projectDir),
  convertInstructions: (content, from, to) => registry.convertInstructions(content, from, to),

  // Base classes for extending
  BasePlatformAdapter,
  UnifiedInstruction
};
