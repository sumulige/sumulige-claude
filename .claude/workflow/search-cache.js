/**
 * Search Result Cache
 *
 * Caches web search results to avoid redundant API calls
 * and improve performance for repeated queries.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ============================================================================
// Configuration
// ============================================================================

const CACHE_DIR = path.join(process.cwd(), 'development/cache/web-search');
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// ============================================================================
// Search Cache Class
// ============================================================================

class SearchCache {
  /**
   * Ensure cache directory exists
   */
  static ensureCacheDir() {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
  }

  /**
   * Generate cache key from query
   */
  static getCacheKey(query) {
    const hash = crypto
      .createHash('md5')
      .update(query.toLowerCase().trim())
      .digest('hex');
    return `search_${hash}.json`;
  }

  /**
   * Get cache file path for a query
   */
  static getCachePath(query) {
    this.ensureCacheDir();
    const key = this.getCacheKey(query);
    return path.join(CACHE_DIR, key);
  }

  /**
   * Check if cached result is still valid
   */
  static isValid(cachedResult) {
    if (!cachedResult || !cachedResult.timestamp) return false;
    const age = Date.now() - cachedResult.timestamp;
    return age < CACHE_TTL;
  }

  /**
   * Get cached results for a query
   */
  static get(query) {
    const cachePath = this.getCachePath(query);

    if (!fs.existsSync(cachePath)) {
      return null;
    }

    try {
      const content = fs.readFileSync(cachePath, 'utf-8');
      const cached = JSON.parse(content);

      if (!this.isValid(cached)) {
        // Cache expired, remove it
        fs.unlinkSync(cachePath);
        return null;
      }

      return cached.results;
    } catch (error) {
      // Invalid cache file, remove it
      try {
        fs.unlinkSync(cachePath);
      } catch (e) {}
      return null;
    }
  }

  /**
   * Set cache results for a query
   */
  static set(query, results) {
    const cachePath = this.getCachePath(query);

    try {
      const cacheData = {
        query,
        results,
        timestamp: Date.now()
      };

      fs.writeFileSync(
        cachePath,
        JSON.stringify(cacheData, null, 2),
        'utf-8'
      );
    } catch (error) {
      // Fail silently if cache write fails
      console.warn(`Failed to write cache: ${error.message}`);
    }
  }

  /**
   * Clear all cache
   */
  static clear() {
    this.ensureCacheDir();

    if (!fs.existsSync(CACHE_DIR)) {
      return 0;
    }

    const files = fs.readdirSync(CACHE_DIR);
    let cleared = 0;

    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          fs.unlinkSync(path.join(CACHE_DIR, file));
          cleared++;
        } catch (error) {
          // Skip files that can't be deleted
        }
      }
    }

    return cleared;
  }

  /**
   * Clean expired cache entries
   */
  static clean() {
    this.ensureCacheDir();

    if (!fs.existsSync(CACHE_DIR)) {
      return 0;
    }

    const files = fs.readdirSync(CACHE_DIR);
    let cleaned = 0;

    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(CACHE_DIR, file);
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          const cached = JSON.parse(content);

          if (!this.isValid(cached)) {
            fs.unlinkSync(filePath);
            cleaned++;
          }
        } catch (error) {
          // Remove invalid cache files
          try {
            fs.unlinkSync(filePath);
            cleaned++;
          } catch (e) {}
        }
      }
    }

    return cleaned;
  }

  /**
   * Get cache statistics
   */
  static getStats() {
    this.ensureCacheDir();

    if (!fs.existsSync(CACHE_DIR)) {
      return { totalEntries: 0, validEntries: 0, totalSize: 0 };
    }

    const files = fs.readdirSync(CACHE_DIR);
    let validEntries = 0;
    let totalSize = 0;

    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(CACHE_DIR, file);
        try {
          const stats = fs.statSync(filePath);
          totalSize += stats.size;

          const content = fs.readFileSync(filePath, 'utf-8');
          const cached = JSON.parse(content);

          if (this.isValid(cached)) {
            validEntries++;
          }
        } catch (error) {
          // Skip invalid files
        }
      }
    }

    return {
      totalEntries: files.length,
      validEntries,
      totalSize,
      cacheDir: CACHE_DIR
    };
  }
}

// ============================================================================
// Exports
// ============================================================================

module.exports = {
  SearchCache,
  CACHE_DIR,
  CACHE_TTL
};
