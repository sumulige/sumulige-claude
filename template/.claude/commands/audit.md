---
description: Audit approved commands for security risks
---

# /audit

审计已批准的命令，检测潜在的安全风险。类似 cc-safe 工具。

## 使用方式

```bash
/audit              # 扫描当前项目
/audit --global     # 扫描全局配置
/audit --fix        # 交互式移除危险权限
/audit --report     # 生成详细报告
```

## 检测的危险模式

### 🔴 Critical (必须移除)

| 模式 | 风险 | 说明 |
|------|------|------|
| `rm -rf /` | 系统破坏 | 删除根目录 |
| `> /dev/sda` | 数据丢失 | 覆写磁盘 |
| `:(){ :\|:& };:` | Fork 炸弹 | 系统崩溃 |
| `mkfs` | 数据丢失 | 格式化磁盘 |
| `dd if=/dev/zero` | 数据丢失 | 覆写设备 |

### 🟠 High (需要审查)

| 模式 | 风险 | 说明 |
|------|------|------|
| `sudo` | 权限提升 | 管理员权限 |
| `rm -rf` | 数据丢失 | 递归删除 |
| `chmod 777` | 安全漏洞 | 过度开放权限 |
| `docker run --privileged` | 容器逃逸 | 特权容器 |
| `curl \| sh` | 远程代码执行 | 未验证脚本 |
| `eval` | 代码注入 | 动态执行 |

### 🟡 Medium (建议审查)

| 模式 | 风险 | 说明 |
|------|------|------|
| `npm install -g` | 全局污染 | 全局包安装 |
| `pip install --user` | 环境污染 | 用户级安装 |
| `git push --force` | 历史丢失 | 强制推送 |
| `DROP TABLE` | 数据丢失 | 删除数据表 |

## 工作流程

### Step 1: 扫描配置文件

检查以下位置：
```
~/.claude/settings.local.json          # 全局批准
.claude/settings.local.json            # 项目批准
~/.claude/projects/*/settings.local.json  # 各项目批准
```

### Step 2: 模式匹配

```javascript
const dangerousPatterns = [
  { pattern: /rm\s+-rf\s+\//, level: 'critical', desc: '删除根目录' },
  { pattern: /sudo/, level: 'high', desc: '权限提升' },
  { pattern: /chmod\s+777/, level: 'high', desc: '过度开放权限' },
  { pattern: /--privileged/, level: 'high', desc: '特权容器' },
  { pattern: /curl.*\|\s*sh/, level: 'high', desc: '远程脚本执行' },
  { pattern: /git\s+push\s+--force/, level: 'medium', desc: '强制推送' },
];
```

### Step 3: 生成报告

```markdown
# Permission Audit Report

**Date**: YYYY-MM-DD HH:mm
**Scanned**: X files
**Issues**: Y found

## 🔴 Critical Issues (0)
None found.

## 🟠 High Risk (2)

### 1. sudo permission
**Location**: ~/.claude/settings.local.json
**Pattern**: `Bash(sudo apt install *)`
**Risk**: 权限提升可能导致系统级变更

**Recommendation**:
移除此权限，改为手动执行 sudo 命令

### 2. rm -rf permission
**Location**: .claude/settings.local.json
**Pattern**: `Bash(rm -rf node_modules)`
**Risk**: 可能意外删除重要文件

**Recommendation**:
限制为特定目录，如 `Bash(rm -rf ./node_modules)`

## 🟡 Medium Risk (1)

### 1. git push --force
**Location**: ~/.claude/settings.local.json
**Pattern**: `Bash(git push --force)`
**Risk**: 可能覆盖远程历史

## Summary

| Level | Count | Action |
|-------|-------|--------|
| 🔴 Critical | 0 | 必须移除 |
| 🟠 High | 2 | 建议移除 |
| 🟡 Medium | 1 | 可选审查 |

## Quick Actions

```bash
# 移除高风险权限
/audit --fix

# 查看具体权限
cat ~/.claude/settings.local.json | jq '.permissions'
```
```

---

## CLI 集成

也可通过 `smc audit` 命令运行：

```bash
smc audit              # 扫描当前项目
smc audit --global     # 扫描全局
smc audit --ci         # CI 模式（非零退出码）
```

## 最佳实践

1. **定期审计** - 每周运行一次 `/audit`
2. **最小权限** - 只批准必要的命令
3. **限定范围** - 使用完整路径而非通配符
4. **CI 检查** - 在 CI 中运行 `smc audit --ci`
