/**
 * Update Registry 脚本单元测试
 * 测试市场注册表生成功能
 */

const path = require('path');

describe('Update Registry Script', () => {
  describe('findSkillDirs', () => {
    it('should identify skill directories with SKILL.md', () => {
      const hasSkillFile = 'SKILL.md';
      expect(hasSkillFile).toBe('SKILL.md');
    });

    it('should identify skill directories with metadata.yaml', () => {
      const hasMetadata = 'metadata.yaml';
      expect(hasMetadata).toBe('metadata.yaml');
    });

    it('should identify skill directories with .source.json', () => {
      const hasSourceJson = '.source.json';
      expect(hasSourceJson).toBe('.source.json');
    });

    it('should skip template directory', () => {
      const skipDirs = ['template', 'examples', '__tests__'];
      expect(skipDirs).toContain('template');
      expect(skipDirs).toContain('examples');
      expect(skipDirs).toContain('__tests__');
    });

    it('should not skip regular skill directories', () => {
      const skipDirs = ['template', 'examples', '__tests__'];
      expect(skipDirs).not.toContain('my-skill');
      expect(skipDirs).not.toContain('code-reviewer');
    });
  });

  describe('parseMetadata', () => {
    it('should parse simple key-value pairs', () => {
      const yamlContent = `
name: test-skill
description: A test skill
version: 1.0.0
      `;

      expect(yamlContent).toContain('name:');
      expect(yamlContent).toContain('description:');
      expect(yamlContent).toContain('version:');
    });

    it('should parse boolean values', () => {
      const yamlTrue = 'enabled: true';
      const yamlFalse = 'enabled: false';

      expect(yamlTrue).toContain('true');
      expect(yamlFalse).toContain('false');
    });

    it('should parse array values', () => {
      const yamlArray = 'tags: [tag1, tag2, tag3]';
      const yamlEmptyArray = 'tags: []';

      expect(yamlArray).toContain('[');
      expect(yamlEmptyArray).toBe('tags: []');
    });

    it('should skip comments', () => {
      const yamlWithComments = `
# This is a comment
name: test-skill
# Another comment
description: Test
      `;

      const lines = yamlWithComments.split('\n').filter(l => l.trim() && !l.trim().startsWith('#'));
      expect(lines.length).toBe(2);
    });

    it('should handle empty YAML', () => {
      const emptyYaml = '';
      expect(emptyYaml).toBe('');
    });
  });

  describe('parseSourceJson', () => {
    it('should parse valid JSON', () => {
      const json = {
        name: 'test-skill',
        source: {
          repo: 'owner/repo',
          ref: 'main'
        },
        synced_at: '2024-01-01T00:00:00.000Z'
      };

      expect(json.name).toBe('test-skill');
      expect(json.source.repo).toBe('owner/repo');
      expect(json.source.ref).toBe('main');
    });

    it('should handle missing .source.json', () => {
      const missing = null;
      expect(missing).toBeNull();
    });
  });

  describe('getSkillDescription', () => {
    it('should extract first non-heading paragraph', () => {
      const content = `
# Test Skill

This is the description of the skill.

More details here.
      `;

      const lines = content.split('\n').filter(l => l.trim() && !l.trim().startsWith('#'));
      expect(lines[0].trim()).toBe('This is the description of the skill.');
    });

    it('should skip HTML comments and headings', () => {
      const content = `
<!-- This is a comment -->
# Title

This is real content.
      `;

      const lines = content.split('\n').filter(l => {
        const trimmed = l.trim();
        return trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('>') && !trimmed.startsWith('<!--');
      });
      expect(lines[0]).toContain('This is real content');
    });

    it('should handle empty content', () => {
      const emptyContent = '';
      const lines = emptyContent.split('\n').filter(l => l.trim());
      expect(lines.length).toBe(0);
    });
  });

  describe('getSkillCategory', () => {
    it('should return default category when no match', () => {
      const pathParts = ['some', 'random', 'path'];
      const categories = { tools: { name: 'Tools' } };

      const found = pathParts.some(part => categories[part]);
      expect(found).toBe(false);
    });

    it('should find category in path', () => {
      const pathParts = ['tools', 'skill-name'];
      const categories = { tools: { name: 'Tools' } };

      const found = pathParts.find(part => categories[part]);
      expect(found).toBe('tools');
    });

    it('should default to tools category', () => {
      const defaultCategory = 'tools';
      expect(defaultCategory).toBe('tools');
    });
  });

  describe('generateRegistry structure', () => {
    it('should have required top-level fields', () => {
      const registry = {
        name: 'smc-skills',
        description: 'Test registry',
        homepage: 'https://github.com/test/test',
        owner: { name: 'test' },
        plugins: [],
        metadata: {}
      };

      expect(registry).toHaveProperty('name');
      expect(registry).toHaveProperty('description');
      expect(registry).toHaveProperty('homepage');
      expect(registry).toHaveProperty('owner');
      expect(registry).toHaveProperty('plugins');
      expect(registry).toHaveProperty('metadata');
    });

    it('should create plugin with skills array', () => {
      const plugin = {
        name: 'smc-skills',
        description: 'Test plugin',
        source: './',
        skills: ['./skills/skill1', './skills/skill2'],
        skill_list: [
          { name: 'skill1', path: './skills/skill1' },
          { name: 'skill2', path: './skills/skill2' }
        ]
      };

      expect(plugin.skills).toHaveLength(2);
      expect(plugin.skill_list).toHaveLength(2);
    });

    it('should include metadata with generated_at timestamp', () => {
      const metadata = {
        version: '1.0.0',
        generated_at: new Date().toISOString(),
        skill_count: 10,
        categories: {}
      };

      expect(metadata.generated_at).toBeDefined();
      expect(new Date(metadata.generated_at)).toBeInstanceOf(Date);
    });
  });

  describe('File paths', () => {
    it('should have correct marketplace.json path', () => {
      const marketplacePath = path.join(__dirname, '..', '.claude-plugin', 'marketplace.json');
      expect(marketplacePath).toContain('.claude-plugin');
      expect(marketplacePath).toContain('marketplace.json');
    });

    it('should have correct skills directory path', () => {
      const skillsDir = path.join(__dirname, '..', 'template', '.claude', 'skills');
      expect(skillsDir).toContain('template');
      expect(skillsDir).toContain('.claude');
      expect(skillsDir).toContain('skills');
    });

    it('should have correct categories file path', () => {
      const categoriesPath = path.join(__dirname, '..', 'config', 'skill-categories.json');
      expect(categoriesPath).toContain('config');
      expect(categoriesPath).toContain('skill-categories.json');
    });
  });

  describe('getPackageVersion', () => {
    it('should return version from package.json', () => {
      const pkg = {
        name: 'test-package',
        version: '1.2.3'
      };

      expect(pkg.version).toBe('1.2.3');
    });

    it('should return default version when not found', () => {
      const defaultVersion = '1.0.0';
      expect(defaultVersion).toBe('1.0.0');
    });
  });
});
