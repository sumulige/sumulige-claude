/**
 * Agent Router - 路由决策
 *
 * 根据任务内容匹配最合适的 Agent
 */

class AgentRouter {
  constructor(registry) {
    this.registry = registry;
    this.patterns = this.compilePatterns();
  }

  /**
   * 预编译路由模式
   */
  compilePatterns() {
    return this.registry.routing.patterns.map(p => ({
      regex: new RegExp(p.match, 'i'),
      agent: p.agent,
      priority: p.priority || 0
    }));
  }

  /**
   * 路由任务到合适的 Agent
   * @param {string} task - 任务描述
   * @returns {Object} 路由结果
   */
  route(task) {
    const matches = [];

    for (const pattern of this.patterns) {
      if (pattern.regex.test(task)) {
        matches.push({
          agent: pattern.agent,
          priority: pattern.priority,
          matched: pattern.regex.source
        });
      }
    }

    if (matches.length === 0) {
      return {
        agent: this.registry.routing.default,
        confidence: 0.5,
        reason: 'No pattern matched, using default agent'
      };
    }

    matches.sort((a, b) => b.priority - a.priority);
    const best = matches[0];

    return {
      agent: best.agent,
      confidence: matches.length === 1 ? 0.9 : 0.7,
      reason: `Matched pattern: ${best.matched}`,
      alternatives: matches.slice(1).map(m => m.agent)
    };
  }

  /**
   * 获取 Agent 信息
   */
  getAgentInfo(agentName) {
    return this.registry.agents[agentName] || null;
  }

  /**
   * 列出所有可用 Agent
   */
  listAgents() {
    return Object.entries(this.registry.agents).map(([name, info]) => ({
      name,
      ...info
    }));
  }
}

module.exports = { AgentRouter };
