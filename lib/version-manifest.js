/**
 * Version Manifest Manager
 *
 * 管理版本清单，支持增量同步
 */

const fs = require('fs');
const path = require('path');
const { getPackageVersion } = require('./version');

const MANIFEST_FILE = path.join(__dirname, '../config/version-manifest.json');
const VERSION_FILE_NAME = '.sumulige-claude-version';

/**
 * 加载版本清单
 */
function loadManifest() {
  if (!fs.existsSync(MANIFEST_FILE)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf-8'));
  } catch (e) {
    return null;
  }
}

/**
 * 获取项目当前版本
 */
function getProjectVersion(projectDir) {
  const versionFile = path.join(projectDir, '.claude', VERSION_FILE_NAME);
  if (!fs.existsSync(versionFile)) {
    return null;
  }
  try {
    return fs.readFileSync(versionFile, 'utf-8').trim();
  } catch (e) {
    return null;
  }
}

/**
 * 设置项目版本
 */
function setProjectVersion(projectDir, version) {
  const versionFile = path.join(projectDir, '.claude', VERSION_FILE_NAME);
  const dir = path.dirname(versionFile);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(versionFile, version);
}

/**
 * 比较版本号
 * @returns -1 if a < b, 0 if a == b, 1 if a > b
 */
function compareVersions(a, b) {
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);

  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const numA = partsA[i] || 0;
    const numB = partsB[i] || 0;
    if (numA < numB) return -1;
    if (numA > numB) return 1;
  }
  return 0;
}

/**
 * 获取版本之间的变更
 */
function getChangesSince(fromVersion, toVersion = null) {
  const manifest = loadManifest();
  if (!manifest) return [];

  const targetVersion = toVersion || manifest.current;
  const changes = [];

  for (const entry of manifest.history) {
    if (compareVersions(entry.version, fromVersion) > 0 &&
        compareVersions(entry.version, targetVersion) <= 0) {
      changes.push({
        version: entry.version,
        date: entry.date,
        breaking: entry.breaking,
        changes: entry.changes
      });
    }
  }

  return changes.sort((a, b) => compareVersions(a.version, b.version));
}

/**
 * 检测是否有 breaking changes
 */
function hasBreakingChanges(fromVersion, toVersion = null) {
  const changes = getChangesSince(fromVersion, toVersion);
  return changes.some(c => c.breaking);
}

/**
 * 获取当前版本
 */
function getCurrentVersion() {
  const manifest = loadManifest();
  if (manifest && manifest.current) return manifest.current;

  // Fallback to package.json when manifest is missing/outdated
  return getPackageVersion();
}

/**
 * 获取同步规则
 */
function getSyncRules() {
  const manifest = loadManifest();
  return manifest ? manifest.syncRules : null;
}

/**
 * 检查是否需要更新
 */
function needsUpdate(projectDir) {
  const projectVersion = getProjectVersion(projectDir);
  if (!projectVersion) return true;

  const currentVersion = getCurrentVersion();
  if (!currentVersion) return false;

  return compareVersions(projectVersion, currentVersion) < 0;
}

/**
 * 获取更新摘要
 */
function getUpdateSummary(projectDir) {
  const projectVersion = getProjectVersion(projectDir);
  const currentVersion = getCurrentVersion();

  if (!currentVersion) {
    return { needsUpdate: false, isNewInstall: false, changes: [], error: 'No current version available' };
  }

  if (!projectVersion) {
    return {
      needsUpdate: true,
      isNewInstall: true,
      fromVersion: null,
      toVersion: currentVersion,
      changes: []
    };
  }

  const changes = getChangesSince(projectVersion, currentVersion);
  const hasBreaking = changes.some(c => c.breaking);

  return {
    needsUpdate: compareVersions(projectVersion, currentVersion) < 0,
    isNewInstall: false,
    fromVersion: projectVersion,
    toVersion: currentVersion,
    hasBreakingChanges: hasBreaking,
    changes: changes
  };
}

module.exports = {
  loadManifest,
  getProjectVersion,
  setProjectVersion,
  compareVersions,
  getChangesSince,
  hasBreakingChanges,
  getCurrentVersion,
  getSyncRules,
  needsUpdate,
  getUpdateSummary
};
