/**
 * Hooks Shared Library - File System Utilities
 *
 * 带缓存的文件操作，减少重复读写
 */

const fs = require('fs');
const path = require('path');

// 内存缓存
const fileCache = new Map();
const DEFAULT_TTL = 60000; // 1分钟

/**
 * 带缓存的 JSON 文件读取
 */
function readJsonCached(filePath, ttl = DEFAULT_TTL) {
  const cached = fileCache.get(filePath);
  const now = Date.now();

  if (cached && now - cached.time < ttl) {
    return cached.data;
  }

  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    fileCache.set(filePath, { data, time: now });
    return data;
  } catch (e) {
    return null;
  }
}

/**
 * 写入 JSON 文件并更新缓存
 */
function writeJsonCached(filePath, data) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    fileCache.set(filePath, { data, time: Date.now() });
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * 带缓存的文本文件读取
 */
function readTextCached(filePath, ttl = DEFAULT_TTL) {
  const cached = fileCache.get(filePath);
  const now = Date.now();

  if (cached && now - cached.time < ttl) {
    return cached.data;
  }

  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    fileCache.set(filePath, { data, time: now });
    return data;
  } catch (e) {
    return null;
  }
}

/**
 * 清除缓存
 */
function clearCache(filePath = null) {
  if (filePath) {
    fileCache.delete(filePath);
  } else {
    fileCache.clear();
  }
}

/**
 * 确保目录存在
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * 安全文件操作 - 写入
 */
function safeWriteFile(filePath, content) {
  try {
    ensureDir(path.dirname(filePath));
    fs.writeFileSync(filePath, content);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * 安全文件操作 - 追加
 */
function safeAppendFile(filePath, content) {
  try {
    ensureDir(path.dirname(filePath));
    fs.appendFileSync(filePath, content);
    return true;
  } catch (e) {
    return false;
  }
}

module.exports = {
  readJsonCached,
  writeJsonCached,
  readTextCached,
  clearCache,
  ensureDir,
  safeWriteFile,
  safeAppendFile
};
