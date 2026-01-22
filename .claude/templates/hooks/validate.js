#!/usr/bin/env node
/**
 * Hook Validator - 检查 hook 是否符合最佳实践
 *
 * 使用方法:
 *   node validate.js [hook-file]
 *
 * 示例:
 *   node validate.js ../my-hook.cjs
 *   node validate.js *.cjs
 */

const fs = require('fs');
const path = require('path');

const CHECKS = {
  ENV_FALLBACK: {
    name: '环境变量 fallback',
    pattern: /process\.env\.CLAUDE_PROJECT_DIR\s*\|\|/,
    required: true,
    error: '缺少 CLAUDE_PROJECT_DIR fallback (|| process.cwd())'
  },

  SILENT_EXIT: {
    name: '静默退出检查',
    pattern: /if\s*\(\s*!process\.env\.CLAUDE_PROJECT_DIR/,
    required: true,
    error: '缺少非项目环境的静默退出检查'
  },

  ERROR_HANDLING: {
    name: '错误处理',
    pattern: /try\s*\{/,
    required: true,
    error: '缺少 try-catch 错误处理'
  },

  SAFE_EXIT: {
    name: '安全退出',
    pattern: /process\.exit\(0\)/,
    required: true,
    error: '缺少明确的 process.exit(0)'
  },

  NO_STDOUT: {
    name: '避免 stdout 输出',
    pattern: /console\.log\(/,
    required: false,
    error: '检测到 console.log - 建议使用 console.error 用于调试'
  },

  SAFE_MKDIR: {
    name: '安全创建目录',
    pattern: /mkdirSync.*recursive/,
    required: true,
    error: '目录创建缺少 { recursive: true } 选项'
  }
};

/**
 * 验证单个 hook 文件
 */
function validateHook(filePath) {
  const results = {
    file: filePath,
    passed: 0,
    failed: 0,
    warnings: 0,
    checks: []
  };

  if (!fs.existsSync(filePath)) {
    results.error = '文件不存在';
    return results;
  }

  const content = fs.readFileSync(filePath, 'utf-8');

  for (const [key, check] of Object.entries(CHECKS)) {
    const passed = check.pattern.test(content);

    if (check.required) {
      if (passed) {
        results.passed++;
      } else {
        results.failed++;
      }
    } else {
      // 可选检查作为警告
      if (passed) {
        results.warnings++;
      }
    }

    results.checks.push({
      name: check.name,
      passed: check.required ? passed : !passed,
      required: check.required,
      error: check.error
    });
  }

  return results;
}

/**
 * 打印验证结果
 */
function printResults(results) {
  console.log(`\n📎 ${path.basename(results.file)}`);
  console.log('─'.repeat(50));

  if (results.error) {
    console.log(`❌ ${results.error}`);
    return;
  }

  for (const check of results.checks) {
    if (check.passed) {
      console.log(`✅ ${check.name}`);
    } else if (check.required) {
      console.log(`❌ ${check.name}`);
      console.log(`   ${check.error}`);
    } else {
      console.log(`⚠️  ${check.name}`);
      console.log(`   ${check.error}`);
    }
  }

  const total = results.passed + results.failed;
  const score = total > 0 ? Math.round((results.passed / total) * 100) : 0;

  console.log('─'.repeat(50));
  console.log(`得分: ${score}% | ✅ ${results.passed} | ❌ ${results.failed} | ⚠️  ${results.warnings}`);
}

/**
 * 主函数
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
🔍 Hook Validator - 检查 hook 最佳实践

使用方法:
  node validate.js <hook-file>
  node validate.js *.cjs

示例:
  node validate.js my-hook.cjs
  node validate.js ../*.cjs
    `);
    process.exit(0);
  }

  let allPassed = true;

  for (const arg of args) {
    const results = validateHook(arg);
    printResults(results);

    if (results.failed > 0) {
      allPassed = false;
    }
  }

  console.log('');
  process.exit(allPassed ? 0 : 1);
}

main();
