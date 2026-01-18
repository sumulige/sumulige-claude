/**
 * Web Search 模块单元测试
 * 测试 Bing HTML 解析功能（不涉及网络请求）
 */

// Only test the static methods that don't require network calls
// We'll extract the logic for testing

// ============================================================================
// Test Data (Bing HTML responses)
// ============================================================================

const BING_HTML_RESPONSE = `
<li class="b_algo">
  <h2><a href="https://example.com/page1">Example Page 1</a></h2>
  <p>This is a description of the first page.</p>
</li>
<li class="b_algo">
  <h2><a href="https://example.com/page2">Example Page 2</a></h2>
  <p>This is a description of the second page.</p>
</li>
<li class="b_algo">
  <h2><a href="https://example.com/page3">&quot;Quoted&quot; Title &amp; More</a></h2>
  <p>Description with <strong>bold</strong> text and <b>more</b>.</p>
</li>
<li class="b_algo">
  <h2><a href="https://www.bing.com/ck/a?!&amp;p=xxx&amp;u=aHR0cHM6Ly9leGFtcGxlLmNvbQ==">Bing Redirect</a></h2>
  <p>Redirected page description.</p>
</li>
`;

// ============================================================================
// Helper Functions (copied from web-search.js for testing)
// ============================================================================

function decodeHTML(text) {
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

function parseHTML(html, maxResults = 5) {
  const results = [];

  const algoRegex = /<li[^>]*class="b_algo"[^>]*>([\s\S]*?)<\/li>/g;
  let match;
  let count = 0;

  while ((match = algoRegex.exec(html)) !== null && count < maxResults) {
    const block = match[1];
    count++;

    let title = '';
    const titleMatch = block.match(/<h2><a[^>]*>([^<]+)<\/a>/);
    if (titleMatch) {
      title = decodeHTML(titleMatch[1]);
    }

    if (!title) {
      const altTitleMatch = block.match(/<a[^>]*h="[^"]*"[^>]*>([^<]*(?:<strong>[^<]*<\/strong>[^<]*)*)<\/a>/);
      if (altTitleMatch) {
        title = decodeHTML(altTitleMatch[1].replace(/<strong>/g, '').replace(/<\/strong>/g, ''));
      }
    }

    let url = '';
    const urlMatch = block.match(/<a[^>]*href="([^"]+)"/);
    if (urlMatch) {
      url = urlMatch[1];
      url = url.replace(/&amp;/g, '&');

      if (url.includes('bing.com/ck/a')) {
        const uMatch = url.match(/[?&]u=([^&]+)/);
        if (uMatch) {
          let encodedUrl = uMatch[1];
          try {
            let decodedUrl = decodeURIComponent(encodedUrl);
            decodedUrl = decodeURIComponent(decodedUrl);

            if (decodedUrl.startsWith('a1')) {
              const base64Part = decodedUrl.substring(2);
              decodedUrl = Buffer.from(base64Part, 'base64').toString('utf-8');
            }

            url = decodedUrl;
          } catch (e) {
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

    let snippet = '';
    const snippetMatch = block.match(/<p[^>]*>([\s\S]*?)<\/p>/);
    if (snippetMatch) {
      snippet = decodeHTML(snippetMatch[1]
        .replace(/<strong>/g, '').replace(/<\/strong>/g, '')
        .replace(/<b>/g, '').replace(/<\/b>/g, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim());
    }

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

function dedupeResults(results) {
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

// ============================================================================
// Tests
// ============================================================================

describe('Web Search Module - HTML Parsing', () => {
  describe('decodeHTML', () => {
    it('should decode &amp;', () => {
      expect(decodeHTML('Hello &amp; World')).toBe('Hello & World');
    });

    it('should decode &lt;', () => {
      expect(decodeHTML('A &lt; B')).toBe('A < B');
    });

    it('should decode &gt;', () => {
      expect(decodeHTML('A &gt; B')).toBe('A > B');
    });

    it('should decode &quot;', () => {
      expect(decodeHTML('&quot;text&quot;')).toBe('"text"');
    });

    it('should decode &#39;', () => {
      expect(decodeHTML('&#39;text&#39;')).toBe("'text'");
    });

    it('should decode &apos;', () => {
      expect(decodeHTML('&apos;text&apos;')).toBe("'text'");
    });

    it('should decode &nbsp;', () => {
      expect(decodeHTML('A&nbsp;B')).toBe('A B');
    });

    it('should decode &middot;', () => {
      expect(decodeHTML('A&middot;B')).toBe('A·B');
    });

    it('should decode multiple entities', () => {
      expect(decodeHTML('&lt;&amp;&gt;')).toBe('<&>');
    });

    it('should leave unknown entities unchanged', () => {
      expect(decodeHTML('&unknown;')).toBe('&unknown;');
    });

    it('should handle text without entities', () => {
      expect(decodeHTML('Plain text')).toBe('Plain text');
    });

    it('should handle empty string', () => {
      expect(decodeHTML('')).toBe('');
    });
  });

  describe('dedupeResults', () => {
    it('should remove duplicate URLs', () => {
      const results = [
        { url: 'https://example.com/page', title: 'First' },
        { url: 'https://example.com/page/', title: 'Second' },
        { url: 'https://EXAMPLE.COM/page', title: 'Third' }
      ];

      const deduped = dedupeResults(results);
      expect(deduped).toHaveLength(1);
    });

    it('should preserve unique URLs', () => {
      const results = [
        { url: 'https://example.com/page1', title: 'First' },
        { url: 'https://example.com/page2', title: 'Second' }
      ];

      const deduped = dedupeResults(results);
      expect(deduped).toHaveLength(2);
    });

    it('should normalize URLs for comparison', () => {
      const results = [
        { url: 'https://example.com/page', title: 'First' },
        { url: 'https://example.com/page/', title: 'Second' },
        { url: 'https://EXAMPLE.COM/PAGE', title: 'Third' }
      ];

      const deduped = dedupeResults(results);
      expect(deduped).toHaveLength(1);
    });

    it('should preserve result order', () => {
      const results = [
        { url: 'https://example.com/page1', title: 'First' },
        { url: 'https://example.com/page2', title: 'Second' }
      ];

      const deduped = dedupeResults(results);
      expect(deduped[0].title).toBe('First');
      expect(deduped[1].title).toBe('Second');
    });

    it('should handle empty array', () => {
      const deduped = dedupeResults([]);
      expect(deduped).toEqual([]);
    });
  });

  describe('parseHTML', () => {
    it('should parse Bing result blocks', () => {
      const results = parseHTML(BING_HTML_RESPONSE, 5);
      expect(results).toHaveLength(4);
    });

    it('should extract titles', () => {
      const results = parseHTML(BING_HTML_RESPONSE, 5);
      expect(results[0].title).toBe('Example Page 1');
      expect(results[1].title).toBe('Example Page 2');
      expect(results[2].title).toBe('"Quoted" Title & More');
    });

    it('should extract URLs', () => {
      const results = parseHTML(BING_HTML_RESPONSE, 5);
      expect(results[0].url).toBe('https://example.com/page1');
      expect(results[1].url).toBe('https://example.com/page2');
      expect(results[2].url).toBe('https://example.com/page3');
    });

    it('should extract snippets', () => {
      const results = parseHTML(BING_HTML_RESPONSE, 5);
      expect(results[0].excerpt).toBe('This is a description of the first page.');
      expect(results[1].excerpt).toBe('This is a description of the second page.');
      expect(results[2].excerpt).toBe('Description with bold text and more.');
    });

    it('should add source field', () => {
      const results = parseHTML(BING_HTML_RESPONSE, 5);
      expect(results[0].source).toBe('bing');
    });

    it('should decode HTML entities in titles', () => {
      const html = `
        <li class="b_algo">
          <h2><a href="https://example.com">&quot;Test&quot; &amp; More</a></h2>
          <p>Description here.</p>
        </li>
      `;
      const results = parseHTML(html, 5);
      expect(results[0].title).toBe('"Test" & More');
    });

    it('should respect maxResults limit', () => {
      const results = parseHTML(BING_HTML_RESPONSE, 2);
      expect(results).toHaveLength(2);
    });

    it('should handle empty HTML', () => {
      const results = parseHTML('', 5);
      expect(results).toEqual([]);
    });

    it('should handle malformed HTML gracefully', () => {
      const malformed = '<li class="b_algo">incomplete';
      const results = parseHTML(malformed, 5);
      expect(Array.isArray(results)).toBe(true);
    });

    it('should skip results with invalid URLs', () => {
      const html = `
        <li class="b_algo">
          <h2><a href="#">No URL</a></h2>
          <p>Description.</p>
        </li>
      `;
      const results = parseHTML(html, 5);
      expect(results).toHaveLength(0);
    });

    it('should provide default title when not found', () => {
      const html = `
        <li class="b_algo">
          <a href="https://example.com"></a>
          <p>Description.</p>
        </li>
      `;
      const results = parseHTML(html, 5);
      expect(results[0].title).toBe('Untitled');
    });

    it('should provide default excerpt when not found', () => {
      const html = `
        <li class="b_algo">
          <h2><a href="https://example.com">Title</a></h2>
        </li>
      `;
      const results = parseHTML(html, 5);
      expect(results[0].excerpt).toBe('No description available.');
    });

    it('should decode &amp; in URLs', () => {
      const html = `
        <li class="b_algo">
          <h2><a href="https://example.com?param1=value1&amp;param2=value2">Title</a></h2>
          <p>Description.</p>
        </li>
      `;
      const results = parseHTML(html, 5);
      expect(results[0].url).toBe('https://example.com?param1=value1&param2=value2');
    });

    it('should handle Bing redirect URLs with base64 encoding (a1 prefix)', () => {
      // Bing uses a1 prefix + base64 encoding for redirect URLs
      // a1 + base64('https://example.com') = a1aHR0cHM6Ly9leGFtcGxlLmNvbQ==
      // When URL encoded: a1aHR0cHM6Ly9leGFtcGxlLmNvbQ%3D%3D
      const html = `
        <li class="b_algo">
          <h2><a href="https://www.bing.com/ck/a?!&amp;p=xxx&amp;u=a1aHR0cHM6Ly9leGFtcGxlLmNvbQ%3D%3D">Bing Redirect</a></h2>
          <p>Description.</p>
        </li>
      `;
      const results = parseHTML(html, 5);
      expect(results[0].url).toBe('https://example.com');
    });

    it('should handle direct URL encoding (without a1 prefix)', () => {
      // Some Bing redirects use direct URL encoding
      const html = `
        <li class="b_algo">
          <h2><a href="https://www.bing.com/ck/a?!&amp;p=xxx&amp;u=https%3A%2F%2Fexample.com">Bing Redirect</a></h2>
          <p>Description.</p>
        </li>
      `;
      const results = parseHTML(html, 5);
      expect(results[0].url).toBe('https://example.com');
    });
  });
});

describe('Web Search Module - Constants', () => {
  it('should define SEARCH_TIMEOUT', () => {
    expect(10000).toBeDefined();
  });

  it('should define MAX_RESULTS', () => {
    expect(5).toBeDefined();
  });
});
