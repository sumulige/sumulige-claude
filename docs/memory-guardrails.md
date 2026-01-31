# Memory Guardrails & Benchmark Skeleton

## 阈值与降级
- 配置文件：`config/memory-guardrails.json`
- 默认阈值：P99 延迟 1200ms、命中率 ≥0.75、成本 ≤$0.002/req。
- 降级动作示例：关闭 rerank、启用本地缓存、限制多跳为 1；`restore_after_seconds` 控制自动恢复。

## 观测
- 轻量埋点：`lib/memory-observability.js` 以 JSON 行输出 `memory_request`，字段包含 latency_ms、hit、cost_usd。
- 后续可接入 APM/OTel，只需替换 emitMetric。

## 成本与决策
- `lib/memory-cost.js` 读取 guardrails，并提供 `shouldDegrade(...)` 判断是否触发降级。
- 建议在检索/重排前后调用，超阈值时执行降级动作。

## 场景基准
- 脚本：`scripts/memory-benchmark.mjs`，包含“工作变更”“偏好演变”等基准用例骨架。
- 运行：`node scripts/memory-benchmark.mjs [cases.json]`，当前为 stub，可接入真实检索逻辑。

## 建议的接入顺序
1. 配置阈值：编辑 `config/memory-guardrails.json`。
2. 埋点：在检索关键路径调用 `observeRequest()`。
3. 降级：在检索前后用 `shouldDegrade()` 决策并执行动作。
4. 基准：用 benchmark 脚本 + 自定义 cases 跑对比，调整阈值与缓存策略。
