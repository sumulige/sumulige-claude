/**
 * Agent Executor - 执行控制
 *
 * 负责执行 Agent 任务并记录日志
 */

const fs = require('fs');
const path = require('path');
const { buildInstruction } = require('./prompts');
const { observeRequest } = require('../memory-observability');
const { loadGuardrails, shouldDegrade, GuardrailMonitor } = require('../memory-cost');
const { AgentRuntime } = require('../runtime/agent-runtime');

class AgentExecutor {
  constructor(registry, options = {}) {
    this.registry = registry;
    this.logDir = options.logDir || '.claude/agent-logs';
    this.dryRun = options.dryRun || false;
    this.requestId = null;
    this.traceId = null;
    this.spanId = null;
    this.guardrails = loadGuardrails(process.cwd());
    this.monitor = new GuardrailMonitor({
      size: 200,
      storagePath: options.guardrailWindowPath || path.join(process.cwd(), '.claude', 'agent-logs', 'guardrail-window.json')
    });
    this.runtime = new AgentRuntime({
      guardrails: this.guardrails,
      monitor: this.monitor,
      ...(options.runtime || {})
    });
  }

  /**
   * 执行 Agent 任务
   * @param {string} agentName - Agent 名称
   * @param {string} task - 任务描述
   * @param {Object} context - 上下文信息
   */
  async execute(agentName, task, context = {}) {
    const started = Date.now();
    this.requestId = process.env.SMC_REQUEST_ID || `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    this.traceId = process.env.SMC_TRACE_ID || this.requestId;
    this.spanId = `span_${Math.random().toString(36).slice(2, 8)}`;
    this.parentSpanId = process.env.SMC_PARENT_SPAN_ID || null;
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

    // Observability & guardrails
    const latencyMs = Date.now() - started;

    observeRequest({
      path: 'agent_instruction',
      latencyMs,
      hit: true,
      costUsd: null,
      extra: { agent: agentName, request_id: this.requestId, trace_id: this.traceId, span_id: this.spanId, parent_span_id: this.parentSpanId }
    });

    this.monitor.addSample({ latencyMs });

    if (shouldDegrade(this.guardrails, { latencyMs }, this.monitor)) {
      execution.degraded = true;
      execution.degradeActions = this.guardrails?.degrade?.actions || [];
      if (!this.options.silent) {
        console.log('⚠️  Guardrail triggered: applying degrade actions:', execution.degradeActions.join(', '));
      }

      // Apply lightweight degradations here (non-invasive defaults)
      if (execution.degradeActions.includes('disable_rerank')) {
        execution.hints = execution.hints || [];
        execution.hints.push('rerank:disabled');
      }
      if (execution.degradeActions.includes('fallback_local_cache')) {
        execution.hints = execution.hints || [];
        execution.hints.push('cache:prefer');
      }
      if (execution.degradeActions.includes('limit_hops_to_1')) {
        execution.hints = execution.hints || [];
        execution.hints.push('max_hops:1');
      }
    }

    // runtime 执行（占位，串联 degrade 行为）
    const runtimeResult = await this.runtime.run({
      agent: agentName,
      task,
      context,
      requestId: this.requestId,
      traceId: this.traceId,
      spanId: this.spanId,
      parentSpanId: this.parentSpanId,
      actions: {
        degraded: execution.degraded,
        hints: execution.hints || [],
        memoryIndex: context.memoryIndex
      }
    });

    execution.runtime = runtimeResult;
    // 自动滚动 memory (可配置关闭)
    if (process.env.SMC_MEMORY_AUTOROLL === '1') {
      try {
        require('../memory/rolling-store').rotate(process.cwd());
      } catch {
        /* ignore */
      }
    }

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
