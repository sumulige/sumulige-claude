/**
 * Cost + guardrail utility with sliding窗口统计
 */

const fs = require('fs');
const path = require('path');

class GuardrailMonitor {
  constructor(options = {}) {
    this.size = options.size || 200; // sliding window size
    this.samples = [];
    this.storagePath = options.storagePath || null;
    if (this.storagePath) {
      this._load();
    }
  }

  addSample(sample) {
    const enriched = { ts: Date.now(), ...sample };
    this.samples.push(enriched);
    if (this.samples.length > this.size) {
      this.samples.shift();
    }
    this._save();
  }

  percentile(field, p) {
    const vals = this.samples.map(s => s[field]).filter(v => typeof v === 'number');
    if (!vals.length) return null;
    vals.sort((a, b) => a - b);
    const idx = Math.min(vals.length - 1, Math.floor((p / 100) * vals.length));
    return vals[idx];
  }

  p99Latency() {
    return this.percentile('latencyMs', 99);
  }

  p99LatencyWindow(ttlSec = null) {
    const now = Date.now();
    const vals = this.samples
      .filter(s => typeof s.latencyMs === 'number' && (!ttlSec || (s.ts && now - s.ts <= ttlSec * 1000)))
      .map(s => s.latencyMs);
    if (!vals.length) return null;
    vals.sort((a, b) => a - b);
    const idx = Math.min(vals.length - 1, Math.floor(0.99 * vals.length));
    return vals[idx];
  }

  /**
   * 统计最近 TTL 内超过阈值的次数
   */
  exceededCount(thresholdMs, ttlSec = null) {
    if (!thresholdMs) return 0;
    const now = Date.now();
    const filtered = ttlSec
      ? this.samples.filter(s => s.ts && now - s.ts <= ttlSec * 1000)
      : this.samples;
    return filtered.filter(s => typeof s.latencyMs === 'number' && s.latencyMs > thresholdMs).length;
  }

  exceededSamples(thresholdMs, ttlSec = null, limit = 5) {
    if (!thresholdMs) return [];
    const now = Date.now();
    const filtered = ttlSec
      ? this.samples.filter(s => s.ts && now - s.ts <= ttlSec * 1000)
      : this.samples;
    return filtered
      .filter(s => typeof s.latencyMs === 'number' && s.latencyMs > thresholdMs)
      .slice(-limit)
      .map(s => new Date(s.ts).toISOString());
  }

  hitRate(ttlSec = null) {
    const now = Date.now();
    const filtered = ttlSec
      ? this.samples.filter(s => s.ts && now - s.ts <= ttlSec * 1000)
      : this.samples;
    if (!filtered.length) return null;
    const hits = filtered.filter(s => s.hit === true).length;
    return hits / filtered.length;
  }

  _load() {
    try {
      if (fs.existsSync(this.storagePath)) {
        const parsed = JSON.parse(fs.readFileSync(this.storagePath, 'utf-8'));
        if (Array.isArray(parsed.samples)) {
          this.samples = parsed.samples.slice(-this.size);
        }
      }
    } catch {
      /* ignore */
    }
  }

  _save() {
    if (!this.storagePath) return;
    try {
      fs.writeFileSync(this.storagePath, JSON.stringify({ samples: this.samples.slice(-this.size) }), 'utf-8');
    } catch {
      /* ignore */
    }
  }
}

function loadGuardrails(projectDir = process.cwd()) {
  const guardPath = path.join(projectDir, 'config', 'memory-guardrails.json');
  if (!fs.existsSync(guardPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(guardPath, 'utf-8'));
  } catch {
    return null;
  }
}

function resolveLatencyThreshold(guardrails, monitor, { now = new Date(), p99Recent }) {
  if (!guardrails || !guardrails.thresholds) return null;
  const t = guardrails.thresholds;
  let base = t.latency_ms_p99 || null;
  const hour = now.getHours();
  if (t.latency_ms_p99_day != null && hour >= 8 && hour < 20) base = t.latency_ms_p99_day;
  if (t.latency_ms_p99_night != null && (hour < 8 || hour >= 20)) base = t.latency_ms_p99_night;
  if (t.latency_ms_p99_dynamic_factor && p99Recent != null) {
    const dyn = p99Recent * t.latency_ms_p99_dynamic_factor;
    base = Math.max(base || 0, dyn);
  }
  return base;
}

function shouldDegrade(guardrails, { latencyMs, hitRate, costUsd }, monitor = null) {
  if (!guardrails || !guardrails.thresholds) return false;
  const t = guardrails.thresholds;
  const p99Recent = monitor?.p99LatencyWindow ? monitor.p99LatencyWindow() : null;
  const effectiveLatency = resolveLatencyThreshold(guardrails, monitor, { p99Recent });

  if (latencyMs !== undefined && effectiveLatency && latencyMs > effectiveLatency) return true;
  if (hitRate !== undefined && t.hit_rate_min && hitRate < t.hit_rate_min) return true;
  if (costUsd !== undefined && t.cost_per_req_usd && costUsd > t.cost_per_req_usd) return true;

  if (monitor) {
    const p99 = monitor.p99Latency();
    if (p99 !== null && effectiveLatency && p99 > effectiveLatency) return true;
  }
  return false;
}

module.exports = {
  loadGuardrails,
  shouldDegrade,
  GuardrailMonitor,
  resolveLatencyThreshold
};
