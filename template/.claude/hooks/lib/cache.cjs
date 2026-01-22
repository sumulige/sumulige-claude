/**
 * Hooks Shared Library - Cache Utilities
 *
 * 统一的缓存管理，支持内存和文件缓存
 */

const fs = require('fs');
const path = require('path');

/**
 * 内存缓存类
 */
class MemoryCache {
  constructor(defaultTTL = 60000) {
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  set(key, value, ttl = this.defaultTTL) {
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl
    });
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * 文件缓存类
 */
class FileCache {
  constructor(cacheFile, defaultTTL = 300000) {
    this.cacheFile = cacheFile;
    this.defaultTTL = defaultTTL;
    this.cache = null;
  }

  load() {
    if (this.cache !== null) return;

    if (!fs.existsSync(this.cacheFile)) {
      this.cache = {};
      return;
    }

    try {
      this.cache = JSON.parse(fs.readFileSync(this.cacheFile, 'utf-8'));
    } catch (e) {
      this.cache = {};
    }
  }

  save() {
    try {
      const dir = path.dirname(this.cacheFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.cacheFile, JSON.stringify(this.cache, null, 2));
    } catch (e) {
      // 忽略保存错误
    }
  }

  get(key) {
    this.load();
    const item = this.cache[key];
    if (!item) return null;

    if (Date.now() > item.expiry) {
      delete this.cache[key];
      return null;
    }

    return item.value;
  }

  set(key, value, ttl = this.defaultTTL) {
    this.load();
    this.cache[key] = {
      value,
      expiry: Date.now() + ttl
    };
    this.save();
  }

  delete(key) {
    this.load();
    delete this.cache[key];
    this.save();
  }

  clear() {
    this.cache = {};
    this.save();
  }

  cleanup() {
    this.load();
    const now = Date.now();
    let changed = false;

    for (const key of Object.keys(this.cache)) {
      if (now > this.cache[key].expiry) {
        delete this.cache[key];
        changed = true;
      }
    }

    if (changed) {
      this.save();
    }
  }
}

/**
 * 简单哈希函数
 */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

module.exports = {
  MemoryCache,
  FileCache,
  hashString
};
