const fs = require('fs');
const os = require('os');
const path = require('path');

function loadSkillIndex(projectDir) {
  const projectIndex = path.join(projectDir, '.claude', 'rag', 'skill-index.json');
  if (fs.existsSync(projectIndex)) {
    try {
      return JSON.parse(fs.readFileSync(projectIndex, 'utf-8'));
    } catch {
      return null;
    }
  }
  const fallbackIndex = path.join(__dirname, '..', '..', 'template', '.claude', 'rag', 'skill-index.json');
  if (fs.existsSync(fallbackIndex)) {
    try {
      return JSON.parse(fs.readFileSync(fallbackIndex, 'utf-8'));
    } catch {
      return null;
    }
  }
  return null;
}

function scoreSkill(task, keywords) {
  if (!keywords?.length) return 0;
  const hay = task.toLowerCase();
  let score = 0;
  for (const kw of keywords) {
    if (!kw) continue;
    const needle = String(kw).toLowerCase();
    if (needle && hay.includes(needle)) score += 1;
  }
  return score;
}

function selectSkills(task, index, maxSkills, threshold) {
  if (!index?.skills?.length) return [];
  const scored = index.skills
    .map((skill) => ({
      ...skill,
      score: scoreSkill(task, skill.keywords || [])
    }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSkills);

  if (!scored.length) return [];

  const confidenceThreshold = typeof threshold === 'number' ? threshold : 0;
  const maxScore = scored[0].score || 1;
  return scored.filter((s) => (s.score / maxScore) >= confidenceThreshold);
}

function resolveSkillPath(projectDir, name) {
  const projectSkill = path.join(projectDir, '.claude', 'skills', name, 'SKILL.md');
  if (fs.existsSync(projectSkill)) return projectSkill;
  const globalSkill = path.join(os.homedir(), '.claude', 'skills', name, 'SKILL.md');
  if (fs.existsSync(globalSkill)) return globalSkill;
  const templateSkill = path.join(__dirname, '..', '..', 'template', '.claude', 'skills', name, 'SKILL.md');
  if (fs.existsSync(templateSkill)) return templateSkill;
  return null;
}

function loadSkillContent(projectDir, name) {
  const skillPath = resolveSkillPath(projectDir, name);
  if (!skillPath) return null;
  try {
    return fs.readFileSync(skillPath, 'utf-8');
  } catch {
    return null;
  }
}

function logActivatedSkills(projectDir, { task, mode, skills }) {
  if (!skills?.length) return;
  try {
    const logDir = path.join(projectDir, '.claude', 'agent-logs');
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    const logFile = path.join(logDir, 'skill-activations.log');
    const entry = {
      ts: new Date().toISOString(),
      mode,
      task,
      skills: skills.map((s) => ({ name: s.name, score: s.score }))
    };
    fs.appendFileSync(logFile, JSON.stringify(entry) + '\n');
  } catch {
    // silent by design
  }
}

function autoActivateSkills({ task, projectDir, enabled = true, maxSkills = null }) {
  if (!enabled) return [];
  const index = loadSkillIndex(projectDir);
  if (!index) return [];
  const threshold = index.auto_load?.confidence_threshold ?? 0;
  const limit = maxSkills ?? index.auto_load?.max_skills_per_task ?? 3;
  let skills = selectSkills(task, index, limit, threshold);
  if (!skills.length && index.fallback?.enabled && index.fallback?.skill) {
    const fallback = index.skills.find((s) => s.name === index.fallback.skill);
    if (fallback) skills = [{ ...fallback, score: 1 }];
  }
  const enriched = skills.map((s) => ({
    name: s.name,
    description: s.description,
    trigger: s.trigger,
    score: s.score,
    content: loadSkillContent(projectDir, s.name)
  }));
  logActivatedSkills(projectDir, { task, mode: 'auto', skills: enriched });
  return enriched;
}

module.exports = {
  autoActivateSkills
};
