const { parseSourcesYaml } = require('../lib/marketplace');

describe('parseSourcesYaml', () => {
  test('parses skills array with nested fields', () => {
    const yaml = `
version: 1
skills:
  - name: dev-browser
    description: Browser skill
    source:
      url: https://example.com
    target:
      category: development
  - name: doc
    description: Doc skill
    target:
      category: documentation
`;
    const parsed = parseSourcesYaml(yaml);
    expect(parsed.skills).toHaveLength(2);
    expect(parsed.skills[0].name).toBe('dev-browser');
    expect(parsed.skills[0].target.category).toBe('development');
    expect(parsed.skills[1].target.category).toBe('documentation');
  });

  test('returns empty list on invalid yaml', () => {
    const parsed = parseSourcesYaml('::: not yaml :::');
    expect(parsed.skills).toEqual([]);
  });
});
