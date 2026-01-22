/**
 * Phase 1: Research - NotebookLM Feasibility Analysis (JavaScript version)
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// Configuration
// ============================================================================

const PROJECTS_DIR = path.join(process.cwd(), 'development/projects');

// ============================================================================
// Feasibility Validator
// ============================================================================

class FeasibilityValidator {
  /**
   * Validate a feasibility report from markdown content
   */
  static validateFromMarkdown(content) {
    const checks = [];
    const blockers = [];
    const warnings = [];

    // Check 1: Has requirement summary
    const hasRequirementSummary =
      content.includes('## Requirements Summary') ||
      content.includes('## 需求概述') ||
      content.includes('# 需求') ||
      content.match(/需求|问题|目标|用户/);

    checks.push({
      name: 'Requirement Summary',
      passed: hasRequirementSummary,
      message: hasRequirementSummary
        ? 'Requirement summary found'
        : 'Missing requirement summary section'
    });

    if (!hasRequirementSummary) {
      blockers.push('Add a requirements summary section describing what we are building');
    }

    // Check 2: Has correlation analysis
    const hasCorrelationAnalysis =
      content.includes('## Correlation Analysis') ||
      content.includes('## 关联分析') ||
      content.includes('## 关联发现') ||
      content.includes('Related Projects') ||
      content.includes('相关项目') ||
      content.includes('reusable');

    checks.push({
      name: 'Correlation Analysis',
      passed: hasCorrelationAnalysis,
      message: hasCorrelationAnalysis
        ? 'Correlation analysis found'
        : 'Missing correlation analysis - connect the dots with related work'
    });

    if (!hasCorrelationAnalysis) {
      warnings.push('Add correlation analysis to find related work and reusable components');
    }

    // Check 3: Has best practices
    const hasBestPractices =
      content.includes('## Best Practices') ||
      content.includes('## 业界最佳实践') ||
      content.includes('## 最佳实践') ||
      content.includes('Industry') ||
      content.includes('sources') ||
      content.includes('参考');

    checks.push({
      name: 'Best Practices Research',
      passed: hasBestPractices,
      message: hasBestPractices
        ? 'Best practices research found'
        : 'Missing industry best practices research'
    });

    if (!hasBestPractices) {
      blockers.push('Add best practices research with cited sources');
    }

    // Check 4: Has feasibility conclusion
    const hasFeasibilityConclusion =
      content.includes('## Feasibility Assessment') ||
      content.includes('## 可行性评估') ||
      content.includes('feasibility') ||
      content.includes('可行性') ||
      content.match(/⭐\s*\d|难度|复杂度|Technical/);

    checks.push({
      name: 'Feasibility Conclusion',
      passed: hasFeasibilityConclusion,
      message: hasFeasibilityConclusion
        ? 'Feasibility assessment found'
        : 'Missing feasibility assessment with concrete ratings'
    });

    if (!hasFeasibilityConclusion) {
      blockers.push('Add feasibility assessment with technical complexity rating (⭐ 1-5)');
    }

    // Check 5: Has time estimate
    const hasTimeEstimate =
      content.includes('Time Estimate') ||
      content.includes('时间预估') ||
      content.includes('estimated') ||
      content.match(/\d+\s*(hour|h|小时|day|天)/);

    checks.push({
      name: 'Time Estimate',
      passed: hasTimeEstimate,
      message: hasTimeEstimate
        ? 'Time estimate found'
        : 'Missing time estimate for implementation'
    });

    if (!hasTimeEstimate) {
      warnings.push('Add concrete time estimate (e.g., "4 hours")');
    }

    // Check 6: Has risk assessment
    const hasRiskAssessment =
      content.includes('## Risk') ||
      content.includes('## 风险') ||
      content.includes('risk') ||
      content.includes('mitigation') ||
      content.includes('缓解') ||
      content.match(/挑战|问题|Risk/);

    checks.push({
      name: 'Risk Assessment',
      passed: hasRiskAssessment,
      message: hasRiskAssessment
        ? 'Risk assessment found'
        : 'Missing risk assessment with mitigation strategies'
    });

    if (!hasRiskAssessment) {
      blockers.push('Add risk assessment with identified risks and mitigation strategies');
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
   * Validate a feasibility report file
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
    lines.push('           Feasibility Report Validation');
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
      lines.push('🎉 Report meets quality standards! Ready for Phase 2 (Approval).');
    } else {
      lines.push('📝 Report needs improvements. Address blockers and re-validate.');
    }

    lines.push('');
    lines.push('═══════════════════════════════════════════════════════');

    return lines.join('\n');
  }
}

// ============================================================================
// Phase 1 Research Executor
// ============================================================================

class Phase1ResearchExecutor {
  constructor(projectId) {
    this.projectId = projectId;
    this.projectDir = path.join(PROJECTS_DIR, projectId);
    this.phaseDir = path.join(this.projectDir, 'phase1');
    this.reportPath = path.join(this.phaseDir, 'feasibility-report.md');
  }

  /**
   * Ensure project directories exist
   */
  ensureDirectories() {
    if (!fs.existsSync(this.projectDir)) {
      fs.mkdirSync(this.projectDir, { recursive: true });
    }
    if (!fs.existsSync(this.phaseDir)) {
      fs.mkdirSync(this.phaseDir, { recursive: true });
    }
  }

  /**
   * Generate report template
   */
  generateReportTemplate(idea, context) {
    const date = new Date().toLocaleDateString();
    const time = new Date().toLocaleTimeString();

    return `# Feasibility Analysis Report

**Project**: ${this.projectId}
**Date**: ${date} ${time}
**Phase**: 1 - Research
**Status**: 🚧 In Progress

---

## Executive Summary

> Brief overview of the project and feasibility assessment

---

## Requirements Summary

### Problem Statement
[What problem are we solving?]

### Target Users
[Who will use this? What are their pain points?]

### Key Features
1. [Feature 1]
2. [Feature 2]
3. [Feature 3]

### Constraints
- [Constraint 1]
- [Constraint 2]

### Assumptions
- [Assumption 1]
- [Assumption 2]

---

## Original Idea

${idea}

${context ? `### Additional Context\n${context}` : ''}

---

## Correlation Analysis (Connect The Dots)

### Research Plan (研究计划)

**Key Objectives (关键目标)**:
- [每个选项要回答的核心问题是什么？]
- [评估需要哪些数据/信息？]

**Research Methods (研究方法)**:
- [如何收集和分析数据？]
- [使用的工具或方法论是什么？]

**Evaluation Criteria (评估标准)**:
- [比较选项的指标/基准是什么？]
- [可行性/成功的判断标准是什么？]

**Expected Outcomes (预期成果)**:
- [可能的研究发现或结果是什么？]
- [研究后的下一步行动是什么？]

### Related Projects
| Project | Similarity | Reusable Components |
|---------|------------|---------------------|
| [Project A] | 85% | [Component list] |
| [Project B] | 60% | [Component list] |

### Overlapping Technology
- [Tech stack overlap]
- [Shared libraries]
- [Common patterns]

### Lessons from History
- [Lesson 1]: [Context and outcome]
- [Lesson 2]: [Context and outcome]

---

## Industry Best Practices

### Architecture
**Practice**: [Specific practice]
**Rationale**: [Why this is recommended]
**Sources**: [Citations]

### Security
**Practice**: [Security best practice]
**Rationale**: [Why this matters]

---

## Feasibility Assessment

### Technical Feasibility: ⭐⭐⭐☆☆ (3/5)

**Strengths**:
- [Strength 1]
- [Strength 2]

**Challenges**:
- [Challenge 1]: [Mitigation strategy]

### Time Estimate: X hours

**Breakdown**:
- Research & Planning: Xh
- Design: Xh
- Implementation: Xh
- Testing: Xh

**Total**: X hours

### Complexity: Medium

**Reasoning**: [Explain complexity assessment]

### Risk Assessment

| Risk | Severity | Probability | Mitigation |
|------|----------|-------------|------------|
| [Risk 1] | High | Medium | [Mitigation strategy] |
| [Risk 2] | Medium | Low | [Mitigation strategy] |

---

## Recommendations

### Recommended Tech Stack

**Frontend**:
- [Choice 1] - [Rationale]

**Backend**:
- [Choice 1] - [Rationale]

### Suggested Architecture

[High-level architecture description]

### Potential Issues to Watch

1. **[Issue 1]**: [Monitoring approach]
2. **[Issue 2]**: [Monitoring approach]

### Next Steps (Phase 2: Approval)

1. [ ] Review this report and ensure all sections are complete
2. [ ] Run quality gate: \`smc workflow validate ${this.reportPath}\`
3. [ ] Address any blockers identified
4. [ ] Proceed to Phase 2 for Claude review and consensus

---

## Quality Checklist

- [x] Requirement summary is clear and complete
- [ ] Correlation analysis found related work/patterns
- [ ] Best practices are cited with sources
- [ ] Feasibility has concrete ratings (not vague)
- [ ] Time estimate is justified
- [ ] Risks have mitigation strategies
- [ ] Recommendations are actionable

---

## Metadata

- **Generated**: ${date} ${time}
- **Confidence Level**: [To be filled by AI]

---

*This report was generated by the Phase 1 Research Executor.*
`;
  }

  /**
   * Execute Phase 1 research workflow
   */
  async execute(idea, context = '', progressCallback) {
    await progressCallback?.('Initializing Phase 1 research...', 0, 5);

    // Ensure directories exist
    this.ensureDirectories();

    // Step 1: Create directories
    await progressCallback?.('Setting up project structure...', 1, 5);

    // Step 2: Generate report template
    await progressCallback?.('Generating feasibility report template...', 2, 5);

    const reportTemplate = this.generateReportTemplate(idea, context);
    await fs.promises.writeFile(this.reportPath, reportTemplate, 'utf-8');

    await progressCallback?.('Phase 1 research context prepared. Ready for AI analysis.', 3, 5);

    return {
      projectId: this.projectId,
      reportPath: this.reportPath,
      nextSteps: [
        'Complete the feasibility report',
        'Validate with: smc workflow validate',
        'Proceed to Phase 2'
      ]
    };
  }

  /**
   * Check if report exists
   */
  reportExists() {
    return fs.existsSync(this.reportPath);
  }

  /**
   * Read the existing report
   */
  readReport() {
    if (!this.reportExists()) return null;
    return fs.readFileSync(this.reportPath, 'utf-8');
  }

  /**
   * Validate the report
   */
  validateReport() {
    return FeasibilityValidator.validateFile(this.reportPath);
  }

  /**
   * Get the report path
   */
  getReportPath() {
    return this.reportPath;
  }
}

// ============================================================================
// Project Management Helpers
// ============================================================================

function generateProjectId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `proj_${timestamp}_${random}`;
}

async function createProject(idea, context = '') {
  const projectId = generateProjectId();
  const executor = new Phase1ResearchExecutor(projectId);

  await executor.execute(idea, context, (msg, current, total) => {
    const progress = Math.round((current / total) * 100);
    console.log(`[${progress}%] ${msg}`);
  });

  return projectId;
}

function listProjects() {
  if (!fs.existsSync(PROJECTS_DIR)) {
    return [];
  }

  const projects = [];
  const entries = fs.readdirSync(PROJECTS_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory() && entry.name.startsWith('proj_')) {
      const projectPath = path.join(PROJECTS_DIR, entry.name);
      const reportPath = path.join(projectPath, 'phase1', 'feasibility-report.md');
      projects.push({
        id: entry.name,
        path: projectPath,
        hasReport: fs.existsSync(reportPath)
      });
    }
  }

  return projects.sort((a, b) => b.id.localeCompare(a.id));
}

module.exports = {
  Phase1ResearchExecutor,
  FeasibilityValidator,
  generateProjectId,
  createProject,
  listProjects
};
