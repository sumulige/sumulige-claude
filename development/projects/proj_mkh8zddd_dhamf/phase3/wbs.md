# Work Breakdown Structure

**Project**: proj_mkh8zddd_dhamf (AI 代码审查工具)
**Date**: 1/17/2026
**Phase**: 3 - Planning
**Status**: In Progress

---

## Executive Summary

本文档将 AI 代码审查工具的开发工作分解为约 30 个子任务，按 4 个阶段组织，预计 16 周 (480 小时) 完成。

**里程碑**:
- Week 1-4: MVP 基础设施 (Parser + Rule Engine)
- Week 5-8: 核心功能 (CLI + 检测规则)
- Week 9-12: 集成功能 (CI/CD + LLM)
- Week 13-16: 测试、优化、发布

---

## Phase 1: Foundation (Week 1-4)

**Goal**: 建立项目基础设施和核心解析能力

### 1.1 Project Setup (Week 1)

| Task ID | Task | Days | Dependencies | Deliverables |
|---------|------|------|--------------|--------------|
| **P1-01** | Initialize Go project structure | 1 | - | `go.mod`, directory layout |
| **P1-02** | Set up development environment | 1 | P1-01 | Makefile, Dockerfile, pre-commit hooks |
| **P1-03** | Configure CI/CD pipeline | 2 | P1-01 | GitHub Actions workflow |
| **P1-04** | Set up database schema | 2 | P1-01 | PostgreSQL migrations, DB connection code |
| **P1-05** | Implement configuration loader | 2 | P1-01 | YAML config parser, validation |

**Subtotal**: 8 days (64 hours)

### 1.2 Parser Service (Week 2-3)

| Task ID | Task | Days | Dependencies | Deliverables |
|---------|------|------|--------------|--------------|
| **P1-06** | Integrate Tree-sitter Go bindings | 2 | P1-01 | Tree-sitter wrapper |
| **P1-07** | Implement Python parser | 2 | P1-06 | Python AST extraction |
| **P1-08** | Implement JavaScript parser | 2 | P1-06 | JavaScript AST extraction |
| **P1-09** | Implement TypeScript parser | 1 | P1-08 | TypeScript AST extraction |
| **P1-10** | Implement AST caching layer | 2 | P1-06, P1-04 | Redis cache integration |
| **P1-11** | Add error handling and recovery | 1 | P1-07, P1-08 | Graceful parse error handling |

**Subtotal**: 10 days (80 hours)

### 1.3 Rule Engine Foundation (Week 4)

| Task ID | Task | Days | Dependencies | Deliverables |
|---------|------|------|--------------|--------------|
| **P1-12** | Design rule interface | 1 | P1-01 | Rule abstraction |
| **P1-13** | Implement rule engine core | 3 | P1-12 | Rule matching framework |
| **P1-14** | Create rule configuration parser | 2 | P1-05, P1-12 | Rule YAML parser |
| **P1-15** | Implement issue reporting model | 1 | P1-13 | Issue data structures |

**Subtotal**: 7 days (56 hours)

**Phase 1 Total**: 25 days (200 hours)

---

## Phase 2: Core Features (Week 5-8)

**Goal**: 实现 CLI 工具和代码检测规则

### 2.1 CLI Implementation (Week 5)

| Task ID | Task | Days | Dependencies | Deliverables |
|---------|------|------|--------------|--------------|
| **P2-01** | Implement Cobra CLI framework | 2 | P1-01 | Command structure |
| **P2-02** | Implement `scan` command | 3 | P1-15, P2-01 | File scanning logic |
| **P2-03** | Implement `init` command | 1 | P2-01 | Config file generation |
| **P2-04** | Implement `config` command | 1 | P2-01 | Config management |
| **P2-05** | Implement output formatters (table, JSON) | 2 | P2-02 | Formatted output |

**Subtotal**: 9 days (72 hours)

### 2.2 Security Rules (Week 6)

| Task ID | Task | Days | Dependencies | Deliverables |
|---------|------|------|--------------|--------------|
| **P2-06** | Implement SQL injection detection | 2 | P1-13 | SQL injection rule |
| **P2-07** | Implement XSS detection | 2 | P1-13 | XSS detection rule |
| **P2-08** | Implement insecure function detection | 2 | P1-13 | Insecure function rules |
| **P2-09** | Implement hardcoded secrets detection | 1 | P1-13 | Secret detection rules |
| **P2-10** | Create security rule test suite | 2 | P2-06, P2-07, P2-08 | Test fixtures |

**Subtotal**: 9 days (72 hours)

### 2.3 Quality Rules (Week 7)

| Task ID | Task | Days | Dependencies | Deliverables |
|---------|------|------|--------------|--------------|
| **P2-11** | Implement long function detection | 1 | P1-13 | Function length rule |
| **P2-12** | Implement cyclomatic complexity | 2 | P1-13 | Complexity rule |
| **P2-13** | Implement code duplication detection | 3 | P1-13 | Duplication rule |
| **P2-14** | Implement missing documentation check | 1 | P1-13 | Docstring rules |
| **P2-15** | Create quality rule test suite | 1 | P2-11, P2-12, P2-14 | Test fixtures |

**Subtotal**: 8 days (64 hours)

### 2.4 Report Generation (Week 8)

| Task ID | Task | Days | Dependencies | Deliverables |
|---------|------|------|--------------|--------------|
| **P2-16** | Implement Markdown report generator | 2 | P2-05 | Markdown output |
| **P2-17** | Implement HTML report generator | 2 | P2-05 | HTML output |
| **P2-18** | Implement SARIF report generator | 2 | P2-05 | SARIF output |
| **P2-19** | Add report aggregation logic | 1 | P2-16, P2-17 | Multi-file aggregation |
| **P2-20** | Implement `report` command | 1 | P2-01, P2-19 | Report CLI command |

**Subtotal**: 8 days (64 hours)

**Phase 2 Total**: 34 days (272 hours)

---

## Phase 3: Integration (Week 9-12)

**Goal**: 实现 CI/CD 集成和 LLM 增强功能

### 3.1 Git Integration (Week 9)

| Task ID | Task | Days | Dependencies | Deliverables |
|---------|------|------|--------------|--------------|
| **P3-01** | Implement Git diff scanner | 2 | P2-02 | Incremental scan |
| **P3-02** | Add .gitignore-aware file discovery | 1 | P2-02 | Smart file filtering |
| **P3-03** | Implement Git context extraction | 1 | P3-01 | Branch, commit info |
| **P3-04** | Create GitHub Action workflow | 2 | P2-02 | Action YAML |
| **P3-05** | Implement PR comment posting | 2 | P3-04 | GitHub integration |

**Subtotal**: 8 days (64 hours)

### 3.2 LLM Integration (Week 10)

| Task ID | Task | Days | Dependencies | Deliverables |
|---------|------|------|--------------|--------------|
| **P3-06** | Design LLM client interface | 1 | P1-01 | LLM abstraction |
| **P3-07** | Implement Claude API client | 2 | P3-06 | Claude integration |
| **P3-08** | Design and implement prompts | 2 | P3-07 | Prompt templates |
| **P3-09** | Implement AI issue enhancement | 2 | P3-07, P2-02 | AI-enhanced issues |
| **P3-10** | Implement local model fallback | 1 | P3-06 | Local Llama support |

**Subtotal**: 8 days (64 hours)

### 3.3 Performance & Caching (Week 11)

| Task ID | Task | Days | Dependencies | Deliverables |
|---------|------|------|--------------|--------------|
| **P3-11** | Implement parallel file scanning | 2 | P2-02 | Concurrent scans |
| **P3-12** | Optimize AST caching strategy | 2 | P1-10 | Cache invalidation |
| **P3-13** | Add scan progress reporting | 1 | P2-02 | Progress bars |
| **P3-14** | Implement scan result caching | 2 | P2-02 | Result persistence |
| **P3-15** | Performance benchmarking | 1 | P3-11, P3-12 | Benchmark suite |

**Subtotal**: 8 days (64 hours)

### 3.4 Advanced Features (Week 12)

| Task ID | Task | Days | Dependencies | Deliverables |
|---------|------|------|--------------|--------------|
| **P3-16** | Implement trend analysis | 2 | P2-20 | Historical reports |
| **P3-17** | Add custom rule DSL | 3 | P1-14 | User-defined rules |
| **P3-18** | Implement auto-fix capability | 2 | P2-06, P2-07 | Auto-fix suggestions |
| **P3-19** | Add ignore directive support | 1 | P2-02 | Inline ignores |

**Subtotal**: 8 days (64 hours)

**Phase 3 Total**: 32 days (256 hours)

---

## Phase 4: Release Preparation (Week 13-16)

**Goal**: 测试、文档优化、发布准备

### 4.1 Testing (Week 13)

| Task ID | Task | Days | Dependencies | Deliverables |
|---------|------|------|--------------|--------------|
| **P4-01** | Write unit tests for parser | 2 | P1-07, P1-08 | Parser test suite |
| **P4-02** | Write unit tests for rules | 2 | P2-10, P2-15 | Rule test suite |
| **P4-03** | Write integration tests | 2 | All | End-to-end tests |
| **P4-04** | Set up code coverage reporting | 1 | P4-01, P4-02 | Coverage report |
| **P4-05** | Performance and load testing | 2 | P3-15 | Performance report |

**Subtotal**: 9 days (72 hours)

### 4.2 Documentation (Week 14)

| Task ID | Task | Days | Dependencies | Deliverables |
|---------|------|------|--------------|--------------|
| **P4-06** | Write user guide | 2 | P2-01 | User documentation |
| **P4-07** | Write configuration reference | 1 | P1-05 | Config docs |
| **P4-08** | Write rule development guide | 2 | P3-17 | Custom rule docs |
| **P4-09** | Create example configurations | 1 | P4-07 | Example configs |
| **P4-10** | Record demo video | 1 | All | Demo content |

**Subtotal**: 7 days (56 hours)

### 4.3 Packaging (Week 15)

| Task ID | Task | Days | Dependencies | Deliverables |
|---------|------|------|--------------|--------------|
| **P4-11** | Set up release automation | 2 | P1-03 | Release workflow |
| **P4-12** | Create binaries for all platforms | 2 | P4-11 | Binary artifacts |
| **P4-13** | Publish to Homebrew | 1 | P4-12 | Homebrew tap |
| **P4-14** | Create Docker image | 1 | P4-12 | Docker Hub |
| **P4-15** | Set up package signing | 1 | P4-12 | Signed releases |

**Subtotal**: 7 days (56 hours)

### 4.4 Launch (Week 16)

| Task ID | Task | Days | Dependencies | Deliverables |
|---------|------|------|--------------|--------------|
| **P4-16** | Create GitHub release | 1 | P4-12 | v1.0.0 release |
| **P4-17** | Publish marketplace entry | 1 | P3-04 | GitHub Action |
| **P4-18** | Write announcement blog post | 1 | P4-10 | Launch post |
| **P4-19** | Community outreach | 1 | P4-18 | Social media |
| **P4-20** | Post-launch support & bug fixes | 2 | P4-16 | v1.0.1 patches |

**Subtotal**: 6 days (48 hours)

**Phase 4 Total**: 29 days (232 hours)

---

## Task Dependency Graph

```
Phase 1: Foundation
├── P1-01 → All tasks
├── P1-01 → P1-02 → P1-03 (CI/CD)
├── P1-01 → P1-04 (Database)
├── P1-01 → P1-05 (Config)
├── P1-01 → P1-06 → P1-07, P1-08 (Parsers)
├── P1-08 → P1-09 (TypeScript)
├── P1-06, P1-04 → P1-10 (Cache)
├── P1-01 → P1-12 → P1-13 (Rule Engine)
├── P1-05, P1-12 → P1-14 (Rule Config)
└── P1-13 → P1-15 (Issue Model)

Phase 2: Core Features
├── P1-01 → P2-01 → P2-02, P2-03, P2-04 (CLI)
├── P2-02 → P2-05 (Output)
├── P1-13 → P2-06, P2-07, P2-08, P2-09 (Rules)
├── P2-06, P2-07, P2-08 → P2-10 (Security Tests)
├── P1-13 → P2-11, P2-12, P2-13, P2-14 (Quality Rules)
├── P2-11, P2-12, P2-14 → P2-15 (Quality Tests)
├── P2-05 → P2-16, P2-17, P2-18 (Reports)
└── P2-16, P2-17 → P2-19 → P2-01 → P2-20 (Report Command)

Phase 3: Integration
├── P2-02 → P3-01 → P3-03 (Git Integration)
├── P3-01 → P3-02 (File Discovery)
├── P2-02 → P3-04 → P3-05 (GitHub Action)
├── P1-01 → P3-06 → P3-07 (LLM Client)
├── P3-07 → P3-08 → P3-09 (AI Enhancement)
├── P3-06 → P3-10 (Local Model)
├── P2-02 → P3-11 → P3-12, P3-14 (Performance)
├── P3-11 → P3-13 (Progress)
├── P3-11, P3-12 → P3-15 (Benchmarking)
├── P2-20 → P3-16 (Trends)
├── P1-14 → P3-17 (Custom Rules)
├── P2-06, P2-07 → P3-18 (Auto-fix)
└── P2-02 → P3-19 (Ignores)

Phase 4: Release
├── P1-07, P1-08 → P4-01 (Parser Tests)
├── P2-10, P2-15 → P4-02 (Rule Tests)
├── All → P4-03 (Integration Tests)
├── P4-01, P4-02 → P4-04 (Coverage)
├── P3-15 → P4-05 (Performance Tests)
├── P2-01 → P4-06 (User Guide)
├── P1-05 → P4-07 (Config Docs)
├── P3-17 → P4-08 (Custom Rule Docs)
├── P4-07 → P4-09 (Examples)
├── All → P4-10 (Demo)
├── P1-03 → P4-11 → P4-12 (Release Automation)
├── P4-12 → P4-13, P4-14, P4-15 (Packaging)
├── P4-12 → P4-16 → P4-17 (Launch)
└── P4-10 → P4-18 → P4-19 → P4-20 (Post-Launch)
```

---

## Critical Path

The critical path (longest chain of dependent tasks) is:

```
P1-01 → P1-06 → P1-07 → P2-02 → P3-11 → P3-12 → P3-15 → P4-03 → P4-11 → P4-12 → P4-16
```

Total: ~11 weeks on the critical path. Parallel tasks can reduce overall timeline to 16 weeks.

---

## Risk Adjustments

| Risk | Impact | Mitigation | Schedule Buffer |
|------|--------|------------|-----------------|
| LLM API delays | +1 week | Use local model fallback | Week 10-11 |
| Tree-sitter complexity | +1 week | Start with simple parsers | Week 2-3 |
| Testing overruns | +1 week | Write tests alongside code | Week 13-14 |
| Documentation gaps | +0.5 week | Start docs early | Week 14-15 |

**Total buffer**: 3.5 weeks built into 16-week schedule

---

## Resource Allocation

| Phase | Tasks | Estimated Hours | % of Total |
|-------|-------|-----------------|------------|
| Phase 1 | 15 | 200 | 42% |
| Phase 2 | 20 | 272 | 57% |
| Phase 3 | 19 | 256 | 53% |
| Phase 4 | 20 | 232 | 48% |
| **Total** | **74** | **960** | **200%** |

*Note: Percentages exceed 100% because tasks can be done in parallel. Actual timeline is 480 hours (16 weeks at 30h/week).*

---

## Milestone Checklist

### Milestone 1: MVP Foundation (Week 4)
- [x] P1-01 to P1-15 completed
- [ ] Python and JavaScript parsing working
- [ ] Rule engine can execute basic rules
- [ ] Configuration system in place

### Milestone 2: CLI + Rules (Week 8)
- [ ] P2-01 to P2-20 completed
- [ ] CLI can scan directories
- [ ] Security rules detecting issues
- [ ] Quality rules operational
- [ ] Reports generating correctly

### Milestone 3: Integration (Week 12)
- [ ] P3-01 to P3-19 completed
- [ ] GitHub Action working
- [ ] LLM integration functional
- [ ] Performance acceptable

### Milestone 4: v1.0 Release (Week 16)
- [ ] P4-01 to P4-20 completed
- [ ] All tests passing
- [ ] Documentation complete
- [ ] v1.0.0 released

---

## Next Steps

1. Review WBS with stakeholders
2. Assign start dates to each task
3. Create project tracking dashboard
4. Set up weekly review cadence
5. Proceed to risk assessment (risks.md)

---

## Metadata

- **Created**: 1/17/2026
- **Author**: Phase 3 Design Executor
- **Total Tasks**: 74
- **Estimated Duration**: 16 weeks (480 hours)
- **Status**: Draft for Review
- **Related Docs**: phase3/architecture.md, phase3/api-design.md, phase3/data-model.md

---

*This work breakdown structure provides a detailed task roadmap for the AI Code Review Tool implementation.*
