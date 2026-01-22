/**
 * NotebookLM Browser Automation Module (Simplified)
 *
 * Provides browser automation for NotebookLM interactions:
 * - Authentication management
 * - Session management
 * - Question/answer with streaming detection
 * - Human-like behavior simulation
 *
 * This is a simplified version of notebooklm-mcp core modules
 * adapted for integration into sumulige-claude.
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_CONFIG = {
  // Browser settings
  headless: true,
  viewport: { width: 1024, height: 768 },

  // Timeout settings
  browserTimeout: 120000, // 2 minutes
  responseTimeout: 60000,  // 1 minute
  sessionTimeout: 900000, // 15 minutes

  // Stealth settings
  stealthEnabled: true,
  humanTyping: true,
  typingWpmMin: 90,
  typingWpmMax: 120,
  randomDelays: true,
  minDelayMs: 100,
  maxDelayMs: 300,

  // URLs
  notebookUrl: 'https://notebooklm.google.com',
  authUrl: 'https://accounts.google.com'
};

// ============================================================================
// Path Management
// ============================================================================

class PathManager {
  constructor() {
    // Use cross-platform home directory
    const homeDir = require('os').homedir();
    const appName = 'sumulige-claude';

    // Platform-specific data directory
    const platform = require('os').platform();
    let baseDir;

    if (platform === 'darwin') {
      baseDir = path.join(homeDir, 'Library', 'Application Support', appName);
    } else if (platform === 'win32') {
      baseDir = path.join(homeDir, 'AppData', 'Roaming', appName);
    } else {
      baseDir = path.join(homeDir, '.local', 'share', appName);
    }

    // Fallback to home directory if platform-specific path fails
    this.dataDir = baseDir || path.join(homeDir, `.${appName}`);
    this.browserStateDir = path.join(this.dataDir, 'notebooklm-state');
    this.stateFilePath = path.join(this.browserStateDir, 'state.json');
    this.sessionFilePath = path.join(this.browserStateDir, 'session.json');
    this.ensureDirectories();
  }

  ensureDirectories() {
    if (!fs.existsSync(this.browserStateDir)) {
      fs.mkdirSync(this.browserStateDir, { recursive: true });
    }
  }

  getStatePath() {
    return fs.existsSync(this.stateFilePath) ? this.stateFilePath : null;
  }

  getSessionPath() {
    return this.sessionFilePath;
  }

  getDataDir() {
    return this.dataDir;
  }
}

// ============================================================================
// Stealth Utilities (Human-like behavior)
// ============================================================================

class StealthUtils {
  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  static randomFloat(min, max) {
    return Math.random() * (max - min) + min;
  }

  // Gaussian distribution (Box-Muller transform)
  static gaussian(mean, stdDev) {
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return z0 * stdDev + mean;
  }

  static async randomDelay(minMs, maxMs) {
    minMs = minMs ?? DEFAULT_CONFIG.minDelayMs;
    maxMs = maxMs ?? DEFAULT_CONFIG.maxDelayMs;

    if (!DEFAULT_CONFIG.stealthEnabled || !DEFAULT_CONFIG.randomDelays) {
      const target = (minMs + maxMs) / 2;
      if (target > 0) await this.sleep(target);
      return;
    }

    const mean = minMs + (maxMs - minMs) * 0.6;
    const stdDev = (maxMs - minMs) * 0.2;
    let delay = this.gaussian(mean, stdDev);
    delay = Math.max(minMs, Math.min(maxMs, delay));

    await this.sleep(delay);
  }

  // Calculate delay per character based on WPM
  static getTypingDelay(wpm) {
    const charsPerMinute = wpm * 5;
    return (60 * 1000) / charsPerMinute;
  }

  // Get pause duration for punctuation
  static getPunctuationPause(char) {
    const pauses = {
      '.': 300,
      '!': 350,
      '?': 300,
      ',': 150,
      ';': 200,
      ':': 200,
      ' ': 50,
      '\n': 400
    };
    return pauses[char] || 50;
  }
}

// ============================================================================
// Page Utilities (NotebookLM specific)
// ============================================================================

class PageUtils {
  // CSS selectors for NotebookLM responses
  static RESPONSE_SELECTORS = [
    // Primary NotebookLM selectors
    '.to-user-container .message-text-content',
    '.to-user-container .markdown-content',
    '.to-user-container',
    // Generic bot/assistant selectors
    '[data-message-author="bot"]',
    '[data-message-author="assistant"]',
    '[data-message-role="assistant"]',
    // Content containers
    'markdown-response',
    '.response-text',
    '.message-text-content',
    // Data attributes
    '[data-automation-id="response-text"]',
    '[data-automation-id="assistant-response"]',
    // Last resort
    '.message-text',
    '[role="log"]'
  ];

  // Placeholder texts to ignore
  static PLACEHOLDERS = new Set([
    '',
    '...',
    'Thinking...',
    'Generating response...',
    'Please wait...',
    'Finding relevant info...',
    'Searching',
    'Loading'
  ]);

  /**
   * Extract latest response from NotebookLM page
   */
  static async extractLatestResponse(page, existingHashes = new Set()) {
    for (const selector of this.RESPONSE_SELECTORS) {
      try {
        const elements = await page.$$(selector);
        if (elements.length > 0) {
          // Get the last (latest) element
          const latest = elements[elements.length - 1];
          const text = await latest.evaluate(el => el.textContent?.trim() || '');
          const hash = this.hashString(text);

          // Only return if it's a new response (not in existing hashes)
          if (text && !this.PLACEHOLDERS.has(text) && !existingHashes.has(hash)) {
            return { text, hash, selector };
          }
        }
      } catch (e) {
        continue;
      }
    }
    return null;
  }

  /**
   * Snapshot all existing responses before asking a question
   */
  static async snapshotAllResponses(page) {
    const hashes = new Set();
    const texts = [];

    try {
      const containers = await page.$$('.to-user-container');
      for (const container of containers) {
        try {
          const textEl = await container.$('.message-text-content');
          if (textEl) {
            const text = await textEl.evaluate(el => el.textContent?.trim() || '');
            if (text) {
              hashes.add(this.hashString(text));
              texts.push(text);
            }
          }
        } catch (e) {
          continue;
        }
      }
    } catch (e) {
      // Ignore errors
    }

    return { hashes, texts };
  }

  /**
   * Wait for new response with streaming detection
   */
  static async waitForNewResponse(page, existingHashes, timeout = 120000) {
    const startTime = Date.now();
    let stableCount = 0;
    const STABLE_THRESHOLD = 5;  // Increased for better detection
    const POLL_INTERVAL = 1000;  // Increased to reduce CPU usage
    let lastResponse = null;
    let lastLength = 0;

    console.log(`⏳ Waiting for response (timeout: ${timeout/1000}s)...`);

    while (Date.now() - startTime < timeout) {
      await StealthUtils.sleep(POLL_INTERVAL);

      const response = await this.extractLatestResponse(page, existingHashes);

      if (response) {
        const currentLength = response.text.length;

        // Check if response is growing (streaming) or stable
        if (lastResponse && lastResponse.text === response.text) {
          stableCount++;
          if (stableCount >= STABLE_THRESHOLD) {
            console.log(`✅ Response complete (${response.text.length} chars)`);
            return response.text;
          }
        } else if (currentLength > lastLength) {
          // Response is still growing
          stableCount = 0;
          lastResponse = response;
          lastLength = currentLength;
          console.log(`⏳ Receiving... (${currentLength} chars)`);
        } else {
          // Different response (unlikely but handle it)
          stableCount = 0;
          lastResponse = response;
          lastLength = currentLength;
        }
      } else {
        // No new response yet, check existing ones
        const allTexts = await this.snapshotAllResponses(page);
        if (allTexts.texts.length > 0) {
          const latest = allTexts.texts[allTexts.texts.length - 1];
          if (latest && latest.length > 0 && !this.PLACEHOLDERS.has(latest)) {
            lastResponse = { text: latest };
            lastLength = latest.length;
          }
        }
      }

      // Progress indicator
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
      process.stdout.write(`\r⏳ ${elapsed}s / ${timeout/1000}s`);
    }

    process.stdout.write('\n');

    if (lastResponse) {
      console.log(`✅ Got response (${lastResponse.text.length} chars)`);
      return lastResponse.text;
    }

    return null;
  }

  static hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash + char) & 0xffffffff;
    }
    return hash.toString(36);
  }
}

// ============================================================================
// Authentication Manager
// ============================================================================

class AuthManager {
  constructor() {
    this.paths = new PathManager();
  }

  /**
   * Check if saved state exists and is valid
   */
  hasValidState() {
    const statePath = this.paths.getStatePath();
    if (!statePath) return false;

    // Check if state is less than 24 hours old
    const stats = fs.statSync(statePath);
    const age = Date.now() - stats.mtime.getTime();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    return age < maxAge;
  }

  /**
   * Get the state file path for loading
   */
  getStatePath() {
    return this.paths.getStatePath();
  }

  /**
   * Save browser state after authentication
   */
  async saveState(context, page) {
    try {
      // Save cookies and localStorage
      await context.storageState({ path: this.paths.stateFilePath });

      // Save sessionStorage separately
      if (page) {
        const sessionStorage = await page.evaluate(() => {
          const storage = {};
          for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key) {
              storage[key] = sessionStorage.getItem(key) || '';
            }
          }
          return JSON.stringify(storage);
        });

        await fs.promises.writeFile(
          this.paths.sessionFilePath,
          sessionStorage,
          'utf-8'
        );
      }

      return true;
    } catch (error) {
      console.error('Failed to save state:', error.message);
      return false;
    }
  }

  /**
   * Clear all authentication data
   */
  async clearState() {
    try {
      if (fs.existsSync(this.paths.stateFilePath)) {
        fs.unlinkSync(this.paths.stateFilePath);
      }
      if (fs.existsSync(this.paths.sessionFilePath)) {
        fs.unlinkSync(this.paths.sessionFilePath);
      }
      return true;
    } catch (error) {
      console.error('Failed to clear state:', error.message);
      return false;
    }
  }

  /**
   * Load sessionStorage data
   */
  async loadSessionStorage() {
    try {
      const data = await fs.promises.readFile(this.paths.sessionFilePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }
}

// ============================================================================
// NotebookLM Session
// ============================================================================

class NotebookLMSession {
  constructor(notebookUrl, options = {}) {
    this.notebookUrl = notebookUrl || DEFAULT_CONFIG.notebookUrl;
    this.options = { ...DEFAULT_CONFIG, ...options };
    this.authManager = new AuthManager();
    this.browser = null;
    this.context = null;
    this.page = null;
    this.isActive = false;
    this.createdAt = Date.now();
    this.lastActivity = Date.now();
  }

  /**
   * Initialize the browser session
   */
  async init() {
    // Check if patchright is available
    let patchright;
    try {
      patchright = require('patchright');
    } catch (e) {
      throw new Error('patchright is not installed. Install with: npm install patchright');
    }

    const paths = new PathManager();
    const statePath = this.authManager.getStatePath();
    const needsAuth = !this.authManager.hasValidState();

    console.log(`🔑 Authentication needed: ${needsAuth ? 'YES' : 'NO (using saved state)'}`);

    // Launch browser
    this.browser = await patchright.chromium.launchPersistentContext(
      paths.getDataDir(),
      {
        headless: this.options.headless && !needsAuth, // Show browser for auth
        channel: 'chrome',
        viewport: this.options.viewport,
        args: [
          '--disable-blink-features=AutomationControlled'
        ]
      }
    );

    // Get or create page
    const pages = this.browser.pages();
    this.page = pages[0] || await this.browser.newPage();
    this.context = this.browser;

    // Load existing state if available
    if (statePath && !needsAuth) {
      // State is loaded automatically by launchPersistentContext

      // Restore sessionStorage
      const sessionData = await this.authManager.loadSessionStorage();
      if (sessionData) {
        await this.page.evaluate((data) => {
          for (const [key, value] of Object.entries(data)) {
            sessionStorage.setItem(key, String(value));
          }
        }, sessionData);
      }
    }

    // Navigate to NotebookLM with longer timeout
    await this.page.goto(this.notebookUrl, { waitUntil: 'domcontentloaded', timeout: 120000 });

    // Wait for page to be fully loaded
    await StealthUtils.sleep(2000);

    // Check if we need to create/select a notebook
    const currentUrl = this.page.url();
    console.log(`Current URL: ${currentUrl}`);

    // Check if authentication is needed
    if (needsAuth) {
      console.log('🔐 Please authenticate in the browser window...');
      console.log('✋ Sign in with your Google account, then close the browser when done.');

      // Wait for authentication (user will close browser when done)
      await this.waitForAuthentication();

      // Save the authenticated state
      await this.authManager.saveState(this.context, this.page);
      console.log('✅ Authentication state saved!');
      console.log('');
      console.log('💡 Next: Create a notebook in NotebookLM and save its URL for asking questions.');
    }

    this.isActive = true;
    this.lastActivity = Date.now();

    return true;
  }

  /**
   * Wait for user to complete authentication
   */
  async waitForAuthentication() {
    // Wait for navigation to authenticated state
    // This is a simple implementation - in production you'd poll for auth cookies
    return new Promise((resolve) => {
      const checkAuth = async () => {
        const cookies = await this.context.cookies();
        const hasAuthCookie = cookies.some(c =>
          c.name === 'SID' || c.name === 'HSID' || c.name === 'SSID'
        );

        if (hasAuthCookie) {
          // Wait a bit more for page to load
          await StealthUtils.sleep(2000);
          resolve();
        } else {
          setTimeout(checkAuth, 2000);
        }
      };

      // Start checking after initial page load
      setTimeout(checkAuth, 3000);
    });
  }

  /**
   * Ask a question to NotebookLM
   */
  async ask(question, progressCallback) {
    if (!this.isActive) {
      throw new Error('Session is not active. Call init() first.');
    }

    await progressCallback?.('Asking NotebookLM...');

    // Snapshot existing responses
    const { hashes: existingHashes } = await PageUtils.snapshotAllResponses(this.page);

    // Find and click the input field - expanded selectors for NotebookLM
    const inputSelectors = [
      // Google-specific selectors
      'textarea[aria-label*="ask" i]',
      'textarea[aria-label*="message" i]',
      'textarea[aria-label*="chat" i]',
      'textarea[placeholder*="ask" i]',
      'textarea[placeholder*="Ask" i]',
      'textarea[placeholder*="Chat" i]',
      // Generic selectors
      'textarea.contenteditable',
      'rich-textarea',
      'div[contenteditable="true"] textarea',
      'div[contenteditable="true"]',
      'textarea',
      // Data attributes
      '[data-test-id="chat-input"]',
      '[data-testid="chat-input"]',
      '[data-test-id="prompt-input"]',
      '[data-testid="prompt-input"]',
      '[data-automation-id="chat-input"]',
      // Specific classes
      '.ql-editor',
      '.ProseMirror',
      'markdown-textarea',
      // If all else fails, get all textareas
      'textarea'
    ];

    let inputField = null;
    let usedSelector = null;

    for (const selector of inputSelectors) {
      try {
        const elements = await this.page.$$(selector);
        for (const el of elements) {
          try {
            const isVisible = await el.isVisible();
            const isEnabled = await el.isEnabled().catch(() => true);
            if (isVisible && isEnabled) {
              inputField = el;
              usedSelector = selector;
              break;
            }
          } catch (e) {
            continue;
          }
        }
        if (inputField) break;
      } catch (e) {
        continue;
      }
    }

    if (!inputField) {
      // Debug: list all potential input elements on page
      const allTextareas = await this.page.$$('textarea, [contenteditable="true"]');
      console.log(`Found ${allTextareas.length} potential input elements on page`);

      // Try to get page title for debugging
      const title = await this.page.title().catch(() => 'Unknown');
      const url = this.page.url();
      console.log(`Page title: ${title}`);
      console.log(`Current URL: ${url}`);

      // Check if we're on the NotebookLM homepage
      const isHomepage = url.includes('notebooklm.google') &&
                        (url === 'https://notebooklm.google.com/' ||
                         url === 'https://notebooklm.google.com' ||
                         url.includes('notebooklm.google/?'));

      if (isHomepage) {
        throw new Error('You are on the NotebookLM homepage. Please:\n' +
                        '1. Create a new notebook or open an existing one\n' +
                        '2. Copy the notebook URL\n' +
                        '3. Use that URL with the command: smc notebooklm ask "<question>" <notebook-url>');
      }

      throw new Error('Could not find input field on the page. Make sure you are on a NotebookLM notebook page.');
    }

    console.log(`✅ Found input field using selector: ${usedSelector}`);

    // Type the question with human-like behavior
    await progressCallback?.('Typing question...');

    if (this.options.humanTyping) {
      // Use the selector we found, not inputField.selector()
      await this.humanType(usedSelector, question);
    } else {
      await inputField.fill(question);
    }

    await StealthUtils.randomDelay(200, 500);

    // Submit (press Enter)
    await this.page.keyboard.press('Enter');

    await progressCallback?.('Waiting for response...');

    // Wait for new response
    const response = await PageUtils.waitForNewResponse(
      this.page,
      existingHashes,
      this.options.responseTimeout
    );

    this.lastActivity = Date.now();

    if (!response) {
      throw new Error('No response received within timeout period');
    }

    await progressCallback?.('Response received!');

    return response;
  }

  /**
   * Type text with human-like behavior
   */
  async humanType(selector, text) {
    const avgDelay = StealthUtils.getTypingDelay(
      StealthUtils.randomInt(this.options.typingWpmMin, this.options.typingWpmMax)
    );

    await this.page.fill(selector, '');
    await this.page.click(selector);
    await StealthUtils.randomDelay(50, 150);

    for (const char of text) {
      await this.page.keyboard.type(char);
      const pause = StealthUtils.getPunctuationPause(char);
      const variance = StealthUtils.randomFloat(-30, 30);
      await StealthUtils.sleep(Math.max(20, avgDelay + pause + variance));
    }
  }

  /**
   * Check if session has expired
   */
  isExpired() {
    const age = Date.now() - this.lastActivity;
    return age > this.options.sessionTimeout;
  }

  /**
   * Close the session
   */
  async close() {
    this.isActive = false;

    if (this.page) {
      await this.page.close().catch(() => {});
    }

    if (this.context) {
      await this.context.close().catch(() => {});
    }

    if (this.browser) {
      await this.browser.close().catch(() => {});
    }

    this.page = null;
    this.context = null;
    this.browser = null;
  }

  /**
   * Get session info
   */
  getInfo() {
    return {
      notebookUrl: this.notebookUrl,
      isActive: this.isActive,
      createdAt: this.createdAt,
      lastActivity: this.lastActivity,
      age: Date.now() - this.createdAt,
      inactiveTime: Date.now() - this.lastActivity
    };
  }
}

// ============================================================================
// Session Manager
// ============================================================================

class SessionManager {
  constructor() {
    this.sessions = new Map();
    this.maxSessions = 5;
  }

  /**
   * Get or create a session for a notebook
   */
  async getSession(notebookUrl, options = {}) {
    // Clean up expired sessions first
    this.cleanupExpired();

    // Find existing session for this notebook
    for (const [id, session] of this.sessions) {
      if (session.notebookUrl === notebookUrl && session.isActive && !session.isExpired()) {
        session.lastActivity = Date.now();
        return session;
      }
    }

    // Create new session
    if (this.sessions.size >= this.maxSessions) {
      // Close oldest inactive session
      const oldest = [...this.sessions.entries()].sort((a, b) => a[1].lastActivity - b[1].lastActivity)[0];
      await this.sessions.get(oldest)?.close();
      this.sessions.delete(oldest);
    }

    const session = new NotebookLMSession(notebookUrl, options);
    await session.init();
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    this.sessions.set(sessionId, session);

    return session;
  }

  /**
   * Close a specific session
   */
  async closeSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      await session.close();
      this.sessions.delete(sessionId);
      return true;
    }
    return false;
  }

  /**
   * Close all sessions
   */
  async closeAll() {
    const promises = [...this.sessions.values()].map(s => s.close());
    await Promise.all(promises);
    this.sessions.clear();
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpired() {
    for (const [id, session] of this.sessions) {
      if (session.isExpired()) {
        session.close().catch(() => {});
        this.sessions.delete(id);
      }
    }
  }

  /**
   * Get session statistics
   */
  getStats() {
    const active = [...this.sessions.values()].filter(s => s.isActive).length;
    return {
      total: this.sessions.size,
      active,
      maxSessions: this.maxSessions
    };
  }
}

// ============================================================================
// Main NotebookLM Client
// ============================================================================

class NotebookLMClient {
  constructor() {
    this.sessionManager = new SessionManager();
    this.authManager = new AuthManager();
  }

  /**
   * Check if authenticated
   */
  isAuthenticated() {
    return this.authManager.hasValidState();
  }

  /**
   * Setup authentication (opens browser for manual login)
   */
  async setup(progressCallback) {
    await progressCallback?.('Launching browser for authentication...');

    const session = new NotebookLMSession(null, { headless: false });
    await session.init();
    await session.close();

    await progressCallback?.('Authentication complete!');

    return true;
  }

  /**
   * Ask a question to NotebookLM
   */
  async ask(notebookUrl, question, progressCallback) {
    const session = await this.sessionManager.getSession(notebookUrl);
    return await session.ask(question, progressCallback);
  }

  /**
   * Close all sessions
   */
  async closeAll() {
    await this.sessionManager.closeAll();
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      authenticated: this.isAuthenticated(),
      sessions: this.sessionManager.getStats()
    };
  }
}

// ============================================================================
// Module Singleton
// ============================================================================

let clientInstance = null;

function getClient() {
  if (!clientInstance) {
    clientInstance = new NotebookLMClient();
  }
  return clientInstance;
}

// ============================================================================
// CLI Command Handlers
// ============================================================================

async function handleNotebookLMCommand(args) {
  const client = getClient();
  const [action, ...rest] = args;

  switch (action) {
    case 'auth':
    case 'setup': {
      console.log('\n🔐 NotebookLM Authentication\n');

      if (client.isAuthenticated()) {
        console.log('✅ Already authenticated!');
        console.log('💡 To re-authenticate, run: smc notebooklm clear && smc notebooklm auth');
        return;
      }

      try {
        await client.setup((msg) => console.log(`  ${msg}`));
        console.log('\n✅ Authentication successful!');
      } catch (error) {
        console.error(`\n❌ Authentication failed: ${error.message}`);
        console.log('\n💡 Make sure you have Google Chrome installed');
        console.log('💡 Install patchright: npm install patchright');
        process.exit(1);
      }
      break;
    }

    case 'ask': {
      const [question, ...urlParts] = rest;
      const notebookUrl = urlParts.join(' ') || null;

      if (!question) {
        console.error('Usage: smc notebooklm ask "<question>" [notebook-url]');
        console.error('');
        console.error('Examples:');
        console.error('  smc notebooklm ask "What are best practices for API design?"');
        console.error('  smc notebooklm ask "Summarize this document" https://notebooklm.google.com/notebook/...');
        process.exit(1);
      }

      console.log(`\n📓 Asking: ${question}\n`);

      if (!notebookUrl) {
        console.log('⚠️  No notebook URL provided. You need to:');
        console.log('   1. Go to https://notebooklm.google.com');
        console.log('   2. Create a new notebook (or open an existing one)');
        console.log('   3. Add sources to your notebook (PDFs, docs, etc.)');
        console.log('   4. Copy the notebook URL from the address bar');
        console.log('   5. Run: smc notebooklm ask "' + question + '" <your-notebook-url>');
        console.log('');
        console.log('💡 The notebook URL looks like:');
        console.log('   https://notebooklm.google.com/notebook/XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX');
        console.log('');
        process.exit(1);
      }

      try {
        const response = await client.ask(notebookUrl, question, (msg) => {
          console.log(`  ${msg}`);
        });

        console.log('\n📝 Response:\n');
        console.log(response);
        console.log('\n');
      } catch (error) {
        console.error(`\n❌ Error: ${error.message}`);
        process.exit(1);
      }
      break;
    }

    case 'status': {
      const stats = client.getStats();

      console.log('\n📊 NotebookLM Status\n');
      console.log(`  Authenticated: ${stats.authenticated ? '✅ Yes' : '❌ No'}`);
      console.log(`  Active Sessions: ${stats.sessions.active}/${stats.sessions.maxSessions}`);
      console.log('');
      break;
    }

    case 'clear': {
      const authManager = new AuthManager();
      await authManager.clearState();
      await client.closeAll();
      console.log('\n✅ Cleared authentication data and closed all sessions\n');
      break;
    }

    default:
      console.log(`
NotebookLM Commands:

  smc notebooklm auth               Authenticate with NotebookLM
  smc notebooklm ask "<question>"   Ask a question
  smc notebooklm status              Show authentication status
  smc notebooklm clear               Clear authentication data

Examples:
  smc notebooklm auth
  smc notebooklm ask "What are the best practices for REST API design?"
  smc notebooklm status
      `);
  }
}

module.exports = {
  NotebookLMClient,
  NotebookLMSession,
  AuthManager,
  SessionManager,
  getClient,
  handleNotebookLMCommand,
  PageUtils,
  StealthUtils
};
