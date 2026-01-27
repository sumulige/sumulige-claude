/**
 * Instruction Converter
 *
 * Converts instruction files between CLAUDE.md and AGENTS.md formats.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

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

  // =========================================================================
  // Cursor Conversion (.cursorrules / MDC format)
  // =========================================================================

  /**
   * Convert CLAUDE.md to .cursorrules (MDC format)
   * @param {string} claudeMd - CLAUDE.md content
   * @param {Object} options - Conversion options
   * @returns {string}
   */
  claudeToCursor(claudeMd, options = {}) {
    const cleanedContent = this.removeClaudeMetadata(claudeMd);

    const frontmatter = {
      description: options.description || 'Project rules converted from CLAUDE.md',
      globs: options.globs || ['**/*'],
      alwaysApply: options.alwaysApply !== false
    };

    return `---\n${yaml.stringify(frontmatter)}---\n\n${cleanedContent}`;
  }

  /**
   * Convert .cursorrules to CLAUDE.md
   * @param {string} cursorRules - .cursorrules content
   * @param {Object} options - Conversion options
   * @returns {string}
   */
  cursorToClaude(cursorRules, options = {}) {
    // Parse MDC format
    const match = cursorRules.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    const content = match ? match[2].trim() : cursorRules;

    return this.addClaudeMetadata(content, options);
  }

  // =========================================================================
  // Cline Conversion (.clinerules)
  // =========================================================================

  /**
   * Convert CLAUDE.md to .clinerules
   * @param {string} claudeMd - CLAUDE.md content
   * @param {Object} options - Conversion options
   * @returns {string}
   */
  claudeToCline(claudeMd, options = {}) {
    // Cline uses plain markdown, similar to CLAUDE.md
    return this.removeClaudeMetadata(claudeMd);
  }

  /**
   * Convert .clinerules to CLAUDE.md
   * @param {string} clineRules - .clinerules content
   * @param {Object} options - Conversion options
   * @returns {string}
   */
  clineToClaude(clineRules, options = {}) {
    return this.addClaudeMetadata(clineRules, options);
  }

  // =========================================================================
  // Aider Conversion (CONVENTIONS.md)
  // =========================================================================

  /**
   * Convert CLAUDE.md to CONVENTIONS.md (Aider format)
   * @param {string} claudeMd - CLAUDE.md content
   * @param {Object} options - Conversion options
   * @returns {string}
   */
  claudeToAider(claudeMd, options = {}) {
    const cleanedContent = this.removeClaudeMetadata(claudeMd);
    const projectName = options.projectName || 'Project';

    return `# Coding Conventions

> Conventions for ${projectName}
> Auto-generated from CLAUDE.md by sumulige-claude

${cleanedContent}

---

## Aider Integration

To use these conventions with Aider:

\`\`\`bash
aider --read CONVENTIONS.md
\`\`\`

Or add to \`.aider.conf.yml\`:

\`\`\`yaml
read:
  - CONVENTIONS.md
\`\`\`
`;
  }

  /**
   * Convert CONVENTIONS.md to CLAUDE.md
   * @param {string} conventions - CONVENTIONS.md content
   * @param {Object} options - Conversion options
   * @returns {string}
   */
  aiderToClaude(conventions, options = {}) {
    // Remove Aider-specific sections
    let content = conventions;
    content = content.replace(/## Aider Integration[\s\S]*?(?=\n## |$)/, '');
    content = content.replace(/> Auto-generated from CLAUDE\.md by sumulige-claude\n?/g, '');
    content = content.replace(/\n{3,}/g, '\n\n');

    return this.addClaudeMetadata(content.trim(), options);
  }

  // =========================================================================
  // OpenCode Conversion
  // =========================================================================

  /**
   * Convert CLAUDE.md for OpenCode (instructions array reference)
   * @param {string} claudeMd - CLAUDE.md content
   * @param {Object} options - Conversion options
   * @returns {string}
   */
  claudeToOpenCode(claudeMd, options = {}) {
    // OpenCode uses CLAUDE.md directly via instructions array
    // Just clean up Claude-specific metadata
    return this.removeClaudeMetadata(claudeMd);
  }

  /**
   * Get OpenCode config instructions array
   * @param {string[]} files - Instruction file names
   * @returns {Object}
   */
  getOpenCodeInstructions(files = ['CLAUDE.md']) {
    return {
      instructions: files
    };
  }

  // =========================================================================
  // Trae Conversion
  // =========================================================================

  /**
   * Convert CLAUDE.md for Trae
   * @param {string} claudeMd - CLAUDE.md content
   * @param {Object} options - Conversion options
   * @returns {string}
   */
  claudeToTrae(claudeMd, options = {}) {
    // Trae uses agents config, instructions are embedded
    return this.removeClaudeMetadata(claudeMd);
  }

  // =========================================================================
  // Zed Conversion
  // =========================================================================

  /**
   * Convert CLAUDE.md for Zed
   * @param {string} claudeMd - CLAUDE.md content
   * @param {Object} options - Conversion options
   * @returns {string}
   */
  claudeToZed(claudeMd, options = {}) {
    // Zed reads CLAUDE.md directly
    return this.removeClaudeMetadata(claudeMd);
  }

  // =========================================================================
  // Universal Conversion
  // =========================================================================

  /**
   * Convert instructions from one platform to another
   * @param {string} content - Source instruction content
   * @param {string} from - Source platform
   * @param {string} to - Target platform
   * @param {Object} options - Conversion options
   * @returns {string}
   */
  convert(content, from, to, options = {}) {
    // Conversion matrix
    const conversions = {
      claude: {
        codex: (c, o) => this.claudeToAgents(c, o),
        cursor: (c, o) => this.claudeToCursor(c, o),
        cline: (c, o) => this.claudeToCline(c, o),
        aider: (c, o) => this.claudeToAider(c, o),
        opencode: (c, o) => this.claudeToOpenCode(c, o),
        trae: (c, o) => this.claudeToTrae(c, o),
        zed: (c, o) => this.claudeToZed(c, o)
      },
      codex: {
        claude: (c, o) => this.agentsToClaude(c, o)
      },
      cursor: {
        claude: (c, o) => this.cursorToClaude(c, o)
      },
      cline: {
        claude: (c, o) => this.clineToClaude(c, o)
      },
      aider: {
        claude: (c, o) => this.aiderToClaude(c, o)
      }
    };

    // Try direct conversion
    if (conversions[from]?.[to]) {
      return conversions[from][to](content, options);
    }

    // Try via claude as intermediate
    if (from !== 'claude' && conversions[from]?.claude && conversions.claude?.[to]) {
      const claudeContent = conversions[from].claude(content, options);
      return conversions.claude[to](claudeContent, options);
    }

    // Fallback: return content as-is
    return content;
  }
}

module.exports = { InstructionConverter };
