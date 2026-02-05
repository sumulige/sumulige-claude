# /design-audit

> 系统性设计审计 - Steve Jobs 标准

## 用法

```bash
/design-audit [屏幕名称]
/design-audit --full          # 全应用审计
/design-audit login           # 审计登录页面
/design-audit dashboard       # 审计仪表盘
```

## 工作流程

1. **读取上下文**
   - DESIGN_SYSTEM.md
   - APP_FLOW.md
   - 目标屏幕/组件

2. **15 维度审计**
   - 视觉层级、间距、排版、颜色、对齐
   - 组件一致性、图标、动效
   - 空/加载/错误状态
   - 响应式、可访问性

3. **应用 Jobs 过滤器**
   - 能删则删
   - 显而易见 > 需要说明
   - Inevitable 设计

4. **输出分阶段计划**
   - Phase 1: 关键问题
   - Phase 2: 精化
   - Phase 3: 打磨

5. **等待批准后执行**

## 范围纪律

✅ 视觉设计、布局、间距、排版、颜色、交互、动效、可访问性
❌ 应用逻辑、功能、API、数据模型

## 核心原则

```
Simplicity is the ultimate sophistication.
Remove until it breaks.
The details users never see should be as refined as the ones they do.
Design is not decoration. It is how it works.
```

## 参考

- `.claude/rules/design-philosophy.md` - 核心哲学
- `.claude/skills/design-audit/SKILL.md` - 完整协议
