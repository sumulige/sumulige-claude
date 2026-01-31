/**
 * 真实接入 Provider Skeleton
 * - 支持超时、重试（这里给出接口签名，调用方自行实现）
 * - 尊重 strategy.hints: rerank/cache/maxHops
 */

async function retrieve({ query, strategy, timeoutMs = 8000, signal }) {
  // TODO: 接入向量/keyword 检索与 rerank。这里返回占位结果。
  return {
    hit: strategy?.cachePrefer || false,
    chunks: [],
    latencyMs: 0
  };
}

async function generate({ agent, task, context, retrieve, timeoutMs = 12000, signal }) {
  // TODO: 接入 LLM（Claude/OpenAI 等），可根据 strategy 控制 max_hops/rerank 逻辑。
  return {
    agent,
    task,
    context,
    retrieve,
    text: '[provider-skeleton placeholder]',
    finish_reason: 'stub'
  };
}

module.exports = {
  retrieve,
  generate
};
