/**
 * Agent Dispatcher - 任务调度
 *
 * 接收任务，路由到合适的 Agent，协调执行
 */

const fs = require('fs');
const path = require('path');
const { buildContext } = require('../context');
const { AgentRouter } = require('./router');
const { AgentExecutor } = require('./executor');

class AgentDispatcher {
  constructor(options = {}) {
    this.registry = this.loadRegistry();
    this.router = new AgentRouter(this.registry);
    this.executor = new AgentExecutor(this.registry, options);
    this.options = options;
  }

  /**
   * 加载 Agent 注册表
   */
  loadRegistry() {
    const projectDir = process.cwd();
    const registryPath = path.join(projectDir, '.claude/agent-registry.json');

    if (fs.existsSync(registryPath)) {
      return JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
    }

    return require('../../config/defaults.json').agentRegistry || {
      agents: {},
      routing: { default: 'conductor', patterns: [] }
    };
  }

  /**
   * 分发任务
   * @param {string} task - 任务描述
   * @param {Object} options - 选项
   */
  async dispatch(task, options = {}) {
    const routeResult = this.router.route(task);

    if (this.options.verbose) {
      console.log(`Routing: ${task.slice(0, 30)}... → ${routeResult.agent}`);
      console.log(`Confidence: ${(routeResult.confidence * 100).toFixed(0)}%`);
      console.log(`Reason: ${routeResult.reason}`);
      console.log('');
    }

    const context = buildContext(routeResult.agent, { projectDir: process.cwd() });

    const result = await this.executor.execute(
      routeResult.agent,
      task,
      context
    );

    return {
      routing: routeResult,
      execution: result
    };
  }

  /**
   * 列出可用 Agent
   */
  listAgents() {
    return this.router.listAgents();
  }

  /**
   * 获取 Agent 详情
   */
  getAgent(name) {
    return this.router.getAgentInfo(name);
  }
}

module.exports = { AgentDispatcher };
