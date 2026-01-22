/**
 * Phase 2: Approval - Requirements Clarification & Consensus
 *
 * Input: Phase 1 Feasibility Report
 * Output: Phase 2 Requirements Document
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// Configuration
// ============================================================================

const PROJECTS_DIR = path.join(process.cwd(), 'development/projects');

// ============================================================================
// Approval Validator
// ============================================================================

class ApprovalValidator {
  /**
   * Validate a requirements document from markdown content
   */
  static validateFromMarkdown(content) {
    const checks = [];
    const blockers = [];
    const warnings = [];

    // Check 1: Has clear requirements
    const hasClearRequirements =
      content.includes('## Requirements') ||
      content.includes('## 需求') ||
      content.includes('## Functional Requirements') ||
      content.includes('## 功能需求') ||
      content.includes('FR-') ||
      content.match(/需求.*[0-9]/);

    checks.push({
      name: 'Clear Requirements',
      passed: hasClearRequirements,
      message: hasClearRequirements
        ? 'Requirements clearly defined'
        : 'Missing clear requirements section'
    });

    if (!hasClearRequirements) {
      blockers.push('Add clear, unambiguous requirements with unique IDs (e.g., FR-001)');
    }

    // Check 2: Has acceptance criteria
    const hasAcceptanceCriteria =
      content.includes('Acceptance Criteria') ||
      content.includes('验收标准') ||
      content.includes('acceptance') ||
      content.includes('Given-When-Then') ||
      content.includes('Gherkin');

    checks.push({
      name: 'Acceptance Criteria',
      passed: hasAcceptanceCriteria,
      message: hasAcceptanceCriteria
        ? 'Acceptance criteria found'
        : 'Missing acceptance criteria for requirements'
    });

    if (!hasAcceptanceCriteria) {
      blockers.push('Add testable acceptance criteria for each requirement');
    }

    // Check 3: Has technical rationale
    const hasTechRationale =
      content.includes('Technical Rationale') ||
      content.includes('技术依据') ||
      content.includes('Tech Stack') ||
      content.includes('技术选型') ||
      content.includes('Rationale') ||
      content.includes('理由');

    checks.push({
      name: 'Technical Rationale',
      passed: hasTechRationale,
      message: hasTechRationale
        ? 'Technical choices have rationale'
        : 'Missing rationale for technical choices'
    });

    if (!hasTechRationale) {
      warnings.push('Add rationale explaining why specific technologies were chosen');
    }

    // Check 4: Has success metrics
    const hasSuccessMetrics =
      content.includes('Success Metrics') ||
      content.includes('成功指标') ||
      content.includes('Metrics') ||
      content.includes('KPI') ||
      content.match(/指标|衡量|Metrics/);

    checks.push({
      name: 'Success Metrics',
      passed: hasSuccessMetrics,
      message: hasSuccessMetrics
        ? 'Success metrics defined'
        : 'Missing quantifiable success metrics'
    });

    if (!hasSuccessMetrics) {
      warnings.push('Add quantifiable metrics to measure project success');
    }

    // Check 5: Has edge cases
    const hasEdgeCases =
      content.includes('Edge Cases') ||
      content.includes('边缘情况') ||
      content.includes('edge case') ||
      content.includes('boundary') ||
      content.includes('边界') ||
      content.includes('exception');

    checks.push({
      name: 'Edge Cases',
      passed: hasEdgeCases,
      message: hasEdgeCases
        ? 'Edge cases identified'
        : 'Missing edge case analysis'
    });

    if (!hasEdgeCases) {
      warnings.push('Identify edge cases and exception handling');
    }

    // Calculate score
    const passedChecks = checks.filter(c => c.passed).length;
    const score = Math.round((passedChecks / checks.length) * 100);

    // Determine if passed (need at least 80% and no blockers)
    const passed = score >= 80 && blockers.length === 0;

    return {
      passed,
      score,
      checks,
      blockers,
      warnings
    };
  }

  /**
   * Validate a requirements document file
   */
  static validateFile(filePath) {
    if (!fs.existsSync(filePath)) {
      return {
        passed: false,
        score: 0,
        checks: [],
        blockers: [`File not found: ${filePath}`],
        warnings: []
      };
    }

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return this.validateFromMarkdown(content);
    } catch (error) {
      return {
        passed: false,
        score: 0,
        checks: [],
        blockers: [`Failed to read file: ${error.message}`],
        warnings: []
      };
    }
  }

  /**
   * Generate a validation report for display
   */
  static generateReport(result) {
    const lines = [];

    lines.push('═══════════════════════════════════════════════════════');
    lines.push('           Requirements Document Validation');
    lines.push('═══════════════════════════════════════════════════════');
    lines.push('');

    // Status
    const status = result.passed ? '✅ PASSED' : '❌ FAILED';
    const statusColor = result.passed ? '🟢' : '🔴';
    lines.push(`Status: ${statusColor} ${status} (Score: ${result.score}/100)`);
    lines.push('');

    // Checks
    lines.push('Quality Checks:');
    lines.push('───────────────────────────────────────────────────────');

    result.checks.forEach(check => {
      const icon = check.passed ? '✅' : '❌';
      lines.push(`  ${icon} ${check.name}: ${check.message || 'Failed'}`);
    });

    lines.push('');

    // Blockers
    if (result.blockers.length > 0) {
      lines.push('🚫 BLOCKERS (must fix before proceeding):');
      lines.push('───────────────────────────────────────────────────────');
      result.blockers.forEach((blocker, i) => {
        lines.push(`  ${i + 1}. ${blocker}`);
      });
      lines.push('');
    }

    // Warnings
    if (result.warnings.length > 0) {
      lines.push('⚠️  WARNINGS (recommended improvements):');
      lines.push('───────────────────────────────────────────────────────');
      result.warnings.forEach((warning, i) => {
        lines.push(`  ${i + 1}. ${warning}`);
      });
      lines.push('');
    }

    // Recommendation
    if (result.passed) {
      lines.push('🎉 Requirements document meets quality standards! Ready for Phase 3 (Planning).');
    } else {
      lines.push('📝 Requirements need improvements. Address blockers and re-validate.');
    }

    lines.push('');
    lines.push('═══════════════════════════════════════════════════════');

    return lines.join('\n');
  }
}

// ============================================================================
// Phase 2 Approval Executor
// ============================================================================

class Phase2ApprovalExecutor {
  constructor(projectId) {
    this.projectId = projectId;
    this.projectDir = path.join(PROJECTS_DIR, projectId);
    this.phaseDir = path.join(this.projectDir, 'phase2');
    this.requirementsPath = path.join(this.phaseDir, 'requirements.md');
    this.phase1ReportPath = path.join(this.projectDir, 'phase1', 'feasibility-report.md');
  }

  /**
   * Ensure project directories exist
   */
  ensureDirectories() {
    if (!fs.existsSync(this.phaseDir)) {
      fs.mkdirSync(this.phaseDir, { recursive: true });
    }
  }

  /**
   * Read Phase 1 feasibility report
   */
  readPhase1Report() {
    if (!fs.existsSync(this.phase1ReportPath)) {
      return null;
    }
    return fs.readFileSync(this.phase1ReportPath, 'utf-8');
  }

  /**
   * Extract key information from Phase 1 report
   */
  extractPhase1Summary(reportContent) {
    const summary = {
      idea: '',
      requirements: '',
      feasibility: '',
      techStack: [],
      timeEstimate: '',
      risks: []
    };

    if (!reportContent) return summary;

    // Extract original idea
    const ideaMatch = reportContent.match(/## Original Idea\s+([\s\S]*?)(?=##|\-{10,})/);
    if (ideaMatch) {
      summary.idea = ideaMatch[1].trim();
    }

    // Extract requirements summary
    const reqMatch = reportContent.match(/## Requirements Summary\s+([\s\S]*?)(?=##)/);
    if (reqMatch) {
      summary.requirements = reqMatch[1].trim();
    }

    // Extract feasibility assessment
    const feasMatch = reportContent.match(/## Feasibility Assessment\s+([\s\S]*?)(?=##|---)/);
    if (feasMatch) {
      summary.feasibility = feasMatch[1].trim();
    }

    // Extract tech stack
    const techMatch = reportContent.match(/Recommended Tech Stack\s+([\s\S]*?)(?=##|---)/);
    if (techMatch) {
      summary.techStack = techMatch[1].trim();
    }

    // Extract time estimate
    const timeMatch = reportContent.match(/Time Estimate[:\s]*([^\n]+)/);
    if (timeMatch) {
      summary.timeEstimate = timeMatch[1].trim();
    }

    return summary;
  }

  /**
   * Generate clarification questions based on Phase 1 report
   */
  generateClarificationQuestions(phase1Summary) {
    return `## Clarification Questions

> Based on the feasibility analysis, the following questions need clarification:

### Scope & Priorities
1. **MVP Scope**: What is the minimum viable scope for the first iteration?
   - [ ] Define core features that must be in v1.0
   - [ ] Identify features that can be deferred to later versions

2. **Priority Order**: Which features are highest priority?
   - [ ] Rank features by business value
   - [ ] Identify any dependencies between features

### Technical Decisions
3. **Tech Stack Confirmation**: Confirm the recommended technology choices
   - [ ] Frontend: ${phase1Summary.techStack.includes('Frontend') ? 'See Phase 1' : 'To be decided'}
   - [ ] Backend: ${phase1Summary.techStack.includes('Backend') ? 'See Phase 1' : 'To be decided'}
   - [ ] Any constraints or preferences?

4. **Integration Points**: Are there existing systems to integrate with?
   - [ ] APIs to connect to
   - [ ] Data migration needs
   - [ ] Third-party service dependencies

### Success Definition
5. **Success Criteria**: How will we know this project is successful?
   - [ ] Define measurable outcomes
   - [ ] Set success metrics for post-launch

### Constraints
6. **Timeline Constraints**: Any deadline requirements?
   - [ ] Hard deadlines (e.g., launch date)
   - [ ] Time constraints for specific phases

7. **Resource Constraints**: Any limitations on resources?
   - [ ] Budget constraints
   - [ ] Team size/skills availability
   - [ ] Infrastructure limitations

---
*Add user responses below each question. Once consensus is reached, proceed to requirements definition.*
`;
  }

  /**
   * Generate requirements document template
   */
  generateRequirementsTemplate(phase1Summary) {
    const date = new Date().toLocaleDateString();
    const time = new Date().toLocaleTimeString();

    // Extract basic info from Phase 1
    const idea = phase1Summary.idea || '[From Phase 1 Report]';
    const feasibility = phase1Summary.feasibility || '[From Phase 1 Report]';

    return `# Requirements Document

**Project**: ${this.projectId}
**Date**: ${date} ${time}
**Phase**: 2 - Approval
**Status**: 🚧 In Progress

---

## Executive Summary

> Brief overview of the approved requirements

**Based on**: Phase 1 Feasibility Report (\`../phase1/feasibility-report.md\`)

---

## Phase 1 Summary

### Original Idea
${idea}

### Feasibility Assessment
${feasibility}

---

## Clarification Questions & Responses

${this.generateClarificationQuestions(phase1Summary)}

---

## Functional Requirements

### FR-001: [Requirement Title]

**Description**: [Clear, unambiguous description of what the system should do]

**Priority**: Must Have / Should Have / Could Have / Won't Have

**Acceptance Criteria**:
- [ ] Given [context], when [action], then [outcome]
- [ ] Given [context], when [action], then [outcome]
- [ ] Given [context], when [action], then [outcome]

**Dependencies**: [Other requirements or systems this depends on]

---

### FR-002: [Requirement Title]

**Description**: [Clear, unambiguous description]

**Priority**: Must Have / Should Have / Could Have / Won't Have

**Acceptance Criteria**:
- [ ] Given [context], when [action], then [outcome]
- [ ] Given [context], when [action], then [outcome]

**Dependencies**: [List dependencies]

---

## Non-Functional Requirements

### Performance
- **Response Time**: [e.g., API requests < 200ms p95]
- **Throughput**: [e.g., 1000 concurrent users]
- **Resource Limits**: [e.g., Memory < 512MB]

### Security
- **Authentication**: [e.g., JWT tokens, OAuth 2.0]
- **Authorization**: [e.g., Role-based access control]
- **Data Protection**: [e.g., Encryption at rest and in transit]

### Reliability
- **Uptime Target**: [e.g., 99.9% availability]
- **Failure Handling**: [Graceful degradation strategy]

### Maintainability
- **Code Quality**: [e.g., Test coverage > 80%]
- **Documentation**: [API documentation, code comments]

### Compatibility
- **Browsers**: [Supported browser versions]
- **Platforms**: [Supported operating systems]
- **API Versions**: [Versioning strategy]

---

## Success Metrics

### User Engagement
| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| [e.g., Daily Active Users] | [value] | [analytics tool] |
| [e.g., Session Duration] | [value] | [analytics tool] |

### Technical Performance
| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| [e.g., Page Load Time] | [value] | [monitoring tool] |
| [e.g., Error Rate] | [value] | [monitoring tool] |

### Business Outcomes
| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| [e.g., Conversion Rate] | [value] | [analytics tool] |
| [e.g., Customer Satisfaction] | [value] | [survey] |

---

## Edge Cases & Constraints

### Edge Cases
- [Edge Case 1]: [Handling strategy]
- [Edge Case 2]: [Handling strategy]
- [Edge Case 3]: [Handling strategy]

### Constraints
- **Technical**: [Technical limitations]
- **Business**: [Business rules or constraints]
- **Legal**: [Compliance requirements]
- **Timeline**: [Deadline constraints]

---

## Assumptions & Dependencies

### Assumptions
- [Assumption 1]: [Impact if false]
- [Assumption 2]: [Impact if false]

### Dependencies
- **Internal**: [Internal system dependencies]
- **External**: [Third-party services or APIs]
- **Team**: [Required team roles or skills]

---

## Out of Scope

Explicitly list what is NOT included in this phase:

- [Out of Scope Item 1]: [Reason for exclusion]
- [Out of Scope Item 2]: [Reason for exclusion]
- [Out of Scope Item 3]: [Reason for exclusion]

---

## Approval Checklist

- [x] Requirements are clear and unambiguous
- [ ] Acceptance criteria are testable
- [ ] Technical rationale is documented
- [ ] Success metrics are quantifiable
- [ ] Edge cases are identified
- [ ] Constraints are documented
- [ ] Stakeholder consensus achieved

---

## Next Steps (Phase 3: Planning)

1. [ ] Review requirements with all stakeholders
2. [ ] Run quality gate: \`smc workflow validate ${this.requirementsPath}\`
3. [ ] Address any blockers identified
4. [ ] Proceed to Phase 3 for detailed design and planning

---

## Metadata

- **Generated**: ${date} ${time}
- **Phase 1 Report**: \`../phase1/feasibility-report.md\`
- **Confidence Level**: [To be filled by AI]

---

*This document was generated by the Phase 2 Approval Executor.*
`;
  }

  /**
   * Execute Phase 2 approval workflow
   */
  async execute(progressCallback) {
    await progressCallback?.('Initializing Phase 2 approval...', 0, 5);

    // Ensure directories exist
    this.ensureDirectories();

    // Step 1: Read Phase 1 report
    await progressCallback?.('Reading Phase 1 feasibility report...', 1, 5);
    const phase1Report = this.readPhase1Report();

    if (!phase1Report) {
      throw new Error(`Phase 1 report not found: ${this.phase1ReportPath}`);
    }

    // Step 2: Extract summary
    await progressCallback?.('Analyzing feasibility report...', 2, 5);
    const phase1Summary = this.extractPhase1Summary(phase1Report);

    // Step 3: Generate requirements template
    await progressCallback?.('Generating requirements document template...', 3, 5);

    const requirementsTemplate = this.generateRequirementsTemplate(phase1Summary);
    await fs.promises.writeFile(this.requirementsPath, requirementsTemplate, 'utf-8');

    await progressCallback?.('Phase 2 approval context prepared. Ready for requirements definition.', 4, 5);

    return {
      projectId: this.projectId,
      requirementsPath: this.requirementsPath,
      phase1Summary,
      nextSteps: [
        'Review and answer clarification questions',
        'Define functional requirements with acceptance criteria',
        'Validate with: smc workflow validate',
        'Proceed to Phase 3'
      ]
    };
  }

  /**
   * Check if requirements document exists
   */
  requirementsExist() {
    return fs.existsSync(this.requirementsPath);
  }

  /**
   * Read the existing requirements document
   */
  readRequirements() {
    if (!this.requirementsExist()) return null;
    return fs.readFileSync(this.requirementsPath, 'utf-8');
  }

  /**
   * Validate the requirements document
   */
  validateRequirements() {
    return ApprovalValidator.validateFile(this.requirementsPath);
  }

  /**
   * Get the requirements path
   */
  getRequirementsPath() {
    return this.requirementsPath;
  }

  /**
   * Get current phase information
   */
  getPhaseInfo() {
    return {
      phase: 2,
      name: 'Approval',
      description: 'Requirements clarification and consensus',
      input: 'Phase 1 Feasibility Report',
      output: 'Phase 2 Requirements Document',
      status: this.requirementsExist() ? 'In Progress' : 'Not Started',
      files: {
        requirements: this.requirementsPath,
        phase1Report: this.phase1ReportPath
      }
    };
  }
}

// ============================================================================
// Project Management Helpers
// ============================================================================

function getProjectPhaseInfo(projectId, phase) {
  const projectDir = path.join(PROJECTS_DIR, projectId);

  if (!fs.existsSync(projectDir)) {
    return null;
  }

  const phaseDir = path.join(projectDir, `phase${phase}`);

  return {
    projectId,
    phase,
    phaseDir,
    exists: fs.existsSync(phaseDir),
    files: phase === 1 ? {
      report: path.join(phaseDir, 'feasibility-report.md')
    } : phase === 2 ? {
      requirements: path.join(phaseDir, 'requirements.md')
    } : {}
  };
}

function listProjectsWithPhase() {
  if (!fs.existsSync(PROJECTS_DIR)) {
    return [];
  }

  const projects = [];
  const entries = fs.readdirSync(PROJECTS_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory() && entry.name.startsWith('proj_')) {
      const projectPath = path.join(PROJECTS_DIR, entry.name);
      const phase1Report = path.join(projectPath, 'phase1', 'feasibility-report.md');
      const phase2Requirements = path.join(projectPath, 'phase2', 'requirements.md');

      let currentPhase = 1;
      let status = 'draft';

      if (fs.existsSync(phase2Requirements)) {
        currentPhase = 2;
        status = 'in_progress';
      } else if (fs.existsSync(phase1Report)) {
        currentPhase = 1;
        status = 'review';
      }

      projects.push({
        id: entry.name,
        path: projectPath,
        currentPhase,
        status,
        hasPhase1: fs.existsSync(phase1Report),
        hasPhase2: fs.existsSync(phase2Requirements)
      });
    }
  }

  return projects.sort((a, b) => b.id.localeCompare(a.id));
}

module.exports = {
  Phase2ApprovalExecutor,
  ApprovalValidator,
  getProjectPhaseInfo,
  listProjectsWithPhase
};
