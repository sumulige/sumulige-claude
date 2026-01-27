## 用户偏好

| 规则 | 说明 |
|------|------|
| **Push = Publish** | 每次 git push 后必须同步发布到 npm |

---

## 2026-01-27

### v1.7.2 - 双层记忆系统

**重大架构变更**: 借鉴 Clawdbot 实现双层记忆

```
.claude/
├── MEMORY.md        # 长期记忆（本文件）
└── memory/
    └── YYYY-MM-DD.md # 临时笔记（14天滚动）
```

**核心设计原则**:
- **分层存储**: 临时 vs 永久分离
- **先保存再压缩**: Pre-compaction flush
- **搜索 > 注入**: 按需检索而非全量加载

**修改的文件**:
- `.claude/CLAUDE.md` - Context 管理规则
- `.claude/rules/performance.md` - PERF-006
- `.claude/hooks/memory-loader.cjs` - 双层加载
- `.claude/hooks/memory-saver.cjs` - 日期文件 + insights

---

## 2026-01-23

### Session: 前端设计灵感 & 3D 可视化

- **主题**: 从 skills.sh 获取前端创意设计灵感
- **产出**:
  - `demos/power-3d-scatter.html` - Three.js 功率-时间-心率 3D 散点图 demo
  - 安装了 5 个设计相关 skills (web-design-guidelines, react-best-practices, threejs-fundamentals 等)

- **关联项目**: SynapseFlow / ApexOS
  - 优化路线图: `synapseflow/docs/FRONTEND_OPTIMIZATION_ROADMAP.md`

- **核心改进方向**:
  1. Typography: tabular-nums, text-wrap, 字体升级
  2. 数据可视化: 曲线动画, hover 精确值, 历史对比
  3. 3D 散点图: 接入真实数据, 区间筛选, 时间刷选
  4. 交互: URL 状态同步, focus states, loading states
  5. 品牌: 避免 AI 审美, 生成式视觉元素

- **待办**:
  - [ ] 3D 散点图接入 ApexOS 真实 FIT 数据
  - [ ] Power Duration 曲线添加绘制动画
  - [ ] iLevels 进度条动画优化

---

## 2026-01-22

### Session 2026-01-22T13:07:26.622Z

- **Duration**: 1 minutes
- **Project**: sumulige-claude
- **Memory entries**: 4
- **TODOs**: 0 active, 0 completed

# 项目增量记忆

> 记录最近变更和重要决策

---

## 2026-01-14

### 新增
- **SMC 对话历史系统** - 从 template 同步完整系统
  - `.claude/hooks/` - 10 个自动化脚本
    - `code-formatter.cjs` - 代码格式化
    - `multi-session.cjs` - 多会话管理
    - `tl-summary.sh` - 对话摘要 ⭐
    - `sync-to-log.sh` - 同步到日志
    - `todo-manager.cjs` - 任务管理
    - `thinking-silent.cjs` - 静默思考
    - `session-end.sh` - 会话结束处理
    - `project-kickoff.cjs` - 项目启动
    - `rag-skill-loader.cjs` - RAG 技能加载
    - `verify-work.cjs` - 工作验证
  - `.claude/thinking-routes/` - 对话流数据目录
  - `.claude/commands/` - 9 个技能命令定义

### 创建
- `.claude/MEMORY.md` - 本文件，增量变更记录
- `.claude/PROJECT_LOG.md` - 完整项目日志
- `.claude/ANCHORS.md` - 快速索引
- `.claude/thinking-routes/.conversation-flow.json` - 对话流数据结构

### 可用命令
- `tl` - 查看今日对话摘要
- `log` - 查看完整项目日志
- `memory` - 查看最近变更
