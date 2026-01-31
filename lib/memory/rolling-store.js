/**
 * Rolling memory store for .claude/memory
 *
 * 策略：
 * - current.md 超过 MAX_LINES 时，自动截断为归档文件 + 摘要写回 current
 * - 提供 compact() 供 CLI 调用
 */

const fs = require('fs');
const path = require('path');

const MAX_LINES = 200; // 可按需调整

function memoryDir(projectDir) {
  return path.join(projectDir, '.claude', 'memory');
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readLines(file) {
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf-8').split(/\r?\n/);
}

function writeLines(file, lines) {
  fs.writeFileSync(file, lines.join('\n'), 'utf-8');
}

function summarize(lines) {
  if (lines.length <= 6) return lines.join(' ');
  return [
    lines[0],
    lines[1] || '',
    `...(${lines.length - 4} lines omitted)...`,
    lines[lines.length - 2] || '',
    lines[lines.length - 1] || ''
  ].join(' ');
}

function rotate(projectDir = process.cwd()) {
  const dir = memoryDir(projectDir);
  ensureDir(dir);

  const currentPath = path.join(dir, 'current.md');
  const lines = readLines(currentPath);
  if (lines.length <= MAX_LINES) {
    return { rotated: false, lines: lines.length };
  }

  const ts = new Date().toISOString().split('T')[0];
  const archiveName = `${ts}.md`;
  const archivePath = path.join(dir, archiveName);

  // Append to archive (with separator)
  const content = lines.join('\n');
  const prefix = fs.existsSync(archivePath) ? '\n\n' : '';
  fs.appendFileSync(archivePath, prefix + content, 'utf-8');

  // Write summary back to current
  const summary = summarize(lines);
  writeLines(currentPath, [`[rolled ${ts}] ${summary}`]);

  // Update index for quick lookup
  const indexPath = path.join(dir, 'index.json');
  let index = [];
  if (fs.existsSync(indexPath)) {
    try {
      index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
    } catch {
      index = [];
    }
  }
  index.push({
    archive: archiveName,
    lines: lines.length,
    rolled_at: new Date().toISOString()
  });
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf-8');

  return { rotated: true, archive: archiveName, lines: lines.length };
}

function readIndex(projectDir = process.cwd()) {
  const indexPath = path.join(memoryDir(projectDir), 'index.json');
  if (!fs.existsSync(indexPath)) return [];
  try {
    return JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
  } catch {
    return [];
  }
}

module.exports = {
  rotate,
  readIndex,
  MAX_LINES
};
