const { getPackageVersion } = require('../lib/version');
const defaults = require('../config/defaults.json');

describe('version single source of truth', () => {
  test('getPackageVersion matches package.json', () => {
    const pkg = require('../package.json');
    expect(getPackageVersion()).toBe(pkg.version);
  });

  test('defaults.json version aligns with package version', () => {
    const pkg = require('../package.json');
    expect(defaults.version).toBe(pkg.version);
  });
});
