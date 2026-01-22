# Architecture Design Document

**Project**: proj_mkh8zddd_dhamf (AI 代码审查工具)
**Date**: 1/17/2026
**Phase**: 3 - Planning
**Status**: In Progress

---

## Executive Summary

本文档定义 AI 代码审查工具的系统架构设计，基于 Phase 1 可行性分析和 Phase 2 需求文档。

**核心架构原则**:
- **模块化**: 每个组件职责单一，易于测试和维护
- **可扩展**: 支持新增语言、规则和集成点
- **高性能**: 增量扫描、缓存机制、并行处理
- **隐私优先**: 本地模式不发送代码到外部 API

---

## 1. System Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER LAYER                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │
│  │   CLI Tool      │  │   CI/CD Plugin  │  │   IDE Plugin    │            │
│  │   (smc-review)  │  │  (GitHub Action)│  │   (Future)      │            │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘            │
│           │                    │                    │                      │
└───────────┼────────────────────┼────────────────────┼──────────────────────┘
            │                    │                    │
            ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY (Go)                                  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  Request Router  │  Auth Handler  │  Rate Limiter  │  Task Queue    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
            ┌─────────────────────────┼─────────────────────────┐
            │                         │                         │
            ▼                         ▼                         ▼
┌───────────────────┐   ┌───────────────────┐   ┌───────────────────────┐
│   Parser Service  │   │   Rule Engine     │   │   LLM Service         │
│                   │   │                   │   │   (Optional)          │
│ ┌───────────────┐ │   │ ┌───────────────┐ │   │ ┌─────────────────┐ │
│ │ Tree-sitter   │ │   │ │ Security Rules│ │   │ │ Claude 3.5 API  │ │
│ │ Python        │ │   │ │ Code Smell    │ │   │ │ Local Llama     │ │
│ │ JavaScript    │ │   │ │ Custom Rules  │ │   │ │ Fallback        │ │
│ └───────────────┘ │   │ └───────────────┘ │   │ └─────────────────┘ │
└─────────┬─────────┘   └─────────┬─────────┘   └───────────┬───────────┘
          │                       │                         │
          └───────────────────────┼─────────────────────────┘
                                  ▼
                    ┌─────────────────────────────┐
                    │   Report Aggregator         │
                    │ ┌─────────────────────────┐ │
                    │ │ Issue Deduplication     │ │
                    │ │ Severity Calculation    │ │
                    │ │ Output Formatting       │ │
                    │ └─────────────────────────┘ │
                    └──────────────┬──────────────┘
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATA LAYER                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │
│  │   PostgreSQL    │  │     Redis       │  │   File System   │            │
│  │                 │  │                 │  │                 │            │
│  │ - Scan Results  │  │ - AST Cache     │  │ - Config Files  │            │
│  │ - Rules         │  │ - Rule Cache    │  │ - Reports       │            │
│  │ - History       │  │ - Session Data  │  │ - Temp Files    │            │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘            │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Component Overview

| Component | Language | Responsibility | Lines (Est.) |
|-----------|----------|----------------|--------------|
| **CLI Tool** | Go | 命令行接口、配置加载 | ~2,000 |
| **Parser Service** | Go | AST 解析、代码遍历 | ~1,500 |
| **Rule Engine** | Go | 规则匹配、问题检测 | ~2,500 |
| **LLM Service** | Go | AI API 调用、结果解析 | ~1,000 |
| **Report Generator** | Go | 报告生成、输出格式化 | ~1,200 |
| **Database Layer** | Go | 数据持久化、查询 | ~800 |
| **CI/CD Integration** | YAML/Go | GitHub Action 配置 | ~500 |
| **Total** | | | ~9,500 |

---

## 2. Module Design

### 2.1 Module Structure

```
smc-review/
├── cmd/
│   └── smc-review/
│       └── main.go                 # CLI 入口
├── internal/
│   ├── cli/
│   │   ├── cmd.go                  # Cobra 命令定义
│   │   ├── scan.go                 # scan 命令实现
│   │   ├── init.go                 # init 命令实现
│   │   ├── config.go               # config 命令实现
│   │   └── report.go               # report 命令实现
│   ├── parser/
│   │   ├── parser.go               # Parser 接口
│   │   ├── tree_sitter.go          # Tree-sitter 实现
│   │   ├── python.go               # Python 解析器
│   │   ├── javascript.go           # JavaScript 解析器
│   │   └── ast.go                  # AST 数据结构
│   ├── ruleengine/
│   │   ├── engine.go               # 规则引擎核心
│   │   ├── rule.go                 # 规则接口
│   │   ├── security_rules.go       # 安全规则集
│   │   ├── quality_rules.go        # 质量规则集
│   │   └── custom_rules.go         # 自定义规则加载
│   ├── llm/
│   │   ├── client.go               # LLM 客户端接口
│   │   ├── claude.go               # Claude API 实现
│   │   ├── local.go                # 本地模型实现
│   │   └── prompt.go               # Prompt 模板
│   ├── report/
│   │   ├── generator.go            # 报告生成器
│   │   ├── formatter.go            # 输出格式化
│   │   └── template.go             # 报告模板
│   ├── db/
│   │   ├── database.go             # 数据库接口
│   │   ├── postgres.go             # PostgreSQL 实现
│   │   ├── migrations.go           # 数据库迁移
│   │   └── models.go               # 数据模型
│   ├── cache/
│   │   ├── cache.go                # 缓存接口
│   │   └── redis.go                # Redis 实现
│   └── config/
│       ├── config.go               # 配置结构
│       ├── loader.go               # 配置加载
│       └── validator.go            # 配置验证
├── pkg/
│   ├── types/
│   │   ├── issue.go                # Issue 类型
│   │   ├── scan_result.go          # ScanResult 类型
│   │   └── report.go               # Report 类型
│   └── utils/
│       ├── fileutil.go             # 文件工具
│       └── gitutil.go              # Git 工具
├── .github/
│   └── workflows/
│       └── code-review.yml         # GitHub Action
└── go.mod
```

### 2.2 Module Dependencies

```
                    ┌─────────────┐
                    │     CLI     │
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │   Config    │ │   Parser    │ │    Cache    │
    └──────┬──────┘ └──────┬──────┘ └─────────────┘
           │               │
           └───────┬───────┘
                   │
       ┌───────────┼───────────┐
       │           │           │
       ▼           ▼           ▼
┌───────────┐ ┌───────────┐ ┌───────────┐
│   Rule    │ │    LLM    │ │    DB     │
│  Engine   │ │  Service  │ │           │
└─────┬─────┘ └─────┬─────┘ └───────────┘
      │             │
      └──────┬──────┘
             ▼
      ┌─────────────┐
      │   Report    │
      │  Generator  │
      └─────────────┘
```

---

## 3. Data Flow

### 3.1 Scan Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SCAN FLOW                                      │
└─────────────────────────────────────────────────────────────────────────────┘

  User                    CLI                  Parser              Rule Engine
   │                       │                      │                      │
   │ smc-review scan       │                      │                      │
   ├──────────────────────>│                      │                      │
   │                       │                      │                      │
   │                       │ Load config          │                      │
   │                       ├───────────────────────────────────────────────>│
   │                       │                      │                       │
   │                       │ Get changed files    │                      │
   │                       │ (git diff)           │                      │
   │                       ├──────────>│          │                      │
   │                       │           │          │                      │
   │                       │           │ Parse    │                      │
   │                       │           │ files    │                      │
   │                       │           ├──────────────────────────────────>│
   │                       │           │          │                       │
   │                       │           │ AST      │                       │
   │                       │           │<─────────┘                       │
   │                       │           │          │                       │
   │                       │           │          │ Run rules             │
   │                       │           │          ├──────────>│            │
   │                       │           │          │           │            │
   │                       │           │          │ Issues    │            │
   │                       │           │          │<──────────┘            │
   │                       │           │          │                       │
   │                       │           │          │ [Optional] LLM        │
   │                       │           │          ├───────────────────────>│
   │                       │           │          │                       │
   │                       │           │          │ Enhanced issues       │
   │                       │           │          │<───────────────────────┤
   │                       │           │          │                       │
   │                       │           │          │ Generate report       │
   │                       │           │          ├───────────────────────>│
   │                       │           │          │                       │
   │                       │           │          │ Report                │
   │                       │           │          │<───────────────────────┤
   │                       │           │          │                       │
   │                       │ Output report         │                       │
   │                       ├───────────────────────────────────────────────>│
   │                       │                      │                       │
   │ Report output         │                      │                       │
   │<──────────────────────┘                      │                       │
   │                       │                      │                       │
```

### 3.2 CI/CD Integration Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CI/CD INTEGRATION FLOW                              │
└─────────────────────────────────────────────────────────────────────────────┘

  GitHub                      smc-review                     GitHub API
   Action                                                   REST API
    │                                                         │
    │ PR created                                              │
    │<────────────────────────────────────────────────────────┤
    │                                                         │
    │ Trigger workflow                                        │
    ├────────────────────────────────────────────────────────>│
    │                                                         │
    │ Download smc-review                                     │
    │<────────────────────────────────────────────────────────┤
    │                                                         │
    │ Run scan                                                │
    ├──────────────────────────────┐                          │
    │                              │                          │
    │                              │ Get PR diff               │
    │                              ├──────────────────────────>│
    │                              │                          │
    │                              │ Changed files             │
    │                              │<──────────────────────────┤
    │                              │                          │
    │                              │ Scan files                │
    │                              ├──────────┐               │
    │                              │          │               │
    │                              │ Results  │               │
    │                              │<─────────┘               │
    │                              │                          │
    │                              │ Post comment              │
    │                              ├──────────────────────────>│
    │                              │                          │
    │ Exit with status             │                          │
    │<─────────────────────────────┘                          │
    │                                                         │
```

---

## 4. Technology Stack

### 4.1 Confirmed Technologies

| Layer | Technology | Version | Justification |
|-------|-----------|---------|---------------|
| **Language** | Go | 1.21+ | 高性能、并发强、单二进制部署 |
| **AST Parser** | Tree-sitter | 0.20+ | 支持 40+ 语言，GitHub 同款 |
| **CLI Framework** | Cobra | 1.8+ | 标准 Go CLI 框架 |
| **Database** | PostgreSQL | 14+ | JSONB 支持，存储扫描结果 |
| **Cache** | Redis | 7+ | AST 结果缓存 |
| **LLM API** | Anthropic Claude | 3.5 Sonnet | 代码理解最佳 |
| **Local LLM** | Llama 3.1 | 8B | 离线场景，隐私要求 |
| **Testing** | testify | 1.8+ | Go 测试框架 |

### 4.2 Go Dependencies

```go
module github.com/smc-review/smc-review

go 1.21

require (
    github.com/spf13/cobra v1.8.0
    github.com/tree-sitter/go-tree-sitter v0.20.0
    github.com/lib/pq v1.10.9
    github.com/redis/go-redis/v9 v9.3.0
    github.com/anthropics/anthropic-go/v3 v3.0.0
    github.com/spf13/viper v1.17.0
    github.com/stretchr/testify v1.8.4
    gopkg.in/yaml.v3 v3.0.1
)
```

---

## 5. Architecture Decision Records (ADR)

### ADR-001: Go as Primary Language

**Status**: Accepted

**Context**: 需要选择一种高性能、易于部署的语言作为主要开发语言。

**Decision**: 使用 Go 1.21+ 作为主要开发语言。

**Consequences**:

*Positive*:
- 高性能编译型语言，适合 I/O 密集型任务
- 内置并发支持 (goroutines)
- 单二进制部署，无运行时依赖
- 丰富的生态系统

*Negative*:
- 泛型支持较新 (Go 1.18+)
- 错误处理较为冗长

**Alternatives Considered**:
- Rust: 性能更优，但学习曲线陡峭
- Python: 开发速度快，但性能较差
- Node.js: 生态丰富，但单线程模型不适合此场景

---

### ADR-002: Tree-sitter for AST Parsing

**Status**: Accepted

**Context**: 需要一个多语言代码解析方案。

**Decision**: 使用 Tree-sitter 作为 AST 解析引擎。

**Consequences**:

*Positive*:
- 支持 40+ 编程语言
- 增量解析，错误恢复能力强
- GitHub 同款，社区活跃
- Go 绑定可用

*Negative*:
- 每种语言需要单独的语法文件
- AST 结构因语言而异

**Alternatives Considered**:
- ANTLR: 需要为每种语言编写语法
- Language Server Protocol: 过于重量级
- 正则表达式: 不可靠，无法处理复杂语法

---

### ADR-003: PostgreSQL for Data Persistence

**Status**: Accepted

**Context**: 需要存储扫描结果、规则配置和历史数据。

**Decision**: 使用 PostgreSQL 14+ 作为主数据库。

**Consequences**:

*Positive*:
- JSONB 支持灵活的数据结构
- ACID 保证数据一致性
- 丰富的查询能力
- 成熟的备份/恢复方案

*Negative*:
- 需要额外部署组件
- 小型项目可能过重

**Alternatives Considered**:
- SQLite: 轻量，但不支持并发写入
- MongoDB: Schema-free，但查询能力较弱
- 纯文件存储: 简单，但不支持复杂查询

---

### ADR-004: Optional LLM Enhancement

**Status**: Accepted

**Context**: AI 增强分析是差异化功能，但不应成为阻塞点。

**Decision**: LLM 服务作为可选模块，规则引擎优先。

**Consequences**:

*Positive*:
- 无 LLM 也能完成基础扫描
- 降低依赖风险
- 逐步验证 AI 价值

*Negative*:
- 需要维护两套分析逻辑
- 可能影响用户对 AI 功能的发现

**Alternatives Considered**:
- 仅 LLM: 过于依赖外部服务
- 本地模型优先: 硬件要求高

---

### ADR-005: GitHub First, GitLab Later

**Status**: Accepted

**Context**: 需要选择 CI/CD 集成优先级。

**Decision**: v1.0 优先支持 GitHub Actions，GitLab 延迟到 v1.1+。

**Consequences**:

*Positive*:
- 聚焦资源，快速交付
- GitHub 市场份额最大
- Action 配置相对简单

*Negative*:
- 限制初始用户群
- 后续需要适配 GitLab

**Alternatives Considered**:
- 同时支持: 增加复杂度
- 抽象集成层: 过早优化

---

## 6. Scalability Considerations

### 6.1 Performance Optimization

| 技术 | 应用场景 | 预期效果 |
|------|----------|----------|
| **增量扫描** | 只扫描 Git diff 变更文件 | 减少 80% 扫描时间 |
| **AST 缓存** | Redis 缓存解析结果 | 减少 50% 解析时间 |
| **并行处理** | goroutine 并行扫描文件 | 线性加速到 CPU 核心数 |
| **规则预编译** | 启动时编译规则 | 减少运行时开销 |

### 6.2 Scalability Targets

| 指标 | v1.0 目标 | v2.0 目标 |
|------|----------|----------|
| 代码库规模 | <100 万行 | <500 万行 |
| 并发扫描 | 单实例 | 分布式 |
| 存储容量 | 10GB | 100GB+ |
| 响应时间 | <5s/1000 行 | <10s/10000 行 |

---

## 7. Security Architecture

### 7.1 Threat Model

| 威胁 | 影响 | 缓解措施 |
|------|------|----------|
| 代码泄露到外部 | 高 | 本地模式默认，API 模式需显式启用 |
| LLM 注入攻击 | 中 | Prompt 模板化，不直接拼接用户输入 |
| 配置文件注入 | 低 | 配置验证，沙箱执行 |
| 依赖供应链攻击 | 中 | Go modules 验证，定期更新 |

### 7.2 Data Flow Privacy

```
┌─────────────────────────────────────────────────────────────────┐
│                        PRIVACY MODES                            │
└─────────────────────────────────────────────────────────────────┘

  LOCAL MODE (Default)                    API MODE (Optional)
  ┌───────────────────┐                   ┌───────────────────┐
  │  User Code        │                   │  User Code        │
  │       ↓           │                   │       ↓           │
  │  Parser + Rules   │                   │  Parser + Rules   │
  │       ↓           │                   │       ↓           │
  │  Local Report     │                   │  Anonymized Snip  │
  │                   │                   │       ↓           │
  │  ✅ No external   │                   │  LLM API          │
  │     network call  │                   │       ↓           │
  │                   │                   │  Enhanced Result  │
  └───────────────────┘                   │       ↓           │
                                           │  Local Report     │
                                           └───────────────────┘
```

---

## 8. Monitoring & Observability

### 8.1 Metrics to Track

| 类别 | 指标 | 目标 |
|------|------|------|
| **性能** | 扫描时间/1000 行 | <5s |
| | 内存占用 | <512MB |
| **质量** | 漏检率 | <5% |
| | 误报率 | <15% |
| **使用** | 日活用户 | >10 |
| | 平均扫描次数/用户 | >5 |

### 8.2 Logging Strategy

```go
// 结构化日志示例
log.WithFields(log.Fields{
    "scan_id": scanID,
    "file": filePath,
    "language": "python",
    "issues_found": len(issues),
    "duration_ms": duration.Milliseconds(),
}).Info("File scan completed")
```

---

## 9. Deployment Architecture

### 9.1 Installation Methods

```
┌─────────────────────────────────────────────────────────────────┐
│                    INSTALLATION OPTIONS                         │
└─────────────────────────────────────────────────────────────────┘

  Method 1: Binary Download              Method 2: Homebrew
  ┌─────────────────────┐                ┌─────────────────────┐
  │ curl -L ... | tar    │                │ brew install smc-   │
  │                      │                │ review              │
  │ Single binary        │                │                     │
  └─────────────────────┘                └─────────────────────┘

  Method 3: Docker                         Method 4: Build from Source
  ┌─────────────────────┐                ┌─────────────────────┐
  │ docker pull smc/     │                │ git clone ...       │
  │ review               │                │ cd smc-review       │
  │                      │                │ go build            │
  │ Self-contained      │                │                     │
  └─────────────────────┘                └─────────────────────┘
```

### 9.2 Configuration Locations

| 平台 | 配置文件路径 |
|------|-------------|
| macOS/Linux | `~/.config/smc-review/config.yml` |
| Windows | `%APPDATA%\smc-review\config.yml` |
| 项目级 | `.code-review.yml` (Git 根目录) |

---

## 10. Quality Gates

### 10.1 Code Quality Standards

| 指标 | 阈值 | 工具 |
|------|------|------|
| 测试覆盖率 | >70% | go test -cover |
| 代码复杂度 | <15 (圈复杂度) | gocyclo |
| 代码重复 | <5% | dupl |
| 文档覆盖 | 100% (导出函数) | godoc |

### 10.2 Pre-commit Hooks

```bash
#!/bin/bash
# .git/hooks/pre-commit

go fmt ./...
go vet ./...
go test ./... -cover
golangci-lint run
```

---

## 11. Next Steps

1. Review architecture with stakeholders
2. Confirm technology stack decisions
3. Proceed to detailed API design (api-design.md)
4. Define data models (data-model.md)
5. Create work breakdown structure (wbs.md)

---

## Metadata

- **Created**: 1/17/2026
- **Author**: Phase 3 Design Executor
- **Reviewers**: Pending
- **Status**: Draft for Review
- **Related Docs**: phase2/requirements.md

---

*This architecture design document serves as the blueprint for the AI Code Review Tool implementation.*
