/**
 * Web Search Module - Bing HTML-based search
 *
 * Provides free web search by parsing Bing's HTML results.
 */

const https = require('https');

// ============================================================================
// Configuration
// ============================================================================

const SEARCH_TIMEOUT = 10000;
const MAX_RESULTS = 5;
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';

// ============================================================================
// Web Search Class
// ============================================================================

class WebSearch {
  /**
   * Search Bing and return results
   */
  static async search(query, options = {}) {
    const {
      maxResults = MAX_RESULTS,
      timeout = SEARCH_TIMEOUT
    } = options;

    return new Promise((resolve, reject) => {
      const encodedQuery = encodeURIComponent(query);
      const searchUrl = `https://www.bing.com/search?q=${encodedQuery}&setlang=en`;

      const urlObj = new URL(searchUrl);
      const requestOptions = {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        timeout: timeout
      };

      const req = https.get(requestOptions, (res) => {
        // Handle redirects
        if (res.statusCode === 301 || res.statusCode === 302) {
          const redirectUrl = res.headers.location;
          if (redirectUrl) {
            this.followRedirect(redirectUrl, options)
              .then(resolve)
              .catch(reject);
            return;
          }
        }

        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }

        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const results = this.parseHTML(data, maxResults);
            resolve(results);
          } catch (error) {
            reject(new Error(`Parse error: ${error.message}`));
          }
        });
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timed out'));
      });

      req.on('error', (error) => {
        reject(new Error(`Request failed: ${error.message}`));
      });
    });
  }

  /**
   * Follow HTTP redirect
   */
  static followRedirect(url, options) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === 'https:';
      const http = isHttps ? https : require('http');

      const requestOptions = {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers: { 'User-Agent': USER_AGENT },
        timeout: options.timeout || SEARCH_TIMEOUT
      };

      const req = http.get(requestOptions, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          const redirectUrl = res.headers.location;
          if (redirectUrl) {
            this.followRedirect(redirectUrl, options)
              .then(resolve)
              .catch(reject);
            return;
          }
        }

        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const results = this.parseHTML(data, options.maxResults || MAX_RESULTS);
            resolve(results);
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on('error', reject);
    });
  }

  /**
   * Parse Bing HTML results
   */
  static parseHTML(html, maxResults) {
    const results = [];

    // Bing result patterns
    // Look for <li class="b_algo"> or <li class="b_result">
    const algoRegex = /<li[^>]*class="b_algo"[^>]*>([\s\S]*?)<\/li>/g;
    let match;
    let count = 0;

    while ((match = algoRegex.exec(html)) !== null && count < maxResults) {
      const block = match[1];
      count++;

      // Extract title (from <h2><a> tag)
      const titleMatch = block.match(/<h2><a[^>]*>([^<]+)<\/a>/);
      let title = titleMatch ? this.decodeHTML(titleMatch[1]) : '';

      // Also try alternative pattern
      if (!title) {
        const altTitleMatch = block.match(/<a[^>]*h="[^"]*"[^>]*>([^<]*(?:<strong>[^<]*<\/strong>[^<]*)*)<\/a>/);
        if (altTitleMatch) {
          title = this.decodeHTML(altTitleMatch[1].replace(/<strong>/g, '').replace(/<\/strong>/g, ''));
        }
      }

      // Extract URL
      let url = '';
      const urlMatch = block.match(/<a[^>]*href="([^"]+)"/);
      if (urlMatch) {
        url = urlMatch[1];

        // Decode &amp; entities in URL
        url = url.replace(/&amp;/g, '&');

        // Clean up Bing redirect URLs
        // Format: https://www.bing.com/ck/a?!&p=...&u=<encoded_url>
        if (url.includes('bing.com/ck/a')) {
          const uMatch = url.match(/[?&]u=([^&]+)/);
          if (uMatch) {
            let encodedUrl = uMatch[1];
            try {
              // The URL is double-encoded, decode twice
              let decodedUrl = decodeURIComponent(encodedUrl);
              decodedUrl = decodeURIComponent(decodedUrl);

              // Bing sometimes adds 'a1' prefix to the final URL
              // Remove it and decode the rest as base64
              if (decodedUrl.startsWith('a1')) {
                const base64Part = decodedUrl.substring(2);
                decodedUrl = Buffer.from(base64Part, 'base64').toString('utf-8');
              }

              url = decodedUrl;
            } catch (e) {
              // If decode fails, try alternative
              try {
                if (encodedUrl.startsWith('a1')) {
                  const base64Part = encodedUrl.substring(2);
                  url = Buffer.from(base64Part, 'base64').toString('utf-8');
                } else {
                  url = decodeURIComponent(encodedUrl);
                }
              } catch (e2) {}
            }
          }
        }
      }

      // Extract snippet (from <p> or <div>)
      let snippet = '';
      const snippetMatch = block.match(/<p[^>]*>([\s\S]*?)<\/p>/);
      if (snippetMatch) {
        snippet = this.decodeHTML(snippetMatch[1]
          .replace(/<strong>/g, '').replace(/<\/strong>/g, '')
          .replace(/<b>/g, '').replace(/<\/b>/g, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim());
      }

      // Skip if no valid URL
      if (!url || url.startsWith('#')) continue;

      results.push({
        title: title || 'Untitled',
        url,
        excerpt: snippet || 'No description available.',
        source: 'bing'
      });
    }

    return results;
  }

  /**
   * Decode HTML entities
   */
  static decodeHTML(text) {
    const entities = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&apos;': "'",
      '&nbsp;': ' ',
      '&middot;': '·'
    };

    return text.replace(/&[^;]+;/g, (entity) => {
      return entities[entity] || entity;
    });
  }

  /**
   * Deduplicate results by URL
   */
  static dedupeResults(results) {
    const seen = new Set();
    return results.filter(result => {
      const normalizedUrl = result.url
        .replace(/^https?:\/\//, '')
        .replace(/\/$/, '')
        .toLowerCase();

      if (seen.has(normalizedUrl)) return false;
      seen.add(normalizedUrl);
      return true;
    });
  }
}

// ============================================================================
// Exports
// ============================================================================

module.exports = {
  WebSearch,
  SEARCH_TIMEOUT,
  MAX_RESULTS
};
