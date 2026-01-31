#!/usr/bin/env node
/**
 * Pattern Learner Hook - Continuous Learning System
 *
 * Claude Official Hook: SessionEnd
 * Triggered: Once at the end of each session (after memory-saver)
 *
 * Features:
 * - Analyze session transcript for extractable patterns
 * - Detect 5 pattern types: error_resolution, user_correction, workaround, debugging, convention
 * - Score and filter patterns by confidence
 * - Store patterns for future reference and RAG indexing
 *
 * Environment Variables:
 * - CLAUDE_PROJECT_DIR: Project directory path
 * - CLAUDE_SESSION_ID: Unique session identifier
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const CLAUDE_DIR = path.join(PROJECT_DIR, '.claude');
const LEARNED_DIR = path.join(CLAUDE_DIR, 'learned');
const PATTERNS_FILE = path.join(LEARNED_DIR, 'patterns.json');
const PATTERNS_DIR = path.join(LEARNED_DIR, 'patterns');
const TRANSCRIPTS_DIR = path.join(CLAUDE_DIR, 'transcripts');
const RAG_INDEX_FILE = path.join(CLAUDE_DIR, 'rag', 'skill-index.json');
const SESSION_ID = process.env.CLAUDE_SESSION_ID || 'unknown';

// ============================================================
// Configuration
// ============================================================

const CONFIG = {
  minSessionMessages: 10,
  minPatternConfidence: 0.6,
  minContentLength: 50,
  maxPatterns: 500,
  patternExpiryDays: 90,
  promotionThreshold: {
    occurrences: 3,
    confidence: 0.85
  }
};

// Pattern type definitions with detection signals
const PATTERN_TYPES = {
  error_resolution: {
    weight: 1.0,
    indicators: [
      /Error:/i,
      /error:/,
      /TS\d{4,5}/,
      /Failed:/i,
      /Exception/i,
      /bug/i,
      /fix/i,
      /resolve/i,
      /solved/i
    ],
    requiredSignals: ['error', 'resolution'],
    minMessages: 3
  },
  user_correction: {
    weight: 1.0,
    indicators: [
      /no,?\s+(actually|that's not|I meant)/i,
      /instead,?\s+/i,
      /not what I (wanted|meant|asked)/i,
      /let me clarify/i,
      /correction:/i,
      /wrong/i,
      /不对/,
      /应该是/,
      /我的意思是/
    ],
    requiredSignals: ['correction'],
    minMessages: 2
  },
  workaround: {
    weight: 0.7,
    indicators: [
      /workaround/i,
      /alternative/i,
      /instead of/i,
      /hack/i,
      /temporary/i,
      /bypass/i,
      /变通/,
      /临时方案/
    ],
    requiredSignals: ['workaround'],
    minMessages: 3
  },
  debugging: {
    weight: 0.7,
    indicators: [
      /debug/i,
      /console\.log/i,
      /breakpoint/i,
      /inspect/i,
      /trace/i,
      /调试/,
      /排查/
    ],
    requiredSignals: ['debug'],
    minMessages: 4
  },
  convention: {
    weight: 0.5,
    indicators: [
      /convention/i,
      /standard/i,
      /prefer/i,
      /always/i,
      /never/i,
      /rule/i,
      /best practice/i,
      /规范/,
      /约定/,
      /惯例/
    ],
    requiredSignals: ['convention'],
    minMessages: 2
  }
};

// Noise patterns to filter out
const NOISE_PATTERNS = [
  /^(ok|yes|no|thanks|sure|got it|好的|谢谢|明白)$/i,
  /test.*message/i,
  /hello|hi|hey|你好/i,
  /^[\d\s.]+$/
];

// ============================================================
// Utility Functions
// ============================================================

function ensureDirectories() {
  [LEARNED_DIR, PATTERNS_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

function generatePatternId() {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(3).toString('hex');
  return `pat_${timestamp}_${random}`;
}

function loadPatternsIndex() {
  if (!fs.existsSync(PATTERNS_FILE)) {
    return {
      version: '1.0.0',
      last_updated: null,
      stats: {
        total_patterns: 0,
        by_type: {
          error_resolution: 0,
          user_correction: 0,
          workaround: 0,
          debugging: 0,
          convention: 0
        },
        ready_for_promotion: 0
      },
      patterns: []
    };
  }
  return JSON.parse(fs.readFileSync(PATTERNS_FILE, 'utf-8'));
}

function savePatternsIndex(index) {
  index.last_updated = new Date().toISOString();
  fs.writeFileSync(PATTERNS_FILE, JSON.stringify(index, null, 2));
}

// ============================================================
// Transcript Loading
// ============================================================

function getTodayTranscriptPath() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return path.join(TRANSCRIPTS_DIR, String(year), month, `${day}.md`);
}

function loadTranscript() {
  const transcriptPath = getTodayTranscriptPath();
  if (!fs.existsSync(transcriptPath)) {
    return null;
  }
  return fs.readFileSync(transcriptPath, 'utf-8');
}

function parseTranscript(content) {
  const messages = [];
  const sessionRegex = /## Session \d+ - [\d-]+ [\d:]+ \| ID: ([^\n]+)/g;
  const messageRegex = /### (👤 User|🤖 Assistant|🔧 Tool:[^\n]+) - ([\d-]+ [\d:]+)\n([\s\S]*?)(?=\n### |$)/g;

  let match;
  let currentSessionId = null;

  // Find sessions
  while ((match = sessionRegex.exec(content)) !== null) {
    currentSessionId = match[1].trim();
  }

  // Parse messages
  messageRegex.lastIndex = 0;
  while ((match = messageRegex.exec(content)) !== null) {
    const roleRaw = match[1];
    const timestamp = match[2];
    const messageContent = match[3].trim();

    let role = 'unknown';
    if (roleRaw.includes('User')) role = 'user';
    else if (roleRaw.includes('Assistant')) role = 'assistant';
    else if (roleRaw.includes('Tool')) role = 'tool';

    // Extract tool usage from assistant messages
    let toolsUsed = [];
    const toolsMatch = messageContent.match(/\*\*Tools Used\*\*:\n([\s\S]*?)(?=\n\n|$)/);
    if (toolsMatch) {
      const toolLines = toolsMatch[1].split('\n');
      toolsUsed = toolLines
        .map(line => {
          const toolNameMatch = line.match(/- `([^`]+)`/);
          return toolNameMatch ? toolNameMatch[1] : null;
        })
        .filter(Boolean);
    }

    messages.push({
      role,
      timestamp,
      content: messageContent,
      toolsUsed,
      sessionId: currentSessionId
    });
  }

  return messages;
}

// ============================================================
// Pattern Detection
// ============================================================

function isNoise(content) {
  return NOISE_PATTERNS.some(pattern => pattern.test(content));
}

function detectPatternType(messages) {
  const detectedPatterns = [];

  for (const [typeName, typeConfig] of Object.entries(PATTERN_TYPES)) {
    const relevantMessages = [];
    let hasRequiredSignals = false;

    // Check each message window
    for (let i = 0; i < messages.length; i++) {
      const windowEnd = Math.min(i + 5, messages.length);
      const window = messages.slice(i, windowEnd);

      // Check if window matches pattern indicators
      const matchCount = window.reduce((count, msg) => {
        const matchesIndicator = typeConfig.indicators.some(indicator =>
          indicator.test(msg.content)
        );
        return count + (matchesIndicator ? 1 : 0);
      }, 0);

      if (matchCount >= typeConfig.minMessages) {
        hasRequiredSignals = true;
        relevantMessages.push(...window);
      }
    }

    if (hasRequiredSignals && relevantMessages.length > 0) {
      // Deduplicate messages
      const uniqueMessages = [...new Map(
        relevantMessages.map(m => [m.timestamp, m])
      ).values()];

      detectedPatterns.push({
        type: typeName,
        messages: uniqueMessages,
        weight: typeConfig.weight
      });
    }
  }

  return detectedPatterns;
}

function extractPatternContent(patternData) {
  const { type, messages } = patternData;

  // Extract key content from messages
  const userMessages = messages.filter(m => m.role === 'user');
  const assistantMessages = messages.filter(m => m.role === 'assistant');

  // Generate title from first relevant message
  const firstRelevant = userMessages[0] || assistantMessages[0];
  const titleContent = firstRelevant?.content || '';
  const title = titleContent
    .split('\n')[0]
    .slice(0, 80)
    .replace(/[#*`]/g, '')
    .trim() || `${type} pattern`;

  // Extract keywords
  const allContent = messages.map(m => m.content).join(' ');
  const keywords = extractKeywords(allContent);

  // Extract code examples if any
  const codeBlocks = [];
  const codeRegex = /```[\s\S]*?```/g;
  let codeMatch;
  while ((codeMatch = codeRegex.exec(allContent)) !== null) {
    codeBlocks.push(codeMatch[0]);
  }

  // Calculate confidence based on various factors
  const confidence = calculateConfidence(patternData, keywords, codeBlocks);

  return {
    title,
    keywords,
    codeExamples: codeBlocks.slice(0, 3), // Max 3 code examples
    problem: extractProblem(type, messages),
    solution: extractSolution(type, messages),
    confidence
  };
}

function extractKeywords(content) {
  // Remove code blocks for keyword extraction
  const textOnly = content.replace(/```[\s\S]*?```/g, '');

  // Extract potential keywords
  const words = textOnly
    .toLowerCase()
    .replace(/[^\w\s\u4e00-\u9fff]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2);

  // Count frequency
  const frequency = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });

  // Get top keywords (excluding common words)
  const stopWords = new Set([
    'the', 'and', 'for', 'that', 'this', 'with', 'from', 'have', 'are',
    'was', 'were', 'been', 'being', 'has', 'had', 'does', 'did', 'will',
    'would', 'could', 'should', 'can', 'may', 'might', 'must', 'shall'
  ]);

  return Object.entries(frequency)
    .filter(([word]) => !stopWords.has(word))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

function extractProblem(type, messages) {
  const userMessages = messages.filter(m => m.role === 'user');
  if (userMessages.length === 0) return '';

  // For error_resolution, look for error messages
  if (type === 'error_resolution') {
    const errorMessage = userMessages.find(m =>
      /Error:|error:|Failed:|Exception/.test(m.content)
    );
    if (errorMessage) {
      return errorMessage.content.slice(0, 500);
    }
  }

  // Default: first user message
  return userMessages[0].content.slice(0, 500);
}

function extractSolution(type, messages) {
  const assistantMessages = messages.filter(m => m.role === 'assistant');
  if (assistantMessages.length === 0) return '';

  // Look for messages with code or "fix" keywords
  const solutionMessage = assistantMessages.find(m =>
    /```|fix|solution|resolve|here's how/i.test(m.content)
  ) || assistantMessages[assistantMessages.length - 1];

  return solutionMessage?.content.slice(0, 1000) || '';
}

function calculateConfidence(patternData, keywords, codeBlocks) {
  let confidence = 0.5; // Base confidence

  // More messages = higher confidence
  confidence += Math.min(patternData.messages.length * 0.05, 0.2);

  // Has code examples = higher confidence
  if (codeBlocks.length > 0) {
    confidence += 0.1;
  }

  // Has meaningful keywords = higher confidence
  if (keywords.length >= 5) {
    confidence += 0.1;
  }

  // Apply type weight
  confidence *= patternData.weight;

  // Clamp to [0, 1]
  return Math.min(Math.max(confidence, 0), 1);
}

// ============================================================
// Pattern Storage
// ============================================================

function findSimilarPattern(index, newPattern) {
  // Check for patterns with similar keywords
  const newKeywords = new Set(newPattern.keywords);

  for (const existing of index.patterns) {
    const existingKeywords = new Set(existing.keywords);
    const intersection = [...newKeywords].filter(k => existingKeywords.has(k));
    const similarity = intersection.length / Math.max(newKeywords.size, existingKeywords.size);

    if (similarity > 0.7 && existing.type === newPattern.type) {
      return existing;
    }
  }

  return null;
}

function savePattern(index, patternData) {
  const content = extractPatternContent(patternData);

  // Skip low confidence patterns
  if (content.confidence < CONFIG.minPatternConfidence) {
    return null;
  }

  // Check for similar existing pattern
  const similar = findSimilarPattern(index, {
    type: patternData.type,
    keywords: content.keywords
  });

  if (similar) {
    // Update existing pattern
    similar.occurrences += 1;
    similar.last_seen = new Date().toISOString().split('T')[0];
    similar.confidence = Math.max(similar.confidence, content.confidence);
    similar.keywords = [...new Set([...similar.keywords, ...content.keywords])].slice(0, 15);

    if (!similar.source_sessions.includes(SESSION_ID)) {
      similar.source_sessions.push(SESSION_ID);
    }

    return similar;
  }

  // Create new pattern
  const patternId = generatePatternId();
  const today = new Date().toISOString().split('T')[0];

  const newPattern = {
    id: patternId,
    type: patternData.type,
    title: content.title,
    keywords: content.keywords,
    occurrences: 1,
    confidence: content.confidence,
    first_seen: today,
    last_seen: today,
    source_sessions: [SESSION_ID],
    promoted_to_skill: null
  };

  // Save detailed pattern file
  const patternMarkdown = generatePatternMarkdown(newPattern, content);
  const patternFilePath = path.join(PATTERNS_DIR, `${patternId}.md`);
  fs.writeFileSync(patternFilePath, patternMarkdown);

  // Add to index
  index.patterns.push(newPattern);

  return newPattern;
}

function generatePatternMarkdown(pattern, content) {
  return `# Pattern: ${pattern.title}

> Type: ${pattern.type} | Confidence: ${pattern.confidence.toFixed(2)} | Occurrences: ${pattern.occurrences}

## Problem

${content.problem || 'No problem description extracted.'}

## Solution

${content.solution || 'No solution description extracted.'}

${content.codeExamples.length > 0 ? `## Code Examples

${content.codeExamples.join('\n\n')}
` : ''}
## Keywords

${pattern.keywords.join(', ')}

## Source Sessions

- ${pattern.source_sessions.join('\n- ')}

---
*Auto-generated by pattern-learner*
*First seen: ${pattern.first_seen}*
*Last updated: ${pattern.last_seen}*
`;
}

function updateStats(index) {
  const stats = {
    total_patterns: index.patterns.length,
    by_type: {
      error_resolution: 0,
      user_correction: 0,
      workaround: 0,
      debugging: 0,
      convention: 0
    },
    ready_for_promotion: 0
  };

  for (const pattern of index.patterns) {
    stats.by_type[pattern.type] = (stats.by_type[pattern.type] || 0) + 1;

    if (
      pattern.occurrences >= CONFIG.promotionThreshold.occurrences &&
      pattern.confidence >= CONFIG.promotionThreshold.confidence &&
      !pattern.promoted_to_skill
    ) {
      stats.ready_for_promotion += 1;
    }
  }

  index.stats = stats;
}

// ============================================================
// RAG Index Integration
// ============================================================

function updateRagIndex(patterns) {
  if (!fs.existsSync(RAG_INDEX_FILE)) {
    return;
  }

  try {
    const ragIndex = JSON.parse(fs.readFileSync(RAG_INDEX_FILE, 'utf-8'));

    // Remove old learned patterns
    ragIndex.skills = ragIndex.skills.filter(s => !s.name?.startsWith('learned:'));

    // Add current learned patterns
    for (const pattern of patterns) {
      if (pattern.confidence >= CONFIG.minPatternConfidence) {
        ragIndex.skills.push({
          name: `learned:${pattern.id}`,
          keywords: pattern.keywords,
          description: pattern.title,
          trigger: `when encountering ${pattern.type.replace('_', ' ')}`,
          type: 'learned',
          confidence: pattern.confidence
        });
      }
    }

    fs.writeFileSync(RAG_INDEX_FILE, JSON.stringify(ragIndex, null, 2));
  } catch (e) {
    // Silently fail - RAG index update is optional
  }
}

// ============================================================
// Main Execution
// ============================================================

function main() {
  try {
    ensureDirectories();

    // Load today's transcript
    const transcript = loadTranscript();
    if (!transcript) {
      // No transcript for today, skip
      process.exit(0);
    }

    // Parse transcript into messages
    const messages = parseTranscript(transcript);

    // Check minimum session length
    if (messages.length < CONFIG.minSessionMessages) {
      // Session too short, skip pattern extraction
      process.exit(0);
    }

    // Filter out noise messages
    const meaningfulMessages = messages.filter(m =>
      m.content.length >= CONFIG.minContentLength && !isNoise(m.content)
    );

    if (meaningfulMessages.length < CONFIG.minSessionMessages / 2) {
      // Not enough meaningful content
      process.exit(0);
    }

    // Detect patterns
    const detectedPatterns = detectPatternType(meaningfulMessages);

    if (detectedPatterns.length === 0) {
      // No patterns detected
      process.exit(0);
    }

    // Load existing patterns index
    const index = loadPatternsIndex();

    // Save detected patterns
    let savedCount = 0;
    for (const patternData of detectedPatterns) {
      const saved = savePattern(index, patternData);
      if (saved) {
        savedCount++;
      }
    }

    if (savedCount > 0) {
      // Update stats
      updateStats(index);

      // Save patterns index
      savePatternsIndex(index);

      // Update RAG index
      updateRagIndex(index.patterns);

      // Output summary
      console.log(`\n🧠 Pattern Learner: Extracted ${savedCount} pattern(s)`);
      console.log(`   Total patterns: ${index.stats.total_patterns}`);
      if (index.stats.ready_for_promotion > 0) {
        console.log(`   Ready for promotion: ${index.stats.ready_for_promotion}`);
      }
    }

    process.exit(0);
  } catch (e) {
    // Silent failure - don't interrupt session end
    console.error(`Pattern learner error: ${e.message}`);
    process.exit(0);
  }
}

// Run
if (require.main === module) {
  main();
}

module.exports = {
  loadTranscript,
  parseTranscript,
  detectPatternType,
  extractPatternContent,
  savePattern,
  updateRagIndex,
  CONFIG,
  PATTERN_TYPES
};
