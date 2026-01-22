# Data Model Design Document

**Project**: proj_mkh8zddd_dhamf (AI 代码审查工具)
**Date**: 1/17/2026
**Phase**: 3 - Planning
**Status**: In Progress

---

## Executive Summary

本文档定义 AI 代码审查工具的核心数据结构，包括 Issue 模型、ScanResult 数据结构和报告格式。

**设计原则**:
- **类型安全**: Go 结构体定义清晰的类型
- **可序列化**: 支持 JSON/YAML 序列化
- **可扩展**: 预留扩展字段
- **向后兼容**: 新字段不影响旧版本

---

## 1. Core Data Types

### 1.1 Severity Levels

```go
// Severity represents the severity level of an issue
type Severity string

const (
    SeverityCritical Severity = "critical"
    SeverityHigh     Severity = "high"
    SeverityMedium   Severity = "medium"
    SeverityLow      Severity = "low"
    SeverityInfo     Severity = "info"
)

// Order returns the numeric ordering for comparison
func (s Severity) Order() int {
    switch s {
    case SeverityCritical:
        return 4
    case SeverityHigh:
        return 3
    case SeverityMedium:
        return 2
    case SeverityLow:
        return 1
    case SeverityInfo:
        return 0
    default:
        return -1
    }
}

// Color returns the terminal color for this severity
func (s Severity) Color() string {
    switch s {
    case SeverityCritical:
        return "red"
    case SeverityHigh:
        return "lightRed"
    case SeverityMedium:
        return "yellow"
    case SeverityLow:
        return "lightBlue"
    case SeverityInfo:
        return "blue"
    default:
        return "white"
    }
}
```

### 1.2 Issue Categories

```go
// Category represents the type of issue
type Category string

const (
    CategorySecurity   Category = "security"
    CategoryQuality    Category = "quality"
    CategoryPerformance Category = "performance"
    CategoryStyle      Category = "style"
    CategoryDocumentation Category = "documentation"
)
```

### 1.3 Confidence Levels

```go
// Confidence represents the confidence level of the detection
type Confidence string

const (
    ConfidenceHigh   Confidence = "high"
    ConfidenceMedium Confidence = "medium"
    ConfidenceLow    Confidence = "low"
)
```

### 1.4 Language Support

```go
// Language represents supported programming languages
type Language string

const (
    LanguagePython     Language = "python"
    LanguageJavaScript Language = "javascript"
    LanguageTypeScript Language = "typescript"
    LanguageJSX        Language = "jsx"
    LanguageTSX        Language = "tsx"
)

// Extension returns the common file extension for this language
func (l Language) Extension() string {
    switch l {
    case LanguagePython:
        return ".py"
    case LanguageJavaScript:
        return ".js"
    case LanguageTypeScript:
        return ".ts"
    case LanguageJSX:
        return ".jsx"
    case LanguageTSX:
        return ".tsx"
    default:
        return ""
    }
}
```

---

## 2. Issue Data Model

### 2.1 Issue Structure

```go
// Issue represents a single code issue found during scanning
type Issue struct {
    // Core identifiers
    ID          string    `json:"id" yaml:"id"`                     // Unique issue ID (e.g., "issue_abc123")
    RuleID      string    `json:"rule_id" yaml:"rule_id"`           // Rule that generated this issue
    ScanID      string    `json:"scan_id" yaml:"scan_id"`           // Scan that found this issue

    // Classification
    Severity    Severity  `json:"severity" yaml:"severity"`         // Issue severity
    Category    Category  `json:"category" yaml:"category"`         // Issue category
    Confidence  Confidence `json:"confidence" yaml:"confidence"`   // Detection confidence

    // Description
    Title       string    `json:"title" yaml:"title"`               // Short title
    Description string    `json:"description" yaml:"description"`   // Detailed description
    Message     string    `json:"message" yaml:"message"`           // Formatted message for display

    // Location
    File        string    `json:"file" yaml:"file"`                 // Relative file path
    Line        int       `json:"line" yaml:"line"`                 // Start line (1-indexed)
    Column      int       `json:"column" yaml:"column"`             // Start column (1-indexed)
    EndLine     int       `json:"end_line" yaml:"end_line"`         // End line
    EndColumn   int       `json:"end_column" yaml:"end_column"`     // End column

    // Code context
    CodeSnippet string    `json:"code_snippet,omitempty" yaml:"code_snippet,omitempty"`
    ContextBefore []string `json:"context_before,omitempty" yaml:"context_before,omitempty"`
    ContextAfter  []string `json:"context_after,omitempty" yaml:"context_after,omitempty"`

    // Fix suggestions
    Suggestion      string   `json:"suggestion,omitempty" yaml:"suggestion,omitempty"`
    SuggestedCode   string   `json:"suggested_code,omitempty" yaml:"suggested_code,omitempty"`
    Fixable         bool     `json:"fixable" yaml:"fixable"`
    AutoFixAvailable bool    `json:"auto_fix_available,omitempty" yaml:"auto_fix_available,omitempty"`

    // References
    References      []string `json:"references,omitempty" yaml:"references,omitempty"`
    CWE             string   `json:"cwe,omitempty" yaml:"cwe,omitempty"`           // CWE ID if applicable
    OWASP           string   `json:"owasp,omitempty" yaml:"owasp,omitempty"`       // OWASP category if applicable

    // Metadata
    Language        Language `json:"language,omitempty" yaml:"language,omitempty"`
    AIEnhanced      bool     `json:"ai_enhanced" yaml:"ai_enhanced"`
    AIModel         string   `json:"ai_model,omitempty" yaml:"ai_model,omitempty"`
    CreatedAt       time.Time `json:"created_at" yaml:"created_at"`

    // Extension fields
    Extra           map[string]interface{} `json:"extra,omitempty" yaml:"extra,omitempty"`
}
```

### 2.2 Issue Methods

```go
// LocationString returns a formatted location string
func (i *Issue) LocationString() string {
    if i.EndLine > i.Line {
        return fmt.Sprintf("%s:%d-%d", i.File, i.Line, i.EndLine)
    }
    return fmt.Sprintf("%s:%d", i.File, i.Line)
}

// FullLocationString returns a detailed location string
func (i *Issue) FullLocationString() string {
    return fmt.Sprintf("%s:%d:%d", i.File, i.Line, i.Column)
}

// String returns a formatted string representation
func (i *Issue) String() string {
    return fmt.Sprintf("[%s] %s: %s",
        strings.ToUpper(string(i.Severity)),
        i.FullLocationString(),
        i.Title,
    )
}

// IsSecurity returns true if this is a security issue
func (i *Issue) IsSecurity() bool {
    return i.Category == CategorySecurity
}

// Hash returns a deterministic hash for deduplication
func (i *Issue) Hash() string {
    data := fmt.Sprintf("%s:%s:%d:%d",
        i.RuleID,
        i.File,
        i.Line,
        i.Column,
    )
    return fmt.Sprintf("%x", sha256.Sum256([]byte(data)))
}
```

### 2.3 Issue Collection

```go
// Issues is a collection of issues with utility methods
type Issues []Issue

// FilterBySeverity returns issues with severity >= min
func (is Issues) FilterBySeverity(min Severity) Issues {
    var result Issues
    for _, issue := range is {
        if issue.Severity.Order() >= min.Order() {
            result = append(result, issue)
        }
    }
    return result
}

// FilterByCategory returns issues in the specified category
func (is Issues) FilterByCategory(cat Category) Issues {
    var result Issues
    for _, issue := range is {
        if issue.Category == cat {
            result = append(result, issue)
        }
    }
    return result
}

// FilterByFile returns issues in the specified file
func (is Issues) FilterByFile(file string) Issues {
    var result Issues
    for _, issue := range is {
        if issue.File == file {
            result = append(result, issue)
        }
    }
    return result
}

// BySeverity sorts issues by severity (highest first)
func (is Issues) BySeverity() Issues {
    sorted := make(Issues, len(is))
    copy(sorted, is)
    sort.Slice(sorted, func(i, j int) bool {
        return sorted[i].Severity.Order() > sorted[j].Severity.Order()
    })
    return sorted
}

// GroupByFile groups issues by file
func (is Issues) GroupByFile() map[string]Issues {
    result := make(map[string]Issues)
    for _, issue := range is {
        result[issue.File] = append(result[issue.File], issue)
    }
    return result
}

// Deduplicate removes duplicate issues based on hash
func (is Issues) Deduplicate() Issues {
    seen := make(map[string]bool)
    var result Issues
    for _, issue := range is {
        hash := issue.Hash()
        if !seen[hash] {
            seen[hash] = true
            result = append(result, issue)
        }
    }
    return result
}
```

---

## 3. ScanResult Data Structure

### 3.1 ScanResult Structure

```go
// ScanResult represents the complete results of a code scan
type ScanResult struct {
    // Scan metadata
    ScanID      string             `json:"scan_id" yaml:"scan_id"`
    Version     string             `json:"version" yaml:"version"`           // Tool version
    Timestamp   time.Time          `json:"timestamp" yaml:"timestamp"`
    Duration    time.Duration      `json:"duration" yaml:"duration"`

    // Scan configuration
    Config      ScanConfig         `json:"config,omitempty" yaml:"config,omitempty"`

    // Files scanned
    FilesScanned int               `json:"files_scanned" yaml:"files_scanned"`
    FilesSkipped int               `json:"files_skipped" yaml:"files_skipped"`
    Files        []FileResult      `json:"files,omitempty" yaml:"files,omitempty"`

    // Issues
    Issues      Issues             `json:"issues" yaml:"issues"`
    Summary     IssueSummary       `json:"summary" yaml:"summary"`

    // Performance metrics
    Performance PerformanceMetrics `json:"performance" yaml:"performance"`

    // AI usage (if applicable)
    AIUsage     *AIUsage           `json:"ai_usage,omitempty" yaml:"ai_usage,omitempty"`

    // Extension fields
    Extra       map[string]interface{} `json:"extra,omitempty" yaml:"extra,omitempty"`
}
```

### 3.2 Scan Configuration Snapshot

```go
// ScanConfig captures the configuration used for a scan
type ScanConfig struct {
    Path         string      `json:"path" yaml:"path"`
    Include      []string    `json:"include,omitempty" yaml:"include,omitempty"`
    Exclude      []string    `json:"exclude,omitempty" yaml:"exclude,omitempty"`
    MinSeverity  Severity    `json:"min_severity" yaml:"min_severity"`
    Recursive    bool        `json:"recursive" yaml:"recursive"`
    DiffMode     bool        `json:"diff_mode" yaml:"diff_mode"`
    AIEnabled    bool        `json:"ai_enabled" yaml:"ai_enabled"`
    Jobs         int         `json:"jobs" yaml:"jobs"`
    RulesEnabled []string    `json:"rules_enabled,omitempty" yaml:"rules_enabled,omitempty"`
}
```

### 3.3 File Result

```go
// FileResult represents the scan result for a single file
type FileResult struct {
    Path        string   `json:"path" yaml:"path"`
    Language    Language `json:"language" yaml:"language"`
    Lines       int      `json:"lines" yaml:"lines"`
    Issues      Issues   `json:"issues" yaml:"issues"`
    Error       string   `json:"error,omitempty" yaml:"error,omitempty"`
    Skipped     bool     `json:"skipped" yaml:"skipped"`
    SkipReason  string   `json:"skip_reason,omitempty" yaml:"skip_reason,omitempty"`
}
```

### 3.4 Issue Summary

```go
// IssueSummary provides a summary of issues found
type IssueSummary struct {
    Total        int                `json:"total" yaml:"total"`
    BySeverity   map[Severity]int   `json:"by_severity" yaml:"by_severity"`
    ByCategory   map[Category]int   `json:"by_category" yaml:"by_category"`
    ByRule       map[string]int     `json:"by_rule,omitempty" yaml:"by_rule,omitempty"`
    ByFile       map[string]int     `json:"by_file,omitempty" yaml:"by_file,omitempty"`
}

// NewIssueSummary creates a summary from a list of issues
func NewIssueSummary(issues Issues) IssueSummary {
    summary := IssueSummary{
        Total:      len(issues),
        BySeverity: make(map[Severity]int),
        ByCategory: make(map[Category]int),
        ByRule:     make(map[string]int),
        ByFile:     make(map[string]int),
    }

    for _, issue := range issues {
        summary.BySeverity[issue.Severity]++
        summary.ByCategory[issue.Category]++
        summary.ByRule[issue.RuleID]++
        summary.ByFile[issue.File]++
    }

    return summary
}
```

### 3.5 Performance Metrics

```go
// PerformanceMetrics captures scan performance data
type PerformanceMetrics struct {
    // Timing
    TotalDuration      time.Duration `json:"total_duration" yaml:"total_duration"`
    ParseDuration      time.Duration `json:"parse_duration" yaml:"parse_duration"`
    RuleDuration       time.Duration `json:"rule_duration" yaml:"rule_duration"`
    LLMDuration        time.Duration `json:"llm_duration,omitempty" yaml:"llm_duration,omitempty"`

    // Throughput
    FilesPerSecond     float64       `json:"files_per_second" yaml:"files_per_second"`
    LinesPerSecond     float64       `json:"lines_per_second" yaml:"lines_per_second"`
    IssuesPerSecond    float64       `json:"issues_per_second" yaml:"issues_per_second"`

    // Cache effectiveness
    CacheHitRate       float64       `json:"cache_hit_rate" yaml:"cache_hit_rate"`

    // Resource usage
    MemoryUsedMB       int64         `json:"memory_used_mb" yaml:"memory_used_mb"`
    CPUUsagePercent    float64       `json:"cpu_usage_percent,omitempty" yaml:"cpu_usage_percent,omitempty"`
}
```

### 3.6 AI Usage

```go
// AIUsage captures AI-related usage data
type AIUsage struct {
    Enabled            bool    `json:"enabled" yaml:"enabled"`
    Provider           string  `json:"provider" yaml:"provider"`
    Model              string  `json:"model" yaml:"model"`

    // API calls
    TotalRequests      int     `json:"total_requests" yaml:"total_requests"`
    SuccessfulRequests int     `json:"successful_requests" yaml:"successful_requests"`
    FailedRequests     int     `json:"failed_requests" yaml:"failed_requests"`

    // Tokens
    TotalTokens        int     `json:"total_tokens" yaml:"total_tokens"`
    InputTokens        int     `json:"input_tokens" yaml:"input_tokens"`
    OutputTokens       int     `json:"output_tokens" yaml:"output_tokens"`

    // Cost
    EstimatedCostUSD   float64 `json:"estimated_cost_usd" yaml:"estimated_cost_usd"`

    // Issues enhanced by AI
    IssuesEnhanced     int     `json:"issues_enhanced" yaml:"issues_enhanced"`
    IssuesFound        int     `json:"issues_found" yaml:"issues_found"`
}
```

---

## 4. Report Formats

### 4.1 Report Metadata

```go
// ReportMetadata contains metadata about a report
type ReportMetadata struct {
    GeneratedAt   time.Time  `json:"generated_at" yaml:"generated_at"`
    GeneratedBy   string     `json:"generated_by" yaml:"generated_by"`   // Tool version
    ScanID        string     `json:"scan_id" yaml:"scan_id"`
    ProjectPath   string     `json:"project_path" yaml:"project_path"`
    GitBranch     string     `json:"git_branch,omitempty" yaml:"git_branch,omitempty"`
    GitCommit     string     `json:"git_commit,omitempty" yaml:"git_commit,omitempty"`
}
```

### 4.2 Trend Report

```go
// TrendReport shows quality trends over time
type TrendReport struct {
    Metadata     ReportMetadata    `json:"metadata" yaml:"metadata"`
    Period       Period            `json:"period" yaml:"period"`
    Current      Snapshot          `json:"current" yaml:"current"`
    Previous     Snapshot          `json:"previous" yaml:"previous"`
    Delta        TrendDelta        `json:"delta" yaml:"delta"`
    History      []Snapshot        `json:"history,omitempty" yaml:"history,omitempty"`
}

// Period defines the time period for the trend report
type Period struct {
    Start        time.Time         `json:"start" yaml:"start"`
    End          time.Time         `json:"end" yaml:"end"`
    Days         int               `json:"days" yaml:"days"`
}

// Snapshot represents a point-in-time state
type Snapshot struct {
    Date         time.Time         `json:"date" yaml:"date"`
    ScanID       string            `json:"scan_id" yaml:"scan_id"`
    Summary      IssueSummary      `json:"summary" yaml:"summary"`
    Files        int               `json:"files" yaml:"files"`
    Lines        int               `json:"lines" yaml:"lines"`
}

// TrendDelta shows changes between snapshots
type TrendDelta struct {
    TotalIssues     int            `json:"total_issues" yaml:"total_issues"`
    CriticalDelta   int            `json:"critical_delta" yaml:"critical_delta"`
    HighDelta       int            `json:"high_delta" yaml:"high_delta"`
    MediumDelta     int            `json:"medium_delta" yaml:"medium_delta"`
    LowDelta        int            `json:"low_delta" yaml:"low_delta"`
    PercentChange   float64        `json:"percent_change" yaml:"percent_change"`
    Direction       string         `json:"direction" yaml:"direction"` // "up", "down", "same"
}
```

### 4.3 SARIF Report

```go
// SARIFReport is the Static Analysis Results Interchange Format
// See: https://sarifweb.azurewebsites.net/
type SARIFReport struct {
    Version string       `json:"version"`
    Schema  string       `json:"$schema"`
    Runs    []SARIFRun   `json:"runs"`
}

type SARIFRun struct {
    Tool       SARIFTool      `json:"tool"`
    Results    []SARIFResult  `json:"results"`
    Invocations []SARIFInvocation `json:"invocations,omitempty"`
}

type SARIFTool struct {
    Driver SARIFToolDriver `json:"driver"`
}

type SARIFToolDriver struct {
    Name            string            `json:"name"`
    Version         string            `json:"version"`
    InformationURI  string            `json:"informationUri,omitempty"`
    Rules           []SARIFRule       `json:"rules,omitempty"`
}

type SARIFRule struct {
    ID              string            `json:"id"`
    Name            string            `json:"name,omitempty"`
    ShortDescription SARIFMessage     `json:"shortDescription"`
    FullDescription SARIFMessage     `json:"fullDescription,omitempty"`
    HelpURI         string            `json:"helpUri,omitempty"`
    Properties      map[string]interface{} `json:"properties,omitempty"`
}

type SARIFResult struct {
    RuleID    string           `json:"ruleId"`
    Level     string           `json:"level"` // error, warning, note
    Message   SARIFMessage     `json:"message"`
    Locations []SARIFLocation  `json:"locations"`
    Fixes     []SARIFFix       `json:"fixes,omitempty"`
}

type SARIFMessage struct {
    Text     string `json:"text"`
    Markdown string `json:"markdown,omitempty"`
}

type SARIFLocation struct {
    PhysicalLocation SARIFPhysicalLocation `json:"physicalLocation"`
    LogicalLocations  []SARIFLogicalLocation `json:"logicalLocations,omitempty"`
}

type SARIFPhysicalLocation struct {
    ArtifactLocation SARIFArtifactLocation `json:"artifactLocation"`
    Region           SARIFRegion           `json:"region"`
}

type SARIFArtifactLocation struct {
    URI string `json:"uri"`
}

type SARIFRegion struct {
    StartLine   int `json:"startLine"`
    StartColumn int `json:"startColumn,omitempty"`
    EndLine     int `json:"endLine,omitempty"`
    EndColumn   int `json:"endColumn,omitempty"`
    Snippet     SARIFSnippet `json:"snippet,omitempty"`
}

type SARIFSnippet struct {
    Text string `json:"text"`
}

type SARIFLogicalLocation struct {
    Name       string `json:"name,omitempty"`
    Kind       string `json:"kind,omitempty"` // function, module, etc.
}

type SARIFFix struct {
    Description SARIFMessage `json:"description"`
    ArtifactChanges []SARIFArtifactChange `json:"artifactChanges"`
}

type SARIFArtifactChange struct {
    ArtifactLocation SARIFArtifactLocation `json:"artifactLocation"`
    Replacements      []SARIFReplacement   `json:"replacements"`
}

type SARIFReplacement struct {
    DeletedRegion SARIFRegion `json:"deletedRegion"`
    InsertedContent SARIFContent `json:"insertedContent"`
}

type SARIFContent struct {
    Text string `json:"text"`
}

type SARIFInvocation struct {
    StartTimeUTC     string `json:"startTimeUtc,omitempty"`
    EndTimeUTC       string `json:"endTimeUtc,omitempty"`
    ExitStatus       string `json:"exitStatus,omitempty"`
    ExitStatusCode   int    `json:"exitStatusCode,omitempty"`
}
```

---

## 5. Database Schema

### 5.1 Scans Table

```sql
CREATE TABLE scans (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id         VARCHAR(255) UNIQUE NOT NULL,
    timestamp       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    duration_ms     INTEGER NOT NULL,
    config          JSONB NOT NULL,

    -- File counts
    files_scanned   INTEGER NOT NULL DEFAULT 0,
    files_skipped   INTEGER NOT NULL DEFAULT 0,

    -- Issue summary
    total_issues    INTEGER NOT NULL DEFAULT 0,
    critical_issues INTEGER NOT NULL DEFAULT 0,
    high_issues     INTEGER NOT NULL DEFAULT 0,
    medium_issues   INTEGER NOT NULL DEFAULT 0,
    low_issues      INTEGER NOT NULL DEFAULT 0,

    -- Performance
    performance     JSONB,

    -- AI usage
    ai_enabled      BOOLEAN NOT NULL DEFAULT false,
    ai_usage        JSONB,

    -- Git context
    git_branch      VARCHAR(255),
    git_commit      VARCHAR(40),

    -- Metadata
    project_path    VARCHAR(1024),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Indexes
    INDEX idx_scans_timestamp (timestamp),
    INDEX idx_scans_project (project_path)
);
```

### 5.2 Issues Table

```sql
CREATE TABLE issues (
    id              BIGSERIAL PRIMARY KEY,
    issue_id        VARCHAR(255) UNIQUE NOT NULL,
    scan_id         VARCHAR(255) NOT NULL REFERENCES scans(scan_id),

    -- Classification
    rule_id         VARCHAR(255) NOT NULL,
    severity        VARCHAR(50) NOT NULL,
    category        VARCHAR(50) NOT NULL,
    confidence      VARCHAR(50),

    -- Location
    file_path       VARCHAR(1024) NOT NULL,
    line_number     INTEGER NOT NULL,
    column_number   INTEGER,
    end_line        INTEGER,
    end_column      INTEGER,

    -- Description
    title           VARCHAR(512) NOT NULL,
    description     TEXT,
    message         TEXT,

    -- Code context
    code_snippet    TEXT,
    suggestion      TEXT,
    suggested_code  TEXT,
    fixable         BOOLEAN DEFAULT false,

    -- References
    references      JSONB,
    cwe             VARCHAR(20),
    owasp           VARCHAR(100),

    -- AI
    ai_enhanced     BOOLEAN DEFAULT false,
    ai_model        VARCHAR(100),

    -- Metadata
    language        VARCHAR(50),
    extra           JSONB,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Indexes
    INDEX idx_issues_scan (scan_id),
    INDEX idx_issues_file (file_path),
    INDEX idx_issues_severity (severity),
    INDEX idx_issues_rule (rule_id)
);
```

### 5.3 Rules Table

```sql
CREATE TABLE rules (
    id              SERIAL PRIMARY KEY,
    rule_id         VARCHAR(255) UNIQUE NOT NULL,
    name            VARCHAR(255) NOT NULL,
    category        VARCHAR(50) NOT NULL,
    default_severity VARCHAR(50) NOT NULL,

    -- Definition
    definition      JSONB NOT NULL,
    languages       VARCHAR(50) [],

    -- Configuration
    enabled         BOOLEAN DEFAULT true,
    custom          BOOLEAN DEFAULT false,

    -- Documentation
    title           VARCHAR(512),
    description     TEXT,
    references      JSONB,

    -- Metadata
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

### 5.4 Scan History View

```sql
CREATE VIEW scan_history AS
SELECT
    date_trunc('day', timestamp) AS date,
    COUNT(*) AS scan_count,
    AVG(total_issues) AS avg_issues,
    AVG(duration_ms) AS avg_duration_ms,
    SUM(total_issues) AS total_issues,
    AVG(critical_issues) AS avg_critical,
    AVG(high_issues) AS avg_high,
    AVG(medium_issues) AS avg_medium,
    AVG(low_issues) AS avg_low
FROM scans
GROUP BY date_trunc('day', timestamp)
ORDER BY date DESC;
```

---

## 6. Cache Schema

### 6.1 Redis Cache Keys

``# AST Cache
ast:{language}:{file_hash} -> {
    "ast": <serialized AST>,
    "timestamp": <unix timestamp>,
    "file_size": <bytes>
}

# Rule Cache
rules:{rule_id} -> {
    "compiled": <compiled rule>,
    "timestamp": <unix timestamp>
}

# Scan Session
session:{scan_id} -> {
    "config": <scan config>,
    "start_time": <unix timestamp>,
    "files_scanned": <count>,
    "issues_found": <count>
}
```

---

## 7. Next Steps

1. Review data model with stakeholders
2. Implement Go structs
3. Create database migration scripts
4. Implement JSON/YAML serialization
5. Create unit tests for data structures
6. Proceed to work breakdown (wbs.md)

---

## Metadata

- **Created**: 1/17/2026
- **Author**: Phase 3 Design Executor
- **Status**: Draft for Review
- **Related Docs**: phase3/architecture.md, phase3/api-design.md

---

*This data model design document defines the core data structures for the AI Code Review Tool.*
