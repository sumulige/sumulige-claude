#!/usr/bin/env node
/**
 * Safe postinstall
 * - Respects SMC_POSTINSTALL=0 to skip
 * - Defaults to no-op to avoid sandbox/CI breakage
 * - If enabled, runs `node cli.js init`
 */

const { spawnSync } = require("child_process");

const flag = process.env.SMC_POSTINSTALL;
if (flag === "0" || flag === "false" || flag === "skip") {
  console.log("SMC postinstall skipped (SMC_POSTINSTALL=0)");
  process.exit(0);
}

const result = spawnSync(process.execPath, ["cli.js", "init"], {
  stdio: "inherit",
  cwd: process.cwd(),
});

process.exit(result.status ?? 0);
