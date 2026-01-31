/**
 * 示例 provider：使用内存向量与本地 LLM 占位
 * 真实接入时可替换为 Milvus/PGVector + OpenAI/Claude SDK。
 */

module.exports = {
  async retrieve({ strategy }) {
    // 示例：根据策略关闭 rerank，命中缓存则返回 hit
    return {
      hit: strategy.cachePrefer || false,
      chunks: [],
      latencyMs: 5
    };
  },

  async generate({ agent, task, context, retrieve }) {
    // 示例：返回占位文本
    return {
      agent,
      task,
      context,
      retrieve,
      note: 'local-rag example provider output'
    };
  }
};
