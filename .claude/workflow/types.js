/**
 * Workflow Type Definitions (JavaScript version)
 * Shared types for the NotebookLM + Claude collaboration workflow
 */

// Project phase enum
const ProjectPhase = {
  RESEARCH: 'research',      // Phase 1: NotebookLM feasibility analysis
  APPROVAL: 'approval',      // Phase 2: Claude review and consensus
  PLANNING: 'planning',      // Phase 3: PRD and prototype
  DEVELOPMENT: 'development',// Phase 4: Implementation
  DEPLOYMENT: 'deployment'   // Phase 5: Release
};

// Project status
const ProjectStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  ON_HOLD: 'on_hold'
};

// Knowledge source types
const KnowledgeSourceType = {
  LOCAL_FILE: 'local_file',
  LOCAL_DIRECTORY: 'local_directory',
  NOTEBOOKLM: 'notebooklm',
  WEB_SEARCH: 'web_search',
  WEB_URL: 'web_url'
};

module.exports = {
  ProjectPhase,
  ProjectStatus,
  KnowledgeSourceType
};
