const mock = require('mock-fs');
const { buildContext } = require('../lib/context');

describe('context builder', () => {
  afterEach(() => mock.restore());

  test('ignores .claude and node_modules', () => {
    mock({
      '/project/.claude/secret.txt': 'x',
      '/project/node_modules/pkg/index.js': 'x',
      '/project/src/a.js': 'code',
      '/project/package.json': JSON.stringify({ name: 'demo', version: '1.0.0' })
    });

    const ctx = buildContext('builder', { projectDir: '/project', limit: 5 });
    expect(ctx.relevantFiles).toContain('src/a.js');
    expect(ctx.relevantFiles.some(f => f.includes('.claude'))).toBe(false);
    expect(ctx.relevantFiles.some(f => f.includes('node_modules'))).toBe(false);
  });
});
