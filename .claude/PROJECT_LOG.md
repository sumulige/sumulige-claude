# 项目历史日志

> 记录重大决策、架构变更和版本里程碑
> 按时间倒序排列

---

## 2026-02-09 - Technical Co-Founder 工作流骨髓化（Always-on + 深模式）+ 测试零污染

### 背景
需要把「Technical Co-Founder」的协作方式变成默认行为：PO 保持控制权，按阶段推进，能做成可发布的成品而不是一次性原型。

### 变更
- **Always-on 协议注入**：新增 core prompt，并在 agent 路由层强制注入（所有任务默认生效）。
- **深模式 Skill**：新增 `technical-cofounder` Skill，通过关键词自动激活，仅在产品/MVP/上线/发布语境启用严格阶段门控。
- **Phase gate 规则**：`PHASE=1..5`，每次只推进一个 Phase；Phase 1/2 禁止提前输出补丁/命令/真实代码修改；每个 Phase 末尾必须 PO 确认。
- **模板同步**：同步进 `template/`，保证新项目默认具备该工作流。
- **测试零污染**：调整命令相关单测，避免触发外部安装/网络访问/写入真实 `~/.claude`，确保 `npm test` 可重复且不污染工作区。

### 结果
- cofounder 工作流成为默认执行协议（深模式按需触发）。
- `npm test` 全绿且不再产生副作用。

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
