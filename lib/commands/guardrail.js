const fs = require('fs');
const path = require('path');
const { GuardrailMonitor, loadGuardrails } = require('../memory-cost');

function windowPath() {
  return path.join(process.cwd(), '.claude', 'agent-logs', 'guardrail-window.json');
}

function computeStats() {
  const file = windowPath();
  const monitor = new GuardrailMonitor({ storagePath: file });
  const guardrails = loadGuardrails(process.cwd());
  const p99 = monitor.p99Latency();
  const p90 = monitor.percentile('latencyMs', 90);
  const p50 = monitor.percentile('latencyMs', 50);
  const size = monitor.size;
  const ttlSec = parseInt(process.env.SMC_GUARDRAIL_TTL_SEC || '86400', 10) || 86400;
  const exceededCount = monitor.exceededCount(guardrails?.thresholds?.latency_ms_p99, ttlSec);
  const exceededSamples = monitor.exceededSamples(guardrails?.thresholds?.latency_ms_p99, ttlSec, 5);
  const p99Recent = monitor.p99LatencyWindow(ttlSec);
  const hitRateRecent = monitor.hitRate(ttlSec);
  const hitRateMin = guardrails?.thresholds?.hit_rate_min || null;
  const effectiveLatency = require('../memory-cost').resolveLatencyThreshold(guardrails, monitor, { p99Recent });
  let lastUpdated = null;
  try {
    const stat = fs.statSync(file);
    lastUpdated = stat.mtime.toISOString();
  } catch {
    /* ignore */
  }
  return {
    samples: monitor.samples.length,
    p50_latency_ms: p50,
    p90_latency_ms: p90,
    p99_latency_ms: p99,
    p99_latency_ms_recent: p99Recent,
    hit_rate_recent: hitRateRecent,
    threshold_p99_ms: guardrails?.thresholds?.latency_ms_p99 || null,
    threshold_p99_effective_ms: effectiveLatency || guardrails?.thresholds?.latency_ms_p99 || null,
    threshold_hit_rate_min: hitRateMin,
    exceeded: guardrails?.thresholds?.latency_ms_p99 && p99 != null ? p99 > guardrails.thresholds.latency_ms_p99 : null,
    exceeded_count_recent: exceededCount,
    exceeded_samples_recent: exceededSamples,
    ttl_sec: ttlSec,
    window_size: size,
    window_file: fs.existsSync(file) ? path.relative(process.cwd(), file) : null,
    last_updated: lastUpdated
  };
}

const commands = {
  'guardrail:stats': (...args) => {
    const json = args.includes('--json');
    const stats = computeStats();
    if (json) {
      console.log(JSON.stringify(stats, null, 2));
      return;
    }
    console.log('📊 Guardrail 滑窗统计');
    console.log(`samples: ${stats.samples}`);
    console.log(`p50 latency: ${stats.p50_latency_ms ?? 'n/a'} ms`);
    console.log(`p90 latency: ${stats.p90_latency_ms ?? 'n/a'} ms`);
    console.log(`p99 latency: ${stats.p99_latency_ms ?? 'n/a'} ms`);
    if (stats.threshold_p99_ms) {
      console.log(`threshold p99: ${stats.threshold_p99_ms} ms`);
    }
  },

  'guardrail:clear': () => {
    const file = windowPath();
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      console.log('✅ 已清空 guardrail 滑窗数据');
    } else {
      console.log('ℹ️ 无滑窗数据可清空');
    }
  }
};

module.exports = commands;
module.exports.computeStats = computeStats;
