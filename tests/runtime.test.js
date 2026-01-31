const { GuardrailMonitor, shouldDegrade } = require('../lib/memory-cost');
const { AgentRuntime } = require('../lib/runtime/agent-runtime');

describe('AgentRuntime guardrail actions', () => {
  test('should disable rerank when guardrail triggered', async () => {
    const guardrails = {
      thresholds: { latency_ms_p99: 1 },
      degrade: { actions: ['disable_rerank', 'limit_hops_to_1'] }
    };
    const monitor = new GuardrailMonitor({ size: 5 });
    monitor.addSample({ latencyMs: 10 }); // 预填充高延迟，确保触发 p99
    const runtime = new AgentRuntime({ guardrails, monitor });

    const result = await runtime.run({
      agent: 'builder',
      task: 'dummy',
      context: {},
      actions: { hints: [] }
    });

    expect(result.retrieve.strategy.rerank).toBe(false);
    expect(result.retrieve.strategy.maxHops).toBe('max_hops:1');
  });
});

describe('GuardrailMonitor', () => {
  test('uses sliding window p99', () => {
    const guardrails = { thresholds: { latency_ms_p99: 5 } };
    const monitor = new GuardrailMonitor({ size: 3 });
    monitor.addSample({ latencyMs: 1 });
    monitor.addSample({ latencyMs: 2 });
    monitor.addSample({ latencyMs: 10 });

    // p99 ~ 10, should trigger
    const degrade = shouldDegrade(guardrails, { latencyMs: 0 }, monitor);
    expect(degrade).toBe(true);
  });
});
