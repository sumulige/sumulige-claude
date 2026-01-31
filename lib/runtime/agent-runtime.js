/**
 * AgentRuntime
 *
 * 负责执行完整管线：route → plan → retrieve → llm → post-process。
 * 当前实现聚焦于把 guardrail/observability action 真正落地到检索阶段，
 * 其余环节保持轻量占位，方便后续替换。
 */

const { observeRequest } = require('../memory-observability');
const { shouldDegrade } = require('../memory-cost');
const { defaultProviders } = require('./providers');

class AgentRuntime {
  constructor(options = {}) {
    this.guardrails = options.guardrails || null;
    this.monitor = options.monitor || null;
    // 支持通过环境变量动态加载 provider 模块
    if (options.providers) {
      this.providers = options.providers;
    } else if (process.env.SMC_PROVIDER_MODULE) {
      try {
        // eslint-disable-next-line import/no-dynamic-require, global-require
        this.providers = require(process.env.SMC_PROVIDER_MODULE);
      } catch (e) {
        this.providers = defaultProviders;
      }
    } else {
      this.providers = defaultProviders;
    }
    this.options = options;
  }

  /**
   * 执行单次任务
   * @param {Object} params
   * @param {string} params.agent
   * @param {string} params.task
   * @param {Object} params.context
   * @param {Object} params.actions 由 executor 传入的 degrade / hint
   */
  async run({ agent, task, context, actions = {}, requestId, traceId, spanId, parentSpanId = null }) {
    const started = Date.now();

    // Step 1: 规划（占位）
    const plan = this.buildPlan(task, actions);

    // Step 2: 检索（尊重 actions）
    const retrieveResult = await this.retrieve(plan, actions);

    // Step 3: 生成（占位）
    const generation = await this.generate(agent, task, context, retrieveResult);

    // Step 4: 观测
    observeRequest({
      path: 'runtime',
      latencyMs: Date.now() - started,
      hit: retrieveResult?.hit ?? null,
      costUsd: null,
      extra: { agent, degraded: actions?.degraded || false, request_id: requestId, trace_id: traceId, span_id: spanId, parent_span_id: parentSpanId }
    });

    return {
      plan,
      retrieve: retrieveResult,
      generation
    };
  }

  buildPlan(task, actions) {
    // 简单占位：未来可插 planner
    return {
      steps: ['retrieve', 'respond'],
      hints: actions?.hints || [],
      memoryIndex: actions?.memoryIndex
    };
  }

  async retrieve(plan, actions) {
    // 可插拔：此处仅模拟不同 degrade 行为
    const start = Date.now();

    const strategy = {
      rerank: !(actions?.hints || []).includes('rerank:disabled'),
      cachePrefer: (actions?.hints || []).includes('cache:prefer'),
      maxHops: (actions?.hints || []).find(h => h.startsWith('max_hops:')) || null
    };

    // 调用可插拔检索器
    let providerResult;
    try {
      providerResult = await this.providers.retrieve({
        strategy,
        hints: actions?.hints || [],
        memoryIndex: plan.memoryIndex || [],
        timeoutMs: this.options.retrieveTimeoutMs || 8000
      });
    } catch (e) {
      providerResult = { hit: false, chunks: [], latencyMs: Date.now() - start, error: e.message };
    }
    const result = {
      hit: providerResult?.hit ?? false,
      chunks: providerResult?.chunks || [],
      strategy,
      latencyMs: providerResult?.latencyMs ?? (Date.now() - start)
    };

    // 写入监控窗口
    if (this.monitor) {
      this.monitor.addSample({ latencyMs: result.latencyMs });
    }

    // guardrail 二次确认（在检索层）
    if (shouldDegrade(this.guardrails, { latencyMs: result.latencyMs }, this.monitor)) {
      result.degraded = true;
      result.strategy.rerank = false;
      result.strategy.maxHops = 'max_hops:1';
    }

    return result;
  }

  async generate(agent, task, context, retrieveResult) {
    try {
      return await this.providers.generate({
        agent,
        task,
        context,
        retrieve: retrieveResult,
        timeoutMs: this.options.generateTimeoutMs || 12000
      });
    } catch (e) {
      return {
        agent,
        task,
        context,
        retrieve: retrieveResult,
        text: '[fallback] generation failed, see error',
        error: e.message
      };
    }
  }
}

module.exports = { AgentRuntime };
