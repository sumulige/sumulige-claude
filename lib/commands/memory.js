const { rotate } = require('../memory/rolling-store');

const commands = {
  'memory:compact': () => {
    const result = rotate(process.cwd());
    if (result.rotated) {
      console.log(`✅ 已归档 ${result.lines} 行到 .claude/memory/${result.archive}`);
      console.log('ℹ️  current.md 已写入摘要，继续安全追加');
    } else {
      console.log(`ℹ️  current.md 行数 ${result.lines}，未超过阈值，无需压缩`);
    }
  }
};

module.exports = commands;
