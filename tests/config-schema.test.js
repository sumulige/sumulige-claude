/**
 * Config Schema 模块单元测试
 * 测试 JSON Schema 定义和获取功能
 */

const schema = require('../lib/config-schema');

describe('Config Schema Module', () => {
  describe('exports', () => {
    it('should export CONFIG_SCHEMA', () => {
      expect(schema.CONFIG_SCHEMA).toBeDefined();
      expect(typeof schema.CONFIG_SCHEMA).toBe('object');
    });

    it('should export SETTINGS_SCHEMA', () => {
      expect(schema.SETTINGS_SCHEMA).toBeDefined();
      expect(typeof schema.SETTINGS_SCHEMA).toBe('object');
    });

    it('should export QUALITY_GATE_SCHEMA', () => {
      expect(schema.QUALITY_GATE_SCHEMA).toBeDefined();
      expect(typeof schema.QUALITY_GATE_SCHEMA).toBe('object');
    });

    it('should export getSchema function', () => {
      expect(typeof schema.getSchema).toBe('function');
    });

    it('should export getAllSchemas function', () => {
      expect(typeof schema.getAllSchemas).toBe('function');
    });
  });

  describe('getSchema', () => {
    it('should return CONFIG_SCHEMA for "config"', () => {
      const result = schema.getSchema('config');
      expect(result).toBe(schema.CONFIG_SCHEMA);
    });

    it('should return SETTINGS_SCHEMA for "settings"', () => {
      const result = schema.getSchema('settings');
      expect(result).toBe(schema.SETTINGS_SCHEMA);
    });

    it('should return QUALITY_GATE_SCHEMA for "quality-gate"', () => {
      const result = schema.getSchema('quality-gate');
      expect(result).toBe(schema.QUALITY_GATE_SCHEMA);
    });

    it('should return undefined for unknown schema name', () => {
      const result = schema.getSchema('unknown');
      expect(result).toBeUndefined();
    });

    it('should return undefined for empty string', () => {
      const result = schema.getSchema('');
      expect(result).toBeUndefined();
    });

    it('should return undefined for null', () => {
      const result = schema.getSchema(null);
      expect(result).toBeUndefined();
    });
  });

  describe('getAllSchemas', () => {
    it('should return all three schemas', () => {
      const result = schema.getAllSchemas();
      expect(Object.keys(result)).toHaveLength(3);
      expect(result.config).toBeDefined();
      expect(result.settings).toBeDefined();
      expect(result['quality-gate']).toBeDefined();
    });

    it('should return the same schema objects as exported', () => {
      const result = schema.getAllSchemas();
      expect(result.config).toBe(schema.CONFIG_SCHEMA);
      expect(result.settings).toBe(schema.SETTINGS_SCHEMA);
      expect(result['quality-gate']).toBe(schema.QUALITY_GATE_SCHEMA);
    });
  });

  describe('CONFIG_SCHEMA structure', () => {
    it('should have correct $id', () => {
      expect(schema.CONFIG_SCHEMA.$id).toBe('https://sumulige-claude.com/schemas/config.json');
    });

    it('should use JSON Schema Draft 7', () => {
      expect(schema.CONFIG_SCHEMA.$schema).toBe('http://json-schema.org/draft-07/schema#');
    });

    it('should have title', () => {
      expect(schema.CONFIG_SCHEMA.title).toBe('Sumulige Claude Configuration');
    });

    it('should be object type', () => {
      expect(schema.CONFIG_SCHEMA.type).toBe('object');
    });

    it('should require version field', () => {
      expect(schema.CONFIG_SCHEMA.required).toContain('version');
    });

    it('should have additionalProperties enabled', () => {
      expect(schema.CONFIG_SCHEMA.additionalProperties).toBe(true);
    });
  });

  describe('CONFIG_SCHEMA version validation', () => {
    const versionSchema = schema.CONFIG_SCHEMA.properties.version;

    it('should be string type', () => {
      expect(versionSchema.type).toBe('string');
    });

    it('should have semantic version pattern', () => {
      expect(versionSchema.pattern).toBeDefined();
      const pattern = new RegExp(versionSchema.pattern);

      // Valid versions
      expect(pattern.test('1.0.0')).toBe(true);
      expect(pattern.test('1.0.7')).toBe(true);
      expect(pattern.test('2.3.4')).toBe(true);
      expect(pattern.test('1.0.0-beta')).toBe(true);
      expect(pattern.test('1.0.0-alpha.1')).toBe(true);
      expect(pattern.test('1.0.0-rc.1')).toBe(true);

      // Invalid versions
      expect(pattern.test('1.0')).toBe(false);
      expect(pattern.test('1')).toBe(false);
      expect(pattern.test('v1.0.0')).toBe(false);
      expect(pattern.test('1.0.0-beta_123')).toBe(false);
    });
  });

  describe('CONFIG_SCHEMA model validation', () => {
    const modelSchema = schema.CONFIG_SCHEMA.properties.model;

    it('should be string type', () => {
      expect(modelSchema.type).toBe('string');
    });

    it('should have enum with valid Claude models', () => {
      expect(modelSchema.enum).toBeDefined();
      expect(modelSchema.enum).toContain('claude-opus-4.5');
      expect(modelSchema.enum).toContain('claude-opus-4-20250514');
      expect(modelSchema.enum).toContain('claude-opus-4-5-20251101');
      expect(modelSchema.enum).toContain('claude-sonnet-4.5');
      expect(modelSchema.enum).toContain('claude-sonnet-4-20250514');
      expect(modelSchema.enum).toContain('claude-sonnet-4-5-20251101');
      expect(modelSchema.enum).toContain('claude-haiku-4.5');
    });
  });

  describe('CONFIG_SCHEMA agents validation', () => {
    const agentsSchema = schema.CONFIG_SCHEMA.properties.agents;

    it('should be object type', () => {
      expect(agentsSchema.type).toBe('object');
    });

    it('should validate agent name pattern', () => {
      // The pattern is defined as a key in patternProperties
      const patternKey = '^[a-z][a-z0-9-]*$';
      expect(agentsSchema.patternProperties[patternKey]).toBeDefined();

      const pattern = new RegExp(patternKey);

      // Valid agent names
      expect(pattern.test('conductor')).toBe(true);
      expect(pattern.test('architect')).toBe(true);
      expect(pattern.test('my-agent')).toBe(true);
      expect(pattern.test('agent-123')).toBe(true);
      expect(pattern.test('a')).toBe(true);

      // Invalid agent names
      expect(pattern.test('Agent')).toBe(false);
      expect(pattern.test('123agent')).toBe(false);
      expect(pattern.test('_agent')).toBe(false);
      expect(pattern.test('agent_')).toBe(false);
      expect(pattern.test('agent.name')).toBe(false);
    });

    it('should require role field for agents', () => {
      const agentSchema = agentsSchema.patternProperties['^[a-z][a-z0-9-]*$'];
      expect(agentSchema.required).toContain('role');
    });
  });

  describe('CONFIG_SCHEMA skills validation', () => {
    const skillsSchema = schema.CONFIG_SCHEMA.properties.skills;

    it('should be array type', () => {
      expect(skillsSchema.type).toBe('array');
    });

    it('should validate skill repository format', () => {
      const itemSchema = skillsSchema.items;
      expect(itemSchema.pattern).toBeDefined();
      const pattern = new RegExp(itemSchema.pattern);

      // Valid formats
      expect(pattern.test('anthropics/skills')).toBe(true);
      expect(pattern.test('numman-ali/n-skills')).toBe(true);
      expect(pattern.test('owner/repo.name')).toBe(true);
      expect(pattern.test('Owner_123/repo-456')).toBe(true);

      // Invalid formats
      expect(pattern.test('owner')).toBe(false);
      expect(pattern.test('owner/')).toBe(false);
      expect(pattern.test('/repo')).toBe(false);
      expect(pattern.test('owner/repo/extra')).toBe(false);
    });

    it('should require unique items', () => {
      expect(skillsSchema.uniqueItems).toBe(true);
    });
  });

  describe('CONFIG_SCHEMA hooks validation', () => {
    const hooksSchema = schema.CONFIG_SCHEMA.properties.hooks;

    it('should be object type', () => {
      expect(hooksSchema.type).toBe('object');
    });

    it('should have preTask array property', () => {
      expect(hooksSchema.properties.preTask).toBeDefined();
      expect(hooksSchema.properties.preTask.type).toBe('array');
    });

    it('should have postTask array property', () => {
      expect(hooksSchema.properties.postTask).toBeDefined();
      expect(hooksSchema.properties.postTask.type).toBe('array');
    });
  });

  describe('CONFIG_SCHEMA thinkingLens validation', () => {
    const tlSchema = schema.CONFIG_SCHEMA.properties.thinkingLens;

    it('should be object type', () => {
      expect(tlSchema.type).toBe('object');
    });

    it('should have enabled boolean property', () => {
      expect(tlSchema.properties.enabled.type).toBe('boolean');
    });

    it('should have autoSync boolean property', () => {
      expect(tlSchema.properties.autoSync.type).toBe('boolean');
    });

    it('should validate syncInterval range', () => {
      const intervalSchema = tlSchema.properties.syncInterval;
      expect(intervalSchema.type).toBe('integer');
      expect(intervalSchema.minimum).toBe(1);
      expect(intervalSchema.maximum).toBe(300);
    });
  });

  describe('CONFIG_SCHEMA qualityGate validation', () => {
    const qgSchema = schema.CONFIG_SCHEMA.properties.qualityGate;

    it('should be object type', () => {
      expect(qgSchema.type).toBe('object');
    });

    it('should have enabled boolean property', () => {
      expect(qgSchema.properties.enabled.type).toBe('boolean');
    });

    it('should validate severity enum', () => {
      const severitySchema = qgSchema.properties.severity;
      expect(severitySchema.enum).toEqual(['info', 'warn', 'error', 'critical']);
    });

    it('should validate rules array structure', () => {
      const rulesSchema = qgSchema.properties.rules;
      expect(rulesSchema.type).toBe('array');
      expect(rulesSchema.items.required).toContain('id');
    });

    it('should validate gates trigger points', () => {
      const gatesSchema = qgSchema.properties.gates;
      expect(gatesSchema.properties.preCommit).toBeDefined();
      expect(gatesSchema.properties.prePush).toBeDefined();
      expect(gatesSchema.properties.onToolUse).toBeDefined();
    });

    it('should validate reporting format enum', () => {
      const reportingSchema = qgSchema.properties.reporting;
      expect(reportingSchema.properties.format.enum).toEqual(['console', 'json', 'markdown', 'html']);
    });
  });

  describe('CONFIG_SCHEMA marketplace validation', () => {
    const mpSchema = schema.CONFIG_SCHEMA.properties.marketplace;

    it('should be object type', () => {
      expect(mpSchema.type).toBe('object');
    });

    it('should have enabled boolean property', () => {
      expect(mpSchema.properties.enabled.type).toBe('boolean');
    });

    it('should have autoSync boolean property', () => {
      expect(mpSchema.properties.autoSync.type).toBe('boolean');
    });

    it('should validate syncInterval range (1-1440 minutes)', () => {
      const intervalSchema = mpSchema.properties.syncInterval;
      expect(intervalSchema.type).toBe('integer');
      expect(intervalSchema.minimum).toBe(1);
      expect(intervalSchema.maximum).toBe(1440);
    });

    it('should validate sources array', () => {
      const sourcesSchema = mpSchema.properties.sources;
      expect(sourcesSchema.type).toBe('array');
      expect(sourcesSchema.items.format).toBe('uri');
    });
  });

  describe('SETTINGS_SCHEMA structure', () => {
    it('should have correct $id', () => {
      expect(schema.SETTINGS_SCHEMA.$id).toBe('https://sumulige-claude.com/schemas/settings.json');
    });

    it('should use JSON Schema Draft 7', () => {
      expect(schema.SETTINGS_SCHEMA.$schema).toBe('http://json-schema.org/draft-07/schema#');
    });

    it('should have title', () => {
      expect(schema.SETTINGS_SCHEMA.title).toBe('Project Settings');
    });

    it('should be object type', () => {
      expect(schema.SETTINGS_SCHEMA.type).toBe('object');
    });

    it('should validate hook event names', () => {
      const patternProperties = schema.SETTINGS_SCHEMA.patternProperties;
      const eventPattern = Object.keys(patternProperties)[0];

      // The schema uses a single regex pattern for all events
      expect(eventPattern).toBe('^(UserPromptSubmit|PreToolUse|PostToolUse|AgentStop|SessionEnd)$');

      // Verify the pattern matches each event
      const pattern = new RegExp(eventPattern);
      expect(pattern.test('UserPromptSubmit')).toBe(true);
      expect(pattern.test('PreToolUse')).toBe(true);
      expect(pattern.test('PostToolUse')).toBe(true);
      expect(pattern.test('AgentStop')).toBe(true);
      expect(pattern.test('SessionEnd')).toBe(true);

      // Verify it doesn't match invalid events
      expect(pattern.test('InvalidEvent')).toBe(false);
      expect(pattern.test('usereventsubmit')).toBe(false);
    });

    it('should validate hook timeout range', () => {
      // Get the first event pattern's items structure
      const eventPattern = '^(UserPromptSubmit|PreToolUse|PostToolUse|AgentStop|SessionEnd)$';
      const eventSchema = schema.SETTINGS_SCHEMA.patternProperties[eventPattern];
      const hookItems = eventSchema.items.properties.hooks.items;

      expect(hookItems.properties.timeout.minimum).toBe(100);
      expect(hookItems.properties.timeout.maximum).toBe(60000);
    });

    it('should validate hook type enum', () => {
      const eventPattern = '^(UserPromptSubmit|PreToolUse|PostToolUse|AgentStop|SessionEnd)$';
      const eventSchema = schema.SETTINGS_SCHEMA.patternProperties[eventPattern];
      const hookItems = eventSchema.items.properties.hooks.items;

      expect(hookItems.properties.type.enum).toContain('command');
    });
  });

  describe('QUALITY_GATE_SCHEMA structure', () => {
    it('should have correct $id', () => {
      expect(schema.QUALITY_GATE_SCHEMA.$id).toBe('https://sumulige-claude.com/schemas/quality-gate.json');
    });

    it('should use JSON Schema Draft 7', () => {
      expect(schema.QUALITY_GATE_SCHEMA.$schema).toBe('http://json-schema.org/draft-07/schema#');
    });

    it('should have title', () => {
      expect(schema.QUALITY_GATE_SCHEMA.title).toBe('Quality Gate Configuration');
    });

    it('should be object type', () => {
      expect(schema.QUALITY_GATE_SCHEMA.type).toBe('object');
    });

    it('should validate severity enum with default', () => {
      const severitySchema = schema.QUALITY_GATE_SCHEMA.properties.severity;
      expect(severitySchema.enum).toEqual(['info', 'warn', 'error', 'critical']);
      expect(severitySchema.default).toBe('warn');
    });

    it('should validate rules array structure', () => {
      const rulesSchema = schema.QUALITY_GATE_SCHEMA.properties.rules;
      expect(rulesSchema.type).toBe('array');
      expect(rulesSchema.items.required).toEqual(['id']);
      expect(rulesSchema.items.properties.enabled.default).toBe(true);
      expect(rulesSchema.items.properties.severity.default).toBe('warn');
    });

    it('should validate gates with defaults', () => {
      const gatesSchema = schema.QUALITY_GATE_SCHEMA.properties.gates;
      expect(gatesSchema.properties.preCommit.default).toBe(true);
      expect(gatesSchema.properties.prePush.default).toBe(true);
      expect(gatesSchema.properties.onToolUse.default).toBe(false);
    });

    it('should validate reporting format with default', () => {
      const reportingSchema = schema.QUALITY_GATE_SCHEMA.properties.reporting;
      expect(reportingSchema.properties.format.enum).toEqual(['console', 'json', 'markdown', 'html']);
      expect(reportingSchema.properties.format.default).toBe('console');
    });
  });
});
