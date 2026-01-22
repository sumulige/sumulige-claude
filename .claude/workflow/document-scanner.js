/**
 * Document Scanner - Extract content and metadata from local files
 *
 * Supports:
 * - Text extraction from multiple file formats
 * - Metadata extraction (word count, headings, links)
 * - Content checksum for change detection
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ============================================================================
// Configuration
// ============================================================================

const MAX_CONTENT_SIZE = 500 * 1024; // 500KB - don't store content if larger
const MAX_SNIPPET_SIZE = 2000; // Store snippet for large files

// Supported file types for content scanning
const SCANNABLE_TYPES = [
  '.md', '.markdown',  // Markdown
  '.txt',              // Plain text
  '.json', '.yaml', '.yml',  // Config files
  '.js', '.ts', '.jsx', '.tsx',  // JavaScript/TypeScript
  '.py', '.rs', '.go', '.java', '.c', '.cpp', '.h', '.hpp',  // Code
  '.sh', '.bash', '.zsh', '.fish',  // Shell scripts
  '.css', '.scss', '.less',  // Stylesheets
  '.html', '.htm', '.xml',  // Markup
  '.sql', '.graphql', '.gql'  // Query languages
];

// ============================================================================
// Document Scanner Class
// ============================================================================

class DocumentScanner {
  /**
   * Check if a file type is scannable
   */
  static isScannable(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return SCANNABLE_TYPES.includes(ext);
  }

  /**
   * Scan a file and extract metadata
   */
  static scanFile(filePath, options = {}) {
    const {
      includeContent = true,
      maxContentSize = MAX_CONTENT_SIZE
    } = options;

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const stats = fs.statSync(filePath);
    const ext = path.extname(filePath).toLowerCase();

    // Basic metadata
    const metadata = {
      path: filePath,
      size: stats.size,
      lastModified: stats.mtimeMs,
      contentType: this.getMimeType(ext),
      extension: ext
    };

    // If file is too large or not scannable, skip content
    if (!this.isScannable(filePath) || stats.size === 0) {
      return {
        ...metadata,
        scannable: false,
        wordCount: 0,
        headings: [],
        links: [],
      };
    }

    // Read file content
    let content;
    try {
      content = fs.readFileSync(filePath, 'utf-8');
    } catch (error) {
      return {
        ...metadata,
        scannable: false,
        error: error.message
      };
    }

    // Calculate checksum
    const checksum = crypto
      .createHash('md5')
      .update(content)
      .digest('hex');

    // Extract metadata based on file type
    const extracted = this.extractMetadata(content, ext);

    // Determine whether to store full content or just snippet
    const shouldStoreContent = includeContent && content.length <= maxContentSize;

    return {
      ...metadata,
      scannable: true,
      checksum,
      wordCount: extracted.wordCount,
      lineCount: extracted.lineCount,
      headings: extracted.headings,
      links: extracted.links,
      codeBlocks: extracted.codeBlocks,
      frontMatter: extracted.frontMatter,
      // Content or snippet
      content: shouldStoreContent ? content : null,
      snippet: shouldStoreContent ? null : content.substring(0, MAX_SNIPPET_SIZE)
    };
  }

  /**
   * Extract metadata from content based on file type
   */
  static extractMetadata(content, ext) {
    const lines = content.split('\n');
    const wordCount = this.countWords(content);
    const lineCount = lines.length;

    let headings = [];
    let links = [];
    let codeBlocks = [];
    let frontMatter = null;

    // Markdown-specific extraction
    if (['.md', '.markdown'].includes(ext)) {
      const mdResult = this.extractMarkdownMetadata(content);
      headings = mdResult.headings;
      links = mdResult.links;
      codeBlocks = mdResult.codeBlocks;
      frontMatter = mdResult.frontMatter;
    }
    // Code-specific extraction
    else if (['.js', '.ts', '.jsx', '.tsx', '.py', '.rs', '.go'].includes(ext)) {
      const codeResult = this.extractCodeMetadata(content, ext);
      headings = codeResult.headings; // Functions/classes as headings
      links = codeResult.links; // Import/require statements
    }

    return {
      wordCount,
      lineCount,
      headings,
      links,
      codeBlocks,
      frontMatter
    };
  }

  /**
   * Extract Markdown-specific metadata
   */
  static extractMarkdownMetadata(content) {
    const headings = [];
    const links = [];
    const codeBlocks = [];
    let frontMatter = null;

    const lines = content.split('\n');
    let inCodeBlock = false;
    let codeBlockLang = null;
    let currentCodeBlock = [];

    // Check for YAML front matter
    if (lines[0] === '---') {
      const endIdx = lines.slice(1).findIndex(line => line === '---');
      if (endIdx > 0) {
        const frontMatterContent = lines.slice(1, endIdx + 1).join('\n');
        frontMatter = this.parseFrontMatter(frontMatterContent);
      }
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Track code blocks
      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeBlockLang = line.substring(3).trim() || 'text';
          currentCodeBlock = [];
        } else {
          codeBlocks.push({
            language: codeBlockLang,
            lineStart: i - currentCodeBlock.length,
            preview: currentCodeBlock.slice(0, 3).join('\n')
          });
          inCodeBlock = false;
          currentCodeBlock = [];
        }
        continue;
      }

      if (inCodeBlock) {
        currentCodeBlock.push(line);
        continue;
      }

      // Extract headings
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const text = headingMatch[2].trim();
        headings.push({ level, text, line: i + 1 });
      }

      // Extract links
      const linkMatch = line.match(/\[([^\]]+)\]\(([^)]+)\)/g);
      if (linkMatch) {
        linkMatch.forEach(link => {
          const match = link.match(/\[([^\]]+)\]\(([^)]+)\)/);
          if (match) {
            links.push({ text: match[1], url: match[2] });
          }
        });
      }
    }

    return { headings, links, codeBlocks, frontMatter };
  }

  /**
   * Extract code-specific metadata (functions, classes, imports)
   */
  static extractCodeMetadata(content, ext) {
    const headings = [];
    const links = [];

    const lines = content.split('\n');

    // Patterns for different languages
    const patterns = {
      '.js': { func: /^\s*(?:export\s+)?(?:async\s+)?function\s+(\w+)/, class: /^\s*class\s+(\w+)/, import: /^\s*import\s+.*from\s+['"]([^'"]+)['"]/ },
      '.ts': { func: /^\s*(?:export\s+)?(?:async\s+)?function\s+(\w+)/, class: /^\s*class\s+(\w+)/, import: /^\s*import\s+.*from\s+['"]([^'"]+)['"]/ },
      '.jsx': { func: /^\s*(?:export\s+)?(?:async\s+)?function\s+(\w+)/, class: /^\s*class\s+(\w+)/, import: /^\s*import\s+.*from\s+['"]([^'"]+)['"]/ },
      '.tsx': { func: /^\s*(?:export\s+)?(?:async\s+)?function\s+(\w+)/, class: /^\s*class\s+(\w+)/, import: /^\s*import\s+.*from\s+['"]([^'"]+)['"]/ },
      '.py': { func: /^\s*def\s+(\w+)\s*\(/, class: /^\s*class\s+(\w+)\s*:/, import: /^\s*(?:import|from)\s+(\w+)/ },
      '.rs': { func: /^\s*(?:pub\s+)?fn\s+(\w+)\s*\(/, class: /^\s*(?:pub\s+)?(struct|enum|trait)\s+(\w+)/, import: /^\s*use\s+([^;]+);/ },
      '.go': { func: /^\s*func\s+(?:\(\w+\s+\*?\w+\)\s+)?(\w+)\s*\(/, class: /^\s*type\s+(\w+)\s+struct/, import: /^\s*import\s+(?:\(|")([^")]+)/ }
    };

    const lang = patterns[ext] || patterns['.js'];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Extract functions
      const funcMatch = line.match(lang.func);
      if (funcMatch) {
        headings.push({ type: 'function', name: funcMatch[1], line: i + 1 });
      }

      // Extract classes
      const classMatch = line.match(lang.class);
      if (classMatch) {
        const name = classMatch[2] || classMatch[1];
        headings.push({ type: 'class', name, line: i + 1 });
      }

      // Extract imports
      const importMatch = line.match(lang.import);
      if (importMatch) {
        links.push({ type: 'import', name: importMatch[1], line: i + 1 });
      }
    }

    return { headings, links };
  }

  /**
   * Parse YAML front matter
   */
  static parseFrontMatter(content) {
    const result = {};
    const lines = content.split('\n');

    for (const line of lines) {
      const match = line.match(/^(\w+):\s*(.+)$/);
      if (match) {
        result[match[1]] = match[2].trim();
      }
    }

    return result;
  }

  /**
   * Count words in content (rough estimate for mixed content)
   */
  static countWords(content) {
    // For code files, count tokens more accurately
    // For text files, count words
    const tokens = content
      .replace(/\s+/g, ' ')
      .replace(/[{}();,.<>[\]]/g, ' ')
      .split(' ')
      .filter(t => t.length > 0);

    return tokens.length;
  }

  /**
   * Get MIME type for extension
   */
  static getMimeType(ext) {
    const mimeTypes = {
      '.md': 'text/markdown',
      '.markdown': 'text/markdown',
      '.txt': 'text/plain',
      '.json': 'application/json',
      '.yaml': 'text/yaml',
      '.yml': 'text/yaml',
      '.js': 'text/javascript',
      '.ts': 'text/typescript',
      '.jsx': 'text/jsx',
      '.tsx': 'text/tsx',
      '.py': 'text/x-python',
      '.rs': 'text/x-rust',
      '.go': 'text/x-go',
      '.java': 'text/x-java',
      '.c': 'text/x-c',
      '.cpp': 'text/x-c++',
      '.h': 'text/x-c',
      '.hpp': 'text/x-c++',
      '.sh': 'text/x-shellscript',
      '.bash': 'text/x-shellscript',
      '.css': 'text/css',
      '.scss': 'text/x-scss',
      '.less': 'text/x-less',
      '.html': 'text/html',
      '.htm': 'text/html',
      '.xml': 'text/xml',
      '.sql': 'text/x-sql',
      '.graphql': 'text/x-graphql',
      '.gql': 'text/x-graphql'
    };
    return mimeTypes[ext.toLowerCase()] || 'text/plain';
  }

  /**
   * Scan a directory recursively
   */
  static scanDirectory(dirPath, options = {}) {
    const {
      recursive = true,
      maxDepth = 10,
      includePatterns = [],
      excludePatterns = ['node_modules', '.git', 'dist', 'build', 'coverage']
    } = options;

    if (!fs.existsSync(dirPath)) {
      throw new Error(`Directory not found: ${dirPath}`);
    }

    const results = [];
    const scanQueue = [{ dir: dirPath, depth: 0 }];

    while (scanQueue.length > 0) {
      const { dir, depth } = scanQueue.shift();

      if (depth > maxDepth) continue;

      let entries;
      try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
      } catch (error) {
        continue; // Skip directories we can't read
      }

      for (const entry of entries) {
        // Skip excluded directories
        if (entry.isDirectory() && excludePatterns.includes(entry.name)) {
          continue;
        }

        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory() && recursive) {
          scanQueue.push({ dir: fullPath, depth: depth + 1 });
        } else if (entry.isFile()) {
          // Check include patterns
          if (includePatterns.length > 0) {
            const matches = includePatterns.some(pattern => {
              if (pattern instanceof RegExp) {
                return pattern.test(fullPath);
              }
              return fullPath.includes(pattern);
            });
            if (!matches) continue;
          }

          try {
            const scanResult = this.scanFile(fullPath, options);
            results.push(scanResult);
          } catch (error) {
            // Skip files that can't be scanned
          }
        }
      }
    }

    return results;
  }
}

// ============================================================================
// Exports
// ============================================================================

module.exports = {
  DocumentScanner,
  SCANNABLE_TYPES,
  MAX_CONTENT_SIZE,
  MAX_SNIPPET_SIZE
};
