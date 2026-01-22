#!/bin/bash
# sumulige-claude → ~/.claude 同步脚本
# 用法: ./scripts/sync-to-home.sh [--link | --copy]

set -e

SOURCE_DIR="$(cd "$(dirname "$0")/.." && pwd)/.claude"
TARGET_DIR="$HOME/.claude"

# 颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "═══════════════════════════════════════════════════════════"
echo "  sumulige-claude → ~/.claude 同步"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "源目录: $SOURCE_DIR"
echo "目标: $TARGET_DIR"
echo ""

# 需要符号链接的目录（共享配置）
LINK_DIRS=(hooks skills templates commands)

# 需要复制的文件（模板）
COPY_FILES=(
    CLAUDE.md
    MEMORY.md
    PROJECT_LOG.md
    ANCHORS.md
    AGENTS.md
    README.md
    boris-optimizations.md
    settings.json
)

# 创建符号链接
sync_links() {
    echo "📁 同步共享配置 (符号链接)..."
    for dir in "${LINK_DIRS[@]}"; do
        if [ -d "$SOURCE_DIR/$dir" ]; then
            # 删除目标目录（如果存在且不是链接）
            if [ -d "$TARGET_DIR/$dir" ] && [ ! -L "$TARGET_DIR/$dir" ]; then
                echo "  删除现有目录: $TARGET_DIR/$dir"
                rm -rf "$TARGET_DIR/$dir"
            fi
            # 创建符号链接
            if [ ! -L "$TARGET_DIR/$dir" ]; then
                ln -sf "$SOURCE_DIR/$dir" "$TARGET_DIR/$dir"
                echo -e "  ${GREEN}✓${NC} $dir → 已链接"
            else
                echo -e "  ${YELLOW}○${NC} $dir → 已是链接"
            fi
        fi
    done
}

# 复制模板文件
sync_files() {
    echo ""
    echo "📄 同步模板文件 (复制)..."
    for file in "${COPY_FILES[@]}"; do
        if [ -f "$SOURCE_DIR/$file" ]; then
            cp "$SOURCE_DIR/$file" "$TARGET_DIR/$file"
            echo -e "  ${GREEN}✓${NC} $file"
        fi
    done
}

# 显示状态
show_status() {
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo "  当前状态"
    echo "═══════════════════════════════════════════════════════════"
    for dir in "${LINK_DIRS[@]}"; do
        if [ -L "$TARGET_DIR/$dir" ]; then
            target=$(readlink "$TARGET_DIR/$dir")
            echo -e "  ${GREEN}✓${NC} $dir → $target"
        elif [ -d "$TARGET_DIR/$dir" ]; then
            echo -e "  ${YELLOW}○${NC} $dir (独立目录，未链接)"
        else
            echo "  ✗ $dir (不存在)"
        fi
    done
}

# 主逻辑
case "${1:-}" in
    --status)
        show_status
        ;;
    --link)
        sync_links
        show_status
        ;;
    --copy)
        sync_files
        ;;
    *)
        sync_links
        sync_files
        echo ""
        echo -e "${GREEN}✅ 同步完成！${NC}"
        show_status
        ;;
esac
