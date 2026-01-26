/**
 * Agent Orchestrator - 主入口
 *
 * 提供统一的 Agent 编排接口
 */

const { AgentDispatcher } = require('./dispatcher');
const { AgentRouter } = require('./router');
const { AgentExecutor } = require('./executor');
const { AGENT_PROMPTS, getPrompt, buildInstruction } = require('./prompts');

let dispatcher = null;

/**
 * 获取或创建 Dispatcher 实例
 */
function getDispatcher(options = {}) {
  if (!dispatcher || options.force) {
    dispatcher = new AgentDispatcher(options);
  }
  return dispatcher;
}

/**
 * 分发任务到合适的 Agent
 * @param {string} task - 任务描述
 * @param {Object} options - 选项
 */
async function dispatch(task, options = {}) {
  const d = getDispatcher(options);
  return await d.dispatch(task, options);
}

/**
 * 列出所有可用 Agent
 */
function listAgents() {
  const d = getDispatcher();
  return d.listAgents();
}

/**
 * 获取 Agent 详情
 */
function getAgent(name) {
  const d = getDispatcher();
  return d.getAgent(name);
}

module.exports = {
  dispatch,
  listAgents,
  getAgent,
  getDispatcher,
  AgentDispatcher,
  AgentRouter,
  AgentExecutor,
  AGENT_PROMPTS,
  getPrompt,
  buildInstruction
};
