#!/usr/bin/env node
import { rotate } from '../lib/memory/rolling-store.js';

const result = rotate(process.cwd());
if (result.rotated) {
  console.log(`✅ Rolled ${result.lines} lines → .claude/memory/${result.archive}`);
} else {
  console.log(`ℹ️ No roll needed, current lines: ${result.lines}`);
}
