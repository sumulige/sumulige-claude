/**
 * Agent Executor - 执行控制
 *
 * 负责执行 Agent 任务并记录日志
 */

const fs = require('fs');
const path = require('path');
const { buildInstruction } = require('./prompts');

class AgentExecutor {
  constructor(registry, options = {}) {
    this.registry = registry;
    this.logDir = options.logDir || '.claude/agent-logs';
    this.dryRun = options.dryRun || false;
  }

  /**
   * 执行 Agent 任务
   * @param {string} agentName - Agent 名称
   * @param {string} task - 任务描述
   * @param {Object} context - 上下文信息
   */
  async execute(agentName, task, context = {}) {
    const agentInfo = this.registry.agents[agentName];
    if (!agentInfo) {
      throw new Error(`Unknown agent: ${agentName}`);
    }

    const instruction = buildInstruction(agentName, task, context);

    const execution = {
      id: this.generateId(),
      agent: agentName,
      task,
      timestamp: new Date().toISOString(),
      model: agentInfo.model || 'sonnet'
    };

    if (this.dryRun) {
      return {
        ...execution,
        dryRun: true,
        instruction
      };
    }

    this.logExecution(execution);

    return {
      ...execution,
      instruction
    };
  }

  /**
   * 生成执行 ID
   */
  generateId() {
    return `exec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  /**
   * 记录执行日志
   */
  logExecution(execution) {
    try {
      const projectDir = process.cwd();
      const logDir = path.join(projectDir, this.logDir);

      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      const today = new Date().toISOString().split('T')[0];
      const logFile = path.join(logDir, `${today}.jsonl`);

      fs.appendFileSync(logFile, JSON.stringify(execution) + '\n');
    } catch (e) {
      // 忽略日志错误
    }
  }

  /**
   * 格式化输出
   */
  formatOutput(result) {
    const lines = [
      '',
      `${'='.repeat(60)}`,
      `  Agent: ${result.agent.toUpperCase()}`,
      `  Model: ${result.model}`,
      `  Task:  ${result.task.slice(0, 50)}${result.task.length > 50 ? '...' : ''}`,
      `${'='.repeat(60)}`,
      ''
    ];

    if (result.dryRun) {
      lines.push('[DRY RUN - No execution]', '');
    }

    lines.push(result.instruction);

    return lines.join('\n');
  }
}

module.exports = { AgentExecutor };
