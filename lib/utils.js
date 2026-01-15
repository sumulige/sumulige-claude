/**
 * Utils - Common utility functions
 *
 * Extracted from cli.js to eliminate code duplication
 */

const fs = require('fs');
const path = require('path');

/**
 * Copy mode for template deployment
 */
const CopyMode = {
  SAFE: 'safe',        // Skip existing files (no overwrite, no backup)
  BACKUP: 'backup',     // Backup then overwrite (default)
  FORCE: 'force'        // Overwrite without backup
};

/**
 * Recursively copy directory contents with backup support
 * @param {string} src - Source directory
 * @param {string} dest - Destination directory
 * @param {boolean|string} mode - Copy mode: true/false (legacy) or CopyMode enum
 * @param {string} backupDir - Backup directory path
 * @returns {object} Copy result { copied, skipped, backedup }
 */
exports.copyRecursive = function(src, dest, mode = CopyMode.BACKUP, backupDir = null) {
  if (!fs.existsSync(src)) return { copied: 0, skipped: 0, backedup: 0 };

  // Legacy support: convert boolean to CopyMode
  if (typeof mode === 'boolean') {
    mode = mode ? CopyMode.FORCE : CopyMode.SAFE;
  }

  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const result = { copied: 0, skipped: 0, backedup: 0 };
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      const subResult = exports.copyRecursive(
        srcPath,
        destPath,
        mode,
        backupDir ? path.join(backupDir, entry.name) : null
      );
      result.copied += subResult.copied;
      result.skipped += subResult.skipped;
      result.backedup += subResult.backedup;
    } else {
      const action = copyFile(srcPath, destPath, mode, backupDir);
      result[action.type === 'copied' ? 'copied' : action.type]++;
      if (action.type === 'backedup') {
        result.copied++;
        result.backedup++;
      }
    }
  }
  return result;
};

/**
 * Copy a single file with backup support
 * @param {string} srcPath - Source file path
 * @param {string} destPath - Destination file path
 * @param {string} mode - Copy mode
 * @param {string} backupDir - Backup directory path
 * @returns {object} Action result { type, backupPath }
 */
function copyFile(srcPath, destPath, mode, backupDir) {
  // File doesn't exist - just copy
  if (!fs.existsSync(destPath)) {
    fs.copyFileSync(srcPath, destPath);
    setExecutablePermission(destPath);
    return { type: 'copied' };
  }

  // File exists - handle based on mode
  switch (mode) {
    case CopyMode.SAFE:
      // Skip existing files
      return { type: 'skipped' };

    case CopyMode.FORCE:
      // Overwrite without backup
      fs.copyFileSync(srcPath, destPath);
      setExecutablePermission(destPath);
      return { type: 'copied' };

    case CopyMode.BACKUP:
    default:
      // Backup then overwrite
      if (backupDir) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
        const backupFileName = path.basename(destPath) + '.' + timestamp + '.bak';
        const backupPath = path.join(backupDir, backupFileName);

        fs.mkdirSync(backupDir, { recursive: true });
        fs.copyFileSync(destPath, backupPath);
        setExecutablePermission(backupPath);

        fs.copyFileSync(srcPath, destPath);
        setExecutablePermission(destPath);
        return { type: 'backedup', backupPath };
      } else {
        // No backup dir, just overwrite
        fs.copyFileSync(srcPath, destPath);
        setExecutablePermission(destPath);
        return { type: 'copied' };
      }
  }
}

/**
 * Set executable permission for script files
 * @param {string} filePath - File path
 */
function setExecutablePermission(filePath) {
  if (filePath.endsWith('.sh') || filePath.endsWith('.cjs')) {
    fs.chmodSync(filePath, 0o755);
  }
}

/**
 * Ensure a directory exists
 * @param {string} dir - Directory path
 */
exports.ensureDir = function(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

/**
 * Convert string to Title Case
 * @param {string} str - Input string
 * @returns {string} Title cased string
 */
exports.toTitleCase = function(str) {
  return str.replace(/\b\w/g, char => char.toUpperCase());
};

// Export CopyMode for use in other modules
exports.CopyMode = CopyMode;
