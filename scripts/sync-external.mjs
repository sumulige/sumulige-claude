#!/usr/bin/env node
/**
 * Sync External Skills
 *
 * This script reads sources.yaml and syncs skills from external repositories.
 * It clones external repos, copies specified files, and generates source metadata.
 *
 * Usage: node scripts/sync-external.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import yaml from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');
const SOURCES_FILE = path.join(ROOT_DIR, 'sources.yaml');

// ============================================================================
// Logging Utilities
// ============================================================================

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  gray: '\x1b[90m'
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function logStep(num, total, message) {
  log(`[${num}/${total}] ${message}`, 'blue');
}

// ============================================================================
// File System Utilities
// ============================================================================

/**
 * Ensure a directory exists, create if not
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Recursively copy directory contents
 */
function copyRecursive(src, dest, include = [], exclude = []) {
  let count = 0;

  if (!fs.existsSync(src)) {
    return count;
  }

  const stat = fs.statSync(src);

  if (stat.isDirectory()) {
    ensureDir(dest);

    const entries = fs.readdirSync(src);

    for (const entry of entries) {
      // Check exclude patterns
      const excluded = exclude.some(pattern => {
        const regex = new RegExp(pattern.replace('*', '.*'));
        return regex.test(entry);
      });

      if (excluded) {
        continue;
      }

      // Check include patterns (if specified)
      if (include.length > 0) {
        const included = include.some(pattern => {
          const regex = new RegExp(pattern.replace('*', '.*'));
          return regex.test(entry);
        });
        if (!included) {
          continue;
        }
      }

      const srcPath = path.join(src, entry);
      const destPath = path.join(dest, entry);
      count += copyRecursive(srcPath, destPath, [], exclude);
    }
  } else {
    fs.copyFileSync(src, dest);
    count = 1;
  }

  return count;
}

/**
 * Remove directory recursively
 */
function removeDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
}

// ============================================================================
// Git Utilities
// ============================================================================

/**
 * Clone a Git repository to a temporary directory
 */
function cloneRepo(repo, ref, targetDir) {
  const url = `https://github.com/${repo}.git`;
  const command = `git clone --depth 1 --branch ${ref} ${url} ${targetDir}`;

  try {
    execSync(command, { stdio: 'pipe' });
    return true;
  } catch (error) {
    log(`Failed to clone ${repo}: ${error.message}`, 'red');
    return false;
  }
}

// ============================================================================
// Source Metadata
// ============================================================================

/**
 * Write .source.json file for a synced skill
 */
function writeSourceJson(skill, targetPath) {
  const sourceJson = {
    name: skill.name,
    description: skill.description,
    source: {
      repo: skill.source?.repo,
      path: skill.source?.path,
      ref: skill.source?.ref || 'main',
      synced_at: new Date().toISOString()
    },
    author: skill.author,
    license: skill.license,
    homepage: skill.homepage,
    verified: skill.verified || false
  };

  const sourceJsonPath = path.join(targetPath, '.source.json');
  fs.writeFileSync(sourceJsonPath, JSON.stringify(sourceJson, null, 2));
}

// ============================================================================
// Main Sync Logic
// ============================================================================

/**
 * Parse sources.yaml file
 */
function parseSources() {
  if (!fs.existsSync(SOURCES_FILE)) {
    log('sources.yaml not found!', 'red');
    return null;
  }

  const content = fs.readFileSync(SOURCES_FILE, 'utf8');
  return yaml.parse(content);
}

/**
 * Sync a single external skill
 */
function syncSkill(skill, index, total) {
  logStep(index, total, `Syncing: ${skill.name}`);

  // Skip native skills (maintained directly in repo)
  if (skill.native) {
    log(`  → Skipped (native skill)`, 'gray');
    return { success: true, skipped: true };
  }

  // Validate required fields
  if (!skill.source?.repo) {
    log(`  → Skipped (no source.repo)`, 'yellow');
    return { success: false, error: 'Missing source.repo' };
  }

  const targetPath = path.join(ROOT_DIR, skill.target.path);
  const tmpDir = path.join(ROOT_DIR, '.tmp', skill.name);

  try {
    // Clone repository
    log(`  → Cloning ${skill.source.repo}...`, 'gray');
    if (!cloneRepo(skill.source.repo, skill.source.ref || 'main', tmpDir)) {
      return { success: false, error: 'Clone failed' };
    }

    // Determine source path
    const sourcePath = path.join(tmpDir, skill.source.path || '');

    if (!fs.existsSync(sourcePath)) {
      log(`  → Source path not found: ${skill.source.path}`, 'yellow');
      removeDir(tmpDir);
      return { success: false, error: 'Source path not found' };
    }

    // Clear target directory
    removeDir(targetPath);
    ensureDir(targetPath);

    // Copy files
    const include = skill.sync?.include || [];
    const exclude = skill.sync?.exclude || ['node_modules', '*.lock'];

    log(`  → Copying files...`, 'gray');
    const count = copyRecursive(sourcePath, targetPath, include, exclude);

    // Write source metadata
    writeSourceJson(skill, targetPath);

    // Cleanup
    removeDir(tmpDir);

    log(`  → Synced ${count} files`, 'green');
    return { success: true, fileCount: count };

  } catch (error) {
    removeDir(tmpDir);
    log(`  → Error: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

/**
 * Main sync function
 */
function syncAll() {
  log('🔄 Syncing External Skills', 'blue');
  log('=====================================', 'gray');
  log('');

  const sources = parseSources();
  if (!sources || !sources.skills) {
    log('No skills found in sources.yaml', 'yellow');
    return;
  }

  const skills = sources.skills;
  const total = skills.length;

  log(`Found ${total} skill(s) in sources.yaml`, 'gray');
  log('');

  let synced = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < total; i++) {
    const result = syncSkill(skills[i], i + 1, total);

    if (result.success) {
      if (result.skipped) {
        skipped++;
      } else {
        synced++;
      }
    } else {
      failed++;
    }

    log('');
  }

  // Summary
  log('=====================================', 'gray');
  log(`✅ Synced: ${synced}`, 'green');
  log(`⏭️  Skipped: ${skipped}`, 'yellow');
  if (failed > 0) {
    log(`❌ Failed: ${failed}`, 'red');
  }
  log('=====================================', 'gray');
}

// ============================================================================
// Run
// ============================================================================

syncAll();
