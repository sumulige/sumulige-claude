#!/bin/bash
# 自动归档 .claude/memory/current.md
# 可通过 SMC_AUTOROLL_DISABLE=1 关闭

if [ "$SMC_AUTOROLL_DISABLE" = "1" ]; then
  exit 0
fi

cd "$(dirname "$0")/../../.." || exit 0
npm run memory:autoroll >/dev/null 2>&1
