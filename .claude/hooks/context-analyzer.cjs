/**
 * Context Analyzer - 上下文内容分析器
 *
 * 从现有系统收集上下文信息，为 Strategic Compact 提供数据源
 */

const fs = require('fs');
const path = require('path');

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();

const PATHS = {
  todos: path.join(PROJECT_DIR, 'development/todos/active'),
  decisions: path.join(PROJECT_DIR, '.claude/decisions/DECISIONS.md'),
  memory: path.join(PROJECT_DIR, '.claude/MEMORY.md'),
  sessionState: path.join(PROJECT_DIR, '.claude/.session-state.json')
};

class ContextAnalyzer {
  constructor() {
    this.contentHashes = new Map();
  }

  /**
   * 收集所有上下文项目
   */
  collectContextItems() {
    const items = [];

    items.push(...this.collectTodos());
    items.push(...this.collectDecisions());
    items.push(...this.collectCodeChanges());
    items.push(...this.collectSessionErrors());

    return this.deduplicateItems(items);
  }

  /**
   * 收集活跃任务
   */
  collectTodos() {
    const items = [];

    if (!fs.existsSync(PATHS.todos)) {
      return items;
    }

    try {
      const files = fs.readdirSync(PATHS.todos).filter(f => f.endsWith('.md'));

      for (const file of files) {
        const content = fs.readFileSync(path.join(PATHS.todos, file), 'utf-8');
        const stat = fs.statSync(path.join(PATHS.todos, file));

        items.push({
          type: 'current-task',
          id: `todo:${file}`,
          content: content.slice(0, 500),
          timestamp: stat.mtimeMs,
          source: file,
          references: 0
        });
      }
    } catch (e) {
      // 忽略读取错误
    }

    return items;
  }

  /**
   * 收集决策记录
   */
  collectDecisions() {
    const items = [];

    if (!fs.existsSync(PATHS.decisions)) {
      return items;
    }

    try {
      const content = fs.readFileSync(PATHS.decisions, 'utf-8');
      const decisions = this.parseDecisions(content);

      for (const decision of decisions) {
        const isRecent = Date.now() - decision.timestamp < 24 * 60 * 60 * 1000;

        items.push({
          type: isRecent ? 'active-decision' : 'past-decision',
          id: `decision:${decision.id}`,
          content: decision.summary,
          timestamp: decision.timestamp,
          source: 'DECISIONS.md',
          references: decision.references || 0
        });
      }
    } catch (e) {
      // 忽略解析错误
    }

    return items;
  }

  /**
   * 解析决策文档
   */
  parseDecisions(content) {
    const decisions = [];
    const lines = content.split('\n');
    let currentDecision = null;

    for (const line of lines) {
      const match = line.match(/^## (D\d+):\s*(.+)/);
      if (match) {
        if (currentDecision) {
          decisions.push(currentDecision);
        }
        currentDecision = {
          id: match[1],
          summary: match[2],
          timestamp: Date.now() - decisions.length * 86400000,
          references: 0
        };
      }
    }

    if (currentDecision) {
      decisions.push(currentDecision);
    }

    return decisions;
  }

  /**
   * 收集最近代码变更
   */
  collectCodeChanges() {
    const items = [];

    try {
      const sessionState = this.loadSessionState();
      const modifiedFiles = sessionState?.modifiedFiles || [];

      for (const file of modifiedFiles.slice(0, 10)) {
        items.push({
          type: 'code-change',
          id: `change:${file}`,
          content: `Modified: ${file}`,
          timestamp: Date.now(),
          source: file,
          references: 0
        });
      }
    } catch (e) {
      // 忽略读取错误
    }

    return items;
  }

  /**
   * 收集会话错误上下文
   */
  collectSessionErrors() {
    const items = [];

    try {
      const sessionState = this.loadSessionState();
      const errors = sessionState?.errors || [];

      for (const error of errors) {
        items.push({
          type: 'error-context',
          id: `error:${this.hashContent(error.message)}`,
          content: error.message,
          timestamp: error.timestamp || Date.now(),
          source: error.source || 'session',
          references: 0
        });
      }
    } catch (e) {
      // 忽略读取错误
    }

    return items;
  }

  /**
   * 加载会话状态
   */
  loadSessionState() {
    if (!fs.existsSync(PATHS.sessionState)) {
      return null;
    }

    try {
      return JSON.parse(fs.readFileSync(PATHS.sessionState, 'utf-8'));
    } catch (e) {
      return null;
    }
  }

  /**
   * 去重：标记重复内容
   */
  deduplicateItems(items) {
    const seen = new Map();

    return items.map(item => {
      const hash = this.hashContent(item.content);

      if (seen.has(hash)) {
        return { ...item, type: 'redundant' };
      }

      seen.set(hash, true);
      return item;
    });
  }

  /**
   * 简单哈希
   */
  hashContent(content) {
    let hash = 0;
    const str = String(content);
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  /**
   * 获取上下文摘要统计
   */
  getSummary(items) {
    const byType = {};

    for (const item of items) {
      byType[item.type] = (byType[item.type] || 0) + 1;
    }

    return {
      total: items.length,
      byType,
      redundant: byType.redundant || 0
    };
  }
}

module.exports = {
  ContextAnalyzer,
  PATHS
};
