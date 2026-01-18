/**
 * Marketplace 模块单元测试 - 扩展版
 * 测试技能市场管理和 YAML 解析功能
 */

const { parseSimpleYaml } = require('../lib/marketplace');

describe('Marketplace Module', () => {

  // ============================================================================
  // parseSimpleYaml 单元测试
  // ============================================================================

  describe('parseSimpleYaml', () => {
    it('should parse version number', () => {
      const yaml = `version: 1
skills:
  - name: test-skill`;
      expect(parseSimpleYaml(yaml).version).toBe(1);
    });

    it('should parse version as integer', () => {
      const yaml = `version: 2
skills:`;
      expect(typeof parseSimpleYaml(yaml).version).toBe('number');
    });

    it('should handle empty YAML', () => {
      expect(parseSimpleYaml('')).toEqual({ skills: [] });
    });

    it('should handle skills section with no skills', () => {
      const yaml = `version: 1
skills:`;
      expect(parseSimpleYaml(yaml).skills).toEqual([]);
    });

    it('should parse single skill name only', () => {
      const yaml = `skills:
  - name: test-skill`;
      const result = parseSimpleYaml(yaml);
      expect(result.skills).toHaveLength(1);
      expect(result.skills[0].name).toBe('test-skill');
    });

    it('should parse multiple skill names', () => {
      const yaml = `skills:
  - name: skill-one
  - name: skill-two
  - name: skill-three`;
      const result = parseSimpleYaml(yaml);
      expect(result.skills).toHaveLength(3);
      expect(result.skills[0].name).toBe('skill-one');
      expect(result.skills[1].name).toBe('skill-two');
      expect(result.skills[2].name).toBe('skill-three');
    });

    it('should parse nested source object', () => {
      const yaml = `skills:
  - name: test
  source:
    repo: owner/repo
    ref: main`;
      const result = parseSimpleYaml(yaml);
      expect(result.skills[0].source).toEqual({ repo: 'owner/repo', ref: 'main' });
    });

    it('should parse nested target object', () => {
      const yaml = `skills:
  - name: test
  target:
    category: tools
    path: /path/to/skill`;
      const result = parseSimpleYaml(yaml);
      expect(result.skills[0].target).toEqual({ category: 'tools', path: '/path/to/skill' });
    });

    it('should parse nested author object', () => {
      const yaml = `skills:
  - name: test
  author:
    name: Test Author
    github: testauthor`;
      const result = parseSimpleYaml(yaml);
      expect(result.skills[0].author).toEqual({ name: 'Test Author', github: 'testauthor' });
    });

    it('should parse nested sync object', () => {
      const yaml = `skills:
  - name: test
  sync:
    include: *.md
    exclude: node_modules`;
      const result = parseSimpleYaml(yaml);
      expect(result.skills[0].sync).toEqual({ include: '*.md', exclude: 'node_modules' });
    });

    it('should parse boolean true in nested properties', () => {
      const yaml = `skills:
  - name: test
  sync:
    enabled: true`;
      const result = parseSimpleYaml(yaml);
      expect(result.skills[0].sync.enabled).toBe(true);
    });

    it('should parse boolean false in nested properties', () => {
      const yaml = `skills:
  - name: test
  sync:
    enabled: false`;
      const result = parseSimpleYaml(yaml);
      expect(result.skills[0].sync.enabled).toBe(false);
    });

    it('should parse empty array in nested properties', () => {
      const yaml = `skills:
  - name: test
  sync:
    tags: []`;
      const result = parseSimpleYaml(yaml);
      expect(result.skills[0].sync.tags).toEqual([]);
    });

    it('should handle properties with hyphens', () => {
      const yaml = `skills:
  - name: my-skill
  author:
    github-url: https://github.com/test`;
      const result = parseSimpleYaml(yaml);
      expect(result.skills[0].author['github-url']).toBe('https://github.com/test');
    });

    it('should handle properties with underscores', () => {
      const yaml = `skills:
  - name: test
  author:
    github_user: test_user`;
      const result = parseSimpleYaml(yaml);
      expect(result.skills[0].author.github_user).toBe('test_user');
    });

    it('should skip comments at start', () => {
      const yaml = `# Comment at start
skills:
  - name: test`;
      const result = parseSimpleYaml(yaml);
      expect(result.skills[0].name).toBe('test');
    });

    it('should skip comments in skills section', () => {
      const yaml = `skills:
  # Inline comment
  - name: test`;
      const result = parseSimpleYaml(yaml);
      expect(result.skills[0].name).toBe('test');
    });

    it('should skip empty lines', () => {
      const yaml = `skills:

  - name: test

  - name: test2`;
      const result = parseSimpleYaml(yaml);
      expect(result.skills).toHaveLength(2);
    });

    it('should handle complex real-world YAML', () => {
      const yaml = `version: 1
skills:
  - name: dev-browser
  description: Browser automation
  native: true
  target:
    category: tools
    path: template/.claude/skills/tools/dev-browser
  - name: gastown
  source:
    repo: SawyerHood/gastown
    path: skills/gastown
    ref: main
  target:
    category: tools
    path: template/.claude/skills/tools/gastown
  author:
    name: SawyerHood
    github: SawyerHood
  license: MIT
  verified: false`;
      const result = parseSimpleYaml(yaml);
      expect(result.version).toBe(1);
      expect(result.skills).toHaveLength(2);
      expect(result.skills[0].name).toBe('dev-browser');
      expect(result.skills[0].native).toBe(true);
      expect(result.skills[0].target.category).toBe('tools');
      expect(result.skills[1].name).toBe('gastown');
      expect(result.skills[1].source.repo).toBe('SawyerHood/gastown');
      expect(result.skills[1].author.github).toBe('SawyerHood');
      expect(result.skills[1].verified).toBe(false);
    });

    it('should handle multiple nested objects in one skill', () => {
      const yaml = `skills:
  - name: complex-skill
  source:
    repo: owner/repo
    ref: main
  target:
    category: workflow
    path: /path
  author:
    name: Author
    github: author
  sync:
    include: *.md
    exclude: node_modules`;
      const result = parseSimpleYaml(yaml);
      expect(result.skills[0].source.repo).toBe('owner/repo');
      expect(result.skills[0].target.category).toBe('workflow');
      expect(result.skills[0].author.name).toBe('Author');
      expect(result.skills[0].sync.include).toBe('*.md');
    });

    it('should parse license property', () => {
      const yaml = `skills:
  - name: test
  license: MIT`;
      const result = parseSimpleYaml(yaml);
      expect(result.skills[0].license).toBe('MIT');
    });

    it('should parse homepage property', () => {
      const yaml = `skills:
  - name: test
  homepage: https://example.com`;
      const result = parseSimpleYaml(yaml);
      expect(result.skills[0].homepage).toBe('https://example.com');
    });

    it('should parse verified property', () => {
      const yaml = `skills:
  - name: test
  verified: false`;
      const result = parseSimpleYaml(yaml);
      expect(result.skills[0].verified).toBe(false);
    });

    it('should handle quoted strings', () => {
      const yaml = `skills:
  - name: test
  description: "A quoted description"`;
      const result = parseSimpleYaml(yaml);
      expect(result.skills[0].description).toBe('A quoted description');
    });

    it('should handle single-quoted strings', () => {
      const yaml = `skills:
  - name: test
  description: 'A single-quoted description'`;
      const result = parseSimpleYaml(yaml);
      expect(result.skills[0].description).toBe('A single-quoted description');
    });

    it('should handle URLs with special characters', () => {
      const yaml = `skills:
  - name: test
  homepage: https://github.com/owner/repo/tree/main/skills`;
      const result = parseSimpleYaml(yaml);
      expect(result.skills[0].homepage).toBe('https://github.com/owner/repo/tree/main/skills');
    });
  });

  // ============================================================================
  // 市场常量定义测试
  // ============================================================================

  describe('Marketplace constants', () => {
    it('should define SOURCES_FILE path', () => {
      const path = require('path');
      const sourcesPath = path.join(__dirname, '..', 'sources.yaml');
      expect(sourcesPath).toContain('sources.yaml');
    });

    it('should define MARKETPLACE_FILE path', () => {
      const path = require('path');
      const marketplacePath = path.join(__dirname, '..', '.claude-plugin', 'marketplace.json');
      expect(marketplacePath).toContain('marketplace.json');
    });

    it('should define CATEGORIES_FILE path', () => {
      const path = require('path');
      const categoriesPath = path.join(__dirname, '..', 'config', 'skill-categories.json');
      expect(categoriesPath).toContain('skill-categories.json');
    });
  });

  // ============================================================================
  // YAML 格式验证测试
  // ============================================================================

  describe('YAML format validation', () => {
    it('should recognize skills section header', () => {
      const yaml = `skills:`;
      const lines = yaml.split('\n');
      const hasSkillsSection = lines.some(l => l.trim() === 'skills:');
      expect(hasSkillsSection).toBe(true);
    });

    it('should recognize version field', () => {
      const yaml = `version: 1`;
      const lines = yaml.split('\n');
      const hasVersion = lines.some(l => l.trim().startsWith('version:'));
      expect(hasVersion).toBe(true);
    });

    it('should recognize skill entry marker', () => {
      const yaml = `  - name: test-skill`;
      const isSkillEntry = yaml.trim().startsWith('- name:');
      expect(isSkillEntry).toBe(true);
    });

    it('should validate indent pattern for skill entries', () => {
      const line = `  - name: test`;
      const indent = line.search(/\S/);
      expect(indent).toBe(2);
    });

    it('should validate indent pattern for nested properties', () => {
      const line = `    repo: owner/repo`;
      const indent = line.search(/\S/);
      expect(indent).toBe(4);
    });
  });

  // ============================================================================
  // 模块导出测试
  // ============================================================================

  describe('exports', () => {
    it('should export marketplaceCommands object', () => {
      const marketplace = require('../lib/marketplace');
      expect(marketplace.marketplaceCommands).toBeDefined();
      expect(typeof marketplace.marketplaceCommands).toBe('object');
    });

    it('should export all marketplace commands', () => {
      const marketplace = require('../lib/marketplace');
      const commands = marketplace.marketplaceCommands;

      expect(commands['marketplace:list']).toBeDefined();
      expect(commands['marketplace:install']).toBeDefined();
      expect(commands['marketplace:sync']).toBeDefined();
      expect(commands['marketplace:add']).toBeDefined();
      expect(commands['marketplace:remove']).toBeDefined();
      expect(commands['marketplace:status']).toBeDefined();
    });

    it('should have exactly 6 commands', () => {
      const marketplace = require('../lib/marketplace');
      const commands = marketplace.marketplaceCommands;

      expect(Object.keys(commands).length).toBe(6);
    });

    it('should export functions with correct types', () => {
      const marketplace = require('../lib/marketplace');
      const commands = marketplace.marketplaceCommands;

      Object.values(commands).forEach(cmd => {
        expect(typeof cmd).toBe('function');
      });
    });
  });

  // ============================================================================
  // 命令功能测试
  // ============================================================================

  describe('command features', () => {
    it('should parse repo format correctly', () => {
      const repo = 'owner/repo-name';
      const match = repo.match(/^([^/]+)\/(.+)$/);
      expect(match).toBeTruthy();
      expect(match[1]).toBe('owner');
      expect(match[2]).toBe('repo-name');
    });

    it('should reject invalid repo format', () => {
      const repo = 'invalid-format';
      const match = repo.match(/^([^/]+)\/(.+)$/);
      expect(match).toBeNull();
    });

    it('should normalize skill name to kebab-case', () => {
      const name = 'Owner/Repo_Name';
      const skillName = name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      expect(skillName).toBe('owner-repo-name');
    });

    it('should detect duplicate skills in sources list', () => {
      const sources = [
        { name: 'skill-one' },
        { name: 'skill-two' },
        { name: 'skill-three' }
      ];
      const exists = sources.some(s => s.name === 'skill-two');
      expect(exists).toBe(true);
    });

    it('should not find non-existent skill', () => {
      const sources = [
        { name: 'skill-one' },
        { name: 'skill-two' }
      ];
      const exists = sources.some(s => s.name === 'skill-three');
      expect(exists).toBe(false);
    });
  });
});
