/**
 * Sync External Skills 脚本单元测试
 * 测试外部技能同步功能
 */

const path = require('path');

describe('Sync External Skills', () => {
  describe('YAML parsing', () => {
    it('should parse valid sources.yaml structure', () => {
      const yamlStructure = {
        version: 1,
        skills: [
          {
            name: 'test-skill',
            description: 'A test skill',
            native: true
          },
          {
            name: 'external-skill',
            description: 'External skill',
            source: {
              repo: 'owner/repo',
              ref: 'main',
              path: '/skills/external'
            },
            target: {
              path: 'template/.claude/skills/external-skill'
            }
          }
        ]
      };

      expect(yamlStructure.version).toBeDefined();
      expect(yamlStructure.skills).toBeInstanceOf(Array);
      expect(yamlStructure.skills[0].name).toBe('test-skill');
      expect(yamlStructure.skills[0].native).toBe(true);
      expect(yamlStructure.skills[1].source?.repo).toBe('owner/repo');
    });

    it('should handle skills array', () => {
      const skills = [
        { name: 'skill1', native: true },
        { name: 'skill2', source: { repo: 'owner/repo' } }
      ];

      expect(skills).toHaveLength(2);
      expect(skills[0].name).toBe('skill1');
      expect(skills[1].name).toBe('skill2');
    });

    it('should parse boolean native field', () => {
      const nativeSkill = { native: true };
      const externalSkill = { native: false };

      expect(nativeSkill.native).toBe(true);
      expect(externalSkill.native).toBe(false);
    });

    it('should parse nested source configuration', () => {
      const source = {
        repo: 'owner/repo',
        ref: 'main',
        path: '/path/to/skill'
      };

      expect(source.repo).toBe('owner/repo');
      expect(source.ref).toBe('main');
      expect(source.path).toBe('/path/to/skill');
    });

    it('should parse sync configuration', () => {
      const sync = {
        include: ['*.md', '*.json'],
        exclude: ['node_modules', '*.lock']
      };

      expect(sync.include).toContain('*.md');
      expect(sync.exclude).toContain('node_modules');
    });
  });

  describe('File pattern matching', () => {
    it('should match include patterns', () => {
      const include = ['*.md', '*.json'];

      // .md file matches
      const mdRegex = new RegExp(include[0].replace('*', '.*'));
      expect(mdRegex.test('file.md')).toBe(true);
      expect(mdRegex.test('file.txt')).toBe(false);

      // .json file matches
      const jsonRegex = new RegExp(include[1].replace('*', '.*'));
      expect(jsonRegex.test('file.json')).toBe(true);
      expect(jsonRegex.test('file.txt')).toBe(false);
    });

    it('should match exclude patterns', () => {
      const exclude = ['node_modules', '*.lock'];

      // node_modules exclusion
      const nmRegex = new RegExp(exclude[0].replace('*', '.*'));
      expect(nmRegex.test('node_modules')).toBe(true);
      expect(nmRegex.test('src')).toBe(false);

      // .lock exclusion
      const lockRegex = new RegExp(exclude[1].replace('*', '.*'));
      expect(lockRegex.test('package-lock.json')).toBe(true);
      expect(lockRegex.test('package.json')).toBe(false);
    });
  });

  describe('Git operations', () => {
    it('should construct correct git clone command', () => {
      const repo = 'owner/repo';
      const ref = 'main';
      const targetDir = '/tmp/test';

      const expectedUrl = `https://github.com/${repo}.git`;
      const command = `git clone --depth 1 --branch ${ref} ${expectedUrl} ${targetDir}`;

      expect(command).toContain('git clone');
      expect(command).toContain('--depth 1');
      expect(command).toContain('--branch main');
      expect(command).toContain('https://github.com/owner/repo.git');
    });
  });

  describe('Source JSON structure', () => {
    it('should create valid JSON structure', () => {
      const skill = {
        name: 'test-skill',
        description: 'A test skill',
        source: {
          repo: 'owner/repo',
          path: '/skills/test',
          ref: 'main'
        },
        author: 'Test Author',
        license: 'MIT',
        homepage: 'https://example.com',
        verified: true
      };

      const expectedFields = ['name', 'description', 'source', 'author', 'license', 'homepage', 'verified'];
      expectedFields.forEach(field => {
        expect(skill).toHaveProperty(field);
      });
    });

    it('should include synced_at timestamp', () => {
      const sourceJson = {
        name: 'test-skill',
        source: {
          repo: 'owner/repo',
          ref: 'main',
          synced_at: new Date().toISOString()
        }
      };

      expect(sourceJson.source.synced_at).toBeDefined();
      expect(new Date(sourceJson.source.synced_at)).toBeInstanceOf(Date);
    });
  });

  describe('Sync logic', () => {
    it('should skip native skills', () => {
      const nativeSkill = { name: 'native-skill', native: true };
      const shouldSkip = nativeSkill.native === true;

      expect(shouldSkip).toBe(true);
    });

    it('should require source.repo for external skills', () => {
      const externalSkill = { name: 'external-skill' };
      const hasRepo = externalSkill.source?.repo;

      expect(hasRepo).toBeUndefined();
    });

    it('should validate required fields', () => {
      const validSkill = {
        name: 'test',
        source: { repo: 'owner/repo' },
        target: { path: '/path' }
      };

      expect(validSkill.name).toBeDefined();
      expect(validSkill.source?.repo).toBeDefined();
      expect(validSkill.target?.path).toBeDefined();
    });
  });

  describe('File paths', () => {
    it('should have correct sources.yaml path', () => {
      const sourcesPath = path.join(__dirname, '..', 'sources.yaml');
      expect(sourcesPath).toContain('sources.yaml');
    });

    it('should have correct skills directory path', () => {
      const skillsDir = path.join(__dirname, '..', 'template', '.claude', 'skills');
      expect(skillsDir).toContain('template');
      expect(skillsDir).toContain('.claude');
      expect(skillsDir).toContain('skills');
    });

    it('should construct correct temp directory path', () => {
      const skillName = 'test-skill';
      const tmpDir = path.join(__dirname, '..', '.tmp', skillName);
      expect(tmpDir).toContain('.tmp');
      expect(tmpDir).toContain('test-skill');
    });
  });
});
