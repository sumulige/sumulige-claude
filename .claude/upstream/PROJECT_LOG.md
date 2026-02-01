# 项目历史日志

> 记录重大决策、架构变更和版本里程碑
> 按时间倒序排列

---

## 2026-01-27 - v1.11.0 封版审计

### 背景
准备封版发布前，进行全面的任务流转系统审计。

### 发现的问题
1. **P0: Hook 配置多源冲突** - hook-dispatcher.cjs 硬编码与 hook-registry.json 不同步
2. **P0: 断裂依赖** - strategic-compact 依赖已弃用模块
3. **P0: 配置引用弃用 hook** - settings.local.json 引用 conversation-recorder
4. **P1: current.md 未激活** - 仅占位符内容

### 执行修复
- 同步 hook-dispatcher.cjs 与 hook-registry.json
- 禁用 strategic-compact 和 handoff-loader
- 清理 settings.local.json 中的弃用引用
- 增强 memory-saver.cjs 生成丰富的 current.md

### 架构决策
- **单一真值源**: hook-registry.json 作为 hook 配置的唯一来源
- **双层记忆**: memory/current.md (持久状态) + memory/YYYY-MM-DD.md (日志)
- **双轨任务**: development/todos/ (跨会话) + TodoWrite (会话内)

---

## 2026-01-27 - Hooks 优化

### 变更
- 活跃 hooks: 27 → 18 (-33%)
- 移动 9 个冗余 hooks 到 `_deprecated/`
- 合并 handoff-loader 到 auto-handoff.cjs

### 弃用的 Hooks
- session-save.cjs (replaced by memory-saver)
- session-restore.cjs (replaced by memory-loader)
- conversation-logger.cjs (replaced by conversation-recorder)
- conversation-recorder.cjs (功能边缘)
- context-analyzer.cjs (仅 strategic-compact 使用)
- priority-scorer.cjs (仅 strategic-compact 使用)
- code-tracer.cjs (功能边缘)
- strategic-compact.cjs (依赖已弃用)
- handoff-loader.cjs (merged into auto-handoff)

---

## 2026-01-27 - 记忆系统简化

### 变更
- 存储位置: 5 处 → 2 处
- 删除 MEMORY.md (迁移到 memory/current.md)
- 减少 session 归档: 20 个 → 5 个

### 新架构
```
.claude/
├── memory/
│   ├── current.md        # 主要状态 (替代 MEMORY.md)
│   └── YYYY-MM-DD.md     # 按日归档 (保留 14 天)
└── handoffs/
    └── LATEST.md         # 压缩快照 (< 2h 有效)
```

---

## 2026-01-14 - SMC 系统初始化

### 背景
项目 `.claude/` 目录缺少对话历史追踪系统。

### 执行
1. 同步 hooks/ - 10 个自动化脚本
2. 同步 thinking-routes/ - 对话流数据目录
3. 同步 commands/ - 9 个技能命令定义
4. 创建核心记忆文件

### 结果
- 完整的对话历史追踪系统上线
- 支持多会话并行管理
- 自动记录对话流数据

---

## 版本历史

| 版本 | 日期 | 主要变更 |
|------|------|---------|
| v1.11.0 | 2026-01-27 | Hook 配置统一, 技术债清理, 记忆系统增强 |
| v1.10.2 | 2026-01-26 | CHANGELOG 版本检查, SEO 优化 skill |
| v1.10.1 | 2026-01-26 | 清理测试产物 |
| v1.10.0 | 2026-01-25 | 添加 Windsurf + Antigravity 平台支持 |
| v1.7.5 | 2026-01-20 | 双层记忆系统 |
| v1.6.0 | 2026-01-15 | OpenAI Codex CLI 兼容支持 |
| v1.0.0 | 2026-01-14 | 初始发布 |

---

## 关键决策记录

### D001: 采用双层记忆架构
- **日期**: 2026-01-20
- **决策**: 分离短期日志 (daily) 和长期状态 (current)
- **理由**: 减少信息冗余，提高检索效率
- **影响**: 需要同时维护两套加载/保存逻辑

### D002: Hook 中央调度器模式
- **日期**: 2026-01-14
- **决策**: 使用 hook-dispatcher.cjs 统一管理所有 hooks
- **理由**: 避免冗余执行，支持防抖和条件执行
- **影响**: 所有 hooks 需要在 registry 中注册

### D003: 双轨任务系统
- **日期**: 2026-01-27
- **决策**: 保留 development/todos/ + TodoWrite 并行
- **理由**: 两者互补，todos/ 用于跨会话，TodoWrite 用于会话内
- **影响**: 需要在文档中明确使用场景
