/**
 * Pluggable providers for runtime。
 * 默认使用占位实现，方便未来接入真实 RAG/LLM。
 */

const defaultProviders = {
  /**
   * 检索器：可替换为真实 RAG
   * @param {Object} params
   * @param {Object} params.strategy - 包含 rerank/cache/maxHops 等策略
   */
  async retrieve({ strategy }) {
    // 占位：模拟一次检索
    return {
      hit: strategy.cachePrefer || false,
      chunks: [],
      latencyMs: 0
    };
  },

  /**
   * 生成器：可替换为真实 LLM
   * @param {Object} params
   * @param {string} params.agent
   * @param {string} params.task
   * @param {Object} params.context
   * @param {Object} params.retrieve
   */
  async generate({ agent, task, context, retrieve }) {
    return {
      agent,
      task,
      context,
      retrieve,
      note: 'Generation stub – connect to LLM via providers.generate'
    };
  }
};

module.exports = {
  defaultProviders
};
