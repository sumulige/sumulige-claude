const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

// 默认忽略目录/文件，避免深度遍历拖慢 CLI
const DEFAULT_IGNORE = new Set([
  'node_modules',
  '.git',
  '.claude',
  'coverage',
  'dist',
  'build',
  '.next',
  '.turbo',
  'tmp',
  'logs'
]);

function loadIgnoreList(projectDir) {
  const ignorePath = path.join(projectDir, '.smcignore');
  if (!fs.existsSync(ignorePath)) return DEFAULT_IGNORE;

  const extra = fs
    .readFileSync(ignorePath, 'utf-8')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'));

  return new Set([...DEFAULT_IGNORE, ...extra]);
}

function getProjectInfo(projectDir) {
  const packagePath = path.join(projectDir, 'package.json');
  if (!fs.existsSync(packagePath)) return null;
  try {
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
    return `项目: ${pkg.name || 'unknown'}\n版本: ${pkg.version || 'unknown'}`;
  } catch {
    return null;
  }
}

function getGitDiffFiles(projectDir, limit) {
  try {
    const res = spawnSync('git', ['diff', '--name-only', '--diff-filter=AM'], {
      cwd: projectDir,
      encoding: 'utf-8'
    });
    if (res.status !== 0) return [];
    return res.stdout
      .split('\n')
      .map(f => f.trim())
      .filter(Boolean)
      .slice(0, limit);
  } catch {
    return [];
  }
}

function walkRecentFiles(projectDir, ignore, limit, maxDepth = 3) {
  const files = [];

  const walk = (dir, depth = 0) => {
    if (depth > maxDepth) return;
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (ignore.has(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full, depth + 1);
      } else {
        try {
          const stat = fs.statSync(full);
          files.push({ file: path.relative(projectDir, full), mtime: stat.mtimeMs });
        } catch {
          /* ignore single failure */
        }
      }
    }
  };

  walk(projectDir);

  return files
    .sort((a, b) => b.mtime - a.mtime)
    .slice(0, limit)
    .map(f => f.file);
}

function listTodos(projectDir, limit) {
  const todosDir = path.join(projectDir, 'development', 'todos');
  if (!fs.existsSync(todosDir)) return [];
  try {
    return fs
      .readdirSync(todosDir)
      .filter(f => f.endsWith('.md') || f.endsWith('.txt') || f.endsWith('.json'))
      .slice(0, limit)
      .map(f => path.join('development', 'todos', f));
  } catch {
    return [];
  }
}

function buildContext(agentName, options = {}) {
  const projectDir = options.projectDir || process.cwd();
  const limit = options.limit || 12;
  const ignore = loadIgnoreList(projectDir);

  const recentFromGit = getGitDiffFiles(projectDir, limit);
  const relevantFiles = recentFromGit.length
    ? recentFromGit
    : walkRecentFiles(projectDir, ignore, limit, 3);

  const memoryIndex = readIndex(projectDir).slice(-3); // recent archives

  return {
    agent: agentName,
    projectInfo: getProjectInfo(projectDir),
    relevantFiles,
    todos: listTodos(projectDir, 10),
    memoryIndex
  };
}

module.exports = {
  buildContext,
  loadIgnoreList,
};
const { readIndex } = require('../memory/rolling-store');
