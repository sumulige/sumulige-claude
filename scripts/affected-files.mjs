#!/usr/bin/env node
/**
 * Emit affected files per version from config/version-manifest.json
 * Usage: node scripts/affected-files.mjs [--from vX.Y.Z] [--to vA.B.C] [--json]
 * Default: all history up to current
 */
import fs from "fs";
import path from "path";

const manifestPath = path.join(process.cwd(), "config/version-manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

const args = process.argv.slice(2);
const get = (flag) => {
  const idx = args.indexOf(flag);
  return idx === -1 ? null : args[idx + 1];
};
const from = get("--from");
const to = get("--to");
const asJson = args.includes("--json");

function cmp(a, b) {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] || 0, y = pb[i] || 0;
    if (x !== y) return x - y;
  }
  return 0;
}

const history = manifest.history
  .filter((h) => (!from || cmp(h.version, from) > 0) && (!to || cmp(h.version, to) <= 0))
  .sort((a, b) => cmp(a.version, b.version));

const result = history.map((h) => ({
  version: h.version,
  date: h.date,
  breaking: h.breaking || false,
  files: (h.changes || [])
    .map((c) => c.path || c.name || c.feature || c.type || "")
    .filter(Boolean),
}));

if (asJson) {
  console.log(JSON.stringify(result, null, 2));
} else {
  for (const entry of result) {
    console.log(`v${entry.version} ${entry.breaking ? "[BREAKING]" : ""}`);
    entry.files.forEach((f) => console.log(`  - ${f}`));
  }
}
