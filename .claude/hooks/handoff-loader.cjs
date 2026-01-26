#!/usr/bin/env node
/**
 * Handoff Loader - 交接文档加载器
 *
 * 在 SessionStart 时检查是否有最近的 handoff 文档
 * 如果存在且在 2 小时内，优先加载以恢复上下文
 */

const fs = require('fs');
const path = require('path');

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const HANDOFFS_DIR = path.join(PROJECT_DIR, '.claude/handoffs');
const LATEST_FILE = path.join(HANDOFFS_DIR, 'LATEST.md');
const COMPACT_STATE = path.join(PROJECT_DIR, '.claude/.compact-state.json');

const VALIDITY_HOURS = 2;

class HandoffLoader {
  /**
   * 检查并加载最近的 handoff
   * @returns {Object|null} 解析后的 handoff 内容或 null
   */
  loadIfRecent() {
    if (!fs.existsSync(LATEST_FILE)) {
      return null;
    }

    const ageHours = this.getHandoffAge();
    if (ageHours > VALIDITY_HOURS) {
      return null;
    }

    const content = fs.readFileSync(LATEST_FILE, 'utf-8');
    return this.parseHandoff(content);
  }

  /**
   * 获取 handoff 文件年龄（小时）
   */
  getHandoffAge() {
    try {
      const stat = fs.statSync(LATEST_FILE);
      return (Date.now() - stat.mtimeMs) / (1000 * 60 * 60);
    } catch (e) {
      return Infinity;
    }
  }

  /**
   * 解析 handoff 文档
   */
  parseHandoff(content) {
    const sections = {};

    const sectionPatterns = {
      sessionInfo: /## Session Info\n([\s\S]*?)(?=\n## |$)/,
      memoryState: /## Memory State\n([\s\S]*?)(?=\n## |$)/,
      activeTodos: /## Active TODOs[^\n]*\n([\s\S]*?)(?=\n## |$)/,
      recentFiles: /## Recently Modified Files[^\n]*\n([\s\S]*?)(?=\n## |$)/,
      recoveryCommands: /## Recovery Commands\n([\s\S]*?)(?=\n## |$)/
    };

    for (const [key, pattern] of Object.entries(sectionPatterns)) {
      const match = content.match(pattern);
      sections[key] = match ? match[1].trim() : '';
    }

    return {
      raw: content,
      sections,
      ageHours: this.getHandoffAge(),
      hasContent: Object.values(sections).some(s => s.length > 0)
    };
  }

  /**
   * 加载压缩状态
   */
  loadCompactState() {
    if (!fs.existsSync(COMPACT_STATE)) {
      return null;
    }

    try {
      return JSON.parse(fs.readFileSync(COMPACT_STATE, 'utf-8'));
    } catch (e) {
      return null;
    }
  }

  /**
   * 生成恢复上下文
   */
  generateRecoveryContext() {
    const handoff = this.loadIfRecent();
    const compactState = this.loadCompactState();

    if (!handoff && !compactState) {
      return null;
    }

    const context = {
      source: handoff ? 'handoff' : 'compact-state',
      timestamp: Date.now()
    };

    if (handoff) {
      context.handoff = {
        ageHours: handoff.ageHours,
        activeTodos: handoff.sections.activeTodos,
        recentFiles: handoff.sections.recentFiles
      };
    }

    if (compactState) {
      context.compact = {
        level: compactState.level,
        summary: compactState.summary,
        itemsKept: compactState.itemsKept
      };
    }

    return context;
  }
}

// CLI 测试入口
if (require.main === module) {
  const isTest = process.argv.includes('--test');

  const loader = new HandoffLoader();

  if (isTest) {
    console.log('=== Handoff Loader Test ===\n');

    console.log(`LATEST.md exists: ${fs.existsSync(LATEST_FILE)}`);

    if (fs.existsSync(LATEST_FILE)) {
      const age = loader.getHandoffAge();
      console.log(`Handoff age: ${age.toFixed(2)} hours`);
      console.log(`Valid (< ${VALIDITY_HOURS}h): ${age < VALIDITY_HOURS}`);

      const handoff = loader.loadIfRecent();
      if (handoff) {
        console.log('\nParsed sections:');
        for (const [key, value] of Object.entries(handoff.sections)) {
          console.log(`- ${key}: ${value ? value.slice(0, 50) + '...' : '(empty)'}`);
        }
      } else {
        console.log('\nHandoff too old, not loaded');
      }
    }

    const recovery = loader.generateRecoveryContext();
    if (recovery) {
      console.log('\n--- Recovery Context ---');
      console.log(JSON.stringify(recovery, null, 2));
    }
  } else {
    const context = loader.generateRecoveryContext();
    if (context) {
      console.log(JSON.stringify(context, null, 2));
    } else {
      console.log('No recent handoff or compact state found');
    }
  }
}

module.exports = {
  HandoffLoader,
  VALIDITY_HOURS
};
