# 安装 Oh My Claude

## 全局安装

```bash
npm install -g /Users/sumulige/Documents/Antigravity/oh-my-claude
```

## 初始化配置

```bash
oh-my-claude init
```

## 同步到项目

```bash
cd /path/to/your/project
oh-my-claude sync
```

## 创建 GitHub 仓库

1. 访问 https://github.com/new
2. 仓库名: `oh-my-claude`
3. 选择 **Private**
4. 点击 **Create repository**

然后运行：

```bash
cd /Users/sumulige/Documents/Antigravity/oh-my-claude
git remote add origin https://github.com/sumulige/oh-my-claude.git
git push -u origin main
```
