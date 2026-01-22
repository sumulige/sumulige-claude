# API Design Document

**Project**: proj_mkh8zddd_dhamf (AI 代码审查工具)
**Date**: 1/17/2026
**Phase**: 3 - Planning
**Status**: In Progress

---

## Executive Summary

本文档定义 AI 代码审查工具的 CLI 命令接口、配置文件格式和输出格式规范。

**设计原则**:
- **简洁**: 最少的命令完成常用任务
- **直观**: 默认行为符合用户预期
- **可配置**: 支持项目级和全局配置
- **可扩展**: 易于添加新命令和选项

---

## 1. CLI Command Design

### 1.1 Command Overview

```
smc-review <command> [options] [arguments]

Commands:
  scan       Scan code for issues
  init       Initialize configuration in current directory
  config     Manage configuration
  report     Generate reports from scan results
  version    Show version information
  help       Show help information

Global Options:
  -c, --config <file>    Use specific config file
  -v, --verbose          Enable verbose output
  -q, --quiet            Suppress non-error output
  --no-color             Disable colored output
```

### 1.2 Command Details

#### 1.2.1 scan

扫描代码库中的问题。

```
Usage: smc-review scan [options] [path]

Arguments:
  path                  Path to scan (default: current directory)
                        Can be a file, directory, or glob pattern

Options:
  -o, --output <format> Output format: table, json, markdown, sarif (default: table)
  -r, --recursive       Scan subdirectories recursively (default: true)
  --rules <rules>       Comma-separated list of rules to run (default: all)
  --exclude <patterns>  Comma-separated glob patterns to exclude
  --severity <level>    Minimum severity: critical, high, medium, low (default: low)
  --diff                Only scan changed files (git diff)
  --cached              Use cached AST results when available
  --ai                  Enable AI-enhanced analysis (requires API key)
  --no-ai               Disable AI analysis even if configured
  --timeout <seconds>   Maximum scan time (default: 300)
  -j, --jobs <n>        Number of parallel jobs (default: CPU count)
  --output-file <file>  Write output to file instead of stdout

Examples:
  smc-review scan ./src
  smc-review scan --diff --severity high
  smc-review scan --output json --output-file results.json
  smc-review scan --exclude "node_modules/**/*.js,dist/**"
```

#### 1.2.2 init

初始化项目配置。

```
Usage: smc-review init [options]

Options:
  -f, --force          Overwrite existing config file
  --template <name>    Use preset template: default, strict, relaxed
  --interactive        Interactive mode with prompts

Examples:
  smc-review init
  smc-review init --template strict
  smc-review init --force
```

#### 1.2.3 config

管理配置。

```
Usage: smc-review config <subcommand> [options]

Subcommands:
  get <key>            Get configuration value
  set <key> <value>    Set configuration value
  list                 List all configuration
  validate             Validate current configuration
  reset                Reset to default configuration

Options:
  --global             Operate on global config (~/.config/smc-review/)
  --project            Operate on project config (.code-review.yml)

Examples:
  smc-review config list
  smc-review config set scan.severity high
  smc-review config get rules.enabled
  smc-review config validate --project
```

#### 1.2.4 report

从扫描结果生成报告。

```
Usage: smc-review report [options]

Options:
  -i, --input <file>   Input scan results file (JSON format)
  -o, --output <file>  Output report file
  -f, --format <fmt>   Report format: markdown, html, pdf, json
  -t, --template <tpl> Custom report template
  --trend              Generate trend report (requires history)

Examples:
  smc-review report -i scan-results.json -o report.md
  smc-review report --input results.json --format html --output report.html
  smc-review report --trend --days 30
```

#### 1.2.5 version

显示版本信息。

```
Usage: smc-review version

Output:
  smc-review v1.0.0
  Build: 2026-01-17
  Tree-sitter: v0.20.0
  Supported languages: Python, JavaScript, TypeScript
```

### 1.3 Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success, no issues found |
| 1 | Issues found (severity at or above threshold) |
| 2 | Error occurred (invalid args, file not found, etc.) |
| 3 | Configuration error |
| 4 | Scan timeout |
| 5 | LLM API error |

---

## 2. Configuration File Format

### 2.1 File Location

配置文件按优先级从高到低：

1. `--config` 指定的文件
2. 当前目录的 `.code-review.yml`
3. 项目根目录的 `.code-review.yml`
4. `~/.config/smc-review/config.yml`

### 2.2 Configuration Schema

```yaml
# .code-review.yml
version: "1.0"

# Scan configuration
scan:
  # Paths to include (glob patterns)
  include:
    - "**/*.py"
    - "**/*.js"
    - "**/*.ts"
    - "**/*.jsx"
    - "**/*.tsx"

  # Paths to exclude (glob patterns)
  exclude:
    - "node_modules/**"
    - "dist/**"
    - "build/**"
    - "vendor/**"
    - "**/*.min.js"
    - "**/*.test.js"
    - "**/*.spec.js"

  # Minimum severity to report
  min_severity: low  # critical, high, medium, low

  # Recursive scan
  recursive: true

  # Parallel jobs
  jobs: 4

  # Cache settings
  cache:
    enabled: true
    ttl: 86400  # 24 hours in seconds

# Rules configuration
rules:
  # Enable/disable rule categories
  categories:
    security:
      enabled: true
      severity: high
    quality:
      enabled: true
      severity: medium
    performance:
      enabled: false

  # Specific rule settings
  specific:
    - id: sql-injection
      enabled: true
      severity: critical
      languages: [python, javascript]

    - id: xss
      enabled: true
      severity: high
      languages: [javascript, typescript]

    - id: long-function
      enabled: true
      severity: low
      params:
        max_lines: 50

    - id: high-complexity
      enabled: true
      severity: medium
      params:
        max_complexity: 10

  # Custom rules (inline definition)
  custom: []

# AI Configuration (optional)
ai:
  enabled: false
  provider: anthropic  # anthropic, openai, local
  model: claude-3-5-sonnet-20241022

  # API settings
  api:
    endpoint: https://api.anthropic.com/v1/messages
    timeout: 30
    max_retries: 3

  # Prompt settings
  prompt:
    temperature: 0.3
    max_tokens: 1000

  # Cost control
  cost_control:
    max_requests_per_scan: 10
    max_tokens_per_scan: 10000

# Output configuration
output:
  # Default format
  format: table  # table, json, markdown, sarif

  # Colored output
  color: auto  # auto, always, never

  # Show code snippets in output
  show_snippets: true

  # Snippet context lines
  context_lines: 3

# Ignore patterns (similar to .gitignore)
ignore:
  # Specific files
  files:
    - "**/__pycache__/**"
    - "**/pyvenv/**"
    - "**/.venv/**"

  # Specific issues (by ID or pattern)
  issues:
    - id: long-function
      files: ["**/test_*.py", "**/*_test.py"]
      reason: "Test functions can be longer"
    - id: no-docstring
      files: ["**/migrations/**"]

# Integration settings
integrations:
  github:
    enabled: false
    # Auto-comment on PRs
    pr_comment: true
    # Fail checks on issues
    fail_on_severity: high

# Report configuration
reports:
  # History tracking
  history:
    enabled: true
    retention_days: 90

  # Trend analysis
  trends:
    enabled: true
    comparison_period: 7  # days
```

### 2.3 Configuration Templates

#### 2.3.1 Default Template

```yaml
# Balanced configuration for general use
scan:
  min_severity: medium
rules:
  categories:
    security:
      enabled: true
    quality:
      enabled: true
ai:
  enabled: false
```

#### 2.3.2 Strict Template

```yaml
# Strict configuration for security-critical projects
scan:
  min_severity: low
rules:
  categories:
    security:
      enabled: true
      severity: critical
    quality:
      enabled: true
      severity: low
ai:
  enabled: true
  cost_control:
    max_requests_per_scan: 50
integrations:
  github:
    fail_on_severity: medium
```

#### 2.3.3 Relaxed Template

```yaml
# Relaxed configuration for learning/prototyping
scan:
  min_severity: high
rules:
  categories:
    security:
      enabled: true
    quality:
      enabled: false
ai:
  enabled: false
ignore:
  issues:
    - id: long-function
      reason: "Not enforced in relaxed mode"
```

### 2.4 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SMC_REVIEW_CONFIG` | Path to config file | - |
| `SMC_REVIEW_API_KEY` | LLM API key | - |
| `SMC_REVIEW_CACHE_DIR` | Cache directory | `~/.cache/smc-review` |
| `SMC_REVIEW_LOG_LEVEL` | Log level | `info` |
| `SMC_REVIEW_NO_COLOR` | Disable colors | `false` |
| `SMC_REVIEW_JOBS` | Default parallel jobs | CPU count |

---

## 3. Output Formats

### 3.1 Table Format (Default)

```
Code Review Results

Summary
-------
Files scanned: 47
Issues found: 12
  Critical: 2
  High: 4
  Medium: 4
  Low: 2

Issues
------

CRITICAL src/auth/login.py:45
  SQL Injection: User input directly concatenated into SQL query
  def authenticate(username, password):
      query = f"SELECT * FROM users WHERE username='{username}'"
                                      ^^^^^^^^^^^^^^^^^^^^^^^^

HIGH src/services/payment.js:23
  XSS Vulnerability: User input rendered without sanitization
  function renderComment(comment) {
      return `<div>${comment.text}</div>`;
                        ^^^^^^^^^^^

MEDIUM src/utils/helpers.py:89
  Long Function: Function exceeds 50 lines (67 lines)
  def process_data(data, options, config):
  ...

LOW src/api/routes.py:156
  Missing Docstring: Public function lacks documentation
  def calculate_total(items):

Scan completed in 3.2s
```

### 3.2 JSON Format

```json
{
  "version": "1.0.0",
  "scan_id": "scan_20260117_123456",
  "timestamp": "2026-01-17T12:34:56Z",
  "summary": {
    "files_scanned": 47,
    "total_issues": 12,
    "by_severity": {
      "critical": 2,
      "high": 4,
      "medium": 4,
      "low": 2
    },
    "by_category": {
      "security": 6,
      "quality": 4,
      "performance": 2
    }
  },
  "issues": [
    {
      "id": "issue_001",
      "rule_id": "sql-injection",
      "severity": "critical",
      "category": "security",
      "title": "SQL Injection",
      "description": "User input directly concatenated into SQL query",
      "file": "src/auth/login.py",
      "line": 45,
      "column": 12,
      "end_line": 45,
      "end_column": 50,
      "code_snippet": "query = f\"SELECT * FROM users WHERE username='{username}'\"",
      "suggestion": "Use parameterized queries instead",
      "suggested_code": "cursor.execute(\"SELECT * FROM users WHERE username=%s\", (username,))",
      "references": [
        "https://owasp.org/www-community/attacks/SQL_Injection"
      ],
      "confidence": "high",
      "ai_enhanced": false
    }
  ],
  "performance": {
    "duration_seconds": 3.2,
    "files_per_second": 14.7
  }
}
```

### 3.3 Markdown Format

```markdown
# Code Review Report

**Generated**: 2026-01-17 12:34:56 UTC
**Scan ID**: `scan_20260117_123456`

## Summary

| Metric | Value |
|--------|-------|
| Files Scanned | 47 |
| Total Issues | 12 |
| Critical | 2 |
| High | 4 |
| Medium | 4 |
| Low | 2 |

## Critical Issues

### SQL Injection in `src/auth/login.py:45`

**Severity**: Critical
**Category**: Security

User input directly concatenated into SQL query.

```python
def authenticate(username, password):
    query = f"SELECT * FROM users WHERE username='{username}'"
    cursor.execute(query)
```

**Suggestion**:
Use parameterized queries to prevent SQL injection.

```python
def authenticate(username, password):
    query = "SELECT * FROM users WHERE username=%s"
    cursor.execute(query, (username,))
```

**References**:
- [OWASP SQL Injection](https://owasp.org/www-community/attacks/SQL_Injection)

---

## High Issues

### XSS Vulnerability in `src/services/payment.js:23`

...

---

## Performance

| Metric | Value |
|--------|-------|
| Scan Duration | 3.2s |
| Files/Second | 14.7 |

---

*Generated by smc-review v1.0.0*
```

### 3.4 SARIF Format

```json
{
  "version": "2.1.0",
  "$schema": "https://json.schemastore.org/sarif-2.1.0.json",
  "runs": [
    {
      "tool": {
        "driver": {
          "name": "smc-review",
          "version": "1.0.0",
          "informationUri": "https://github.com/smc-review/smc-review"
        }
      },
      "results": [
        {
          "ruleId": "sql-injection",
          "level": "error",
          "message": {
            "text": "User input directly concatenated into SQL query"
          },
          "locations": [
            {
              "physicalLocation": {
                "artifactLocation": {
                  "uri": "src/auth/login.py"
                },
                "region": {
                  "startLine": 45,
                  "startColumn": 12,
                  "endLine": 45,
                  "endColumn": 50
                }
              }
            }
          ]
        }
      ]
    }
  ]
}
```

---

## 4. GitHub Actions Integration

### 4.1 Action Configuration

```yaml
# .github/workflows/code-review.yml
name: Code Review

on:
  pull_request:
    types: [opened, synchronize, reopened]
  push:
    branches: [main, develop]

permissions:
  contents: read
  pull-requests: write

jobs:
  code-review:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Install smc-review
        run: |
          curl -L https://github.com/smc-review/smc-review/releases/latest/download/smc-review-linux-amd64.tar.gz | tar xz
          sudo mv smc-review /usr/local/bin/
          smc-review version

      - name: Run code review
        id: review
        env:
          SMC_REVIEW_API_KEY: ${{ secrets.SMC_REVIEW_API_KEY }}
        run: |
          smc-review scan --diff --output json --output-file results.json

      - name: Post PR comment
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const results = JSON.parse(fs.readFileSync('results.json', 'utf8'));
            const body = formatResults(results);
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: body
            });

      - name: Upload results
        uses: actions/upload-artifact@v4
        with:
          name: code-review-results
          path: results.json
```

### 4.2 Action Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `path` | Path to scan | No | `.` |
| `format` | Output format | No | `table` |
| `severity` | Minimum severity | No | `low` |
| `ai-enabled` | Enable AI analysis | No | `false` |
| `config-file` | Custom config file | No | `.code-review.yml` |

### 4.3 Action Outputs

| Output | Description |
|--------|-------------|
| `results-file` | Path to results JSON |
| `issue-count` | Number of issues found |
| `critical-count` | Number of critical issues |
| `high-count` | Number of high issues |

---

## 5. Error Messages

### 5.1 Error Format

```
Error: <error message>
Details: <additional context>
Hint: <suggested action>
```

### 5.2 Common Errors

| Error | Message | Hint |
|-------|---------|------|
| `E001` | Configuration file not found | Run `smc-review init` to create a config file |
| `E002` | Invalid configuration | Run `smc-review config validate` for details |
| `E003` | No files to scan | Check include/exclude patterns |
| `E004` | Parse error in file | Fix syntax errors or exclude the file |
| `E005` | LLM API timeout | Increase timeout with `--ai-timeout` or disable AI |
| `E006` | Cache write failed | Check disk space or disable cache |
| `E007` | Rule compilation failed | Check rule syntax in config file |

---

## 6. API Reference (Internal)

### 6.1 Go Package Structure

```go
// Package cli provides the command-line interface
package cli

// Scanner performs code scanning
type Scanner struct {
    config *config.Config
    parser parser.Parser
    rules  *ruleengine.Engine
    llm    llm.Client
}

// ScanResult contains the results of a scan
type ScanResult struct {
    ScanID     string
    Timestamp  time.Time
    Summary    Summary
    Issues     []Issue
    Performance Performance
}

// ScanOptions configures the scan operation
type ScanOptions struct {
    Path       string
    Output     Format
    Severity   Severity
    Diff       bool
    AI         bool
    Jobs       int
    Timeout    time.Duration
}
```

### 6.2 CLI Handler Signatures

```go
// Command handlers
func NewRootCmd() *cobra.Command
func NewScanCmd() *cobra.Command
func NewInitCmd() *cobra.Command
func NewConfigCmd() *cobra.Command
func NewReportCmd() *cobra.Command
func NewVersionCmd() *cobra.Command

// Scan runner
func RunScan(opts ScanOptions) (*ScanResult, error)

// Configuration
func LoadConfig(path string) (*config.Config, error)
func ValidateConfig(cfg *config.Config) error
```

---

## 7. Next Steps

1. Review CLI command design with stakeholders
2. Prototype table output format
3. Implement configuration loader
4. Create GitHub Action marketplace entry
5. Proceed to data model design (data-model.md)

---

## Metadata

- **Created**: 1/17/2026
- **Author**: Phase 3 Design Executor
- **Status**: Draft for Review
- **Related Docs**: phase3/architecture.md

---

*This API design document defines the external interfaces of the AI Code Review Tool.*
