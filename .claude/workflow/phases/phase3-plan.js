/**
 * Phase 3: Planning - PRD, Prototype, and Task Plan
 *
 * Input: Phase 2 Requirements Document
 * Output: PRD.md, prototype/, TASK_PLAN.md
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// Configuration
// ============================================================================

const PROJECTS_DIR = path.join(process.cwd(), 'development/projects');

// ============================================================================
// Planning Validator
// ============================================================================

class PlanningValidator {
  /**
   * Validate a PRD and task plan from markdown content
   */
  static validateFromMarkdown(content) {
    const checks = [];
    const blockers = [];
    const warnings = [];

    // Check 1: Has PRD overview
    const hasPRDOverview =
      content.includes('# Product Requirements Document') ||
      content.includes('# PRD') ||
      content.includes('## Product Overview') ||
      content.includes('## 产品概述');

    checks.push({
      name: 'PRD Overview',
      passed: hasPRDOverview,
      message: hasPRDOverview
        ? 'Product overview defined'
        : 'Missing product overview section'
    });

    if (!hasPRDOverview) {
      blockers.push('Add product overview with vision and goals');
    }

    // Check 2: Has architecture design
    const hasArchitecture =
      content.includes('## Architecture') ||
      content.includes('## 系统架构') ||
      content.includes('## System Design') ||
      content.includes('## Technical Design') ||
      content.includes('## 技术设计') ||
      content.includes('架构');

    checks.push({
      name: 'Architecture Design',
      passed: hasArchitecture,
      message: hasArchitecture
        ? 'Architecture design included'
        : 'Missing architecture design'
    });

    if (!hasArchitecture) {
      blockers.push('Add system architecture design with components and interactions');
    }

    // Check 3: Has data model
    const hasDataModel =
      content.includes('## Data Model') ||
      content.includes('## 数据模型') ||
      content.includes('## Database Schema') ||
      content.includes('## Database') ||
      content.includes('### Entities') ||
      content.includes('数据结构') ||
      content.includes('schema');

    checks.push({
      name: 'Data Model',
      passed: hasDataModel,
      message: hasDataModel
        ? 'Data model defined'
        : 'Missing data model/schema'
    });

    if (!hasDataModel) {
      warnings.push('Add data model or database schema for key entities');
    }

    // Check 4: Has API design
    const hasAPIDesign =
      content.includes('## API Design') ||
      content.includes('## API 设计') ||
      content.includes('## Endpoints') ||
      content.includes('## Routes') ||
      content.includes('API:') ||
      content.includes('POST') ||
      content.includes('GET /');

    checks.push({
      name: 'API Design',
      passed: hasAPIDesign,
      message: hasAPIDesign
        ? 'API design included'
        : 'Missing API design'
    });

    if (!hasAPIDesign) {
      warnings.push('Add API design with key endpoints and request/response formats');
    }

    // Check 5: Has task breakdown
    const hasTaskBreakdown =
      content.includes('## Task Breakdown') ||
      content.includes('## 任务分解') ||
      content.includes('## Implementation Tasks') ||
      content.includes('## Development Tasks') ||
      content.includes('TASK-') ||
      content.includes('### Task');

    checks.push({
      name: 'Task Breakdown',
      passed: hasTaskBreakdown,
      message: hasTaskBreakdown
        ? 'Implementation tasks defined'
        : 'Missing task breakdown'
    });

    if (!hasTaskBreakdown) {
      blockers.push('Add implementation task breakdown with dependencies');
    }

    // Check 6: Has milestones
    const hasMilestones =
      content.includes('## Milestones') ||
      content.includes('## 里程碑') ||
      content.includes('## Timeline') ||
      content.includes('## Schedule') ||
      content.includes('Sprint') ||
      content.includes('里程碑');

    checks.push({
      name: 'Milestones',
      passed: hasMilestones,
      message: hasMilestones
        ? 'Project milestones defined'
        : 'Missing project milestones'
    });

    if (!hasMilestones) {
      warnings.push('Add project milestones or sprint schedule');
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
   * Validate a PRD file
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
    lines.push('           PRD & Task Plan Validation');
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
      lines.push('🎉 PRD and task plan meet quality standards! Ready for Phase 4 (Development).');
    } else {
      lines.push('📝 Planning documents need improvements. Address blockers and re-validate.');
    }

    lines.push('');
    lines.push('═══════════════════════════════════════════════════════');

    return lines.join('\n');
  }
}

// ============================================================================
// Phase 3 Planning Executor
// ============================================================================

class Phase3PlanningExecutor {
  constructor(projectId) {
    this.projectId = projectId;
    this.projectDir = path.join(PROJECTS_DIR, projectId);
    this.phaseDir = path.join(this.projectDir, 'phase3');
    this.prdPath = path.join(this.phaseDir, 'PRD.md');
    this.taskPlanPath = path.join(this.phaseDir, 'TASK_PLAN.md');
    this.prototypeDir = path.join(this.phaseDir, 'prototype');
    this.phase2RequirementsPath = path.join(this.projectDir, 'phase2', 'requirements.md');
  }

  /**
   * Ensure project directories exist
   */
  ensureDirectories() {
    if (!fs.existsSync(this.phaseDir)) {
      fs.mkdirSync(this.phaseDir, { recursive: true });
    }
    if (!fs.existsSync(this.prototypeDir)) {
      fs.mkdirSync(this.prototypeDir, { recursive: true });
    }
  }

  /**
   * Read Phase 2 requirements document
   */
  readPhase2Requirements() {
    if (!fs.existsSync(this.phase2RequirementsPath)) {
      return null;
    }
    return fs.readFileSync(this.phase2RequirementsPath, 'utf-8');
  }

  /**
   * Extract key information from Phase 2 requirements
   */
  extractRequirementsSummary(requirementsContent) {
    const summary = {
      idea: '',
      functionalRequirements: [],
      nonFunctionalRequirements: [],
      techStack: [],
      successMetrics: [],
      constraints: []
    };

    if (!requirementsContent) return summary;

    // Extract original idea from Phase 1 summary
    const ideaMatch = requirementsContent.match(/### Original Idea\s+([\s\S]*?)(?=##|---)/);
    if (ideaMatch) {
      summary.idea = ideaMatch[1].trim();
    }

    // Extract functional requirements (FR-XXX format)
    const frMatches = requirementsContent.matchAll(/### FR-(\d+):[^\n]+\n+\*\*Description\*\*:[\s\S]*?(?=###|\n##)/g);
    for (const match of frMatches) {
      const titleMatch = match[0].match(/### FR-\d+:\s+([^\n]+)/);
      const descMatch = match[0].match(/\*\*Description\*\*:\s*([^\n]+)/);
      if (titleMatch) {
        summary.functionalRequirements.push({
          id: match[0].match(/### FR-(\d+)/)[1],
          title: titleMatch[1].trim(),
          description: descMatch ? descMatch[1].trim() : ''
        });
      }
    }

    // Extract non-functional requirements
    const nfrSection = requirementsContent.match(/## Non-Functional Requirements\s+([\s\S]*?)(?=##|$)/);
    if (nfrSection) {
      const categories = nfrSection[1].split(/###|\*\*/);
      categories.forEach(cat => {
        if (cat.includes('Performance') || cat.includes('Security') ||
            cat.includes('Reliability') || cat.includes('Maintainability')) {
          summary.nonFunctionalRequirements.push(cat.trim());
        }
      });
    }

    // Extract success metrics
    const metricsSection = requirementsContent.match(/## Success Metrics\s+([\s\S]*?)(?=##|$)/);
    if (metricsSection) {
      const tableRows = metricsSection[1].match(/\|[^|\n]*\|[^|\n]*\|[^|\n]*/g);
      if (tableRows) {
        tableRows.forEach(row => {
          summary.successMetrics.push(row);
        });
      }
    }

    return summary;
  }

  /**
   * Generate PRD template
   */
  generatePRDTemplate(requirementsSummary) {
    const date = new Date().toLocaleDateString();
    const time = new Date().toLocaleTimeString();

    const idea = requirementsSummary.idea || '[From Phase 2 Requirements]';
    const functionalReqs = requirementsSummary.functionalRequirements || [];

    return `# Product Requirements Document (PRD)

**Project**: ${this.projectId}
**Date**: ${date} ${time}
**Phase**: 3 - Planning
**Status**: 🚧 In Progress

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | ${date} | Claude | Initial draft |

---

## Executive Summary

> Brief overview of the product vision and goals

### Vision
[Describe the product vision - what problem are we solving and why does it matter?]

### Goals
1. [Goal 1]
2. [Goal 2]
3. [Goal 3]

### Success Criteria
[How will we measure success?]

---

## Product Overview

### Background
${idea}

### Target Audience
| Segment | Description | Pain Points |
|---------|-------------|-------------|
| [Segment A] | [Description] | [Pain points] |
| [Segment B] | [Description] | [Pain points] |

### User Personas
**Persona 1: [Name]**
- Role: [User role]
- Goals: [What they want to achieve]
- Frustrations: [Current pain points]
- Scenarios: [Usage scenarios]

---

## Functional Requirements

### Core Features

${functionalReqs.length > 0 ? functionalReqs.map((fr, i) => `
**FR-${String(i + 1).padStart(3, '0')}: ${fr.title}**
- **Description**: ${fr.description}
- **Priority**: Must Have
- **Dependencies**: [List dependencies]
`).join('') : `
**FR-001: [Feature Name]**
- **Description**: [What the feature does]
- **Priority**: Must Have / Should Have / Could Have
- **User Story**: As a [user], I want [action], so that [benefit]
- **Acceptance Criteria**:
  - [ ] Given [context], when [action], then [outcome]
  - [ ] Given [context], when [action], then [outcome]
`}

### Future Features (Out of Scope for MVP)
- [Feature 1]: [Brief description]
- [Feature 2]: [Brief description]

---

## System Architecture

### High-Level Architecture

\`\`\`
[Insert architecture diagram or ASCII art]

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │    Database     │
│  (User Interface)│◄──►│  (API Gateway)  │◄──►│  (Data Store)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
\`\`\`

### Components

| Component | Responsibility | Technology |
|-----------|---------------|------------|
| [Frontend] | User interface | [To be decided] |
| [Backend API] | Business logic | [To be decided] |
| [Database] | Data persistence | [To be decided] |
| [Cache] | Performance optimization | [To be decided] |

### Data Flow

1. **User Action**: [User does X]
2. **Request**: [Frontend sends request to API]
3. **Processing**: [Backend processes request]
4. **Response**: [Data returned to frontend]
5. **Display**: [UI updates]

---

## Data Model

### Entity Relationship Diagram

\`\`\`
[Insert ERD or describe relationships]

[Entity A] 1──N [Entity B]
[Entity B] N──1 [Entity C]
\`\`\`

### Key Entities

**Entity 1: [Name]**
| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | Primary key |
| name | String | Yes | Display name |
| created_at | Timestamp | Yes | Creation time |
| updated_at | Timestamp | Yes | Last update |

**Entity 2: [Name]**
| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | Primary key |
| [attribute] | [type] | [Yes/No] | [Description] |

---

## API Design

### API Guidelines
- RESTful conventions
- JSON request/response format
- Standard HTTP status codes
- Authentication: [Type, e.g., JWT]
- Rate limiting: [Limits]

### Core Endpoints

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | /api/v1/resource | List items | - | 200: Item array |
| POST | /api/v1/resource | Create item | Item data | 201: Created item |
| GET | /api/v1/resource/:id | Get item | - | 200: Item details |
| PUT | /api/v1/resource/:id | Update item | Item data | 200: Updated item |
| DELETE | /api/v1/resource/:id | Delete item | - | 204: No content |

### Example API Call

\`\`\`bash
# Get all items
GET /api/v1/items
Authorization: Bearer <token>

Response:
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
\`\`\`

---

## Non-Functional Requirements

### Performance
- API response time: < 200ms (p95)
- Page load time: < 2s
- Support concurrent users: [Number]

### Security
- Authentication: [Method, e.g., JWT with 24h expiry]
- Authorization: [Model, e.g., RBAC]
- Data encryption: TLS 1.3 in transit, AES-256 at rest
- Input validation: All user inputs sanitized

### Reliability
- Uptime target: 99.9%
- Error handling: Graceful degradation
- Backup strategy: [Backup approach]

### Scalability
- Horizontal scaling capability
- Database sharding strategy (if needed)
- CDN for static assets

### Maintainability
- Code coverage target: > 80%
- API documentation: Auto-generated from code
- Logging: Structured logging with correlation IDs

---

## User Interface Design

### Design Principles
1. [Principle 1]: [Description]
2. [Principle 2]: [Description]

### Screen Flow

\`\`\`
[Screen A] → [Screen B] → [Screen C]
    ↓           ↓
[Screen D] ← [Screen E]
\`\`\`

### Key Screens

**Screen 1: [Name]**
- Purpose: [What user accomplishes]
- Elements: [List key UI elements]
- Interactions: [User actions and responses]

---

## Testing Strategy

### Test Levels
- **Unit Tests**: Test individual components
- **Integration Tests**: Test component interactions
- **E2E Tests**: Test complete user flows
- **Performance Tests**: Load and stress testing

### Test Coverage
- Target coverage: 80%+
- Critical path coverage: 100%

### Test Automation
- Unit test framework: [To be decided]
- E2E test framework: [To be decided]
- CI/CD integration: [Approach]

---

## Deployment Plan

### Environments
| Environment | Purpose | URL |
|-------------|---------|-----|
| Development | Local development | localhost |
| Staging | Pre-production testing | staging.example.com |
| Production | Live environment | app.example.com |

### Deployment Strategy
- [ ] CI/CD pipeline setup
- [ ] Database migrations
- [ ] Feature flags
- [ ] Rollback plan

### Monitoring
- Application metrics: [Tool, e.g., DataDog]
- Error tracking: [Tool, e.g., Sentry]
- Log aggregation: [Tool, e.g., ELK]

---

## Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| [Risk 1] | High | High | [Strategy] |
| [Risk 2] | Medium | Low | [Strategy] |

---

## Dependencies

### Internal Dependencies
- [Service A]: [Purpose and API]
- [Service B]: [Purpose and API]

### External Dependencies
- [Third-party API]: [Purpose and fallback]
- [Library X]: [Purpose and version]

---

## Open Questions

| Question | Proposed Answer | Status |
|----------|-----------------|--------|
| [Question 1] | [Answer] | [Open/Resolved] |
| [Question 2] | [Answer] | [Open/Resolved] |

---

## Appendix

### Glossary
| Term | Definition |
|------|------------|
| [Term 1] | [Definition] |
| [Term 2] | [Definition] |

### References
- [Reference 1]: [Link]
- [Reference 2]: [Link]

---

## Approval Checklist

- [x] Product vision is clear
- [ ] Functional requirements are complete
- [ ] Architecture is designed
- [ ] Data model is defined
- [ ] API endpoints are specified
- [ ] Non-functional requirements are documented
- [ ] Test strategy is defined
- [ ] Deployment plan is outlined

---

## Next Steps (Phase 4: Development)

1. [ ] Review and approve PRD
2. [ ] Set up development environment
3. [ ] Create initial project structure
4. [ ] Begin implementation based on TASK_PLAN.md

---

## Metadata

- **Generated**: ${date} ${time}
- **Phase 2 Requirements**: \`../phase2/requirements.md\`
- **Task Plan**: \`TASK_PLAN.md\`

---

*This PRD was generated by the Phase 3 Planning Executor.*
`;
  }

  /**
   * Generate TASK_PLAN template
   */
  generateTaskPlanTemplate(requirementsSummary) {
    const date = new Date().toLocaleDateString();

    return `# Implementation Task Plan

**Project**: ${this.projectId}
**Created**: ${date}
**Phase**: 4 - Development

---

## Overview

This task plan breaks down the implementation into manageable tasks with clear dependencies and time estimates.

---

## Task Breakdown

### Sprint 1: Foundation (Week 1)

#### TASK-001: Project Setup
- **Description**: Set up development environment and project structure
- **Priority**: P0 (Must Have)
- **Estimated**: 2 hours
- **Dependencies**: None
- **Owner**: [To be assigned]
- **Acceptance Criteria**:
  - [ ] Repository initialized with proper structure
  - [ ] Development environment configured
  - [ ] CI/CD pipeline set up
  - [ ] Code quality tools configured (linter, formatter)

#### TASK-002: Database Schema Implementation
- **Description**: Create database schema and migrations
- **Priority**: P0 (Must Have)
- **Estimated**: 3 hours
- **Dependencies**: TASK-001
- **Owner**: [To be assigned]
- **Acceptance Criteria**:
  - [ ] All entities defined in PRD implemented
  - [ ] Migration scripts created
  - [ ] Seed data for development
  - [ ] Indexes created for performance

#### TASK-003: Core API Infrastructure
- **Description**: Set up API framework and base controllers
- **Priority**: P0 (Must Have)
- **Estimated**: 4 hours
- **Dependencies**: TASK-001, TASK-002
- **Owner**: [To be assigned]
- **Acceptance Criteria**:
  - [ ] API framework configured
  - [ ] Authentication middleware
  - [ ] Error handling middleware
  - [ ] Request validation
  - [ ] API documentation scaffold

### Sprint 2: Core Features (Week 2)

#### TASK-004: [Feature A] Implementation
- **Description**: Implement [Feature A] as per FR-001
- **Priority**: P0 (Must Have)
- **Estimated**: 6 hours
- **Dependencies**: TASK-003
- **Owner**: [To be assigned]
- **Acceptance Criteria**:
  - [ ] API endpoint implemented
  - [ ] Business logic complete
  - [ ] Unit tests written (>80% coverage)
  - [ ] API documentation updated

#### TASK-005: [Feature B] Implementation
- **Description**: Implement [Feature B] as per FR-002
- **Priority**: P0 (Must Have)
- **Estimated**: 5 hours
- **Dependencies**: TASK-003
- **Owner**: [To be assigned]
- **Acceptance Criteria**:
  - [ ] API endpoint implemented
  - [ ] Business logic complete
  - [ ] Unit tests written
  - [ ] API documentation updated

#### TASK-006: Frontend Base Setup
- **Description**: Set up frontend framework and routing
- **Priority**: P0 (Must Have)
- **Estimated**: 3 hours
- **Dependencies**: TASK-001
- **Owner**: [To be assigned]
- **Acceptance Criteria**:
  - [ ] Framework configured
  - [ ] Base layout created
  - [ ] Routing configured
  - [ ] State management set up

### Sprint 3: User Interface (Week 3)

#### TASK-007: [Screen A] Implementation
- **Description**: Build [Screen A] UI
- **Priority**: P1 (Should Have)
- **Estimated**: 4 hours
- **Dependencies**: TASK-006, TASK-004
- **Owner**: [To be assigned]
- **Acceptance Criteria**:
  - [ ] UI matches design specification
  - [ ] Responsive design (mobile, tablet, desktop)
  - [ ] Loading states handled
  - [ ] Error states handled
  - [ ] Accessibility (WCAG 2.1 AA)

#### TASK-008: [Screen B] Implementation
- **Description**: Build [Screen B] UI
- **Priority**: P1 (Should Have)
- **Estimated**: 4 hours
- **Dependencies**: TASK-006, TASK-005
- **Owner**: [To be assigned]
- **Acceptance Criteria**:
  - [ ] UI matches design specification
  - [ ] Responsive design
  - [ ] Loading/error states handled
  - [ ] Accessibility compliance

### Sprint 4: Integration & Testing (Week 4)

#### TASK-009: API Integration
- **Description**: Connect frontend to backend APIs
- **Priority**: P0 (Must Have)
- **Estimated**: 4 hours
- **Dependencies**: TASK-007, TASK-008, TASK-004, TASK-005
- **Owner**: [To be assigned]
- **Acceptance Criteria**:
  - [ ] All screens connected to APIs
  - [ ] Error handling complete
  - [ ] Loading indicators working
  - [ ] Data flow verified

#### TASK-010: End-to-End Testing
- **Description**: Write and execute E2E tests
- **Priority**: P0 (Must Have)
- **Estimated**: 3 hours
- **Dependencies**: TASK-009
- **Owner**: [To be assigned]
- **Acceptance Criteria**:
  - [ ] Critical user paths covered
  - [ ] Tests automated in CI/CD
  - [ ] All tests passing
  - [ ] Performance benchmarks met

#### TASK-011: Performance Optimization
- **Description**: Optimize application performance
- **Priority**: P1 (Should Have)
- **Estimated**: 3 hours
- **Dependencies**: TASK-010
- **Owner**: [To be assigned]
- **Acceptance Criteria**:
  - [ ] API response time < 200ms (p95)
  - [ ] Page load time < 2s
  - [ ] Bundle size optimized
  - [ ] Images/assets optimized

### Sprint 5: Deployment (Week 5)

#### TASK-012: Production Setup
- **Description**: Prepare production environment
- **Priority**: P0 (Must Have)
- **Estimated**: 2 hours
- **Dependencies**: TASK-011
- **Owner**: [To be assigned]
- **Acceptance Criteria**:
  - [ ] Production environment configured
  - [ ] Database configured
  - [ ] SSL certificate installed
  - [ ] Monitoring configured
  - [ ] Backup strategy in place

#### TASK-013: Deployment & Verification
- **Description**: Deploy to production and verify
- **Priority**: P0 (Must Have)
- **Estimated**: 2 hours
- **Dependencies**: TASK-012
- **Owner**: [To be assigned]
- **Acceptance Criteria**:
  - [ ] Application deployed
  - [ ] Smoke tests passing
  - [ ] Monitoring data flowing
  - [ ] Rollback plan documented

---

## Task Dependencies

\`\`\`
TASK-001 (Project Setup)
    │
    ├──→ TASK-002 (Database)
    │       │
    │       └──→ TASK-003 (API Infrastructure)
    │               │
    │               ├──→ TASK-004 (Feature A)
    │               │       │
    │               │       └──→ TASK-009 (Integration)
    │               │               │
    │               ├──→ TASK-005 (Feature B)────────┘
    │               │
    │               └──→ TASK-006 (Frontend Setup)
    │                       │
    │                       ├──→ TASK-007 (Screen A)──┐
    │                       │                           │
    │                       └──→ TASK-008 (Screen B)──┴─→ TASK-009
    │                                                           │
    └──────────────────────────────────────────────────────────→ TASK-010
                                                                      │
                                                                      └──→ TASK-011
                                                                              │
                                                                              └──→ TASK-012
                                                                                      │
                                                                                      └──→ TASK-013
\`\`\`

---

## Milestones

| Milestone | Tasks | Target Date | Status |
|-----------|-------|-------------|--------|
| M1: Foundation | TASK-001 to TASK-003 | Week 1 | 🔲 Pending |
| M2: Core Features | TASK-004 to TASK-006 | Week 2 | 🔲 Pending |
| M3: UI Complete | TASK-007 to TASK-008 | Week 3 | 🔲 Pending |
| M4: Test & Optimize | TASK-009 to TASK-011 | Week 4 | 🔲 Pending |
| M5: Production | TASK-012 to TASK-013 | Week 5 | 🔲 Pending |

---

## Time Estimates

| Phase | Tasks | Total Hours |
|-------|-------|-------------|
| Sprint 1 | TASK-001 to TASK-003 | 9h |
| Sprint 2 | TASK-004 to TASK-006 | 14h |
| Sprint 3 | TASK-007 to TASK-008 | 8h |
| Sprint 4 | TASK-009 to TASK-011 | 10h |
| Sprint 5 | TASK-012 to TASK-013 | 4h |
| **Total** | **All tasks** | **45h** |

---

## Risk & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Task estimation errors | Delayed delivery | Add 20% buffer to estimates |
| Technical blockers | Sprint delays | Identify and address early |
| Resource availability | Bottleneck | Cross-train team members |

---

## Definition of Done

A task is complete when:
- [ ] Code is written and follows style guidelines
- [ ] Unit tests written (coverage > 80%)
- [ ] Code reviewed by at least one person
- [ ] Documentation updated
- [ ] Tests passing in CI/CD
- [ ] No critical bugs

---

## Daily Standup Format

Each team member shares:
1. **Yesterday**: What I completed
2. **Today**: What I plan to work on
3. **Blockers**: Anything blocking progress

---

## Notes

- Update task status as work progresses
- Add new tasks as scope changes
- Archive completed tasks for reference

---

*Generated by Phase 3 Planning Executor*
`;
  }

  /**
   * Execute Phase 3 planning workflow
   */
  async execute(progressCallback) {
    await progressCallback?.('Initializing Phase 3 planning...', 0, 6);

    // Ensure directories exist
    this.ensureDirectories();

    // Step 1: Read Phase 2 requirements
    await progressCallback?.('Reading Phase 2 requirements...', 1, 6);
    const requirementsContent = this.readPhase2Requirements();

    if (!requirementsContent) {
      throw new Error(`Phase 2 requirements not found: ${this.phase2RequirementsPath}`);
    }

    // Step 2: Extract requirements summary
    await progressCallback?.('Analyzing requirements...', 2, 6);
    const requirementsSummary = this.extractRequirementsSummary(requirementsContent);

    // Step 3: Generate PRD
    await progressCallback?.('Generating PRD template...', 3, 6);

    const prdTemplate = this.generatePRDTemplate(requirementsSummary);
    await fs.promises.writeFile(this.prdPath, prdTemplate, 'utf-8');

    // Step 4: Generate Task Plan
    await progressCallback?.('Generating task plan...', 4, 6);

    const taskPlanTemplate = this.generateTaskPlanTemplate(requirementsSummary);
    await fs.promises.writeFile(this.taskPlanPath, taskPlanTemplate, 'utf-8');

    // Step 5: Create prototype structure
    await progressCallback?.('Creating prototype directory structure...', 5, 6);

    // Create prototype placeholder files
    const prototypeReadme = path.join(this.prototypeDir, 'README.md');
    await fs.promises.writeFile(
      prototypeReadme,
      `# Prototype - ${this.projectId}

This directory contains prototype and proof-of-concept code.

## Structure

- \`mocks/\` - Mock data and API responses
- \`screens/\` - UI screen mockups
- \`proof-of-concept/\` - Experimental code

## Notes

This is a working directory for prototyping and experimentation.
Code here may not follow production standards.
`,
      'utf-8'
    );

    await progressCallback?.('Phase 3 planning complete. Ready for detailed design.', 6, 6);

    return {
      projectId: this.projectId,
      prdPath: this.prdPath,
      taskPlanPath: this.taskPlanPath,
      prototypeDir: this.prototypeDir,
      requirementsSummary,
      nextSteps: [
        'Review and complete the PRD',
        'Review and adjust the task plan',
        'Create prototypes/proofs-of-concept',
        'Validate with: smc workflow validate',
        'Proceed to Phase 4'
      ]
    };
  }

  /**
   * Check if PRD exists
   */
  prdExists() {
    return fs.existsSync(this.prdPath);
  }

  /**
   * Check if task plan exists
   */
  taskPlanExists() {
    return fs.existsSync(this.taskPlanPath);
  }

  /**
   * Read the PRD
   */
  readPRD() {
    if (!this.prdExists()) return null;
    return fs.readFileSync(this.prdPath, 'utf-8');
  }

  /**
   * Read the task plan
   */
  readTaskPlan() {
    if (!this.taskPlanExists()) return null;
    return fs.readFileSync(this.taskPlanPath, 'utf-8');
  }

  /**
   * Validate the PRD
   */
  validatePRD() {
    return PlanningValidator.validateFile(this.prdPath);
  }

  /**
   * Get phase info
   */
  getPhaseInfo() {
    return {
      phase: 3,
      name: 'Planning',
      description: 'PRD, prototype, and task plan',
      input: 'Phase 2 Requirements Document',
      output: 'PRD.md, TASK_PLAN.md, prototype/',
      status: this.prdExists() ? 'In Progress' : 'Not Started',
      files: {
        prd: this.prdPath,
        taskPlan: this.taskPlanPath,
        prototype: this.prototypeDir,
        phase2Requirements: this.phase2RequirementsPath
      }
    };
  }
}

// ============================================================================
// Project Management Helpers
// ============================================================================

function getProjectsWithAllPhases() {
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
      const phase3PRD = path.join(projectPath, 'phase3', 'PRD.md');

      let currentPhase = 1;
      let status = 'draft';

      if (fs.existsSync(phase3PRD)) {
        currentPhase = 3;
        status = 'planned';
      } else if (fs.existsSync(phase2Requirements)) {
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
        hasPhase2: fs.existsSync(phase2Requirements),
        hasPhase3: fs.existsSync(phase3PRD)
      });
    }
  }

  return projects.sort((a, b) => b.id.localeCompare(a.id));
}

module.exports = {
  Phase3PlanningExecutor,
  PlanningValidator,
  getProjectsWithAllPhases
};
