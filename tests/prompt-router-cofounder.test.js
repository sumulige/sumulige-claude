const { routePrompts } = require('../lib/agent-orchestrator/prompt-router');

function hasPrompt(prompts, name) {
  return Array.isArray(prompts) && prompts.some((p) => p && p.name === name);
}

describe('prompt-router (technical-cofounder-core)', () => {
  test('always injects technical-cofounder-core for agent tasks', () => {
    const routed = routePrompts({ task: '修一个 bug', kind: 'agent' });
    expect(hasPrompt(routed.prompts, 'technical-cofounder-core')).toBe(true);
    expect(hasPrompt(routed.prompts, 'software-architect')).toBe(false);
    expect(routed.missing || []).toHaveLength(0);
  });

  test('injects technical-cofounder-core and software-architect for kickoff', () => {
    const routed = routePrompts({ task: 'build an MVP', kind: 'kickoff' });
    expect(hasPrompt(routed.prompts, 'technical-cofounder-core')).toBe(true);
    expect(hasPrompt(routed.prompts, 'software-architect')).toBe(true);
    expect(routed.missing || []).toHaveLength(0);
  });
});

