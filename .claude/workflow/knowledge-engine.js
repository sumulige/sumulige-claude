/**
 * Knowledge Engine (JavaScript version)
 *
 * Integrates NotebookLM knowledge capabilities with local knowledge base
 * and web search for Phase 1 research.
 */

const fs = require('fs');
const path = require('path');

// Import DocumentScanner
const { DocumentScanner } = require('./document-scanner.js');

// Import WebSearch and SearchCache
const { WebSearch } = require('./web-search.js');
const { SearchCache } = require('./search-cache.js');

// Try to import NotebookLM browser module
let NotebookLMClient = null;
let getClient = null;
try {
  const notebooklm = require('./notebooklm/browser.js');
  NotebookLMClient = notebooklm.NotebookLMClient;
  getClient = notebooklm.getClient;
} catch (e) {
  // NotebookLM not available, will use fallback
}

// ============================================================================
// Configuration
// ============================================================================

const KNOWLEDGE_BASE_DIR = path.join(process.cwd(), 'development/knowledge-base');
const PROJECTS_DIR = path.join(process.cwd(), 'development/projects');
const KNOWLEDGE_INDEX_FILE = path.join(KNOWLEDGE_BASE_DIR, '.index.json');

// ============================================================================
// Knowledge Engine Class
// ============================================================================

class KnowledgeEngine {
  constructor() {
    this.index = { sources: [], lastUpdated: 0 };
    this.indexLoaded = false;
    this.ensureDirectories();
  }

  // --------------------------------------------------------------------------
  // Initialization
  // --------------------------------------------------------------------------

  ensureDirectories() {
    [KNOWLEDGE_BASE_DIR, PROJECTS_DIR].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  loadIndex() {
    if (this.indexLoaded) return;

    try {
      if (fs.existsSync(KNOWLEDGE_INDEX_FILE)) {
        const content = fs.readFileSync(KNOWLEDGE_INDEX_FILE, 'utf-8');
        this.index = JSON.parse(content);
      }
      this.indexLoaded = true;
    } catch (error) {
      console.warn('Failed to load knowledge index, starting fresh:', error);
      this.index = { sources: [], lastUpdated: Date.now() };
      this.indexLoaded = true;
    }
  }

  saveIndex() {
    try {
      fs.writeFileSync(
        KNOWLEDGE_INDEX_FILE,
        JSON.stringify(this.index, null, 2),
        'utf-8'
      );
      this.index.lastUpdated = Date.now();
    } catch (error) {
      console.error('Failed to save knowledge index:', error);
    }
  }

  // --------------------------------------------------------------------------
  // Knowledge Source Management
  // --------------------------------------------------------------------------

  generateId() {
    return `src_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getMimeType(ext) {
    const mimeTypes = {
      '.md': 'text/markdown',
      '.txt': 'text/plain',
      '.json': 'application/json',
      '.pdf': 'application/pdf',
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.ts': 'text/typescript',
      '.py': 'text/x-python',
      '.rs': 'text/x-rust'
    };
    return mimeTypes[ext.toLowerCase()] || 'application/octet-stream';
  }

  /**
   * Add a knowledge source to the index
   */
  addSource(source) {
    this.loadIndex();

    const id = this.generateId();
    const newSource = {
      ...source,
      id,
      addedAt: Date.now(),
      lastAccessed: Date.now()
    };

    this.index.sources.push(newSource);
    this.saveIndex();

    return id;
  }

  /**
   * Add a local file as knowledge source
   */
  addFile(filePath, tags = [], options = {}) {
    const resolvedPath = path.resolve(filePath);
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const stats = fs.statSync(resolvedPath);
    const ext = path.extname(resolvedPath);

    // Scan file for content and metadata
    const scanResult = DocumentScanner.scanFile(resolvedPath, {
      includeContent: true,
      maxContentSize: options.maxContentSize || 500 * 1024
    });

    // Build title from front matter or filename
    let title = path.basename(resolvedPath);
    let description = `Local file: ${resolvedPath}`;

    if (scanResult.frontMatter && scanResult.frontMatter.title) {
      title = scanResult.frontMatter.title;
    }
    if (scanResult.frontMatter && scanResult.frontMatter.description) {
      description = scanResult.frontMatter.description;
    }

    return this.addSource({
      type: 'local_file',
      path: resolvedPath,
      title,
      description,
      tags: tags.concat(scanResult.frontMatter?.tags?.split(',') || []),
      size: stats.size,
      contentType: scanResult.contentType,

      // New fields from scanning
      scannable: scanResult.scannable,
      wordCount: scanResult.wordCount,
      lineCount: scanResult.lineCount,
      headings: scanResult.headings,
      links: scanResult.links,
      codeBlocks: scanResult.codeBlocks,
      content: scanResult.content,
      snippet: scanResult.snippet,
      checksum: scanResult.checksum,
      lastModified: scanResult.lastModified,
      indexedAt: Date.now()
    });
  }

  /**
   * Add a local directory as knowledge source
   * Recursively scans all supported files in the directory
   */
  addDirectory(dirPath, tags = [], options = {}) {
    const resolvedPath = path.resolve(dirPath);
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Directory not found: ${dirPath}`);
    }

    const {
      recursive = true,
      maxDepth = 10,
      includePatterns = [],
      excludePatterns = ['node_modules', '.git', 'dist', 'build', 'coverage', 'sessions', '.claude']
    } = options;

    // Scan the directory for files
    const scanResults = DocumentScanner.scanDirectory(resolvedPath, {
      recursive,
      maxDepth,
      includePatterns,
      excludePatterns
    });

    // Add each file as a separate source
    const addedIds = [];
    for (const result of scanResults) {
      if (!result.scannable) continue;

      let title = path.basename(result.path);
      let description = `File: ${result.path}`;

      // Use front matter if available
      if (result.frontMatter && result.frontMatter.title) {
        title = result.frontMatter.title;
      }
      if (result.frontMatter && result.frontMatter.description) {
        description = result.frontMatter.description;
      }

      const id = this.addSource({
        type: 'local_file',
        path: result.path,
        title,
        description,
        tags: tags.concat(result.frontMatter?.tags?.split(',') || []),
        size: result.size,
        contentType: result.contentType,
        scannable: result.scannable,
        wordCount: result.wordCount,
        lineCount: result.lineCount,
        headings: result.headings,
        links: result.links,
        codeBlocks: result.codeBlocks,
        content: result.content,
        snippet: result.snippet,
        checksum: result.checksum,
        lastModified: result.lastModified,
        indexedAt: Date.now()
      });
      addedIds.push(id);
    }

    // Also add the directory itself as a container
    this.addSource({
      type: 'local_directory',
      path: resolvedPath,
      title: path.basename(resolvedPath),
      description: `Directory with ${addedIds.length} indexed files`,
      tags,
      fileCount: addedIds.length
    });

    return addedIds;
  }

  /**
   * Add a NotebookLM notebook as knowledge source
   */
  addNotebook(notebookUrl, title, tags = []) {
    return this.addSource({
      type: 'notebooklm',
      notebookUrl,
      title,
      description: `NotebookLM: ${title}`,
      tags
    });
  }

  /**
   * List all knowledge sources
   */
  listSources(filter = {}) {
    this.loadIndex();

    let sources = [...this.index.sources];

    if (filter.type) {
      sources = sources.filter(s => s.type === filter.type);
    }

    if (filter.tag) {
      sources = sources.filter(s => s.tags.includes(filter.tag));
    }

    return sources.sort((a, b) => b.lastAccessed - a.lastAccessed);
  }

  /**
   * Get a specific knowledge source by ID
   */
  getSource(id) {
    this.loadIndex();
    return this.index.sources.find(s => s.id === id) || null;
  }

  /**
   * Remove a knowledge source
   */
  removeSource(id) {
    this.loadIndex();
    const initialLength = this.index.sources.length;
    this.index.sources = this.index.sources.filter(s => s.id !== id);

    if (this.index.sources.length < initialLength) {
      this.saveIndex();
      return true;
    }
    return false;
  }

  /**
   * Check if a source needs reindexing due to file changes
   */
  needsReindex(source) {
    if (source.type !== 'local_file') return false;
    if (!fs.existsSync(source.path)) return false; // File deleted

    try {
      const stats = fs.statSync(source.path);
      // Check if file was modified since last index
      if (source.lastModified && stats.mtimeMs > source.lastModified) {
        return true;
      }
      // Also check checksum if available
      if (source.checksum) {
        const currentContent = fs.readFileSync(source.path, 'utf-8');
        const currentChecksum = require('crypto')
          .createHash('md5')
          .update(currentContent)
          .digest('hex');
        return currentChecksum !== source.checksum;
      }
    } catch (error) {
      return false;
    }

    return false;
  }

  /**
   * Reindex a single file source
   */
  reindexFile(source) {
    try {
      const scanResult = DocumentScanner.scanFile(source.path, {
        includeContent: true
      });

      // Update the source with new data
      Object.assign(source, {
        wordCount: scanResult.wordCount,
        lineCount: scanResult.lineCount,
        headings: scanResult.headings,
        links: scanResult.links,
        codeBlocks: scanResult.codeBlocks,
        content: scanResult.content,
        snippet: scanResult.snippet,
        checksum: scanResult.checksum,
        lastModified: scanResult.lastModified,
        indexedAt: Date.now()
      });

      this.saveIndex();
      return true;
    } catch (error) {
      console.warn(`Failed to reindex ${source.path}:`, error.message);
      return false;
    }
  }

  /**
   * Update index for all files that have changed
   */
  updateIndex(options = {}) {
    const { progressCallback } = options;
    this.loadIndex();

    const fileSources = this.index.sources.filter(s => s.type === 'local_file');
    let updatedCount = 0;

    for (const source of fileSources) {
      if (this.needsReindex(source)) {
        progressCallback?.(`Reindexing: ${source.title}`);
        if (this.reindexFile(source)) {
          updatedCount++;
        }
      }
    }

    // Remove sources for files that no longer exist
    const initialLength = this.index.sources.length;
    this.index.sources = this.index.sources.filter(s => {
      if (s.type === 'local_file') {
        return fs.existsSync(s.path);
      }
      return true;
    });

    if (this.index.sources.length < initialLength) {
      this.saveIndex();
    }

    return { updatedCount, removedCount: initialLength - this.index.sources.length };
  }

  // --------------------------------------------------------------------------
  // Knowledge Query
  // --------------------------------------------------------------------------

  calculateRelevance(question, source) {
    const questionLower = question.toLowerCase();
    const questionWords = questionLower.split(/\s+/).filter(w => w.length > 2);

    let score = 0;
    const weights = {
      title: 0.35,
      tags: 0.25,
      content: 0.30,
      headings: 0.10
    };

    // 1. Title matching
    const titleLower = (source.title || '').toLowerCase();
    const titleWords = titleLower.split(/\s+/);
    let titleMatches = 0;
    questionWords.forEach(word => {
      if (titleWords.some(t => t.includes(word) || word.includes(t))) {
        titleMatches++;
      }
    });
    score += (titleMatches / Math.max(questionWords.length, 1)) * weights.title;

    // 2. Tag matching
    if (source.tags && source.tags.length > 0) {
      let tagMatches = 0;
      questionWords.forEach(word => {
        if (source.tags.some(t => t.toLowerCase().includes(word))) {
          tagMatches++;
        }
      });
      score += (tagMatches / Math.max(questionWords.length, 1)) * weights.tags;
    }

    // 3. Content matching (full-text search)
    if (source.content || source.snippet) {
      const contentLower = (source.content || source.snippet || '').toLowerCase();
      let contentMatches = 0;
      questionWords.forEach(word => {
        if (contentLower.includes(word)) {
          contentMatches++;
        }
      });
      score += (contentMatches / Math.max(questionWords.length, 1)) * weights.content;

      // Boost for exact phrase match
      if (contentLower.includes(questionLower)) {
        score += 0.2;
      }
    }

    // 4. Headings matching
    if (source.headings && source.headings.length > 0) {
      let headingMatches = 0;
      questionWords.forEach(word => {
        if (source.headings.some(h => h.text && h.text.toLowerCase().includes(word))) {
          headingMatches++;
        }
      });
      score += (headingMatches / Math.max(questionWords.length, 1)) * weights.headings;
    }

    return Math.min(score, 1);
  }

  /**
   * Query the knowledge base with NotebookLM integration
   */
  async query(question, options = {}) {
    this.loadIndex();

    const {
      includeWeb = false,
      maxSources = 5,
      progressCallback,
      useNotebookLM = true
    } = options;

    const sources = [];
    const webResults = [];
    let notebooklmAnswer = null;

    // Step 1: Search local knowledge base
    await progressCallback?.('Searching local knowledge base...', 1, 5);

    const localSources = this.index.sources.filter(
      s => s.type === 'local_file' || s.type === 'local_directory'
    );

    for (const source of localSources.slice(0, maxSources)) {
      const relevance = this.calculateRelevance(question, source);
      if (relevance > 0.3) {
        sources.push({
          title: source.title,
          type: source.type,
          relevance,
          excerpt: `Excerpt from ${source.title}`
        });
        source.lastAccessed = Date.now();
      }
    }

    // Step 2: Query NotebookLM if available and enabled
    await progressCallback?.('Querying NotebookLM...', 2, 5);

    const notebooklmSources = this.index.sources.filter(s => s.type === 'notebooklm');

    if (useNotebookLM && notebooklmSources.length > 0 && getClient) {
      try {
        const client = getClient();

        // Check if authenticated
        const stats = client.getStats();
        if (!stats.authenticated) {
          sources.push({
            title: 'NotebookLM (requires auth)',
            type: 'notebooklm',
            relevance: 0.9,
            excerpt: 'NotebookLM requires authentication. Run: smc notebooklm auth'
          });
        } else {
          // Use the first NotebookLM source
          const notebookUrl = notebooklmSources[0].notebookUrl || null;
          notebooklmAnswer = await client.ask(notebookUrl, question, (msg) => {
            // Forward progress
          });

          sources.push({
            title: 'NotebookLM',
            type: 'notebooklm',
            relevance: 1.0,
            excerpt: notebooklmAnswer?.substring(0, 200) + '...'
          });
        }
      } catch (error) {
        sources.push({
          title: 'NotebookLM (error)',
          type: 'notebooklm',
          relevance: 0.5,
          excerpt: `NotebookLM query failed: ${error.message}`
        });
      }
    } else if (notebooklmSources.length === 0) {
      sources.push({
        title: 'NotebookLM',
        type: 'notebooklm',
        relevance: 0.5,
        excerpt: 'No NotebookLM sources added. Add one with: smc knowledge notebook <url> <title>'
      });
    }

    // Step 3: Web search
    if (includeWeb) {
      await progressCallback?.('Searching web for latest information...', 3, 5);

      try {
        // Check cache first
        const cached = SearchCache.get(question);
        if (cached && cached.length > 0) {
          webResults.push(...cached);
          await progressCallback?.('Using cached web results...', 4, 5);
        } else {
          // Perform fresh search
          const freshResults = await WebSearch.search(question, { maxResults: 5 });
          if (freshResults.length > 0) {
            webResults.push(...freshResults);
            // Cache the results
            SearchCache.set(question, freshResults);
          }
        }
      } catch (error) {
        // Graceful degradation - search failed but continue
        webResults.push({
          title: 'Web Search (unavailable)',
          url: '#',
          excerpt: `Web search is currently unavailable: ${error.message}. Try again later.`,
          source: 'error'
        });
      }
    }

    // Step 4: Synthesize answer
    await progressCallback?.('Synthesizing answer...', 4, 5);

    // Use NotebookLM answer if available, otherwise fall back to synthesis
    let finalAnswer;
    if (notebooklmAnswer) {
      finalAnswer = notebooklmAnswer;
    } else {
      finalAnswer = this.synthesizeAnswer(question, sources, webResults);
    }

    await progressCallback?.('Query complete!', 5, 5);

    return {
      answer: finalAnswer,
      sources: sources.slice(0, maxSources).sort((a, b) => b.relevance - a.relevance),
      webResults,
      confidence: this.calculateConfidence(sources, webResults),
      notebooklmUsed: !!notebooklmAnswer
    };
  }

  /**
   * Query NotebookLM directly (bypass local knowledge)
   */
  async queryNotebookLM(question, notebookUrl = null, progressCallback) {
    if (!getClient) {
      throw new Error('NotebookLM module not available. Install patchright: npm install patchright');
    }

    const client = getClient();
    const stats = client.getStats();

    if (!stats.authenticated) {
      throw new Error('Not authenticated. Run: smc notebooklm auth');
    }

    await progressCallback?.('Asking NotebookLM...');
    const answer = await client.ask(notebookUrl, question, (msg) => {
      // Forward progress silently or log
    });

    return {
      answer,
      notebooklmUsed: true,
      confidence: 0.95
    };
  }

  synthesizeAnswer(question, sources, webResults) {
    if (sources.length === 0 && (!webResults || webResults.length === 0)) {
      return `No relevant information found in the knowledge base for: "${question}"`;
    }

    let answer = `Based on the knowledge base, here's what I found regarding "${question}":\n\n`;

    if (sources.length > 0) {
      answer += `**Local Knowledge:**\n`;
      sources.forEach(source => {
        answer += `- ${source.title} (relevance: ${(source.relevance * 100).toFixed(0)}%)\n`;
        if (source.excerpt && source.excerpt !== 'Excerpt from ' + source.title) {
          answer += `  ${source.excerpt.substring(0, 150)}${source.excerpt.length > 150 ? '...' : ''}\n`;
        }
      });
      answer += '\n';
    }

    if (webResults && webResults.length > 0) {
      answer += `**Web Sources:**\n`;
      webResults.forEach(result => {
        // Format URL for display (decode if needed)
        let displayUrl = result.url;
        if (displayUrl.startsWith('a1aHR0c')) {
          // URL appears to be still encoded
          try {
            displayUrl = Buffer.from(displayUrl, 'base64').toString('ascii');
            // Extract the actual URL from the encoded string
            const urlMatch = displayUrl.match(/https?:\/\/[^&\s]+/);
            if (urlMatch) displayUrl = urlMatch[0];
          } catch (e) {}
        }

        answer += `- [${result.title}](${displayUrl})\n`;
        if (result.excerpt && result.excerpt !== 'No description available.') {
          answer += `  ${result.excerpt.substring(0, 200)}${result.excerpt.length > 200 ? '...' : ''}\n`;
        }
      });
    }

    return answer;
  }

  calculateConfidence(sources, webResults) {
    const sourceCount = sources.length + (webResults?.length || 0);
    const avgRelevance = sources.reduce((sum, s) => sum + s.relevance, 0) / Math.max(sources.length, 1);

    return Math.min((sourceCount / 5) * 0.5 + avgRelevance * 0.5, 1);
  }

  // --------------------------------------------------------------------------
  // Statistics
  // --------------------------------------------------------------------------

  getStats() {
    this.loadIndex();

    const sourcesByType = {};
    this.index.sources.forEach(s => {
      sourcesByType[s.type] = (sourcesByType[s.type] || 0) + 1;
    });

    return {
      totalSources: this.index.sources.length,
      sourcesByType,
      lastUpdated: this.index.lastUpdated
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let knowledgeEngineInstance = null;

function getKnowledgeEngine() {
  if (!knowledgeEngineInstance) {
    knowledgeEngineInstance = new KnowledgeEngine();
  }
  return knowledgeEngineInstance;
}

// ============================================================================
// CLI Helpers
// ============================================================================

async function handleKnowledgeCommand(args) {
  const engine = getKnowledgeEngine();
  const [action, ...rest] = args;

  switch (action) {
    case 'add': {
      const [filePath, ...restArgs] = rest;
      if (!filePath) {
        console.error('Usage: smc knowledge add <file|directory> [tags...] [--recursive] [--max-depth=N]');
        process.exit(1);
      }

      try {
        // Parse options
        const tags = restArgs.filter(arg => !arg.startsWith('--'));
        const isRecursive = restArgs.includes('--recursive');
        const maxDepthMatch = restArgs.find(arg => arg.startsWith('--max-depth='));
        const maxDepth = maxDepthMatch ? parseInt(maxDepthMatch.split('=')[1]) : 10;

        const resolvedPath = path.resolve(filePath);
        const stats = fs.existsSync(resolvedPath) ? fs.statSync(resolvedPath) : null;

        if (stats && stats.isDirectory()) {
          // Add directory
          console.log(`📁 Scanning directory: ${filePath}`);
          const addedIds = engine.addDirectory(filePath, tags, {
            recursive: isRecursive !== false, // default true
            maxDepth
          });
          console.log(`✅ Added ${addedIds.length} files from directory`);
        } else if (stats && stats.isFile()) {
          // Add single file
          const id = engine.addFile(filePath, tags);
          const source = engine.getSource(id);
          const scanInfo = source.scannable
            ? ` (${source.wordCount} words, ${source.headings?.length || 0} headings)`
            : ' (not scannable)';
          console.log(`✅ Added: ${source.title}${scanInfo}`);
        } else {
          console.error(`❌ Error: File not found: ${filePath}`);
          process.exit(1);
        }
      } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
      }
      break;
    }

    case 'list': {
      const sources = engine.listSources();
      console.log(`\n📚 Knowledge Base (${sources.length} sources):\n`);

      if (sources.length === 0) {
        console.log('  No knowledge sources yet.');
        console.log('  Add sources with: smc knowledge add <file|directory> [tags...]');
      } else {
        const icons = {
          local_file: '📄',
          local_directory: '📁',
          notebooklm: '📓',
          web_search: '🔍',
          web_url: '🌐'
        };

        sources.forEach(source => {
          const icon = icons[source.type] || '📄';
          const tags = source.tags && source.tags.length > 0 ? ` [${source.tags.join(', ')}]` : '';
          console.log(`  ${icon} ${source.title}${tags}`);

          // Show file info
          if (source.scannable) {
            const wordInfo = source.wordCount ? `${source.wordCount} words` : '';
            const headingInfo = source.headings && source.headings.length > 0 ? `${source.headings.length} headings` : '';
            const details = [wordInfo, headingInfo].filter(Boolean).join(', ');
            if (details) {
              console.log(`     📊 ${details}`);
            }
          }

          console.log(`     Type: ${source.type} | Added: ${new Date(source.addedAt).toLocaleDateString()}`);
        });
      }
      console.log('');
      break;
    }

    case 'query': {
      const question = rest.join(' ').replace('--web', '').trim();
      if (!question) {
        console.error('Usage: smc knowledge query "<question>" [--web]');
        process.exit(1);
      }

      const includeWeb = rest.includes('--web');
      const result = await engine.query(question, { includeWeb });

      console.log(`\n${result.answer}\n`);
      console.log(`Confidence: ${(result.confidence * 100).toFixed(0)}%`);
      break;
    }

    case 'stats': {
      const stats = engine.getStats();
      console.log('\n📊 Knowledge Base Statistics:\n');
      console.log(`  Total Sources: ${stats.totalSources}`);
      console.log('  By Type:');
      Object.entries(stats.sourcesByType).forEach(([type, count]) => {
        console.log(`    - ${type}: ${count}`);
      });
      console.log(`  Last Updated: ${new Date(stats.lastUpdated).toLocaleString()}\n`);
      break;
    }

    case 'remove': {
      const [id] = rest;
      if (!id) {
        console.error('Usage: smc knowledge remove <source-id>');
        process.exit(1);
      }

      if (engine.removeSource(id)) {
        console.log(`✅ Removed knowledge source: ${id}`);
      } else {
        console.error(`❌ Source not found: ${id}`);
        process.exit(1);
      }
      break;
    }

    case 'update': {
      console.log('🔄 Checking for file changes...\n');
      const result = engine.updateIndex({
        progressCallback: (msg) => console.log(`  ${msg}`)
      });

      if (result.updatedCount === 0 && result.removedCount === 0) {
        console.log('✅ Index is up to date!');
      } else {
        console.log(`\n✅ Updated: ${result.updatedCount} files`);
        if (result.removedCount > 0) {
          console.log(`   Removed: ${result.removedCount} deleted files`);
        }
      }
      break;
    }

    case 'cache': {
      const [action] = rest;
      if (action === 'clear') {
        const cleared = SearchCache.clear();
        console.log(`🗑️  Cleared ${cleared} cached search results`);
      } else if (action === 'clean') {
        const cleaned = SearchCache.clean();
        console.log(`🧹 Cleaned ${cleaned} expired cache entries`);
      } else if (action === 'stats') {
        const stats = SearchCache.getStats();
        console.log('\n📊 Search Cache Statistics:\n');
        console.log(`  Total Entries: ${stats.totalEntries}`);
        console.log(`  Valid Entries: ${stats.validEntries}`);
        console.log(`  Cache Size: ${(stats.totalSize / 1024).toFixed(2)} KB`);
        console.log(`  Cache Dir: ${stats.cacheDir}\n`);
      } else {
        console.log(`
Search Cache Commands:

  smc knowledge cache clear             Clear all cached results
  smc knowledge cache clean             Remove expired entries
  smc knowledge cache stats             Show cache statistics
        `);
      }
      break;
    }

    case 'sync': {
      console.log('🔄 NotebookLM sync pending - requires notebooklm-mcp integration');
      break;
    }

    default:
      console.log(`
Knowledge Base Commands:

  smc knowledge add <file|directory> [tags...]    Add a knowledge source
  smc knowledge list                             List all sources
  smc knowledge query "<question>" [--web]       Query the knowledge base
  smc knowledge remove <source-id>               Remove a source
  smc knowledge update                           Update index for changed files
  smc knowledge cache <clear|clean|stats>        Manage search cache
  smc knowledge stats                            Show statistics
  smc knowledge sync                             Sync with NotebookLM

Examples:
  smc knowledge add ./docs/best-practices.md architecture
  smc knowledge add ./docs --recursive
  smc knowledge list
  smc knowledge query "What are the best practices for API design?"
  smc knowledge query --web "React 19 new features"
  smc knowledge update
  smc knowledge cache stats
      `);
  }
}

module.exports = {
  KnowledgeEngine,
  getKnowledgeEngine,
  handleKnowledgeCommand
};
