#!/usr/bin/env node

/**
 * Prepublish Check Script
 * 发布前检查脚本 - 确保所有必要文件存在且格式正确
 */

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')

const REQUIRED_FILES = [
  'cli.js',
  'README.md',
  'LICENSE',
  'package.json',
  '.claude/skills/react-node-practices/SKILL.md',
  '.claude/rules/coding-style.md',
  '.claude/rules/security.md',
  '.claude/rules/testing.md',
  '.claude/rules/performance.md'
]

const REQUIRED_DIRS = [
  'template',
  '.claude/skills',
  '.claude/rules',
  '.claude/commands'
]

console.log('🔍 Prepublish Check / 发布前检查\n')

let hasError = false

// Check required files
console.log('📄 Checking required files...')
for (const file of REQUIRED_FILES) {
  const fullPath = path.join(ROOT, file)
  if (fs.existsSync(fullPath)) {
    console.log(`  ✅ ${file}`)
  } else {
    console.log(`  ❌ ${file} - MISSING`)
    hasError = true
  }
}

// Check required directories
console.log('\n📁 Checking required directories...')
for (const dir of REQUIRED_DIRS) {
  const fullPath = path.join(ROOT, dir)
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
    const files = fs.readdirSync(fullPath)
    console.log(`  ✅ ${dir} (${files.length} items)`)
  } else {
    console.log(`  ❌ ${dir} - MISSING`)
    hasError = true
  }
}

// Check package.json
console.log('\n📦 Checking package.json...')
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'))

const requiredFields = ['name', 'version', 'description', 'main', 'bin', 'files', 'keywords', 'author', 'license']
for (const field of requiredFields) {
  if (pkg[field]) {
    console.log(`  ✅ ${field}: ${typeof pkg[field] === 'object' ? '(configured)' : pkg[field]}`)
  } else {
    console.log(`  ❌ ${field} - MISSING`)
    hasError = true
  }
}

// Check Skills have metadata
console.log('\n🎯 Checking Skills metadata...')
const skillsDir = path.join(ROOT, '.claude/skills')
if (fs.existsSync(skillsDir)) {
  const skills = fs.readdirSync(skillsDir).filter(f => {
    const skillPath = path.join(skillsDir, f)
    return fs.statSync(skillPath).isDirectory() && f !== 'examples'
  })

  for (const skill of skills) {
    const skillPath = path.join(skillsDir, skill)
    const hasSkillMd = fs.existsSync(path.join(skillPath, 'SKILL.md'))
    const hasMetadata = fs.existsSync(path.join(skillPath, 'metadata.yaml'))

    if (hasSkillMd) {
      console.log(`  ✅ ${skill}/SKILL.md`)
    } else {
      console.log(`  ⚠️ ${skill}/SKILL.md - MISSING (optional)`)
    }
  }
}

// Check Rules have priority tags
console.log('\n📋 Checking Rules priority tags...')
const rulesDir = path.join(ROOT, '.claude/rules')
if (fs.existsSync(rulesDir)) {
  const rules = fs.readdirSync(rulesDir).filter(f => f.endsWith('.md'))

  for (const rule of rules) {
    const content = fs.readFileSync(path.join(rulesDir, rule), 'utf-8')
    const hasPriority = content.includes('🔴') || content.includes('🟠') || content.includes('🟡') || content.includes('🟢')

    if (hasPriority) {
      console.log(`  ✅ ${rule} (has priority tags)`)
    } else {
      console.log(`  ⚠️ ${rule} (no priority tags)`)
    }
  }
}

// Summary
console.log('\n' + '─'.repeat(50))
if (hasError) {
  console.log('❌ Prepublish check FAILED. Please fix the issues above.')
  process.exit(1)
} else {
  console.log('✅ All checks passed! Ready to publish.')
  console.log('\nTo publish:')
  console.log('  npm publish')
  console.log('\nTo publish with tag:')
  console.log('  npm publish --tag beta')
}
