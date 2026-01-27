# Performance Rules

> 性能和资源管理规则

## 优先级说明

| 标签 | 含义 | 处理方式 |
|------|------|----------|
| 🔴 CRITICAL | 必须遵守 | 影响系统稳定性 |
| 🟠 HIGH | 应该遵守 | 影响效率和成本 |
| 🟡 MEDIUM | 建议遵守 | 优化体验 |

---

## 🟠 HIGH: 模型选择策略 [PERF-001]

根据任务复杂度选择合适的模型：

| 模型 | 适用场景 | 成本 |
|------|---------|------|
| **Haiku** | 简单任务、高频调用、轻量 agent | 最低 |
| **Sonnet** | 主要开发、代码生成、工作流编排 | 中等 |
| **Opus** | 复杂架构决策、深度推理、研究分析 | 最高 |

### 推荐配置

```
Conductor   → Sonnet (需要全局理解)
Architect   → Opus (需要深度思考)
Builder     → Sonnet (主要编码工作)
Reviewer    → Opus (需要严谨分析)
Librarian   → Haiku (文档整理)
```

## 🔴 CRITICAL: Context Window 管理 [PERF-002]

**关键原则**：避免在 context 的最后 20% 进行复杂操作

### 高 Context 敏感任务（避免在 context 末尾）
- 大规模重构
- 跨多文件的功能实现
- 复杂交互调试

### 低 Context 敏感任务（可在任何时候）
- 单文件编辑
- 独立工具创建
- 文档更新
- 简单 bug 修复

## 🟠 HIGH: MCP 管理 [PERF-003]

**关键**：不要同时启用所有 MCP

- 200k context 可能被压缩到 70k
- 建议配置 20-30 个 MCP
- 每个项目启用不超过 10 个
- 活跃工具保持在 80 个以下

### 禁用不需要的 MCP

在项目 `settings.json` 中：

```json
{
  "disabledMcpServers": [
    "unused-mcp-1",
    "unused-mcp-2"
  ]
}
```

## 🟡 MEDIUM: 构建故障排除 [PERF-004]

构建失败时：

1. 使用 **build-error-resolver** skill
2. 分析错误信息
3. 增量修复
4. 每次修复后验证

## 🟡 MEDIUM: 复杂任务策略 [PERF-005]

对于需要深度推理的任务：

1. 使用 `ultrathink` 模式增强思考
2. 启用 **Plan Mode** 进行结构化方案
3. 多轮自我批判优化
4. 使用分角色 sub-agents 进行多角度分析

## 🔴 CRITICAL: Pre-compaction Memory Flush [PERF-006]

当 context 使用率接近上限时，**必须先保存再压缩**：

### 执行顺序

```
1. 先刷盘 → 将重要信息写入 memory/YYYY-MM-DD.md
2. 再压缩 → 让系统执行 compaction
3. 后恢复 → 读取 LATEST.md 和 memory/ 恢复上下文
```

### 触发信号

| 信号 | 阈值 | 动作 |
|------|------|------|
| 对话轮数 | > 15 轮 | 主动总结写入 |
| 工具调用 | > 30 次 | 记录关键结果 |
| 文件修改 | > 10 个 | 记录修改清单 |
| 系统提示 | 即将 compact | 立即 flush |

### 保存内容优先级

```
1. 未完成任务状态 (最高)
2. 关键决策及理由
3. 用户新偏好
4. 技术约束发现
5. 调试线索 (最低)
```

### 恢复流程

```bash
# 压缩后恢复上下文
1. 读取 .claude/handoffs/LATEST.md
2. 读取 .claude/memory/今日.md
3. 读取 .claude/memory/昨日.md
4. 继续任务
```
