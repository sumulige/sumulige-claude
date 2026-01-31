#!/usr/bin/env node
/**
 * Memory/RAG baseline benchmark skeleton.
 *
 * Usage: node scripts/memory-benchmark.mjs [path/to/cases.json]
 * The script prints a simple table of metrics per case. Hook your real
 * system by implementing the stub runCase() to call your retrieval pipeline.
 */

import fs from 'fs';
import path from 'path';

const DEFAULT_CASES = [
  {
    name: '工作变更场景',
    timeline: [
      ['Day 1', '我在Google工作'],
      ['Day 30', '我在考虑换工作'],
      ['Day 60', '我加入了OpenAI'],
      ['Day 90', '查询: 我在哪工作?']
    ],
    expected: 'OpenAI'
  },
  {
    name: '偏好演变场景',
    timeline: [
      ['Week 1', '我喜欢Java'],
      ['Week 4', '我开始学Python'],
      ['Week 8', '我现在主要用Python'],
      ['Week 12', '查询: 我用什么语言?']
    ],
    expected: 'Python'
  }
];

async function runCase(testCase) {
  // TODO: Replace with real calls into your memory / RAG stack.
  // For now, return dummy metrics so the harness runs.
  return {
    accuracy: 0,
    consistency: 0,
    recency: 0,
    latencyMs: 0,
    costUsd: 0,
    notes: 'stub'
  };
}

function aggregate(results) {
  const avg = (arr) => arr.reduce((a, b) => a + b, 0) / (arr.length || 1);
  return {
    accuracy: avg(results.map(r => r.accuracy)),
    consistency: avg(results.map(r => r.consistency)),
    recency: avg(results.map(r => r.recency)),
    latencyMs: avg(results.map(r => r.latencyMs)),
    costUsd: avg(results.map(r => r.costUsd))
  };
}

async function main() {
  const argPath = process.argv[2];
  let cases = DEFAULT_CASES;
  if (argPath) {
    const full = path.resolve(argPath);
    cases = JSON.parse(fs.readFileSync(full, 'utf-8'));
  }

  console.log('Memory Benchmark');
  console.log('================');

  const allResults = [];

  for (const c of cases) {
    const result = await runCase(c);
    console.log(`\n[${c.name}]`);
    console.table([{
      accuracy: result.accuracy,
      consistency: result.consistency,
      recency: result.recency,
      latency_ms: result.latencyMs,
      cost_usd: result.costUsd,
      notes: result.notes
    }]);
    allResults.push(result);
  }

  console.log('\nAggregate (avg)');
  const agg = aggregate(allResults);
  console.table([agg]);
}

main();
