# Phase 1 E2E Test Cases

> **版本**: 1.0
> **日期**: 2026-01-17
> **状态**: 🚧 进行中

---

## 测试概述

本文档定义了 Phase 1（项目立项阶段）的端到端测试用例。

### 测试范围

| 模块 | 测试内容 |
|------|----------|
| Workflow CLI | 项目创建、状态查询、验证、列表 |
| Knowledge Engine | 添加文档、查询、缓存管理 |
| Quality Gates | 可行性报告质量检查 |

---

## TC-001: 基础工作流流程

### 描述
验证从用户输入想法到生成可行性报告的完整流程。

### 前置条件
- CLI 已安装 (`npm link`)
- 开发目录存在

### 测试步骤

```bash
# 1. 创建新项目
smc workflow start "构建一个个人博客系统"

# 2. 检查项目目录是否创建
ls development/projects/

# 3. 检查可行性报告是否生成
ls development/projects/<project-id>/phase1/feasibility-report.md

# 4. 查看报告内容
cat development/projects/<project-id>/phase1/feasibility-report.md
```

### 预期结果

| 步骤 | 预期输出 |
|------|----------|
| 1 | `✅ Created project: <project-id>` |
| 2 | 项目目录存在 |
| 3 | `feasibility-report.md` 文件存在 |
| 4 | 报告包含以下章节：<br>- # 可行性分析报告<br>- ## 需求概述<br>- ## 关联发现<br>- ## 业界最佳实践<br>- ## 可行性评估<br>- ## 建议 |

### 实际结果
_(测试后填写)_

### 状态
- [ ] 通过
- [ ] 失败

---

## TC-002: 工作流状态查询

### 描述
验证 `smc workflow status` 命令正确显示当前工作流状态。

### 前置条件
- 至少有一个项目已创建

### 测试步骤

```bash
# 1. 查询工作流状态
smc workflow status

# 2. 验证输出包含项目列表
```

### 预期结果

| 字段 | 说明 |
|------|------|
| Project ID | 项目唯一标识符 |
| Phase | 当前阶段 (phase1) |
| Status | 状态 (draft/review/completed) |
| Created | 创建时间 |

### 实际结果
_(测试后填写)_

### 状态
- [ ] 通过
- [ ] 失败

---

## TC-003: 质量门控验证

### 描述
验证可行性报告质量检查功能。

### 前置条件
- 可行性报告已生成

### 测试步骤

```bash
# 1. 验证报告
smc workflow validate development/projects/<id>/phase1/feasibility-report.md

# 2. 创建一个不完整的报告进行测试
cat > /tmp/incomplete.md << 'EOF'
# 不完整的报告

这里什么都没有。
EOF

smc workflow validate /tmp/incomplete.md
```

### 预期结果

| 场景 | 预期输出 |
|------|----------|
| 完整报告 | `✅ PASSED` - 6项检查全部通过 |
| 不完整报告 | `❌ BLOCKER` - 列出缺失的字段 |

### 质量门控检查项

1. **需求概述** (hasRequirementSummary) - 报告是否有明确的需求概述
2. **关联分析** (hasCorrelationAnalysis) - 是否有关联发现内容
3. **最佳实践** (hasBestPractices) - 是否引用业界最佳实践
4. **可行性结论** (hasFeasibilityConclusion) - 是否有明确的可行性评估
5. **时间预估** (hasTimeEstimate) - 是否有预估时间
6. **风险评估** (hasRiskAssessment) - 是否有风险点分析

### 实际结果
_(测试后填写)_

### 状态
- [ ] 通过
- [ ] 失败

---

## TC-004: 知识库 - 添加文档

### 描述
验证向知识库添加本地文档的功能。

### 前置条件
- 有一个 Markdown 文件

### 测试步骤

```bash
# 1. 添加单个文件
smc knowledge add ./docs/best-practices.md

# 2. 添加整个目录
smc knowledge add ./development/knowledge-base/

# 3. 列出知识源
smc knowledge list
```

### 预期结果

| 步骤 | 预期输出 |
|------|----------|
| 1 | `✅ Added: best-practices.md (1234 words, 5 headings)` |
| 2 | 显示所有已索引的文件 |
| 3 | 列出所有知识源，包含标题、标签、类型 |

### 状态
- [ ] 通过
- [ ] 失败

---

## TC-005: 知识库 - 查询

### 描述
验证从知识库查询相关信息的功能。

### 前置条件
- 知识库中已有文档

### 测试步骤

```bash
# 1. 简单查询
smc knowledge query "API设计"

# 2. 带标签过滤
smc knowledge query "REST" --tags architecture

# 3. 网络搜索
smc knowledge query --web "React 19 new features"
```

### 预期结果

| 步骤 | 预期输出 |
|------|----------|
| 1 | 返回相关文档，按相关性排序 |
| 2 | 只返回带 architecture 标签的结果 |
| 3 | 返回网络搜索结果 + 本地结果 |

### 相关性评分算法

```
总分 = 标题匹配(35%) + 标签匹配(25%) + 内容匹配(30%) + 标题匹配(10%)
```

### 状态
- [ ] 通过
- [ ] 失败

---

## TC-006: 知识库 - 缓存管理

### 描述
验证网络搜索结果缓存功能。

### 前置条件
- 已执行过网络搜索

### 测试步骤

```bash
# 1. 查看缓存统计
smc knowledge cache stats

# 2. 执行搜索
smc knowledge query --web "test query"

# 3. 再次查看缓存
smc knowledge cache stats

# 4. 清理过期缓存
smc knowledge cache clean

# 5. 清空所有缓存
smc knowledge cache clear
```

### 预期结果

| 步骤 | 预期输出 |
|------|----------|
| 1 | 缓存条目数、有效条目数、总大小 |
| 2 | 第一次搜索，从网络获取 |
| 3 | 缓存条目 +1 |
| 4 | 删除过期条目 |
| 5 | 所有缓存被清空 |

### 缓存配置

| 参数 | 值 |
|------|-----|
| TTL | 24 小时 |
| 存储路径 | `development/cache/web-search/` |
| 键格式 | `search_{md5(query)}.json` |

### 状态
- [ ] 通过
- [ ] 失败

---

## TC-007: 增量索引更新

### 描述
验证文件修改后自动更新索引的功能。

### 前置条件
- 文件已添加到知识库

### 测试步骤

```bash
# 1. 修改已索引的文件
echo "## 新章节" >> ./docs/best-practices.md

# 2. 更新索引
smc knowledge update

# 3. 查询新内容
smc knowledge query "新章节"
```

### 预期结果

| 步骤 | 预期输出 |
|------|----------|
| 1 | 文件修改时间更新 |
| 2 | 检测到变化并重新索引 |
| 3 | 返回包含新内容的结果 |

### 状态
- [ ] 通过
- [ ] 失败

---

## TC-008: NotebookLM 集成

### 描述
验证 NotebookLM 浏览器自动化集成。

### 前置条件
- NotebookLM 账号已认证

### 测试步骤

```bash
# 1. 检查认证状态
smc notebooklm status

# 2. 如果未认证，执行认证
smc notebooklm auth

# 3. 提问
smc notebooklm ask "什么是好教练" <notebook_url>

# 4. 清理会话
smc notebooklm clear
```

### 预期结果

| 步骤 | 预期输出 |
|------|----------|
| 1 | 显示认证状态和会话信息 |
| 2 | 浏览器打开，等待用户登录 |
| 3 | 流式返回 NotebookLM 回答 |
| 4 | 会话已清除 |

### 状态
- [ ] 通过
- [ ] 失败
- [ ] 跳过 (无 NotebookLM 访问权限)

---

## 测试执行记录

### 测试环境

| 项目 | 值 |
|------|-----|
| 操作系统 | macOS Darwin 23.6.0 |
| Node.js 版本 | _(填写)_ |
| CLI 版本 | 1.1.2 |

### 执行日期
_(测试执行时填写)_

### 结果汇总

| 用例编号 | 用例名称 | 状态 | 备注 |
|----------|----------|------|------|
| TC-001 | 基础工作流流程 | | |
| TC-002 | 工作流状态查询 | | |
| TC-003 | 质量门控验证 | | |
| TC-004 | 知识库 - 添加文档 | | |
| TC-005 | 知识库 - 查询 | | |
| TC-006 | 知识库 - 缓存管理 | | |
| TC-007 | 增量索引更新 | | |
| TC-008 | NotebookLM 集成 | | |

### 通过率
_(测试完成后计算)_

---

## 问题追踪

### 发现的问题

| ID | 描述 | 严重性 | 状态 |
|----|------|--------|------|
| | | | |

### 严重性级别

- **P0** - 阻塞性问题，无法继续
- **P1** - 严重问题，影响核心功能
- **P2** - 一般问题，有绕过方案
- **P3** - 轻微问题，不影响使用

---

## 附录

### 快速测试命令

```bash
# 一键执行所有基础测试
bash tests/manual/phase1-e2e.sh

# 单独测试工作流
smc workflow start "测试项目"
smc workflow status
smc workflow validate $(ls -t development/projects/*/phase1/feasibility-report.md | head -1)

# 单独测试知识库
smc knowledge add ./README.md
smc knowledge query "cli"
smc knowledge cache stats
```
