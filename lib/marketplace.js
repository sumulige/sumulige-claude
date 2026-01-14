/**
 * Marketplace Commands
 *
 * Commands for managing the skill marketplace and external skill sources.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.join(__dirname, '..');
const SOURCES_FILE = path.join(ROOT_DIR, 'sources.yaml');
const MARKETPLACE_FILE = path.join(ROOT_DIR, '.claude-plugin', 'marketplace.json');
const CATEGORIES_FILE = path.join(ROOT_DIR, 'config', 'skill-categories.json');
const TEMPLATE_SKILLS_DIR = path.join(ROOT_DIR, 'template', '.claude', 'skills');

// ============================================================================
// Logging Utilities
// ============================================================================

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

// ============================================================================
// YAML Parser (Simple)
// ============================================================================

function parseSimpleYaml(content) {
  const result = { skills: [] };
  let currentSection = null;
  let currentSkill = null;
  let currentKey = null;

  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    const indent = line.search(/\S/);

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) {
      return;
    }

    // Version
    if (trimmed.startsWith('version:')) {
      result.version = parseInt(trimmed.split(':')[1].trim());
      return;
    }

    // Skills array starts
    if (trimmed === 'skills:') {
      currentSection = 'skills';
      return;
    }

    // New skill entry (starts with -)
    if (trimmed.startsWith('- name:')) {
      if (currentSkill) {
        result.skills.push(currentSkill);
      }
      currentSkill = { name: trimmed.split(':')[1].trim() };
      return;
    }

    // Skill properties
    if (currentSection === 'skills' && currentSkill) {
      // Determine nesting level by indent
      const isTopLevel = indent === 2;

      if (isTopLevel) {
        const match = trimmed.match(/^([\w-]+):\s*(.*)$/);
        if (match) {
          currentKey = match[1];
          let value = match[2].trim();

          // Handle arrays
          if (value === '[]') {
            value = [];
          } else if (value === 'true') {
            value = true;
          } else if (value === 'false') {
            value = false;
          } else if (value.startsWith('"') || value.startsWith("'")) {
            value = value.slice(1, -1);
          }

          currentSkill[currentKey] = value;

          // Initialize nested objects
          if (['source', 'target', 'author', 'sync'].includes(currentKey)) {
            currentSkill[currentKey] = {};
          }
        }
      } else if (currentKey) {
        // Nested property
        const match = trimmed.match(/^([\w-]+):\s*(.*)$/);
        if (match) {
          let value = match[2].trim();
          if (value === 'true') value = true;
          if (value === 'false') value = false;
          if (value === '[]') value = [];
          currentSkill[currentKey][match[1]] = value;
        }
      }
    }
  });

  // Push last skill
  if (currentSkill) {
    result.skills.push(currentSkill);
  }

  return result;
}

// ============================================================================
// Marketplace Commands
// ============================================================================

const marketplaceCommands = {
  // -------------------------------------------------------------------------
  'marketplace:list': () => {
    log('📋 SMC Skill Marketplace', 'blue');
    log('=====================================', 'gray');
    log('');

    // Load marketplace registry
    let registry = { plugins: [], metadata: { skill_count: 0, categories: {} } };
    if (fs.existsSync(MARKETPLACE_FILE)) {
      try {
        registry = JSON.parse(fs.readFileSync(MARKETPLACE_FILE, 'utf-8'));
      } catch (e) {
        log('Warning: Failed to parse marketplace.json', 'yellow');
      }
    }

    // Load sources.yaml
    let sources = { skills: [] };
    if (fs.existsSync(SOURCES_FILE)) {
      try {
        const content = fs.readFileSync(SOURCES_FILE, 'utf-8');
        sources = parseSimpleYaml(content);
      } catch (e) {
        log('Warning: Failed to parse sources.yaml', 'yellow');
      }
    }

    // Display by category
    const categories = registry.metadata.categories || {
      tools: { name: 'CLI 工具', icon: '🔧' },
      workflow: { name: '工作流编排', icon: '🎼' },
      development: { name: '开发辅助', icon: '💻' },
      productivity: { name: '效率工具', icon: '⚡' },
      automation: { name: '自动化', icon: '🤖' },
      data: { name: '数据处理', icon: '📊' },
      documentation: { name: '文档', icon: '📚' }
    };

    // Group skills by category
    const byCategory = {};
    for (const [key, cat] of Object.entries(categories)) {
      byCategory[key] = [];
    }

    // Add from registry
    for (const plugin of registry.plugins) {
      if (plugin.skill_list) {
        for (const skill of plugin.skill_list) {
          if (byCategory[skill.category]) {
            byCategory[skill.category].push({
              name: skill.name,
              description: skill.description,
              external: skill.external
            });
          }
        }
      }
    }

    // Add from sources.yaml
    for (const skill of sources.skills) {
      const cat = skill.target?.category || 'tools';
      if (!byCategory[cat]) {
        byCategory[cat] = [];
      }
      if (!byCategory[cat].some(s => s.name === skill.name)) {
        byCategory[cat].push({
          name: skill.name,
          description: skill.description,
          native: skill.native
        });
      }
    }

    // Display
    for (const [key, skills] of Object.entries(byCategory)) {
      if (skills.length === 0) continue;

      const cat = categories[key] || { name: key, icon: '📁' };
      log(`${cat.icon} ${cat.name}`, 'cyan');
      log('', 'gray');

      for (const skill of skills) {
        const badge = skill.native ? ' [native]' : skill.external ? ' [external]' : '';
        log(`  ${skill.name}${badge}`, 'green');
        if (skill.description) {
          log(`    ${skill.description}`, 'gray');
        }
      }
      log('', 'gray');
    }

    log('=====================================', 'gray');
    log(`Total: ${registry.metadata.skill_count || sources.skills.length} skills`, 'gray');
    log('', 'gray');
    log('Commands:', 'gray');
    log('  smc marketplace:install <name>   Install a skill', 'gray');
    log('  smc marketplace:sync             Sync external skills', 'gray');
    log('  smc marketplace:add <repo>       Add external source', 'gray');
  },

  // -------------------------------------------------------------------------
  'marketplace:install': (skillName) => {
    if (!skillName) {
      log('Usage: smc marketplace:install <skill-name>', 'yellow');
      log('', 'gray');
      log('Examples:', 'gray');
      log('  smc marketplace:install dev-browser', 'gray');
      log('  smc marketplace:install gastown', 'gray');
      return;
    }

    log(`📦 Installing skill: ${skillName}`, 'blue');
    log('', 'gray');

    // Load sources.yaml to find the skill
    let sources = { skills: [] };
    if (fs.existsSync(SOURCES_FILE)) {
      try {
        const content = fs.readFileSync(SOURCES_FILE, 'utf-8');
        sources = parseSimpleYaml(content);
      } catch (e) {
        log('Warning: Failed to parse sources.yaml', 'yellow');
      }
    }

    const skill = sources.skills.find(s => s.name === skillName);
    if (!skill) {
      log(`Skill "${skillName}" not found in sources.yaml`, 'yellow');
      log('', 'gray');
      log('Available skills:', 'gray');
      log('  smc marketplace:list', 'gray');
      return;
    }

    // Native skills are already in the repo
    if (skill.native) {
      log(`✅ Skill "${skillName}" is a native skill, already available at:`, 'green');
      log(`   ${skill.target.path}`, 'gray');
      return;
    }

    // External skills - sync them
    log(`Syncing from external source...`, 'gray');

    try {
      execSync('npm run sync', { stdio: 'inherit' });
      log(``, 'gray');
      log(`✅ Skill "${skillName}" installed`, 'green');
    } catch (e) {
      log(`❌ Failed to install skill`, 'red');
    }
  },

  // -------------------------------------------------------------------------
  'marketplace:sync': () => {
    log('🔄 Syncing external skills...', 'blue');
    log('', 'gray');

    try {
      execSync('npm run sync:all', { stdio: 'inherit' });
      log('', 'gray');
      log('✅ Sync complete', 'green');
    } catch (e) {
      log('❌ Sync failed', 'red');
    }
  },

  // -------------------------------------------------------------------------
  'marketplace:add': (repo) => {
    if (!repo) {
      log('Usage: smc marketplace:add <owner/repo>', 'yellow');
      log('', 'gray');
      log('This command adds an external skill repository to sources.yaml', 'gray');
      log('', 'gray');
      log('Example:', 'gray');
      log('  smc marketplace:add SawyerHood/dev-browser', 'gray');
      return;
    }

    // Parse repo
    const match = repo.match(/^([^/]+)\/(.+)$/);
    if (!match) {
      log('Invalid repo format. Use: owner/repo', 'red');
      return;
    }

    const [, owner, name] = match;
    const skillName = name.toLowerCase().replace(/[^a-z0-9-]/g, '-');

    log(`📝 Adding skill source: ${repo}`, 'blue');
    log('', 'gray');

    // Check sources.yaml exists
    if (!fs.existsSync(SOURCES_FILE)) {
      log(`sources.yaml not found. Creating...`, 'yellow');
      fs.writeFileSync(SOURCES_FILE, `version: 1\nskills:\n`);
    }

    // Read existing sources
    const content = fs.readFileSync(SOURCES_FILE, 'utf-8');
    const lines = content.split('\n');

    // Check if skill already exists
    if (lines.some(l => l.includes(`name: ${skillName}`))) {
      log(`Skill "${skillName}" already exists in sources.yaml`, 'yellow');
      return;
    }

    // Find where to insert (after existing skills or before # Comments)
    let insertIndex = lines.length;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('#') && lines[i].includes('Schema')) {
        insertIndex = i;
        break;
      }
    }

    // Build new skill entry
    const newEntry = `
  # ─────────────────────────────────────────────────────────────────────────────
  # ${skillName} - External skill from ${repo}
  # ─────────────────────────────────────────────────────────────────────────────
  - name: ${skillName}
    description: "TODO: Add description for ${skillName}"
    source:
      repo: ${repo}
      path: skills/${skillName}
      ref: main
    target:
      category: tools
      path: template/.claude/skills/tools/${skillName}
    author:
      name: ${owner}
      github: ${owner}
    license: MIT
    homepage: https://github.com/${repo}
    verified: false
`;

    // Insert new entry
    lines.splice(insertIndex, 0, newEntry.trim());

    // Write back
    fs.writeFileSync(SOURCES_FILE, lines.join('\n'));

    log(`✅ Added "${skillName}" to sources.yaml`, 'green');
    log('', 'gray');
    log('Next steps:', 'gray');
    log(`  1. Edit sources.yaml to update description and category`, 'gray');
    log(`  2. Run: smc marketplace:sync`, 'gray');
  },

  // -------------------------------------------------------------------------
  'marketplace:remove': (skillName) => {
    if (!skillName) {
      log('Usage: smc marketplace:remove <skill-name>', 'yellow');
      return;
    }

    log(`🗑️  Removing skill: ${skillName}`, 'blue');
    log('', 'gray');

    // Read sources.yaml
    if (!fs.existsSync(SOURCES_FILE)) {
      log('sources.yaml not found', 'yellow');
      return;
    }

    const content = fs.readFileSync(SOURCES_FILE, 'utf-8');
    const lines = content.split('\n');

    // Find and remove the skill entry
    let inSkillEntry = false;
    let removed = false;
    const newLines = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check if this is the skill to remove
      if (line.includes(`name: ${skillName}`) && line.trim().startsWith('-')) {
        inSkillEntry = true;
        removed = true;
        continue;
      }

      // Skip lines while in the skill entry
      if (inSkillEntry) {
        // End of skill entry
        if (line.trim().startsWith('- name:') || line.trim().startsWith('#')) {
          inSkillEntry = false;
          newLines.push(line);
        }
        continue;
      }

      newLines.push(line);
    }

    if (!removed) {
      log(`Skill "${skillName}" not found in sources.yaml`, 'yellow');
      return;
    }

    // Write back
    fs.writeFileSync(SOURCES_FILE, newLines.join('\n'));

    log(`✅ Removed "${skillName}" from sources.yaml`, 'green');
    log('', 'gray');
    log('Note: The skill files remain in the template directory.', 'yellow');
    log('      To remove them, delete:', 'yellow');
    log(`      template/.claude/skills/*/${skillName}`, 'gray');
  },

  // -------------------------------------------------------------------------
  'marketplace:status': () => {
    log('📊 Marketplace Status', 'blue');
    log('=====================================', 'gray');
    log('');

    // Check marketplace.json
    if (fs.existsSync(MARKETPLACE_FILE)) {
      const registry = JSON.parse(fs.readFileSync(MARKETPLACE_FILE, 'utf-8'));
      log(`Registry: ${MARKETPLACE_FILE}`, 'green');
      log(`Version: ${registry.metadata.version}`, 'gray');
      log(`Skills: ${registry.metadata.skill_count}`, 'gray');
      log(`Updated: ${registry.metadata.generated_at}`, 'gray');
    } else {
      log(`Registry: Not found (run: smc marketplace:sync)`, 'yellow');
    }

    log('');

    // Check sources.yaml
    if (fs.existsSync(SOURCES_FILE)) {
      const content = fs.readFileSync(SOURCES_FILE, 'utf-8');
      const sources = parseSimpleYaml(content);
      log(`Sources: ${SOURCES_FILE}`, 'green');
      log(`External sources: ${sources.skills.filter(s => !s.native).length}`, 'gray');
      log(`Native skills: ${sources.skills.filter(s => s.native).length}`, 'gray');
    } else {
      log(`Sources: Not found`, 'yellow');
    }

    log('');
    log('=====================================', 'gray');
  }
};

// ============================================================================
// Exports
// ============================================================================

exports.marketplaceCommands = marketplaceCommands;
