const fs = require("fs");
const path = require("path");
const { setExecutablePermission, TEMPLATE_DIR } = require("./commands/template");

const CLAUDE_DIR = ".claude";
const LOCAL_DIR = path.join(CLAUDE_DIR, "local");
const UPSTREAM_DIR = path.join(CLAUDE_DIR, "upstream");
const SRC_DIR = path.join(TEMPLATE_DIR, CLAUDE_DIR);

function listFiles(dir) {
  const out = [];
  const stack = [dir];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else {
        out.push(full);
      }
    }
  }
  return out;
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function rel(file) {
  return file.slice(SRC_DIR.length + 1);
}

function fileDiffers(a, b) {
  if (!fs.existsSync(a) || !fs.existsSync(b)) return true;
  return fs.readFileSync(a).equals(fs.readFileSync(b)) === false;
}

function plan(projectDir) {
  const results = [];
  if (!fs.existsSync(SRC_DIR)) return { results, message: "Template .claude not found" };
  const files = listFiles(SRC_DIR);
  for (const src of files) {
    const relative = rel(src);
    const dest = path.join(projectDir, UPSTREAM_DIR, relative);
    const destExists = fs.existsSync(dest);
    const action = destExists ? (fileDiffers(src, dest) ? "update" : "skip") : "copy";
    results.push({ relative, action, src, dest });
  }
  return { results, message: "ok" };
}

function applyPlan(planResult) {
  const applied = [];
  for (const item of planResult.results) {
    if (item.action === "skip") continue;
    ensureDir(path.dirname(item.dest));
    fs.copyFileSync(item.src, item.dest);
    setExecutablePermission(item.dest);
    applied.push(item);
  }
  return applied;
}

function printPlan(planResult) {
  planResult.results.forEach((item) => {
    const tag = item.action === "skip" ? "  " : item.action === "update" ? "~" : "+";
    console.log(`${tag} ${item.relative}`);
  });
}

module.exports = { plan, applyPlan, printPlan, paths: { LOCAL_DIR, UPSTREAM_DIR, CLAUDE_DIR }, toJSON: (r) => r.results };
