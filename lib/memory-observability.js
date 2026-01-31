/**
 * Lightweight observability helpers for memory/RAG paths.
 * Metrics are emitted via console.log for now (structured JSON lines),
 * so they can be grepped/forwarded; swap to real metrics later.
 */

function shouldSample() {
  const raw = process.env.SMC_METRICS_SAMPLE;
  if (!raw) return Math.random() < 0.1; // default 10% 采样
  const p = parseFloat(raw);
  if (Number.isNaN(p)) return true;
  return Math.random() < p;
}

function emitMetric(name, fields = {}) {
  if (!shouldSample()) return;

  const sampleRate = process.env.SMC_METRICS_SAMPLE
    ? parseFloat(process.env.SMC_METRICS_SAMPLE)
    : 0.1;

  const payload = {
    ts: new Date().toISOString(),
    metric: name,
    request_id: fields.request_id || fields.requestId || `req_${Math.random().toString(36).slice(2, 10)}`,
    sample_rate: Number.isFinite(sampleRate) ? sampleRate : null,
    ...fields
  };

  // Optional silent mode
  if (process.env.SMC_METRICS_SILENT === '1') return;

  // Optional file sink
  const sink = process.env.SMC_METRICS_FILE;
  if (sink) {
    try {
      require('fs').appendFileSync(sink, JSON.stringify(payload) + '\n');
    } catch (e) {
      // fall back to console if file write fails
      console.warn('[metrics] write failed:', e.message);
      console.log(JSON.stringify(payload));
    }
    return;
  }

  // Default: stdout JSON line
  console.log(JSON.stringify(payload));
}

function observeRequest({ path = 'memory', latencyMs, hit, costUsd, extra = {} }) {
  emitMetric('memory_request', {
    path,
    latency_ms: latencyMs,
    hit,
    cost_usd: costUsd,
    ...extra
  });
}

module.exports = {
  observeRequest
};
