const fs = require('fs');
const os = require('os');
const path = require('path');

const { autoActivateSkills } = require('../lib/skills/auto-activate');

function writeJson(filePath, obj) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(obj, null, 2));
}

describe('autoActivateSkills (technical-cofounder)', () => {
  let projectDir;

  beforeEach(() => {
    projectDir = path.join(
      os.tmpdir(),
      'smc-cofounder-skill-' + Date.now() + '-' + Math.random().toString(16).slice(2)
    );
    fs.mkdirSync(projectDir, { recursive: true });

    writeJson(path.join(projectDir, '.claude', 'rag', 'skill-index.json'), {
      version: '1.0.0',
      last_updated: 'test',
      skills: [
        {
          name: 'technical-cofounder',
          keywords: ['mvp', 'launch', '产品'],
          description: 'test',
          trigger: 'test'
        }
      ],
      auto_load: { enabled: true, confidence_threshold: 0.7, max_skills_per_task: 3 },
      fallback: { enabled: false }
    });

    const skillDir = path.join(projectDir, '.claude', 'skills', 'technical-cofounder');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(
      path.join(skillDir, 'SKILL.md'),
      '---\nname: technical-cofounder\ndescription: test\n---\n'
    );
  });

  afterEach(() => {
    fs.rmSync(projectDir, { recursive: true, force: true });
  });

  test('activates technical-cofounder for product/MVP tasks', () => {
    const skills = autoActivateSkills({ task: 'build an MVP to launch', projectDir });
    expect(skills.map((s) => s.name)).toContain('technical-cofounder');
  });

  test('does not activate technical-cofounder for bugfix tasks', () => {
    const skills = autoActivateSkills({ task: 'fix bug in cli', projectDir });
    expect(skills.map((s) => s.name)).not.toContain('technical-cofounder');
  });
});

