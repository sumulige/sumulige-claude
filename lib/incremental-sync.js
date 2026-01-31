/**
 * Incremental Sync Manager
 *
 * 增量同步功能，只同步变更的文件
 */

const fs = require('fs');
const path = require('path');
const versionManifest = require('./version-manifest');

const TEMPLATE_DIR = path.join(__dirname, '../template');

/**
 * 复制文件
 */
function copyFile(src, dest) {
  const dir = path.dirname(dest);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.copyFileSync(src, dest);
}

/**
 * 合并 JSON 配置
 */
function mergeJsonConfig(src, dest) {
  let existing = {};
  if (fs.existsSync(dest)) {
    try {
      existing = JSON.parse(fs.readFileSync(dest, 'utf-8'));
    } catch (e) {
      existing = {};
    }
  }

  const newConfig = JSON.parse(fs.readFileSync(src, 'utf-8'));

  // 深度合并
  const merged = deepMerge(existing, newConfig);

  const dir = path.dirname(dest);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(dest, JSON.stringify(merged, null, 2));
}

/**
 * 深度合并对象
 */
function deepMerge(target, source) {
  const result = { ...target };

  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }

  return result;
}

/**
 * 应用单个变更
 */
function applyChange(change, projectDir, rules) {
  const rule = rules[change.type];
  if (!rule) return { success: false, reason: 'Unknown change type' };

  const action = rule[change.action];
  if (!action) return { success: false, reason: 'Unknown action' };

  try {
    switch (change.type) {
      case 'hook':
        return applyHookChange(change, projectDir, action);
      case 'config':
        return applyConfigChange(change, projectDir, action);
      case 'command':
        return applyCommandChange(change, projectDir, action);
      case 'lib':
        return applyLibChange(change, projectDir, action);
      case 'skill':
        return applySkillChange(change, projectDir, action);
      default:
        return { success: true, skipped: true };
    }
  } catch (e) {
    return { success: false, reason: e.message };
  }
}

/**
 * 应用 hook 变更
 */
function applyHookChange(change, projectDir, action) {
  const hookName = change.name;
  const src = path.join(TEMPLATE_DIR, '.claude/hooks', `${hookName}.cjs`);
  const dest = path.join(projectDir, '.claude/hooks', `${hookName}.cjs`);

  if (action === 'copy') {
    if (fs.existsSync(src)) {
      copyFile(src, dest);
      return { success: true, action: 'copied', file: dest };
    }
    return { success: false, reason: 'Source file not found' };
  }

  if (action === 'delete') {
    if (fs.existsSync(dest)) {
      fs.unlinkSync(dest);
      return { success: true, action: 'deleted', file: dest };
    }
    return { success: true, skipped: true };
  }

  return { success: true, skipped: true };
}

/**
 * 应用配置变更
 */
function applyConfigChange(change, projectDir, action) {
  const configName = change.name;
  let src, dest;

  if (configName === 'settings.json') {
    src = path.join(TEMPLATE_DIR, '.claude/settings.json');
    dest = path.join(projectDir, '.claude/settings.json');
  } else if (configName === 'hook-registry.json') {
    src = path.join(TEMPLATE_DIR, '.claude/hooks/hook-registry.json');
    dest = path.join(projectDir, '.claude/hooks/hook-registry.json');
  } else {
    src = path.join(TEMPLATE_DIR, '.claude', configName);
    dest = path.join(projectDir, '.claude', configName);
  }

  if (action === 'copy') {
    if (fs.existsSync(src)) {
      copyFile(src, dest);
      return { success: true, action: 'copied', file: dest };
    }
    return { success: false, reason: 'Source file not found' };
  }

  if (action === 'merge') {
    if (fs.existsSync(src)) {
      mergeJsonConfig(src, dest);
      return { success: true, action: 'merged', file: dest };
    }
    return { success: false, reason: 'Source file not found' };
  }

  return { success: true, skipped: true };
}

/**
 * 应用命令变更
 */
function applyCommandChange(change, projectDir, action) {
  const commandName = change.name;
  const src = path.join(TEMPLATE_DIR, '.claude/commands', `${commandName}.md`);
  const dest = path.join(projectDir, '.claude/commands', `${commandName}.md`);

  if (action === 'copy') {
    if (fs.existsSync(src)) {
      copyFile(src, dest);
      return { success: true, action: 'copied', file: dest };
    }
    return { success: false, reason: 'Source file not found' };
  }

  return { success: true, skipped: true };
}

/**
 * 应用库文件变更
 */
function applyLibChange(change, projectDir, action) {
  const libPath = change.name;
  const src = path.join(TEMPLATE_DIR, '.claude', libPath);
  const dest = path.join(projectDir, '.claude', libPath);

  if (action === 'copy') {
    if (fs.existsSync(src)) {
      copyFile(src, dest);
      return { success: true, action: 'copied', file: dest };
    }
    return { success: false, reason: 'Source file not found' };
  }

  return { success: true, skipped: true };
}

/**
 * 应用技能变更
 */
function applySkillChange(change, projectDir, action) {
  // 技能同步由现有的 sync 命令处理
  return { success: true, skipped: true, reason: 'Skills handled by full sync' };
}

/**
 * 执行增量同步
 */
function incrementalSync(projectDir, options = {}) {
  const summary = versionManifest.getUpdateSummary(projectDir);

  if (!summary || summary.error) {
    return {
      success: false,
      message: 'Version manifest 无法读取或格式错误，请先运行 smc sync',
      needsFullSync: true
    };
  }

  if (!summary.needsUpdate) {
    return {
      success: true,
      message: 'Already up to date',
      changes: []
    };
  }

  if (summary.isNewInstall) {
    return {
      success: false,
      message: 'New installation detected. Please run full sync first.',
      needsFullSync: true
    };
  }

  if (summary.hasBreakingChanges && !options.force) {
    return {
      success: false,
      message: 'Breaking changes detected. Use --force to continue.',
      hasBreakingChanges: true,
      changes: summary.changes
    };
  }

  const rules = versionManifest.getSyncRules();
  if (!rules) {
    return {
      success: false,
      message: '缺少 sync 规则，请运行 smc sync 以恢复模板',
      needsFullSync: true
    };
  }
  const results = [];

  for (const versionChange of summary.changes) {
    for (const change of versionChange.changes) {
      const result = applyChange(change, projectDir, rules);
      results.push({
        version: versionChange.version,
        change,
        result
      });
    }
  }

  // 更新项目版本
  versionManifest.setProjectVersion(projectDir, summary.toVersion);

  return {
    success: true,
    message: `Updated from ${summary.fromVersion} to ${summary.toVersion}`,
    fromVersion: summary.fromVersion,
    toVersion: summary.toVersion,
    results: results
  };
}

/**
 * 检查更新
 */
function checkForUpdates(projectDir) {
  return versionManifest.getUpdateSummary(projectDir);
}

module.exports = {
  incrementalSync,
  checkForUpdates,
  applyChange
};
