#!/usr/bin/env node
/**
 * Sync version from package.json to other project metadata files.
 * - config/defaults.json (version)
 * - config/version-manifest.json (current)
 *
 * Idempotent and safe to run anytime. Intended for release/prepublish.
 */

import fs from 'fs';
import path from 'path';

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

function main() {
  const pkgPath = path.join(ROOT, 'package.json');
  const defaultsPath = path.join(ROOT, 'config', 'defaults.json');
  const manifestPath = path.join(ROOT, 'config', 'version-manifest.json');

  const pkg = readJson(pkgPath);

  // defaults.json
  try {
    const defaults = readJson(defaultsPath);
    defaults.version = pkg.version;
    writeJson(defaultsPath, defaults);
    console.log(`defaults.json version → ${pkg.version}`);
  } catch (e) {
    console.error('Failed to update defaults.json:', e.message);
  }

  // version-manifest.json
  try {
    const manifest = readJson(manifestPath);
    manifest.current = pkg.version;
    writeJson(manifestPath, manifest);
    console.log(`version-manifest current → ${pkg.version}`);
  } catch (e) {
    console.error('Failed to update version-manifest.json:', e.message);
  }
}

main();
