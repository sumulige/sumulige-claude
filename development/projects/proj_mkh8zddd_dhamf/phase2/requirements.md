# Requirements Document

**Project**: proj_mkh8zddd_dhamf (AI 代码审查工具)
**Date**: 1/17/2026
**Phase**: 2 - Approval
**Status**: ✅ Completed

---

## Executive Summary

> AI 驱动的代码审查工具，专注于代码质量检测和安全漏洞扫描，与 GitHub Copilot 的代码补全功能形成差异化定位。

**基于**: Phase 1 可行性分析报告 (推荐度: ⭐⭐⭐⭐☆ 4/5)

---

## Phase 1 Summary

### Original Idea
构建一个 AI 代码审查工具，类似 GitHub Copilot 但专注于代码质量检测和安全漏洞扫描，支持主流编程语言。

### Feasibility Assessment
- **技术可行性**: ⭐⭐⭐⭐☆ (4/5)
- **预计工时**: 480小时 (3-4个月单人全职)
- **推荐策略**: 渐进式开发，先做 Python + JavaScript MVP

---

## Clarification Questions & Responses

### Q1: MVP Scope ✅

**问题**: v1.0 版本必须包含哪些核心功能？

**回答**:

| 优先级 | 功能 | 说明 |
|--------|------|------|
| **Must Have (P0)** | | |
| | AST 代码解析 | Tree-sitter 解析 Python/JavaScript 代码 |
| | 安全漏洞检测 | SQL 注入、XSS、不安全函数调用 |
| | CLI 工具 | 命令行接口，支持本地扫描 |
| | 规则引擎 | 可自定义检测规则 |
| | 基础报告输出 | 终端输出 + Markdown 报告 |
| **Should Have (P1)** | | |
| | 代码异味检测 | 长函数、重复代码、复杂度过高 |
| | CI/CD 集成 | GitHub Actions / GitLab CI 插件 |
| | PR 自动评论 | 提交 MR 时自动评论审查结果 |
| **Could Have (P2)** | | |
| | IDE 插件 | VS Code / JetBrains 插件 |
| | Web Dashboard | 质量趋势可视化 |
| | 团队协作 | 多用户、权限管理 |

**语言支持**: v1.0 仅支持 **Python + JavaScript/TypeScript**

---

### Q2: Priority Order ✅

**功能依赖关系**:

```
                    ┌─────────────────┐
                    │   CLI 工具      │ ← 入口点
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  AST 解析器     │ ← 基础能力
                    │  (Tree-sitter)  │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼───────┐  ┌────────▼────────┐  ┌────────▼────────┐
│  规则引擎      │  │  LLM 增强分析   │  │  报告聚合器     │
│  (核心规则)    │  │  (可选)         │  │                │
└───────┬───────┘  └────────┬────────┘  └────────┬────────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   输出格式      │
                    │ (CLI/PR/JSON)   │
                    └─────────────────┘
```

**开发顺序**:
1. **Week 1-4**: AST 解析 + 规则引擎 (核心)
2. **Week 5-8**: 安全检测规则 + CLI 工具
3. **Week 9-12**: CI/CD 集成 + PR 评论
4. **Week 13-16**: LLM 增强分析 (可选)

---

### Q3: Tech Stack ✅

**确认技术选型**:

| 层级 | 技术 | 理由 |
|------|------|------|
| **后端语言** | Go | 高性能、并发强、单二进制部署 |
| **AST 解析** | Tree-sitter | 支持 40+ 语言，GitHub 同款 |
| **数据库** | PostgreSQL | 存储扫描结果、规则配置 |
| **缓存** | Redis | AST 解析结果缓存 |
| **LLM API** | Claude 3.5 Sonnet | 代码理解最佳 |
| **本地模型** | Llama 3.1 8B (可选) | 离线场景，隐私要求 |

**本地模型 vs API 调用权衡**:

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| **Claude API** | 准确率高、无需 GPU | 成本、延迟、数据外传 | 快速验证、个人项目 |
| **Llama 本地** | 隐私、无 API 成本 | GPU 需求、准确率略低 | 企业内网、敏感代码 |

**v1.0 策略**: 支持两种模式，默认规则引擎 (无需 LLM)，可选 Claude API 增强分析

---

### Q4: Integration Points ✅

**MVP 阶段集成优先级**:

| 集成点 | 优先级 | 复杂度 | v1.0 支持 |
|--------|--------|--------|-----------|
| **Git 平台** | P0 | 中 | GitHub (API) |
| **CI/CD** | P1 | 中 | GitHub Actions |
| **IDE** | P2 | 高 | ❌ 推迟到 v2.0 |
| **Linter 集成** | P1 | 低 | ESLint (可选) |

**GitHub 集成设计**:
- 使用 GitHub App 认证
- PR Webhook 触发扫描
- 扫描结果以评论形式发布
- 支持 `.code-review.yml` 配置文件

---

### Q5: Success Criteria ✅

**可量化的成功指标**:

| 维度 | 指标 | 目标 | 测量方法 |
|------|------|------|----------|
| **技术性能** | 扫描速度 | <5s/1000 行 | 基准测试 |
| | 漏检率 | <5% | 人工抽查 |
| | 误报率 | <15% | 用户反馈 |
| **用户体验** | CLI 响应 | <2s 首次输出 | 性能监控 |
| | 易用性 | 3 个命令完成使用 | 用户测试 |
| **业务价值** | 漏洞发现 | 平均每次扫描 ≥1 个问题 | 统计数据 |
| | 代码质量改善 | 用户留存 >30% | 分析指标 |
| **采用率** | 活跃仓库 | >10 个周活仓库 | GitHub 统计 |

---

### Q6: Timeline ✅

**时间规划** (480小时 ≈ 12周全职):

| 阶段 | 时间 | 里程碑 | 交付物 |
|------|------|--------|--------|
| **Phase 0** | Week 0 | 技术调研 | 架构设计文档 |
| **Phase 1** | Week 1-4 | MVP: Parser + Rules | CLI 基础扫描 |
| **Phase 2** | Week 5-8 | LLM 集成 | AI 增强分析 |
| **Phase 3** | Week 9-12 | CI/CD 集成 | GitHub Action |
| **Phase 4** | Week 13-16 | 测试 & 文档 | v1.0 发布 |

**v1.0 交付目标**: 16周 (4个月)

**无硬性截止日期**，但建议按里程碑推进

---

### Q7: Resource Constraints ✅

**资源约束清单**:

| 资源类型 | 约束 | 说明 |
|----------|------|------|
| **团队规模** | 单人开发 | 需要全栈技能 |
| **技能要求** | Go, AST, LLM API | 需要学习曲线 |
| **LLM 成本** | < $50/月 | Claude API 控制预算 |
| **本地部署** | GPU 8GB+ (可选) | Llama 推理 |
| **数据库** | PostgreSQL 14+ | 需要 JSONB 支持 |
| **开发环境** | macOS/Linux | Windows 支持后排 |

**开发工具**:
- IDE: VS Code + Go 插件
- 版本控制: Git
- CI: GitHub Actions
- 容器: Docker (可选)

---

## Functional Requirements

### FR-001: 代码解析

**Description**: 系统能够解析 Python 和 JavaScript/TypeScript 源代码，生成抽象语法树 (AST)

**Priority**: Must Have

**Acceptance Criteria**:
- [x] Given 一个 Python 文件，when 解析时，then 生成 AST 且无错误
- [x] Given 一个 JavaScript/TypeScript 文件，when 解析时，then 生成 AST 且无错误
- [x] Given 语法错误的代码，when 解析时，then 返回清晰的错误信息

**Dependencies**: Tree-sitter 库

---

### FR-002: 安全漏洞检测

**Description**: 检测常见安全漏洞，包括 SQL 注入、XSS、不安全函数调用等

**Priority**: Must Have

**Acceptance Criteria**:
- [x] Given 包含 SQL 注入的代码，when 扫描时，then 标记为高危漏洞
- [x] Given 包含 XSS 风险的代码，when 扫描时，then 标记为中危漏洞
- [x] Given 使用不安全函数的代码，when 扫描时，then 提供安全替代方案

**Dependencies**: FR-001 (代码解析)

---

### FR-003: CLI 工具

**Description**: 提供命令行接口，支持本地代码扫描

**Priority**: Must Have

**Acceptance Criteria**:
- [x] Given 用户安装了 CLI，when 运行 `smc-review scan ./src`，then 扫描完成并输出结果
- [x] Given 扫描完成，when 查看输出，then 显示问题数量和详细信息
- [x] Given 不存在的路径，when 扫描时，then 返回友好的错误提示

**Dependencies**: FR-001, FR-002

---

### FR-004: 规则引擎

**Description**: 支持自定义检测规则，团队可配置特定检查项

**Priority**: Should Have

**Acceptance Criteria**:
- [x] Given 一个 YAML 配置文件，when 加载规则时，then 正确解析并应用
- [x] Given 自定义规则，when 扫描时，then 按规则执行检查
- [x] Given 无效的规则配置，when 加载时，then 返回验证错误

**Dependencies**: FR-001

---

### FR-005: CI/CD 集成

**Description**: 集成 GitHub Actions，在 PR 创建时自动运行代码审查

**Priority**: Should Have

**Acceptance Criteria**:
- [x] Given 一个 PR 创建，when 触发 workflow，then 自动扫描变更文件
- [x] Given 扫描发现问题，when 完成时，then 在 PR 中添加评论
- [x] Given 无安全问题，when 扫描完成时，then 标记检查为通过

**Dependencies**: FR-001, FR-002, FR-003

---

### FR-006: 代码异味检测

**Description**: 检测代码质量问题，如过长函数、高复杂度、重复代码

**Priority**: Should Have

**Acceptance Criteria**:
- [x] Given 函数超过 50 行，when 扫描时，then 标记为代码异味
- [x] Given 圈复杂度 > 10，when 扫描时，then 建议重构
- [x] Given 重复代码块，when 扫描时，then 标记并建议提取

**Dependencies**: FR-001

---

## Non-Functional Requirements

### Performance

| 指标 | 目标 | 测量方法 |
|------|------|----------|
| 扫描速度 | <5s/1000 行 | 基准测试 |
| 内存占用 | <512MB | 性能监控 |
| 并发支持 | 10 个仓库同时扫描 | 负载测试 |

### Security

| 需求 | 说明 |
|------|------|
| 代码隐私 | 本地模式不发送代码到外部 API |
| API 加密 | 所有网络通信使用 HTTPS |
| 权限控制 | GitHub App 使用最小权限原则 |

### Reliability

| 需求 | 目标 |
|------|------|
| 可用性 | 99% (本地工具无依赖外部服务) |
| 错误处理 | 优雅降级，LLM 失败时回退到规则引擎 |

### Maintainability

| 需求 | 目标 |
|------|------|
| 代码覆盖 | >70% 测试覆盖率 |
| 文档 | API 文档 + 用户手册 |

### Compatibility

| 平台 | 支持版本 |
|------|----------|
| 操作系统 | macOS 12+, Ubuntu 20.04+, Windows 11+ |
| Python | 3.8+ |
| Node.js | 16+ (JS/TS 解析) |
| Git | GitHub, GitLab (v2.0) |

---

## Success Metrics

### 技术性能

| Metric | Target | Measurement |
|--------|--------|-------------|
| 扫描速度 | <5s/1000 LOC | Benchmark |
| 准确率 | >85% | Test suite |
| 误报率 | <15% | User feedback |

### 用户体验

| Metric | Target | Measurement |
|--------|--------|-------------|
| 安装时间 | <2min | One-liner install |
| 学习曲线 | <10min | Documentation survey |

### 业务价值

| Metric | Target | Measurement |
|--------|--------|-------------|
| 漏洞发现 | ≥1 issue/scan | Analytics |
| 用户留存 | >30% DAU/MAU | Usage stats |

---

## Edge Cases & Constraints

### Edge Cases

| 场景 | 处理策略 |
|------|----------|
| 超大文件 (>1MB) | 跳过或分块处理 |
| 二进制文件 | 自动排除 |
| 语法错误代码 | 标记但继续扫描 |
| 无网络访问 | 回退到纯规则模式 |

### Constraints

| 类型 | 约束 |
|------|------|
| **技术** | LLM API 有速率限制 |
| **业务** | 开源免费，企业版收费 |
| **法律** | 不存储用户代码 |
| **时间** | 16周交付 v1.0 |

---

## Assumptions & Dependencies

### Assumptions

| 假设 | 影响 |
|------|------|
| 用户有基本 Git 经验 | 文档不需要 Git 教程 |
| 代码仓库 <100万行 | 性能优化聚焦中小仓库 |
| Claude API 持续可用 | 需要备用方案 |

### Dependencies

| 类型 | 依赖 |
|------|------|
| **内部** | Tree-sitter Go 绑定 |
| **外部** | Claude Anthropic API (可选) |
| **团队** | Go 开发经验 |

---

## Out of Scope

v1.0 **不包含** 的功能:

| 功能 | 原因 | 计划 |
|------|------|------|
| IDE 插件 | 开发复杂度高，优先 CLI | v2.0 |
| Web Dashboard | 非核心价值 | v2.0 |
| 多语言支持 >2 | 聚焦 Python/JS | 逐步扩展 |
| 团队协作功能 | 单用户场景优先 | 企业版 |
| 自托管 SaaS | 先验证产品价值 | 未来评估 |

---

## Approval Checklist

- [x] Requirements are clear and unambiguous
- [x] Acceptance criteria are testable
- [x] Technical rationale is documented
- [x] Success metrics are quantifiable
- [x] Edge cases are identified
- [x] Constraints are documented
- [x] Stakeholder consensus achieved

---

## Next Steps (Phase 3: Planning)

1. [x] Review requirements with all stakeholders
2. [x] Run quality gate: `smc workflow validate`
3. [x] Address any blockers identified
4. [ ] Proceed to Phase 3 for detailed design and planning

---

## Metadata

- **Generated**: 1/17/2026
- **Phase 1 Report**: `../phase1/feasibility-report.md`
- **Clarification Questions**: 7/7 answered ✅
- **Confidence Level**: High (基于可行性分析和行业最佳实践)

---

*This document was completed by the Phase 2 Approval Executor.*
