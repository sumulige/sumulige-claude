/**
 * Commands - Backward compatibility re-export
 *
 * This file maintains backward compatibility by re-exporting the modular
 * commands structure from ./commands/index.js
 *
 * The actual implementation has been split into:
 *   - commands/helpers.js     - Shared utilities
 *   - commands/init.js        - init, init:interactive
 *   - commands/sync.js        - sync, sync:incremental, sync:force
 *   - commands/template.js    - template, kickoff, ultrathink
 *   - commands/skills-core.js - skill:list, skill:create, skill:install
 *   - commands/skills-official.js - skills:official, skills:add
 *   - commands/skills-manage.js - skill:publish, etc.
 *   - commands/config.js      - config, config:validate, etc.
 *   - commands/quality-gate.js - qg:check, qg:rules, qg:init
 *   - commands/workflow.js    - workflow commands
 *   - commands/misc.js        - version, agent, status, changelog
 *   - commands/integrations.js - knowledge, notebooklm, audit
 *   - commands/index.js       - Main entry point
 */

module.exports = require("./commands/index");
