#!/usr/bin/env node
/**
 * Update Marketplace Registry
 *
 * This script scans the skills directory and generates the marketplace.json
 * registry file for Claude Code's native plugin system.
 *
 * Usage: node scripts/update-registry.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');
const MARKETPLACE_FILE = path.join(ROOT_DIR, '.claude-plugin', 'marketplace.json');
const SKILLS_DIR = path.join(ROOT_DIR, 'template', '.claude', 'skills');
const CATEGORIES_FILE = path.join(ROOT_DIR, 'config', 'skill-categories.json');

// ============================================================================
// Logging Utilities
// ============================================================================

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  gray: '\x1b[90m'
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

// ============================================================================
// File System Utilities
// ============================================================================

/**
 * Recursively find all skill directories
 */
function findSkillDirs(dir, basePath = dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const skills = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const fullPath = path.join(dir, entry.name);

      // Skip template and examples directories
      if (['template', 'examples', '__tests__'].includes(entry.name)) {
        continue;
      }

      // Check if this is a skill directory (contains SKILL.md or metadata.yaml)
      const hasSkillFile = fs.existsSync(path.join(fullPath, 'SKILL.md'));
      const hasMetadata = fs.existsSync(path.join(fullPath, 'metadata.yaml'));
      const hasSourceJson = fs.existsSync(path.join(fullPath, '.source.json'));

      if (hasSkillFile || hasMetadata || hasSourceJson) {
        const relativePath = path.relative(basePath, fullPath);
        skills.push({
          name: entry.name,
          path: fullPath,
          relativePath: relativePath,
          hasSourceJson
        });
      } else {
        // Recurse into subdirectories
        skills.push(...findSkillDirs(fullPath, basePath));
      }
    }
  }

  return skills;
}

/**
 * Parse YAML metadata file
 */
function parseMetadata(skillDir) {
  const metadataPath = path.join(skillDir, 'metadata.yaml');

  if (!fs.existsSync(metadataPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(metadataPath, 'utf8');
    // Simple YAML parser for basic key: value format
    const result = {};
    let currentKey = null;

    content.split('\n').forEach(line => {
      const trimmed = line.trim();

      // Skip comments and empty lines
      if (!trimmed || trimmed.startsWith('#')) {
        return;
      }

      // Key: Value pair
      const match = trimmed.match(/^([^:]+):\s*(.*)$/);
      if (match) {
        currentKey = match[1];
        let value = match[2];

        // Handle array values
        if (value.startsWith('[')) {
          try {
            value = JSON.parse(value.replace(/'/g, '"'));
          } catch (e) {
            value = [];
          }
        } else if (value === '[]') {
          value = [];
        } else if (value === 'true') {
          value = true;
        } else if (value === 'false') {
          value = false;
        }

        result[currentKey] = value;
      } else if (currentKey && trimmed.startsWith('-')) {
        // Array item continuation
        if (!Array.isArray(result[currentKey])) {
          result[currentKey] = [];
        }
        result[currentKey].push(trimmed.slice(1).trim());
      }
    });

    return result;
  } catch (error) {
    log(`Warning: Failed to parse ${metadataPath}`, 'yellow');
    return null;
  }
}

/**
 * Parse .source.json file
 */
function parseSourceJson(skillDir) {
  const sourcePath = path.join(skillDir, '.source.json');

  if (!fs.existsSync(sourcePath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(sourcePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

/**
 * Get skill description from SKILL.md
 */
function getSkillDescription(skillDir) {
  const skillPath = path.join(skillDir, 'SKILL.md');

  if (!fs.existsSync(skillPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(skillPath, 'utf-8');
    // Extract first heading or first paragraph
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      // Skip title
      if (trimmed.startsWith('#')) {
        continue;
      }
      // Return first non-empty, non-comment line
      if (trimmed && !trimmed.startsWith('>') && !trimmed.startsWith('<!--')) {
        return trimmed.replace(/^>/, '').trim();
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Determine skill category
 */
function getSkillCategory(skillPath, categories) {
  // Check if path contains a category
  const pathParts = skillPath.split(path.sep);

  for (const part of pathParts) {
    if (categories[part]) {
      return part;
    }
  }

  return 'tools'; // Default category
}

// ============================================================================
// Registry Generation
// ============================================================================

/**
 * Generate the marketplace.json registry
 */
function generateRegistry() {
  log('📋 Generating Marketplace Registry', 'blue');
  log('=====================================', 'gray');
  log('');

  // Load categories
  let categories = {};
  if (fs.existsSync(CATEGORIES_FILE)) {
    categories = JSON.parse(fs.readFileSync(CATEGORIES_FILE, 'utf-8')).categories || {};
  }

  // Find all skill directories
  log('Scanning skills directory...', 'gray');
  const skills = findSkillDirs(SKILLS_DIR);
  log(`Found ${skills.length} skill(s)`, 'gray');
  log('');

  if (skills.length === 0) {
    log('No skills found. Registry will be empty.', 'yellow');
    return;
  }

  // Build plugin entries
  const pluginSkills = [];

  for (const skill of skills) {
    log(`Processing: ${skill.name}`, 'gray');

    // Get metadata
    const metadata = parseMetadata(skill.path);
    const sourceJson = parseSourceJson(skill.path);
    const description = metadata?.description || getSkillDescription(skill.path) || 'No description';

    // Determine category
    const category = metadata?.category || getSkillCategory(skill.relativePath, categories);

    // Build relative path from .claude-plugin
    const relativeFromPlugin = path.join('..', 'template', '.claude', 'skills', skill.relativePath);

    pluginSkills.push({
      name: skill.name,
      description: description,
      path: `./${relativeFromPlugin}`,
      category: category,
      external: !!sourceJson
    });
  }

  // Build the full registry
  const registry = {
    name: 'smc-skills',
    description: 'Sumulige Claude Agent Harness - Curated skill collection for AI coding agents',
    homepage: 'https://github.com/sumulige/sumulige-claude',
    owner: {
      name: 'sumulige',
      email: 'sumulige@example.com'
    },
    plugins: [
      {
        name: 'smc-skills',
        description: 'Multi-agent orchestration harness with curated skills. Includes Conductor, Architect, Builder, Reviewer, Librarian agents plus RAG-based skill discovery system.',
        source: './',
        skills: pluginSkills.map(s => s.path),
        strict: false,
        skill_list: pluginSkills
      }
    ],
    metadata: {
      version: getPackageVersion(),
      generated_at: new Date().toISOString(),
      skill_count: skills.length,
      categories: categories
    }
  };

  // Write registry file
  log('', 'gray');
  log(`Writing registry to: ${MARKETPLACE_FILE}`, 'gray');
  fs.writeFileSync(MARKETPLACE_FILE, JSON.stringify(registry, null, 2));

  log('', 'gray');
  log('=====================================', 'gray');
  log(`✅ Registry generated with ${skills.length} skills`, 'green');
  log('=====================================', 'gray');
}

/**
 * Get package version
 */
function getPackageVersion() {
  try {
    const pkgPath = path.join(ROOT_DIR, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    return pkg.version || '1.0.0';
  } catch (error) {
    return '1.0.0';
  }
}

// ============================================================================
// Run
// ============================================================================

generateRegistry();
