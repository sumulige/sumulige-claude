# Skills 系统使用手册

> 版本: 2.0.0 | 更新日期: 2026-01-22

---

## 核心 Skills

| Skill | 命令 | 触发时机 | 作用 | 模型 |
|-------|------|---------|------|------|
| `quality-guard` | `/review` | 提交前、PR 审查 | 代码质量 + 安全检查 + 清理建议 | sonnet |
| `test-master` | `/test` | 实现功能后 | TDD + E2E + 覆盖率分析 | sonnet |
| `design-brain` | `/plan` | 开始新任务前 | 规划 + 架构设计 | opus |
| `quick-fix` | `/fix` | 构建失败时 | 快速修复错误 | haiku |

---

## 命令速查表

### /review - 代码审查

```bash
/review              # 标准代码审查
/review --security   # 安全深度扫描 (OWASP Top 10)
/review --clean      # 死代码清理建议
/review --all        # 完整审查
```

**触发时机**:
- 准备提交代码前
- PR 审查时
- 怀疑有安全问题时

### /test - 测试

```bash
/test                # 运行单元测试
/test --tdd          # TDD 开发模式 (RED→GREEN→REFACTOR)
/test --e2e          # E2E 测试 (Playwright)
/test --coverage     # 覆盖率报告
/test --all          # 完整测试套件
```

**触发时机**:
- 完成功能实现后
- 修复 bug 后
- 提交前验证

### /plan - 规划

```bash
/plan                # 快速规划（默认）
/plan --deep         # 深度设计（架构决策）
/plan --arch         # 仅架构设计
```

**触发时机**:
- 开始新功能开发前
- 重大重构前
- 技术选型时

### /fix - 快速修复

```bash
/fix                 # 自动检测并修复
/fix --build         # 修复构建错误
/fix --lint          # 修复 lint 错误
/fix --type          # 修复类型错误
/fix --all           # 修复所有错误
```

**触发时机**:
- `npm run build` 失败
- `tsc` 报类型错误
- ESLint 报错

### /refactor - 重构

```bash
/refactor            # 分析并建议清理
/refactor --dead     # 查找死代码
/refactor --deps     # 查找未使用依赖
/refactor --duplicate # 查找重复代码
/refactor --execute  # 执行清理（需确认）
```

**触发时机**:
- 代码库变大需要清理
- 发现重复代码
- 依赖需要整理

---

## 模型成本策略

| 模型 | 使用场景 | 相对成本 | 速度 |
|------|---------|---------|------|
| **haiku** | `/fix` 快速修复 | 1x (最低) | 最快 |
| **sonnet** | `/review`, `/test` 标准任务 | 5x | 中等 |
| **opus** | `/plan --deep` 复杂架构 | 15x | 较慢 |

**自动选择规则**:
- 简单修复 → haiku（节省成本）
- 代码审查/测试 → sonnet（平衡性价比）
- 架构设计 → opus（仅在需要深度分析时）

---

## 工作流示例

### 新功能开发

```
1. /plan              # 规划实现步骤
2. 编写代码           # 实现功能
3. /fix               # 修复编译错误
4. /test --tdd        # 补充测试
5. /review            # 代码审查
6. /commit            # 提交代码
```

### Bug 修复

```
1. /test              # 确认失败的测试
2. 修复代码           # 实现修复
3. /fix               # 确保编译通过
4. /test              # 验证测试通过
5. /review --security # 安全检查
6. /commit            # 提交修复
```

### 代码清理

```
1. /refactor          # 分析代码库
2. /refactor --dead   # 找死代码
3. /refactor --deps   # 找未用依赖
4. /refactor --execute # 执行清理
5. /test              # 确保不破坏功能
6. /commit            # 提交清理
```

---

## 自动加载

Skills 会根据用户输入自动加载：

```json
{
  "auto_load": {
    "enabled": true,
    "confidence_threshold": 0.7,
    "max_skills_per_task": 3
  }
}
```

**关键词触发示例**:
- "review code" → `quality-guard`
- "fix build error" → `quick-fix`
- "plan architecture" → `design-brain`
- "run tests" → `test-master`

---

## 配置文件

| 文件 | 说明 |
|------|------|
| `.claude/rag/skill-index.json` | Skill 索引和模型策略 |
| `.claude/skills/*/metadata.yaml` | 各 Skill 配置 |
| `.claude/skills/*/SKILL.md` | Skill 详细指令 |
| `.claude/commands/*.md` | 命令定义 |
