const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function hasCommand(cmd) {
  const bin = process.platform === 'win32' ? 'where' : 'which';
  const res = spawnSync(bin, [cmd], { stdio: 'ignore' });
  return res.status === 0;
}

function ensureLogDir(projectDir) {
  const logDir = path.join(projectDir, '.claude', 'agent-logs');
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  return logDir;
}

function initUiPro({ runner, projectDir }) {
  if (!hasCommand('uipro')) {
    return { ok: false, reason: 'missing' };
  }

  const logDir = ensureLogDir(projectDir);
  const markerPath = path.join(logDir, 'uipro-init.json');
  if (fs.existsSync(markerPath)) {
    try {
      const prev = JSON.parse(fs.readFileSync(markerPath, 'utf-8'));
      if (prev?.runner === runner) return { ok: true, skipped: true };
    } catch {
      // ignore parse errors
    }
  }

  const args = ['init', '--ai', runner];
  const result = spawnSync('uipro', args, { cwd: projectDir, stdio: 'inherit' });
  if (result.status === 0) {
    const payload = { runner, ts: new Date().toISOString() };
    try {
      fs.writeFileSync(markerPath, JSON.stringify(payload, null, 2));
    } catch {
      // ignore marker write errors
    }
    return { ok: true };
  }
  return { ok: false, reason: 'failed' };
}

module.exports = {
  initUiPro
};
