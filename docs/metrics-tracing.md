# Metrics & Tracing 快速指南

- 默认采样率：10%（可用 `SMC_METRICS_SAMPLE=0.5` 改为 50%，或 `1` 全量）
- 关键标识：`request_id`、`trace_id`、`span_id` 会贯穿 executor → runtime → metrics
- 输出：标准输出 JSON 行；设置 `SMC_METRICS_FILE=/tmp/smc-metrics.log` 可落盘
- Guardrail 观察：`smc guardrail:stats --json` 显示滑窗 p50/p90/p99、阈值、是否超阈、窗口文件和更新时间
- 快速检查：`smc status` 显示 samples/p50/p90/p99/阈值/是否超阈/最近超阈次数与时间戳
- 关闭输出：`SMC_METRICS_SILENT=1`

推荐最小化配置（生产）：
```bash
SMC_TRACE_ID=$(uuidgen) \
SMC_METRICS_SAMPLE=0.1 \
SMC_METRICS_FILE=/var/log/smc-metrics.log

# 接入自定义 provider（示例见 lib/runtime/providers/examples/local-rag.js）
SMC_PROVIDER_MODULE=./lib/runtime/providers/examples/local-rag.js

# 使用 skeleton 作为模板（含 timeout/retry 接口签名）
# SMC_PROVIDER_MODULE=./lib/runtime/providers/skeleton.js
```
