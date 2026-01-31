/**
 * Version source of truth
 *
 * Single place to read the package version so other modules don't hard-code it
 * or drift from package.json.
 */

const fs = require('fs');
const path = require('path');

let cachedVersion = null;

function getPackageVersion() {
  if (cachedVersion) return cachedVersion;

  try {
    const pkgPath = path.join(__dirname, '..', 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    cachedVersion = pkg.version || null;
  } catch {
    cachedVersion = null;
  }

  return cachedVersion;
}

module.exports = {
  getPackageVersion
};
