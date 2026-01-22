/**
 * Permission Audit - Security scanner for approved commands
 * Inspired by cc-safe from ykdojo/claude-code-tips
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Dangerous patterns with severity levels
const DANGEROUS_PATTERNS = [
  // Critical - Must remove
  { pattern: /rm\s+-rf\s+\/(?!\w)/, level: 'critical', desc: 'Delete root directory' },
  { pattern: />\s*\/dev\/sd[a-z]/, level: 'critical', desc: 'Overwrite disk device' },
  { pattern: /mkfs/, level: 'critical', desc: 'Format disk' },
  { pattern: /dd\s+if=\/dev\/zero/, level: 'critical', desc: 'Overwrite with zeros' },
  { pattern: /:\(\)\s*\{\s*:\|:&\s*\}\s*;:/, level: 'critical', desc: 'Fork bomb' },

  // High - Should review
  { pattern: /sudo/, level: 'high', desc: 'Privilege escalation' },
  { pattern: /rm\s+-rf/, level: 'high', desc: 'Recursive force delete' },
  { pattern: /chmod\s+777/, level: 'high', desc: 'World-writable permissions' },
  { pattern: /--privileged/, level: 'high', desc: 'Privileged container' },
  { pattern: /curl.*\|\s*(sh|bash)/, level: 'high', desc: 'Remote script execution' },
  { pattern: /wget.*\|\s*(sh|bash)/, level: 'high', desc: 'Remote script execution' },
  { pattern: /eval\s/, level: 'high', desc: 'Dynamic code execution' },
  { pattern: /--no-verify/, level: 'high', desc: 'Skip verification hooks' },

  // Medium - Optional review
  { pattern: /npm\s+install\s+-g/, level: 'medium', desc: 'Global npm install' },
  { pattern: /pip\s+install/, level: 'medium', desc: 'Python package install' },
  { pattern: /git\s+push\s+--force/, level: 'medium', desc: 'Force push' },
  { pattern: /git\s+reset\s+--hard/, level: 'medium', desc: 'Hard reset' },
  { pattern: /DROP\s+(TABLE|DATABASE)/i, level: 'medium', desc: 'Drop database objects' },
  { pattern: /TRUNCATE/i, level: 'medium', desc: 'Truncate table' },
];

/**
 * Find all settings files to scan
 */
function findSettingsFiles(projectDir) {
  const files = [];
  const homeDir = os.homedir();

  // Global settings
  const globalSettings = path.join(homeDir, '.claude', 'settings.local.json');
  if (fs.existsSync(globalSettings)) {
    files.push({ path: globalSettings, scope: 'global' });
  }

  // Project settings
  if (projectDir) {
    const projectSettings = path.join(projectDir, '.claude', 'settings.local.json');
    if (fs.existsSync(projectSettings)) {
      files.push({ path: projectSettings, scope: 'project' });
    }
  }

  // All project settings in ~/.claude/projects/
  const projectsDir = path.join(homeDir, '.claude', 'projects');
  if (fs.existsSync(projectsDir)) {
    try {
      const projects = fs.readdirSync(projectsDir);
      for (const proj of projects) {
        const projSettings = path.join(projectsDir, proj, 'settings.local.json');
        if (fs.existsSync(projSettings)) {
          files.push({ path: projSettings, scope: `project:${proj}` });
        }
      }
    } catch (e) {
      // Ignore read errors
    }
  }

  return files;
}

/**
 * Extract permissions from settings file
 */
function extractPermissions(settingsPath) {
  try {
    const content = fs.readFileSync(settingsPath, 'utf-8');
    const settings = JSON.parse(content);

    const permissions = [];

    // Check permissions.allow array
    if (settings.permissions?.allow) {
      permissions.push(...settings.permissions.allow);
    }

    // Check allowedTools (older format)
    if (settings.allowedTools) {
      permissions.push(...settings.allowedTools);
    }

    return permissions;
  } catch (e) {
    return [];
  }
}

/**
 * Scan a permission string for dangerous patterns
 */
function scanPermission(permission) {
  const issues = [];

  for (const { pattern, level, desc } of DANGEROUS_PATTERNS) {
    if (pattern.test(permission)) {
      issues.push({ level, desc, pattern: pattern.toString(), match: permission });
    }
  }

  return issues;
}

/**
 * Run full audit
 */
function audit(options = {}) {
  const { projectDir = process.cwd(), global: scanGlobal = true } = options;

  const results = {
    scanned: 0,
    issues: {
      critical: [],
      high: [],
      medium: [],
    },
    files: [],
  };

  const files = findSettingsFiles(scanGlobal ? projectDir : null);
  results.scanned = files.length;
  results.files = files.map(f => f.path);

  for (const { path: filePath, scope } of files) {
    const permissions = extractPermissions(filePath);

    for (const perm of permissions) {
      const issues = scanPermission(perm);

      for (const issue of issues) {
        const entry = {
          ...issue,
          file: filePath,
          scope,
          permission: perm,
        };

        results.issues[issue.level].push(entry);
      }
    }
  }

  return results;
}

/**
 * Generate markdown report
 */
function generateReport(results) {
  const { scanned, issues, files } = results;
  const totalIssues = issues.critical.length + issues.high.length + issues.medium.length;

  let report = `# Permission Audit Report

**Date**: ${new Date().toISOString().split('T')[0]}
**Scanned**: ${scanned} files
**Issues**: ${totalIssues} found

`;

  // Critical issues
  report += `## 🔴 Critical Issues (${issues.critical.length})\n\n`;
  if (issues.critical.length === 0) {
    report += 'None found.\n\n';
  } else {
    issues.critical.forEach((issue, i) => {
      report += `### ${i + 1}. ${issue.desc}
**Location**: ${issue.file}
**Pattern**: \`${issue.permission}\`
**Risk**: ${issue.desc}

`;
    });
  }

  // High risk
  report += `## 🟠 High Risk (${issues.high.length})\n\n`;
  if (issues.high.length === 0) {
    report += 'None found.\n\n';
  } else {
    issues.high.forEach((issue, i) => {
      report += `### ${i + 1}. ${issue.desc}
**Location**: ${issue.file}
**Pattern**: \`${issue.permission}\`
**Risk**: ${issue.desc}

`;
    });
  }

  // Medium risk
  report += `## 🟡 Medium Risk (${issues.medium.length})\n\n`;
  if (issues.medium.length === 0) {
    report += 'None found.\n\n';
  } else {
    issues.medium.forEach((issue, i) => {
      report += `### ${i + 1}. ${issue.desc}
**Location**: ${issue.file}
**Pattern**: \`${issue.permission}\`

`;
    });
  }

  // Summary
  report += `## Summary

| Level | Count | Action |
|-------|-------|--------|
| 🔴 Critical | ${issues.critical.length} | Must remove |
| 🟠 High | ${issues.high.length} | Should review |
| 🟡 Medium | ${issues.medium.length} | Optional review |

`;

  return report;
}

/**
 * Check if audit passes (for CI)
 */
function passes(results, options = {}) {
  const { allowMedium = true, allowHigh = false } = options;

  if (results.issues.critical.length > 0) return false;
  if (!allowHigh && results.issues.high.length > 0) return false;
  if (!allowMedium && results.issues.medium.length > 0) return false;

  return true;
}

module.exports = {
  audit,
  generateReport,
  passes,
  DANGEROUS_PATTERNS,
  findSettingsFiles,
  extractPermissions,
  scanPermission,
};
