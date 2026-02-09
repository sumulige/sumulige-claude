const { buildExecutionPrompt } = require('../lib/agent-orchestrator/execution-prompts');

describe('buildExecutionPrompt (technical-cofounder deep mode)', () => {
  test('enables cofounder deep mode rules and placeholder roles when skill is present', () => {
    const prompt = buildExecutionPrompt({
      task: 'build an MVP',
      context: {},
      skills: [{ name: 'technical-cofounder', description: 'test', trigger: 'test', content: 'test' }],
      mode: 'run',
      prompts: [],
      uiPro: false
    });

    expect(prompt).toContain('Cofounder 深模式已启用');
    expect(prompt).toContain('PHASE=1..5');
    expect(prompt).toContain('# Architect');
    expect(prompt).toContain('(等待 PO 确认后继续');
  });

  test('keeps default 4-section template when cofounder skill is not present', () => {
    const prompt = buildExecutionPrompt({
      task: 'fix a bug',
      context: {},
      skills: [],
      mode: 'run',
      prompts: [],
      uiPro: false
    });

    expect(prompt).toContain('每个角色都要包含四段');
    expect(prompt).not.toContain('Cofounder 深模式已启用');
  });
});

