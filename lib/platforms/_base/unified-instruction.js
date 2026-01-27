/**
 * Unified Instruction Format
 *
 * Provides a common intermediate format for instruction file conversion.
 * All platforms convert through this format to achieve N-to-M conversion
 * with only 2N methods (parse + serialize per platform).
 *
 * Flow: Platform A → UnifiedInstruction → Platform B
 */

/**
 * UnifiedInstruction - Platform-agnostic instruction representation
 */
class UnifiedInstruction {
  constructor() {
    this.title = '';
    this.description = '';
    this.sections = {};       // { sectionName: content }
    this.metadata = {};       // Platform-specific metadata (globs, frontmatter, etc.)
    this.rawContent = '';     // Original content backup for lossless conversion
  }

  /**
   * Parse Markdown content to unified format
   * @param {string} content - Markdown content
   * @returns {UnifiedInstruction}
   */
  static fromMarkdown(content) {
    const unified = new UnifiedInstruction();
    unified.rawContent = content;

    // Extract title (first H1)
    const titleMatch = content.match(/^#\s+(.+)$/m);
    if (titleMatch) {
      unified.title = titleMatch[1].trim();
    }

    // Extract description (first paragraph after title or first blockquote)
    const descMatch = content.match(/^>\s*(.+)$/m);
    if (descMatch) {
      unified.description = descMatch[1].trim();
    }

    // Extract sections (H2 headers)
    const sectionRegex = /^##\s+(.+)$/gm;
    const sections = content.split(/^##\s+/m);

    // Skip the part before first H2
    if (sections.length > 1) {
      for (let i = 1; i < sections.length; i++) {
        const section = sections[i];
        const lines = section.split('\n');
        const sectionName = lines[0].trim();
        const sectionContent = lines.slice(1).join('\n').trim();

        // Normalize section name for consistent keys
        const normalizedName = UnifiedInstruction.normalizeSectionName(sectionName);
        unified.sections[normalizedName] = {
          originalName: sectionName,
          content: sectionContent
        };
      }
    }

    return unified;
  }

  /**
   * Serialize to generic Markdown
   * @returns {string}
   */
  toMarkdown() {
    const lines = [];

    // Title
    if (this.title) {
      lines.push(`# ${this.title}`);
      lines.push('');
    }

    // Description
    if (this.description) {
      lines.push(`> ${this.description}`);
      lines.push('');
    }

    // Sections
    for (const [key, section] of Object.entries(this.sections)) {
      const name = section.originalName || key;
      lines.push(`## ${name}`);
      lines.push('');
      lines.push(section.content);
      lines.push('');
    }

    return lines.join('\n').trim();
  }

  /**
   * Get raw content (for lossless conversion)
   * @returns {string}
   */
  getRawContent() {
    return this.rawContent;
  }

  /**
   * Set metadata
   * @param {string} key - Metadata key
   * @param {any} value - Metadata value
   */
  setMetadata(key, value) {
    this.metadata[key] = value;
  }

  /**
   * Get metadata
   * @param {string} key - Metadata key
   * @returns {any}
   */
  getMetadata(key) {
    return this.metadata[key];
  }

  /**
   * Add or update a section
   * @param {string} name - Section name
   * @param {string} content - Section content
   */
  setSection(name, content) {
    const normalizedName = UnifiedInstruction.normalizeSectionName(name);
    this.sections[normalizedName] = {
      originalName: name,
      content
    };
  }

  /**
   * Get a section
   * @param {string} name - Section name
   * @returns {string|null}
   */
  getSection(name) {
    const normalizedName = UnifiedInstruction.normalizeSectionName(name);
    return this.sections[normalizedName]?.content || null;
  }

  /**
   * Check if section exists
   * @param {string} name - Section name
   * @returns {boolean}
   */
  hasSection(name) {
    const normalizedName = UnifiedInstruction.normalizeSectionName(name);
    return normalizedName in this.sections;
  }

  /**
   * Normalize section name for consistent lookup
   * @param {string} name - Original section name
   * @returns {string}
   */
  static normalizeSectionName(name) {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')  // Remove special chars except dash
      .replace(/\s+/g, '-')       // Replace spaces with dashes
      .trim();
  }

  /**
   * Clone this instruction
   * @returns {UnifiedInstruction}
   */
  clone() {
    const cloned = new UnifiedInstruction();
    cloned.title = this.title;
    cloned.description = this.description;
    cloned.sections = JSON.parse(JSON.stringify(this.sections));
    cloned.metadata = JSON.parse(JSON.stringify(this.metadata));
    cloned.rawContent = this.rawContent;
    return cloned;
  }

  /**
   * Create from object (deserialization)
   * @param {Object} obj - Plain object
   * @returns {UnifiedInstruction}
   */
  static fromObject(obj) {
    const unified = new UnifiedInstruction();
    unified.title = obj.title || '';
    unified.description = obj.description || '';
    unified.sections = obj.sections || {};
    unified.metadata = obj.metadata || {};
    unified.rawContent = obj.rawContent || '';
    return unified;
  }

  /**
   * Convert to plain object (serialization)
   * @returns {Object}
   */
  toObject() {
    return {
      title: this.title,
      description: this.description,
      sections: this.sections,
      metadata: this.metadata,
      rawContent: this.rawContent
    };
  }
}

module.exports = { UnifiedInstruction };
