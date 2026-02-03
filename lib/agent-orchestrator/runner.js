/**
 * Agent Runner - execute tasks via local CLI (codex/claude/gemini)
 */

const { spawn, spawnSync } = require('child_process');

function hasCommand(cmd) {
  const bin = process.platform === 'win32' ? 'where' : 'which';
  const res = spawnSync(bin, [cmd], { stdio: 'ignore' });
  return res.status === 0;
}

function detectAvailableRunners() {
  return {
    codex: hasCommand('codex'),
    claude: hasCommand('claude'),
    gemini: hasCommand('gemini')
  };
}

function resolveRunner(preferred, available) {
  if (preferred && preferred !== 'auto') {
    if (!available[preferred]) return null;
    return preferred;
  }
  if (available.codex) return 'codex';
  if (available.claude) return 'claude';
  if (available.gemini) return 'gemini';
  return null;
}

function runCommand(cmd, args, cwd, { capture = false } = {}) {
  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';
    const child = spawn(cmd, args, {
      cwd,
      stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit'
    });
    if (capture) {
      if (child.stdout) {
        child.stdout.on('data', (chunk) => {
          stdout += chunk.toString();
          process.stdout.write(chunk);
        });
      }
      if (child.stderr) {
        child.stderr.on('data', (chunk) => {
          stderr += chunk.toString();
          process.stderr.write(chunk);
        });
      }
    }
    child.on('exit', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        const err = new Error(`${cmd} exited with code ${code}`);
        err.stdout = stdout;
        err.stderr = stderr;
        reject(err);
      }
    });
  });
}

function buildCodexArgs({ prompt, projectDir, sandbox, fullAuto }) {
  const args = ['exec', '--cd', projectDir, '--sandbox', sandbox];
  if (fullAuto) args.push('--full-auto');
  args.push(prompt);
  return args;
}

function buildClaudeArgs({ prompt, permissionMode }) {
  return ['--print', '--output-format', 'text', '--permission-mode', permissionMode, prompt];
}

function buildGeminiArgs({ prompt }) {
  // Placeholder for future gemini cli integration
  return [prompt];
}

async function runRunner({
  runner,
  prompt,
  projectDir,
  sandbox = 'read-only',
  fullAuto = false,
  permissionMode = 'plan',
  capture = false
}) {
  if (runner === 'codex') {
    return runCommand('codex', buildCodexArgs({ prompt, projectDir, sandbox, fullAuto }), projectDir, { capture });
  }
  if (runner === 'claude') {
    return runCommand('claude', buildClaudeArgs({ prompt, permissionMode }), projectDir, { capture });
  }
  if (runner === 'gemini') {
    return runCommand('gemini', buildGeminiArgs({ prompt }), projectDir, { capture });
  }
  throw new Error(`Unknown runner: ${runner}`);
}

module.exports = {
  detectAvailableRunners,
  resolveRunner,
  runRunner
};
