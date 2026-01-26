/**
 * Priority Scorer - 信息优先级评分
 *
 * 计算上下文项目的重要性分数，用于 Strategic Compact 决定保留哪些信息
 *
 * 评分公式: priority = baseWeight × timeFactor × referenceFactor
 */

const TYPE_WEIGHTS = {
  'active-decision': 100,
  'current-task': 95,
  'error-context': 90,
  'code-change': 80,
  'constraint': 70,
  'past-decision': 50,
  'conversation': 30,
  'tool-output': 20,
  'redundant': 5
};

const DEFAULT_WEIGHT = 10;

class PriorityScorer {
  constructor(options = {}) {
    this.weights = { ...TYPE_WEIGHTS, ...options.customWeights };
    this.decayHours = options.decayHours || 24;
  }

  /**
   * 计算项目优先级
   * @param {Object} item - 上下文项目
   * @param {string} item.type - 项目类型
   * @param {number} item.timestamp - 创建时间戳
   * @param {number} item.references - 被引用次数
   * @returns {number} 优先级分数
   */
  calculate(item) {
    const baseWeight = this.getBaseWeight(item.type);
    const timeFactor = this.calculateTimeFactor(item.timestamp);
    const refFactor = this.calculateReferenceFactor(item.references);

    return Math.round(baseWeight * timeFactor * refFactor);
  }

  /**
   * 获取类型基础权重
   */
  getBaseWeight(type) {
    return this.weights[type] || DEFAULT_WEIGHT;
  }

  /**
   * 计算时效因子
   * - 24小时内: 50%-100%
   * - 超过24小时: 逐渐衰减至 10%
   */
  calculateTimeFactor(timestamp) {
    if (!timestamp) return 1;

    const ageHours = (Date.now() - timestamp) / (1000 * 60 * 60);

    if (ageHours <= this.decayHours) {
      return 1 - (ageHours / this.decayHours) * 0.5;
    }

    const additionalDecay = Math.min(0.4, (ageHours - this.decayHours) / 168 * 0.4);
    return 0.5 - additionalDecay;
  }

  /**
   * 计算引用因子
   * - 每次引用增加 10% 权重
   */
  calculateReferenceFactor(references) {
    return 1 + (references || 0) * 0.1;
  }

  /**
   * 批量评分并排序
   * @param {Array} items - 项目数组
   * @returns {Array} 按优先级降序排列的项目
   */
  scoreAndSort(items) {
    return items
      .map(item => ({
        ...item,
        priority: this.calculate(item)
      }))
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * 按优先级过滤，保留前 N% 的项目
   * @param {Array} items - 项目数组
   * @param {number} keepPercent - 保留百分比 (0-100)
   * @returns {Array} 过滤后的项目
   */
  filterByPriority(items, keepPercent) {
    const scored = this.scoreAndSort(items);
    const keepCount = Math.ceil(scored.length * (keepPercent / 100));
    return scored.slice(0, keepCount);
  }

  /**
   * 获取优先级阈值
   * @param {Array} items - 项目数组
   * @param {number} keepPercent - 保留百分比
   * @returns {number} 阈值分数
   */
  getThreshold(items, keepPercent) {
    const scored = this.scoreAndSort(items);
    const keepCount = Math.ceil(scored.length * (keepPercent / 100));
    return scored[keepCount - 1]?.priority || 0;
  }
}

module.exports = {
  PriorityScorer,
  TYPE_WEIGHTS,
  DEFAULT_WEIGHT
};
