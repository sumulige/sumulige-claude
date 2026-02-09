const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..', '..');
const PROMPTS_DIR = path.join(ROOT_DIR, 'prompts');

const PROMPT_FILES = {
  technicalCofounderCore: path.join(PROMPTS_DIR, 'technical-cofounder-core.md'),
  softwareArchitect: path.join(PROMPTS_DIR, 'software-architect.md'),
  webDesigner: path.join(PROMPTS_DIR, 'web-designer.md'),
  linusArchitect: path.join(PROMPTS_DIR, 'linus-architect.md')
};

const KEYWORDS = {
  globalUI: [
    '全局', '设计系统', '视觉规范', '统一样式', '品牌', 'design system',
    '视觉系统', '全站', 'ui规范', 'ui 规范', 'brand'
  ],
  web: [
    'web', '网页', '前端', 'ui', 'ux', '页面', '组件', '界面',
    '网站', 'h5', 'react', 'vue', 'svelte', 'tailwind', 'css', 'html'
  ],
  backend: [
    '后端', 'api', '接口', '服务', '数据库', '系统', '认证',
    'server', 'backend', '架构', '微服务', '存储', 'cache'
  ]
};

function includesAny(text, keywords) {
  if (!text || !keywords?.length) return false;
  const hay = text.toLowerCase();
  return keywords.some((kw) => hay.includes(String(kw).toLowerCase()));
}

function readPrompt(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

function addPrompt(prompts, missing, name, filePath) {
  const content = readPrompt(filePath);
  if (!content) {
    missing.push({ name, path: filePath });
    return;
  }
  prompts.push({ name, path: filePath, content });
}

function routePrompts({ task, kind }) {
  const flags = {
    globalUI: includesAny(task, KEYWORDS.globalUI),
    web: includesAny(task, KEYWORDS.web),
    backend: includesAny(task, KEYWORDS.backend)
  };

  const prompts = [];
  const missing = [];

  // Always-on: keep the PO in control and enforce phase-gated cofounder workflow (when skill is present).
  addPrompt(prompts, missing, 'technical-cofounder-core', PROMPT_FILES.technicalCofounderCore);

  if (kind === 'kickoff') {
    addPrompt(prompts, missing, 'software-architect', PROMPT_FILES.softwareArchitect);
  }

  if (flags.globalUI) {
    // ui-ux-pro-max is handled via uipro init; prompt text is injected separately
  }

  if (flags.web) {
    addPrompt(prompts, missing, 'web-designer', PROMPT_FILES.webDesigner);
  }

  if (flags.backend) {
    addPrompt(prompts, missing, 'linus-architect', PROMPT_FILES.linusArchitect);
  }

  return { prompts, flags, missing };
}

module.exports = {
  routePrompts
};
