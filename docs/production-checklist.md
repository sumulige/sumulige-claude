# 生产落地 Checklist

## 监控 & 告警
- [ ] 设置 `SMC_METRICS_SAMPLE`（默认 10%），必要时落盘 `SMC_METRICS_FILE`
- [ ] 接入日志平台或 Prometheus/OpenTelemetry，转发 metrics JSON 行
- [ ] 配置 guardrail 阈值：`latency_ms_p99`，可选 day/night、dynamic_factor、`hit_rate_min`
- [ ] 建立告警：p99_recent 超阈、hit_rate 低于阈值、连续超阈次数

## RAG/LLM Provider
- [ ] 填写 `SMC_PROVIDER_MODULE` 指向你实现的 provider（参考 `lib/runtime/providers/skeleton.js`）
- [ ] 设置检索/生成超时、重试/熔断策略，降级到 cache-only 或低价模型
- [ ] 使用 hints（rerank/ cache/max_hops）控制策略

## 记忆 & 存储
- [ ] 启用 post-task autoroll（默认开启，可用 `SMC_AUTOROLL_DISABLE=1` 关闭）
- [ ] 定期检查 `.claude/memory/index.json` 容量；必要时清理归档或压缩
- [ ] 检索前利用 index 按时间片过滤/优先级排序

## 日志与追踪
- [ ] 贯穿 trace：`SMC_TRACE_ID`/`SMC_REQUEST_ID`（自动生成）；需要时设置 `SMC_PARENT_SPAN_ID`
- [ ] Metrics Summary（`smc agent` 输出）：traceId、sample_rate、p99_recent/threshold

## 配置
- [ ] guardrail TTL (`SMC_GUARDRAIL_TTL_SEC`) 依据业务流量调优
- [ ] memory autoroll：`SMC_AUTOROLL_VERBOSE=1` 调试；`SMC_AUTOROLL_DRYRUN=1` 安全演练
- [ ] 需要外部存储/对象存储时，把归档同步到远端并更新 index

## 验证
- [ ] 压测下验证 p99/命中率阈值误报率
- [ ] 触发降级路径（禁 rerank / cache-only / max_hops=1）确保无故障
- [ ] 宕机/重启后滑窗文件继续生效（guardrail-window.json）
