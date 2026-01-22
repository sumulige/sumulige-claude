/**
 * Phase 1: Research - NotebookLM Feasibility Analysis
 *
 * This phase uses NotebookLM (via notebooklm-mcp integration) to:
 * 1. Structure requirements
 * 2. Connect dots with related work
 * 3. Research best practices
 * 4. Assess feasibility
 *
 * Output: feasibility-report.md
 */

import * as fs from 'fs';
import * as path from 'path';
import { getKnowledgeEngine } from '../knowledge-engine';
import { FeasibilityValidator } from '../validators/feasibility';
import type { FeasibilityReport, ProjectPhase, ProgressCallback } from '../types';

// ============================================================================
// Configuration
// ============================================================================

const PROJECTS_DIR = path.join(process.cwd(), 'development/projects');

// ============================================================================
// Phase 1 Executor
// ============================================================================

export class Phase1ResearchExecutor {
  private projectId: string;
  private projectDir: string;
  private phaseDir: string;
  private reportPath: string;

  constructor(projectId: string) {
    this.projectId = projectId;
    this.projectDir = path.join(PROJECTS_DIR, projectId);
    this.phaseDir = path.join(this.projectDir, 'phase1');
    this.reportPath = path.join(this.phaseDir, 'feasibility-report.md');
  }

  /**
   * Execute Phase 1 research workflow
   */
  async execute(
    idea: string,
    context: string = '',
    progressCallback?: ProgressCallback
  ): Promise<FeasibilityReport> {
    await progressCallback?.('Initializing Phase 1 research...', 0, 5);

    // Ensure directories exist
    await this.ensureDirectories();

    // Step 1: Gather knowledge
    await progressCallback?.('Gathering relevant knowledge...', 1, 5);
    const knowledgeContext = await this.gatherKnowledge(idea);

    // Step 2: Generate research prompt
    await progressCallback?.('Preparing research prompt...', 2, 5);
    const prompt = this.generatePrompt(idea, context, knowledgeContext);

    // Step 3: Save prompt for Claude/AI to execute
    await progressCallback?.('Generating feasibility report...', 3, 5);
    await this.savePrompt(prompt);

    // Step 4: Return structured result for AI execution
    await progressCallback?.('Preparing AI execution context...', 4, 5);

    const reportTemplate = this.generateReportTemplate(idea, context, knowledgeContext);
    await fs.promises.writeFile(this.reportPath, reportTemplate, 'utf-8');

    await progressCallback?.('Phase 1 research context prepared. Ready for AI analysis.', 5, 5);

    return {
      projectId: this.projectId,
      createdAt: Date.now(),
      requirements: {
        summary: idea,
        keyFeatures: [],
        constraints: [],
        assumptions: []
      },
      correlations: {
        relatedProjects: [],
        overlappingTech: [],
        lessonsLearned: []
      },
      bestPractices: [],
      feasibility: {
        technical: 0,
        time: 0,
        complexity: 'medium',
        risks: []
      },
      recommendations: {
        techStack: [],
        architecture: '',
        potentialIssues: [],
        nextSteps: [
          'Review and complete the feasibility report',
          'Validate with quality gate: smc workflow validate',
          'Proceed to Phase 2: Claude approval'
        ]
      },
      quality: {
        completeness: 0,
        confidence: 0,
        sourcesCount: knowledgeContext.sourceCount,
        webSearchPerformed: false
      }
    };
  }

  /**
   * Gather relevant knowledge from knowledge base
   */
  private async gatherKnowledge(idea: string): Promise<{
    sources: Array<{ title: string; type: string; relevance: number }>;
    excerpts: string[];
    sourceCount: number;
  }> {
    const engine = getKnowledgeEngine();
    const result = await engine.query(idea, { includeWeb: true });

    return {
      sources: result.sources.map(s => ({
        title: s.title,
        type: s.type,
        relevance: s.relevance
      })),
      excerpts: result.sources.map(s => s.excerpt || '').filter(Boolean),
      sourceCount: result.sources.length
    };
  }

  /**
   * Generate research prompt for AI execution
   */
  private generatePrompt(idea: string, context: string, knowledgeContext: any): string {
    return `
# Phase 1 Research Task

## User Idea
${idea}

${context ? `## Additional Context\n${context}\n` : ''}

## Knowledge Context
Found ${knowledgeContext.sourceCount} relevant sources in the knowledge base.

${knowledgeContext.sources.length > 0 ? `
### Relevant Sources
${knowledgeContext.sources.map((s: any) => `- ${s.title} (${(s.relevance * 100).toFixed(0)}% relevance)`).join('\n')}
` : ''}

## Your Task

Please complete a comprehensive feasibility analysis following the template in:
${path.join(__dirname, '../templates/research.md')}

## Output

Save the complete feasibility report to:
${this.reportPath}

Then validate with: smc workflow validate ${this.reportPath}
`.trim();
  }

  /**
   * Generate report template for AI to fill
   */
  private generateReportTemplate(idea: string, context: string, knowledgeContext: any): string {
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

### Risks Based on History
- [Risk from past project]: [How we'll address it]

---

## Industry Best Practices

### Architecture
**Practice**: [Specific practice]
**Rationale**: [Why this is recommended]
**Sources**: [Citations]
**Applicability**: [How this applies to current project]

### Security
**Practice**: [Security best practice]
**Rationale**: [Why this matters]
**Sources**: [Citations]

### Performance
**Practice**: [Performance approach]
**Rationale**: [Performance considerations]

### UX/UI
**Practice**: [UX principle]
**Rationale**: [User experience impact]

---

## Feasibility Assessment

### Technical Feasibility: ⭐⭐⭐☆☆ (3/5)

**Strengths**:
- [Strength 1]
- [Strength 2]

**Challenges**:
- [Challenge 1]: [Mitigation strategy]
- [Challenge 2]: [Mitigation strategy]

### Time Estimate: X hours

**Breakdown**:
- Research & Planning: Xh
- Design: Xh
- Implementation: Xh
- Testing: Xh
- Documentation: Xh

**Total**: X hours

### Complexity: Medium

**Reasoning**: [Explain complexity assessment]

### Risk Assessment

| Risk | Severity | Probability | Mitigation |
|------|----------|-------------|------------|
| [Risk 1] | High | Medium | [Mitigation strategy] |
| [Risk 2] | Medium | Low | [Mitigation strategy] |
| [Risk 3] | Low | Low | [Mitigation strategy] |

---

## Recommendations

### Recommended Tech Stack

**Frontend**:
- [Choice 1] - [Rationale]
- [Choice 2] - [Rationale]

**Backend**:
- [Choice 1] - [Rationale]
- [Choice 2] - [Rationale]

**Database**:
- [Choice] - [Rationale]

**Other**:
- [Choice] - [Rationale]

### Suggested Architecture

[High-level architecture description - could include diagrams]

### Potential Issues to Watch

1. **[Issue 1]**: [Monitoring approach, early warning signs]
2. **[Issue 2]**: [Monitoring approach, early warning signs]
3. **[Issue 3]**: [Monitoring approach, early warning signs]

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
- **Knowledge Sources Queried**: ${knowledgeContext.sourceCount}
- **Web Search Performed**: No
- **Confidence Level**: [To be filled by AI]

---

*This report was generated by the Phase 1 Research Executor. Please complete all sections before proceeding to Phase 2.*
`;
  }

  /**
   * Save prompt for AI execution
   */
  private async savePrompt(prompt: string): Promise<void> {
    const promptPath = path.join(this.phaseDir, 'research-prompt.md');
    await fs.promises.writeFile(promptPath, prompt, 'utf-8');
  }

  /**
   * Ensure project directories exist
   */
  private async ensureDirectories(): Promise<void> {
    await fs.promises.mkdir(this.projectDir, { recursive: true });
    await fs.promises.mkdir(this.phaseDir, { recursive: true });
  }

  /**
   * Get the report path
   */
  getReportPath(): string {
    return this.reportPath;
  }

  /**
   * Check if report exists
   */
  reportExists(): boolean {
    return fs.existsSync(this.reportPath);
  }

  /**
   * Read the existing report
   */
  readReport(): string | null {
    if (!this.reportExists()) return null;
    return fs.readFileSync(this.reportPath, 'utf-8');
  }

  /**
   * Validate the report
   */
  validateReport() {
    return FeasibilityValidator.validateFile(this.reportPath);
  }
}

// ============================================================================
// Project Management Helpers
// ============================================================================

export function generateProjectId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `proj_${timestamp}_${random}`;
}

export async function createProject(idea: string, context: string = ''): Promise<string> {
  const projectId = generateProjectId();
  const executor = new Phase1ResearchExecutor(projectId);

  await executor.execute(idea, context, (msg, current, total) => {
    const progress = Math.round((current / total) * 100);
    console.log(`[${progress}%] ${msg}`);
  });

  return projectId;
}

export function listProjects(): Array<{
  id: string;
  path: string;
  hasReport: boolean;
}> {
  if (!fs.existsSync(PROJECTS_DIR)) {
    return [];
  }

  const projects: Array<{
    id: string;
    path: string;
    hasReport: boolean;
  }> = [];

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
