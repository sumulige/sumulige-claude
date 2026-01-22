# Performance Rules

> 性能和资源管理规则

## 模型选择策略

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

## Context Window 管理

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

## MCP 管理

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

## 构建故障排除

构建失败时：

1. 使用 **build-error-resolver** skill
2. 分析错误信息
3. 增量修复
4. 每次修复后验证

## 复杂任务策略

对于需要深度推理的任务：

1. 使用 `ultrathink` 模式增强思考
2. 启用 **Plan Mode** 进行结构化方案
3. 多轮自我批判优化
4. 使用分角色 sub-agents 进行多角度分析
