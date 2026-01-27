# /workflow - 统一工作流命令

一键执行常见工作流操作。

## 可用子命令

### `/workflow check` - 检查状态
检查 sumulige-claude 更新和项目状态。

```bash
# 检查版本和更新
smc sync --check-update
```

### `/workflow pull` - 拉取更新
增量同步 sumulige-claude 更新到当前项目。

```bash
# 增量同步（推荐）
smc sync --incremental

# 强制全量同步
smc sync --hooks
```

### `/workflow task <description>` - 执行任务
标准任务执行流程：
1. 分析任务需求
2. 创建 TODO 列表
3. 逐步实现
4. 更新文档

### `/workflow sync` - 同步文档
更新项目文档和记忆：
- memory/current.md - 持久状态
- PROJECT_LOG.md - 历史记录
- CHANGELOG.md - 版本日志

### `/workflow commit <message>` - 提交变更
Git 提交工作流：
1. 检查变更状态
2. 暂存相关文件
3. 提交并生成消息

### `/workflow push` - 推送远程
将本地变更推送到远程仓库。

### `/workflow full <description>` - 一键完整流程
执行完整的开发工作流：

```
1. 检查更新 → 2. 增量同步 → 3. 执行任务 → 4. 更新文档 → 5. 提交 → 6. 推送
```

示例：
```
/workflow full "实现用户认证功能"
```

## 使用示例

```
# 日常任务
/workflow task "修复登录 bug"

# 完整流程
/workflow full "添加暗黑模式"

# 仅同步文档
/workflow sync

# 仅提交
/workflow commit "fix: 修复登录问题"
```

## 注意事项

- 任务执行前会自动检查更新
- 增量同步只更新变更的文件
- 文档同步包括 memory/current.md 和 PROJECT_LOG.md
- 提交前会自动运行测试（如配置）
