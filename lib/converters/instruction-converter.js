/**
 * Instruction Converter
 *
 * Converts instruction files between CLAUDE.md and AGENTS.md formats.
 */

const fs = require('fs');
const path = require('path');

class InstructionConverter {
  /**
   * Convert CLAUDE.md to AGENTS.md format
   * @param {string} claudeMd - CLAUDE.md content
   * @param {Object} options - Conversion options
   * @returns {string} AGENTS.md content
   */
  claudeToAgents(claudeMd, options = {}) {
    let content = claudeMd;

    // Remove Claude-specific metadata
    content = this.removeClaudeMetadata(content);

    // Add Codex preamble
    content = this.addCodexPreamble(content, options);

    // Add Codex-specific footer
    content = this.addCodexFooter(content, options);

    return content;
  }

  /**
   * Convert AGENTS.md to CLAUDE.md format
   * @param {string} agentsMd - AGENTS.md content
   * @param {Object} options - Conversion options
   * @returns {string} CLAUDE.md content
   */
  agentsToClaude(agentsMd, options = {}) {
    let content = agentsMd;

    // Remove Codex-specific sections
    content = this.removeCodexSections(content);

    // Add Claude metadata
    content = this.addClaudeMetadata(content, options);

    return content;
  }

  /**
   * Remove Claude-specific metadata from content
   * @param {string} content - Original content
   * @returns {string}
   */
  removeClaudeMetadata(content) {
    // Remove AI startup checklist section if present
    const checklistPattern = /## 🚀 AI 启动检查清单[\s\S]*?(?=\n## |$)/;
    content = content.replace(checklistPattern, '');

    // Remove memory priority section
    const memoryPattern = /\*\*记忆加载优先级\*\*:[\s\S]*?```\n/g;
    content = content.replace(memoryPattern, '');

    // Clean up multiple empty lines
    content = content.replace(/\n{3,}/g, '\n\n');

    return content.trim();
  }

  /**
   * Add Codex preamble to content
   * @param {string} content - Original content
   * @param {Object} options - Options
   * @returns {string}
   */
  addCodexPreamble(content, options = {}) {
    const projectName = options.projectName || 'Project';
    const preamble = `# ${projectName} - Agent Instructions

> This file configures Codex CLI behavior for this project.
> Auto-generated from CLAUDE.md by sumulige-claude.
> Last updated: ${new Date().toISOString().split('T')[0]}

`;
    return preamble + content;
  }

  /**
   * Add Codex-specific footer
   * @param {string} content - Current content
   * @param {Object} options - Options
   * @returns {string}
   */
  addCodexFooter(content, options = {}) {
    const footer = `

---

## Codex-Specific Settings

- **Sandbox Mode**: workspace-write (can modify project files)
- **Approval Policy**: on-failure (auto-approve unless errors occur)
- **Context Window**: Uses project_doc_max_bytes (64KB default)

### Fallback Files

Codex will also read these files if present:
- \`CLAUDE.md\` - Claude Code instructions (compatible)
- \`TEAM_GUIDE.md\` - Team guidelines

### MCP Integration

MCP servers configured in \`.codex/config.toml\` are available for use.
`;
    return content + footer;
  }

  /**
   * Remove Codex-specific sections from content
   * @param {string} content - Original content
   * @returns {string}
   */
  removeCodexSections(content) {
    // Remove Codex-Specific Settings section
    const codexPattern = /## Codex-Specific Settings[\s\S]*?(?=\n## |$)/;
    content = content.replace(codexPattern, '');

    // Remove auto-generated notice
    const noticePattern = /> Auto-generated from CLAUDE\.md by sumulige-claude\.\n/g;
    content = content.replace(noticePattern, '');

    // Clean up
    content = content.replace(/\n{3,}/g, '\n\n');

    return content.trim();
  }

  /**
   * Add Claude metadata to content
   * @param {string} content - Current content
   * @param {Object} options - Options
   * @returns {string}
   */
  addClaudeMetadata(content, options = {}) {
    const projectName = options.projectName || '[项目名称]';
    const header = `# ${projectName} - AI 协作配置

> 本文件由 AI 自动维护，定义 AI 协作方式和项目规范
> 最后更新：${new Date().toISOString().split('T')[0]}

---

## 🚀 AI 启动检查清单（每次任务开始前执行）

1. **加载锚点索引**：\`.claude/ANCHORS.md\` → 快速定位模块
2. **阅读项目范式**：\`prompts/project-paradigm.md\` → 理解协作方式 ⭐
3. **阅读项目日志**：\`.claude/PROJECT_LOG.md\` → 了解完整构建历史
4. **加载增量记忆**：\`.claude/MEMORY.md\` → 获取最新变更
5. **确认当前阶段**：\`todo.md\` → 了解待办任务

---

`;
    return header + content;
  }

  /**
   * Generate AGENTS.md from project rules
   * @param {string} projectDir - Project directory
   * @param {Object} options - Generation options
   * @returns {string}
   */
  generateAgentsMd(projectDir, options = {}) {
    const sections = [];
    const projectName = options.projectName || path.basename(projectDir);

    // Header
    sections.push(`# ${projectName} - Agent Instructions

> Auto-generated by sumulige-claude for Codex CLI compatibility.
> Last updated: ${new Date().toISOString().split('T')[0]}
`);

    // Try to read CLAUDE.md
    const claudeMdPath = path.join(projectDir, 'CLAUDE.md');
    const claudeMdAltPath = path.join(projectDir, '.claude', 'CLAUDE.md');

    if (fs.existsSync(claudeMdPath)) {
      const claudeContent = fs.readFileSync(claudeMdPath, 'utf-8');
      sections.push(this.extractCoreInstructions(claudeContent));
    } else if (fs.existsSync(claudeMdAltPath)) {
      const claudeContent = fs.readFileSync(claudeMdAltPath, 'utf-8');
      sections.push(this.extractCoreInstructions(claudeContent));
    }

    // Try to read rules
    const rulesDir = path.join(projectDir, '.claude', 'rules');
    if (fs.existsSync(rulesDir)) {
      const rulesSummary = this.summarizeRules(rulesDir);
      if (rulesSummary) {
        sections.push('\n## Project Rules\n\n' + rulesSummary);
      }
    }

    // Add Codex footer
    sections.push(`

---

## Codex Configuration

- Sandbox: workspace-write
- Approval: on-failure
- Shell tool: enabled
- Web search: enabled

See \`.codex/config.toml\` for full configuration.
`);

    return sections.join('\n');
  }

  /**
   * Extract core instructions from CLAUDE.md
   * @param {string} content - CLAUDE.md content
   * @returns {string}
   */
  extractCoreInstructions(content) {
    // Extract key sections
    const sections = [];

    // Project info section
    const projectInfoMatch = content.match(/## 项目信息[\s\S]*?(?=\n## |$)/);
    if (projectInfoMatch) {
      sections.push(projectInfoMatch[0]);
    }

    // Project vision
    const visionMatch = content.match(/## 项目愿景[\s\S]*?(?=\n## |$)/);
    if (visionMatch) {
      sections.push(visionMatch[0]);
    }

    // Core architecture
    const archMatch = content.match(/## 核心架构[\s\S]*?(?=\n## |$)/);
    if (archMatch) {
      sections.push(archMatch[0]);
    }

    // Code style
    const styleMatch = content.match(/## 代码风格[\s\S]*?(?=\n## |$)/);
    if (styleMatch) {
      sections.push(styleMatch[0]);
    }

    // Key rules
    const rulesMatch = content.match(/## 关键规则[\s\S]*?(?=\n## |$)/);
    if (rulesMatch) {
      sections.push(rulesMatch[0]);
    }

    return sections.join('\n\n');
  }

  /**
   * Summarize rules from rules directory
   * @param {string} rulesDir - Rules directory path
   * @returns {string}
   */
  summarizeRules(rulesDir) {
    const summaries = [];

    try {
      const files = fs.readdirSync(rulesDir).filter(f => f.endsWith('.md'));

      for (const file of files) {
        const content = fs.readFileSync(path.join(rulesDir, file), 'utf-8');
        const title = file.replace('.md', '').replace(/-/g, ' ');

        // Extract first paragraph as summary
        const firstPara = content.match(/^#[^\n]+\n+>?\s*([^\n]+)/);
        if (firstPara) {
          summaries.push(`- **${title}**: ${firstPara[1]}`);
        }
      }
    } catch (e) {
      // Ignore errors
    }

    return summaries.join('\n');
  }
}

module.exports = { InstructionConverter };
