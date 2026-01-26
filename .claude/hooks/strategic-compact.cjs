#!/usr/bin/env node
/**
 * Strategic Compact - 智能上下文压缩
 *
 * 触发时机: PreCompact
 * 工作流程:
 * 1. 分析当前上下文内容
 * 2. 计算每项信息的优先级
 * 3. 根据压缩级别选择保留策略
 * 4. 生成压缩后的上下文摘要
 * 5. 保存状态供后续恢复
 */

const fs = require('fs');
const path = require('path');
const { PriorityScorer } = require('./priority-scorer.cjs');
const { ContextAnalyzer } = require('./context-analyzer.cjs');

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const STATE_FILE = path.join(PROJECT_DIR, '.claude/.compact-state.json');

const COMPACT_LEVELS = {
  LEVEL_1_DEDUP: { threshold: 0.70, name: 'dedup', keepPercent: 90 },
  LEVEL_2_SUMMARY: { threshold: 0.85, name: 'summary', keepPercent: 60 },
  LEVEL_3_SKELETON: { threshold: 0.95, name: 'skeleton', keepPercent: 30 }
};

class StrategicCompact {
  constructor() {
    this.scorer = new PriorityScorer();
    this.analyzer = new ContextAnalyzer();
  }

  /**
   * 主入口：执行压缩
   * @param {number} contextUsage - 当前 context 使用率 (0-1)
   */
  compact(contextUsage = 0.8) {
    const level = this.determineLevel(contextUsage);
    const items = this.analyzer.collectContextItems();
    const scored = this.scorer.scoreAndSort(items);
    const result = this.applyCompression(scored, level);

    this.saveState(result, level);
    return result;
  }

  /**
   * 确定压缩级别
   */
  determineLevel(contextUsage) {
    if (contextUsage >= COMPACT_LEVELS.LEVEL_3_SKELETON.threshold) {
      return COMPACT_LEVELS.LEVEL_3_SKELETON;
    }
    if (contextUsage >= COMPACT_LEVELS.LEVEL_2_SUMMARY.threshold) {
      return COMPACT_LEVELS.LEVEL_2_SUMMARY;
    }
    if (contextUsage >= COMPACT_LEVELS.LEVEL_1_DEDUP.threshold) {
      return COMPACT_LEVELS.LEVEL_1_DEDUP;
    }
    return null;
  }

  /**
   * 应用压缩策略
   */
  applyCompression(scoredItems, level) {
    if (!level) {
      return { items: scoredItems, compressed: false };
    }

    const keepCount = Math.ceil(scoredItems.length * (level.keepPercent / 100));
    const kept = scoredItems.slice(0, keepCount);
    const dropped = scoredItems.slice(keepCount);

    return {
      level: level.name,
      items: kept,
      dropped: dropped.length,
      summary: this.generateSummary(kept),
      compressed: true
    };
  }

  /**
   * 生成压缩摘要
   */
  generateSummary(items) {
    const byType = {};

    for (const item of items) {
      if (!byType[item.type]) {
        byType[item.type] = [];
      }
      byType[item.type].push(item);
    }

    const lines = ['# Context Summary (Strategic Compact)', ''];

    if (byType['current-task']?.length) {
      lines.push('## Active Tasks');
      for (const task of byType['current-task']) {
        lines.push(`- ${task.source}: ${task.content.slice(0, 100)}`);
      }
      lines.push('');
    }

    if (byType['active-decision']?.length) {
      lines.push('## Recent Decisions');
      for (const decision of byType['active-decision']) {
        lines.push(`- ${decision.id}: ${decision.content}`);
      }
      lines.push('');
    }

    if (byType['error-context']?.length) {
      lines.push('## Unresolved Errors');
      for (const error of byType['error-context']) {
        lines.push(`- ${error.content.slice(0, 100)}`);
      }
      lines.push('');
    }

    if (byType['code-change']?.length) {
      lines.push('## Recent Changes');
      for (const change of byType['code-change'].slice(0, 5)) {
        lines.push(`- ${change.content}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * 保存压缩状态
   */
  saveState(result, level) {
    const state = {
      timestamp: Date.now(),
      level: level?.name || 'none',
      itemsKept: result.items?.length || 0,
      itemsDropped: result.dropped || 0,
      summary: result.summary || ''
    };

    try {
      const dir = path.dirname(STATE_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    } catch (e) {
      console.error('Failed to save compact state:', e.message);
    }

    return state;
  }

  /**
   * 加载之前的压缩状态
   */
  loadState() {
    if (!fs.existsSync(STATE_FILE)) {
      return null;
    }

    try {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
    } catch (e) {
      return null;
    }
  }
}

// CLI 测试入口
if (require.main === module) {
  const isTest = process.argv.includes('--test');

  const compactor = new StrategicCompact();

  if (isTest) {
    console.log('=== Strategic Compact Test ===\n');

    const analyzer = new ContextAnalyzer();
    const items = analyzer.collectContextItems();
    console.log(`Collected ${items.length} context items`);
    console.log('Summary:', analyzer.getSummary(items));

    const result = compactor.compact(0.85);
    console.log('\nCompact Result:');
    console.log(`- Level: ${result.level || 'none'}`);
    console.log(`- Items kept: ${result.items?.length || 0}`);
    console.log(`- Items dropped: ${result.dropped || 0}`);

    if (result.summary) {
      console.log('\n--- Generated Summary ---');
      console.log(result.summary);
    }
  } else {
    const result = compactor.compact(0.8);
    console.log(JSON.stringify(result, null, 2));
  }
}

module.exports = {
  StrategicCompact,
  COMPACT_LEVELS
};
