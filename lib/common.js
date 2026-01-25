#!/usr/bin/env node
/**
 * bkit Common Library (v1.4.0)
 * Cross-platform utility functions for bkit hooks
 * Supports: Claude Code, Gemini CLI
 *
 * Converted from: lib/common.sh
 * Platform: Windows, macOS, Linux
 * Dependencies: Node.js only (no external tools like jq, bash)
 *
 * v1.4.0 Changes:
 * - Added Debug Logging system (debugLog, getDebugLogPath)
 * - Added PDCA Status Management (updatePdcaStatus, getPdcaStatusFull, etc.)
 * - Added extractFeatureFromContext for multi-source feature detection
 */

const fs = require('fs');
const path = require('path');

// ============================================================
// Environment & Configuration (v1.4.0 - Dual Platform Support)
// ============================================================

/**
 * Detect current platform (Claude Code or Gemini CLI)
 * @returns {'claude' | 'gemini' | 'unknown'}
 */
function detectPlatform() {
  if (process.env.GEMINI_PROJECT_DIR || process.env.GEMINI_SESSION_ID || process.env.GEMINI_EXTENSION_PATH) {
    return 'gemini';
  }
  if (process.env.CLAUDE_PLUGIN_ROOT || process.env.CLAUDE_PROJECT_DIR) {
    return 'claude';
  }
  return 'unknown';
}

const BKIT_PLATFORM = process.env.BKIT_PLATFORM || detectPlatform();

// Cross-platform environment variables with fallback chain
const PLUGIN_ROOT = process.env.CLAUDE_PLUGIN_ROOT
  || process.env.GEMINI_EXTENSION_PATH
  || path.resolve(__dirname, '..');

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR
  || process.env.GEMINI_PROJECT_DIR
  || process.cwd();

// Unified project directory alias
const BKIT_PROJECT_DIR = PROJECT_DIR;

// ============================================================
// v1.4.0 P4: Performance Optimization - Caching System
// ============================================================

/**
 * In-memory cache for frequently accessed data
 * TTL-based invalidation for config files and status
 */
const _cache = {
  data: new Map(),
  timestamps: new Map(),
  defaultTTL: 5000,  // 5 seconds default TTL

  /**
   * Get cached value if not expired
   * @param {string} key - Cache key
   * @param {number} ttl - Time-to-live in ms (default: 5000)
   * @returns {any|null} Cached value or null if expired/missing
   */
  get(key, ttl = this.defaultTTL) {
    const timestamp = this.timestamps.get(key);
    if (!timestamp) return null;

    if (Date.now() - timestamp > ttl) {
      this.data.delete(key);
      this.timestamps.delete(key);
      return null;
    }
    return this.data.get(key);
  },

  /**
   * Set cache value with timestamp
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   */
  set(key, value) {
    this.data.set(key, value);
    this.timestamps.set(key, Date.now());
  },

  /**
   * Invalidate specific cache key or all keys matching pattern
   * @param {string|RegExp} keyOrPattern - Key or pattern to invalidate
   */
  invalidate(keyOrPattern) {
    if (typeof keyOrPattern === 'string') {
      this.data.delete(keyOrPattern);
      this.timestamps.delete(keyOrPattern);
    } else {
      // RegExp pattern
      for (const key of this.data.keys()) {
        if (keyOrPattern.test(key)) {
          this.data.delete(key);
          this.timestamps.delete(key);
        }
      }
    }
  },

  /**
   * Clear all cache
   */
  clear() {
    this.data.clear();
    this.timestamps.clear();
  }
};

// Default patterns (configurable via bkit.config.json)
const DEFAULT_EXCLUDE_PATTERNS = [
  'node_modules', '.git', 'dist', 'build', '.next',
  '__pycache__', '.venv', 'venv', 'coverage',
  '.pytest_cache', 'target', '.cargo', 'vendor'
];

const DEFAULT_FEATURE_PATTERNS = [
  'features', 'modules', 'packages', 'apps', 'services', 'domains'
];

// Language Tier System (v1.2.1)
const TIER_EXTENSIONS = {
  1: ['py', 'pyx', 'pyi', 'ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs'],
  2: ['go', 'rs', 'dart', 'astro', 'vue', 'svelte', 'mdx'],
  3: ['java', 'kt', 'kts', 'swift', 'c', 'cpp', 'cc', 'h', 'hpp', 'sh', 'bash'],
  4: ['php', 'rb', 'erb', 'cs', 'scala', 'ex', 'exs'],
  experimental: ['mojo', 'zig', 'v']
};

// ============================================================
// 1. Configuration Management
// ============================================================

let _configCache = null;

/**
 * Load bkit.config.json
 * @returns {Object} Configuration object or empty object
 */
function loadConfig() {
  if (_configCache !== null) return _configCache;

  const configPath = path.join(PROJECT_DIR, 'bkit.config.json');
  try {
    if (fs.existsSync(configPath)) {
      _configCache = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return _configCache;
    }
  } catch (e) { /* ignore */ }
  _configCache = {};
  return _configCache;
}

/**
 * Get configuration value by path
 * @param {string} keyPath - Dot-separated path (e.g., "pdca.thresholds.quickFix")
 * @param {*} defaultValue - Default value if not found
 * @returns {*} Configuration value or default
 */
function getConfig(keyPath, defaultValue = null) {
  const config = loadConfig();
  const keys = keyPath.replace(/^\./, '').split('.');
  let value = config;

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return defaultValue;
    }
  }
  return value ?? defaultValue;
}

/**
 * Get configuration array as space-separated string (for compatibility)
 * @param {string} keyPath - Configuration path
 * @param {string} defaultValue - Default space-separated string
 * @returns {string} Space-separated values
 */
function getConfigArray(keyPath, defaultValue = '') {
  const value = getConfig(keyPath, null);
  if (Array.isArray(value)) {
    return value.join(' ');
  }
  return defaultValue;
}

// ============================================================
// 2. File Detection Functions
// ============================================================

/**
 * Check if file is a source code file
 * @param {string} filePath - File path to check
 * @returns {boolean} True if source file
 */
function isSourceFile(filePath) {
  if (!filePath) return false;

  // Exclude patterns
  const excludePatterns = getConfig('excludePatterns', DEFAULT_EXCLUDE_PATTERNS);
  for (const pattern of excludePatterns) {
    if (filePath.includes(pattern)) return false;
  }

  // Exclude documentation and config files
  const excludeExtensions = ['.md', '.json', '.yaml', '.yml', '.lock', '.txt', '.log'];
  const ext = path.extname(filePath).toLowerCase();
  if (excludeExtensions.includes(ext)) return false;

  // Exclude hidden files
  const basename = path.basename(filePath);
  if (basename.startsWith('.')) return false;

  return isCodeFile(filePath);
}

/**
 * Check if file has recognized code extension
 * @param {string} filePath - File path to check
 * @returns {boolean} True if code file
 */
function isCodeFile(filePath) {
  const ext = path.extname(filePath).slice(1).toLowerCase();
  if (!ext) return false;

  for (const tier of Object.values(TIER_EXTENSIONS)) {
    if (tier.includes(ext)) return true;
  }
  return false;
}

/**
 * Check if file is a UI component file
 * @param {string} filePath - File path
 * @returns {boolean} True if UI file
 */
function isUiFile(filePath) {
  const ext = path.extname(filePath).slice(1).toLowerCase();
  return ['tsx', 'jsx', 'vue', 'svelte', 'astro'].includes(ext);
}

/**
 * Check if file is an environment file
 * @param {string} filePath - File path
 * @returns {boolean} True if env file
 */
function isEnvFile(filePath) {
  const basename = path.basename(filePath);
  return basename.includes('.env') || basename.startsWith('.env');
}

// ============================================================
// 3. Tier Detection Functions
// ============================================================

/**
 * Get language tier for file
 * @param {string} filePath - File path
 * @returns {string} Tier: "1"|"2"|"3"|"4"|"experimental"|"unknown"
 */
function getLanguageTier(filePath) {
  const ext = path.extname(filePath).slice(1).toLowerCase();

  for (const [tier, extensions] of Object.entries(TIER_EXTENSIONS)) {
    if (extensions.includes(ext)) return String(tier);
  }
  return 'unknown';
}

/**
 * Get tier description
 * @param {string} tier - Tier number or name
 * @returns {string} Description
 */
function getTierDescription(tier) {
  const descriptions = {
    '1': 'AI-Native Essential',
    '2': 'Mainstream Recommended',
    '3': 'Domain Specific',
    '4': 'Legacy/Niche',
    'experimental': 'Experimental'
  };
  return descriptions[tier] || 'Unknown';
}

/**
 * Get PDCA guidance for tier
 * @param {string} tier - Tier
 * @returns {string} Guidance message
 */
function getTierPdcaGuidance(tier) {
  const guidance = {
    '1': 'Tier 1 (AI-Native): Full PDCA support. Vibe coding optimized.',
    '2': 'Tier 2 (Mainstream): Good PDCA support. Most features available.',
    '3': 'Tier 3 (Domain): Basic PDCA support. Some limitations may apply.',
    '4': 'Tier 4 (Legacy): Limited PDCA support. Consider migration.',
    'experimental': 'Experimental: PDCA support varies. Use with caution.'
  };
  return guidance[tier] || '';
}

// Convenience tier check functions
const isTier1 = (filePath) => getLanguageTier(filePath) === '1';
const isTier2 = (filePath) => getLanguageTier(filePath) === '2';
const isTier3 = (filePath) => getLanguageTier(filePath) === '3';
const isTier4 = (filePath) => getLanguageTier(filePath) === '4';
const isExperimentalTier = (filePath) => getLanguageTier(filePath) === 'experimental';

// ============================================================
// 4. Feature Detection
// ============================================================

/**
 * Extract feature name from file path
 * @param {string} filePath - File path
 * @returns {string} Feature name or empty string
 */
function extractFeature(filePath) {
  if (!filePath) return '';

  const featurePatterns = getConfig('featurePatterns', DEFAULT_FEATURE_PATTERNS);
  const genericNames = [
    'src', 'lib', 'app', 'components', 'pages', 'utils', 'hooks',
    'types', 'internal', 'cmd', 'pkg', 'models', 'views',
    'routers', 'controllers', 'services'
  ];

  // Try configured feature patterns
  for (const pattern of featurePatterns) {
    const regex = new RegExp(`${pattern}/([^/]+)`);
    const match = filePath.match(regex);
    if (match && match[1] && !genericNames.includes(match[1])) {
      return match[1];
    }
  }

  // Fallback: extract from parent directory
  const parts = filePath.split(/[/\\]/).filter(Boolean);
  for (let i = parts.length - 2; i >= 0; i--) {
    if (!genericNames.includes(parts[i])) {
      return parts[i];
    }
  }

  return '';
}

// ============================================================
// 5. PDCA Document Detection
// ============================================================

/**
 * Find design document for feature
 * FR-06: Uses fs.accessSync for read permission verification
 * @param {string} feature - Feature name
 * @returns {string} Path to design doc or empty string
 */
function findDesignDoc(feature) {
  if (!feature) return '';

  const paths = [
    path.join(PROJECT_DIR, 'docs', '02-design', 'features', `${feature}.design.md`),
    path.join(PROJECT_DIR, 'docs', '02-design', `${feature}.design.md`),
    path.join(PROJECT_DIR, 'docs', 'design', `${feature}.md`)
  ];

  for (const p of paths) {
    try {
      // FR-06: Verify read permission, not just existence
      fs.accessSync(p, fs.constants.R_OK);
      return p;
    } catch (e) {
      // File doesn't exist or no read permission - try next path
      continue;
    }
  }
  return '';
}

/**
 * Find plan document for feature
 * FR-06: Uses fs.accessSync for read permission verification
 * @param {string} feature - Feature name
 * @returns {string} Path to plan doc or empty string
 */
function findPlanDoc(feature) {
  if (!feature) return '';

  const paths = [
    path.join(PROJECT_DIR, 'docs', '01-plan', 'features', `${feature}.plan.md`),
    path.join(PROJECT_DIR, 'docs', '01-plan', `${feature}.plan.md`),
    path.join(PROJECT_DIR, 'docs', 'plan', `${feature}.md`)
  ];

  for (const p of paths) {
    try {
      // FR-06: Verify read permission, not just existence
      fs.accessSync(p, fs.constants.R_OK);
      return p;
    } catch (e) {
      // File doesn't exist or no read permission - try next path
      continue;
    }
  }
  return '';
}

// ============================================================
// 6. Task Classification
// ============================================================

/**
 * Classify task by content length (legacy, character-based)
 * @param {string} content - Content to classify
 * @returns {string} Classification
 */
function classifyTask(content) {
  const length = (content || '').length;

  const quickFix = getConfig('taskClassification.thresholds.quickFix', 50);
  const minorChange = getConfig('taskClassification.thresholds.minorChange', 200);
  const feature = getConfig('taskClassification.thresholds.feature', 1000);

  if (length < quickFix) return 'quick_fix';
  if (length < minorChange) return 'minor_change';
  if (length < feature) return 'feature';
  return 'major_feature';
}

/**
 * Classify task by line count (v1.3.0, more accurate)
 * @param {string} content - Content to classify
 * @returns {string} Classification
 */
function classifyTaskByLines(content) {
  const lines = (content || '').split('\n');
  const lineCount = lines.length;

  const quickFix = getConfig('taskClassification.lines.quickFix', 10);
  const minorChange = getConfig('taskClassification.lines.minorChange', 50);
  const feature = getConfig('taskClassification.lines.feature', 200);

  if (lineCount < quickFix) return 'quick_fix';
  if (lineCount < minorChange) return 'minor_change';
  if (lineCount < feature) return 'feature';
  return 'major_feature';
}

/**
 * Get PDCA level from classification
 * @param {string} classification - Task classification
 * @returns {string} PDCA level
 */
function getPdcaLevel(classification) {
  const levels = {
    'quick_fix': 'none',
    'minor_change': 'light',
    'feature': 'recommended',
    'major_feature': 'required'
  };
  return levels[classification] || 'none';
}

/**
 * Get PDCA guidance message
 * @param {string} classification - Task classification
 * @returns {string} Guidance message
 */
function getPdcaGuidance(classification) {
  const guidance = {
    'quick_fix': '',
    'minor_change': 'Minor change. PDCA optional.',
    'feature': 'Feature-level change. Design doc recommended. Run /pdca-design.',
    'major_feature': 'Major feature. Design doc strongly recommended. Run /pdca-plan first.'
  };
  return guidance[classification] || '';
}

/**
 * Get contextual PDCA guidance by level
 * @param {string} level - PDCA level
 * @param {string} feature - Feature name
 * @param {number} lineCount - Line count
 * @returns {string} Guidance message
 */
function getPdcaGuidanceByLevel(level, feature = '', lineCount = 0) {
  const lineInfo = lineCount > 0 ? ` (${lineCount} lines)` : '';
  const featureInfo = feature ? ` for '${feature}'` : '';

  switch (level) {
    case 'none':
      return '';
    case 'light':
      return `Minor change${lineInfo}. PDCA optional.`;
    case 'recommended':
      return `Feature${lineInfo}. Design doc recommended${featureInfo}.`;
    case 'required':
      return `Major feature${lineInfo}. Design doc strongly recommended${featureInfo}.`;
    default:
      return '';
  }
}

// ============================================================
// 7. JSON Output Helpers (Dual Platform Support)
// ============================================================

/**
 * Maximum context message length (FR-04)
 * Prevents UI truncation issues
 */
const MAX_CONTEXT_LENGTH = 500;

/**
 * Truncate context message to prevent UI issues (FR-04)
 * Attempts to cut at last complete sentence
 * @param {string} context - Original context message
 * @param {number} maxLength - Maximum length (default: 500)
 * @returns {string} - Truncated context
 */
function truncateContext(context, maxLength = MAX_CONTEXT_LENGTH) {
  if (!context || typeof context !== 'string') return '';
  if (context.length <= maxLength) return context;

  // Try to cut at last complete sentence
  const truncated = context.substring(0, maxLength - 3);
  const lastPeriod = truncated.lastIndexOf('.');
  const lastPipe = truncated.lastIndexOf(' | ');

  const cutPoint = Math.max(lastPeriod, lastPipe);
  if (cutPoint > maxLength * 0.7) {
    return context.substring(0, cutPoint + 1) + '...';
  }

  return truncated + '...';
}

/**
 * Output allow decision with context
 * @param {string} context - Additional context
 * @param {string} hookEvent - Hook event type: 'PreToolUse' | 'PostToolUse' | 'SessionStart' | 'Stop'
 */
function outputAllow(context = '', hookEvent = 'PostToolUse') {
  // Apply context length limit (FR-04)
  const safeContext = truncateContext(context, MAX_CONTEXT_LENGTH);

  if (isGeminiCli()) {
    // Gemini CLI: Print plain text context if available
    if (safeContext) {
      // Use cyan color for informational context
      console.log(`\x1b[36m💡 bkit Context:\x1b[0m ${safeContext}`);
    }
    process.exit(0);
  } else {
    // Claude Code: Print JSON based on hook event type
    if (!safeContext) {
      console.log('{}');
      return;
    }

    // v1.4.2: Hook event별 다른 스키마 사용
    // - PreToolUse: additionalContext만 사용 (FR-01: permissionDecision 제거, GitHub Issue #16598 회피)
    // - PostToolUse/SessionStart: additionalContext
    // - Stop: systemMessage (additionalContext 미지원)
    if (hookEvent === 'PreToolUse') {
      // FR-01: permissionDecision: "allow" 제거 (GitHub Issue #16598 회피)
      // Exit Code 0만으로 허용 의미 전달, additionalContext로 컨텍스트 제공
      console.log(JSON.stringify({
        hookSpecificOutput: {
          additionalContext: safeContext
        }
      }));
    } else if (hookEvent === 'Stop') {
      // Stop hooks don't support additionalContext, use systemMessage
      console.log(JSON.stringify({
        decision: 'allow',
        systemMessage: safeContext
      }));
    } else {
      // PostToolUse, SessionStart, UserPromptSubmit
      console.log(JSON.stringify({
        decision: 'allow',
        hookSpecificOutput: { additionalContext: safeContext }
      }));
    }
  }
}

/**
 * Output block decision with reason and exit
 * FR-02: Use stderr + Exit Code 2 for most stable blocking (Best Practice)
 * @param {string} reason - Block reason
 */
function outputBlock(reason) {
  if (isGeminiCli()) {
    // Gemini CLI: Print error to stderr and exit non-zero
    console.error(`\x1b[31m🚫 bkit Blocked:\x1b[0m ${reason}`);
    process.exit(1);
  } else {
    // FR-02: Claude Code Best Practice - stderr + Exit Code 2
    // JSON stdout is ignored when Exit Code 2, use stderr instead
    console.error(reason);
    process.exit(2);
  }
}

/**
 * Output empty JSON or nothing
 */
function outputEmpty() {
  if (isGeminiCli()) {
    // Gemini CLI: Do nothing
    process.exit(0);
  } else {
    // Claude Code: Print empty JSON
    console.log('{}');
  }
}

// ============================================================
// 8. Level Detection
// ============================================================

/**
 * Detect project level from CLAUDE.md, GEMINI.md, or structure
 * @returns {string} "Starter" | "Dynamic" | "Enterprise"
 */
function detectLevel() {
  // 1. Check CLAUDE.md or GEMINI.md for explicit declaration (v1.4.0)
  const contextFiles = ['CLAUDE.md', 'GEMINI.md'];
  for (const file of contextFiles) {
    const filePath = path.join(PROJECT_DIR, file);
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const match = content.match(/^level:\s*(\w+)/im);
        if (match) {
          const level = match[1].toLowerCase();
          if (['starter', 'dynamic', 'enterprise'].includes(level)) {
            return level.charAt(0).toUpperCase() + level.slice(1);
          }
        }
      } catch (e) { /* ignore */ }
    }
  }

  // 2. Check for Enterprise indicators
  const enterpriseDirs = ['kubernetes', 'terraform', 'k8s', 'infra'];
  for (const dir of enterpriseDirs) {
    const dirPath = path.join(PROJECT_DIR, dir);
    if (fs.existsSync(dirPath)) {
      try {
        if (fs.statSync(dirPath).isDirectory()) return 'Enterprise';
      } catch (e) { /* ignore */ }
    }
  }

  // 3. Check for Dynamic indicators
  const mcpJson = path.join(PROJECT_DIR, '.mcp.json');
  if (fs.existsSync(mcpJson)) {
    try {
      const content = fs.readFileSync(mcpJson, 'utf8');
      if (content.includes('bkend')) return 'Dynamic';
    } catch (e) { /* ignore */ }
  }

  const dynamicIndicators = ['lib/bkend', 'supabase', 'docker-compose.yml', 'api', 'backend'];
  for (const indicator of dynamicIndicators) {
    if (fs.existsSync(path.join(PROJECT_DIR, indicator))) {
      return 'Dynamic';
    }
  }

  // 4. Default to Starter
  return 'Starter';
}

// ============================================================
// 9. Input Helpers (New for v1.3.1)
// ============================================================

/**
 * Read JSON from stdin synchronously
 * FR-03: Added error logging for debugging
 * @returns {Object} Parsed JSON or empty object
 */
function readStdinSync() {
  let data = '';
  try {
    // Read from file descriptor 0 (stdin)
    data = fs.readFileSync(0, 'utf8');
    if (!data || data.trim() === '') {
      debugLog('Input', 'stdin is empty');
      return {};
    }
    return JSON.parse(data);
  } catch (e) {
    // FR-03: Log parsing errors for debugging
    debugLog('Input', 'Failed to parse stdin JSON', {
      error: e.message,
      errorName: e.name,
      dataPreview: (data || '').substring(0, 100)
    });
    return {};
  }
}

/**
 * Read JSON from stdin asynchronously
 * @returns {Promise<Object>} Parsed JSON
 */
async function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('readable', () => {
      let chunk;
      while ((chunk = process.stdin.read()) !== null) {
        data += chunk;
      }
    });
    process.stdin.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        resolve({});
      }
    });
    process.stdin.on('error', () => resolve({}));
  });
}

/**
 * Parse hook input and extract common fields
 * @param {Object} input - Raw hook input
 * @returns {Object} Parsed fields
 */
function parseHookInput(input) {
  return {
    toolName: input.tool_name || '',
    filePath: input.tool_input?.file_path || input.tool_input?.path || '',
    content: input.tool_input?.content || input.tool_input?.new_string || '',
    command: input.tool_input?.command || '',
    oldString: input.tool_input?.old_string || ''
  };
}

// ============================================================
// 10. Task System Integration (v1.3.1 - FR-01~05)
// ============================================================

/**
 * PDCA Phase definitions for Task System integration
 */
const PDCA_PHASES = {
  plan: { order: 1, name: 'Plan', emoji: '📋' },
  design: { order: 2, name: 'Design', emoji: '📐' },
  do: { order: 3, name: 'Do', emoji: '🔨' },
  check: { order: 4, name: 'Check', emoji: '🔍' },
  act: { order: 5, name: 'Act', emoji: '🔄' }
};

/**
 * Generate PDCA Task metadata for Task System integration
 * @param {string} phase - PDCA phase (plan|design|do|check|act)
 * @param {string} feature - Feature name
 * @param {Object} options - Additional options
 * @returns {Object} Task metadata
 */
function getPdcaTaskMetadata(phase, feature, options = {}) {
  const phaseInfo = PDCA_PHASES[phase.toLowerCase()] || PDCA_PHASES.do;

  return {
    pdcaPhase: phase.toLowerCase(),
    pdcaOrder: phaseInfo.order,
    feature: feature || '',
    level: options.level || detectLevel(),
    createdAt: new Date().toISOString(),
    ...options
  };
}

/**
 * Generate Task subject for PDCA phase
 * @param {string} phase - PDCA phase
 * @param {string} feature - Feature name
 * @returns {string} Task subject
 */
function generatePdcaTaskSubject(phase, feature) {
  const phaseInfo = PDCA_PHASES[phase.toLowerCase()] || PDCA_PHASES.do;
  const featureName = feature || 'current task';
  return `[${phaseInfo.name}] ${featureName}`;
}

/**
 * Generate Task description for PDCA phase
 * @param {string} phase - PDCA phase
 * @param {string} feature - Feature name
 * @param {string} docPath - Document path if applicable
 * @returns {string} Task description
 */
function generatePdcaTaskDescription(phase, feature, docPath = '') {
  const phaseDescriptions = {
    plan: `Feature planning for '${feature}'.\nDocument: ${docPath || `docs/01-plan/features/${feature}.plan.md`}`,
    design: `Feature design for '${feature}'.\nDocument: ${docPath || `docs/02-design/features/${feature}.design.md`}`,
    do: `Implementation of '${feature}'.`,
    check: `Gap analysis for '${feature}'.\nDocument: ${docPath || `docs/03-analysis/${feature}.analysis.md`}`,
    act: `Iteration/Report for '${feature}'.\nDocument: ${docPath || `docs/04-report/${feature}.report.md`}`
  };

  return phaseDescriptions[phase.toLowerCase()] || `PDCA ${phase} for ${feature}`;
}

/**
 * Generate Task creation guidance for hooks
 * @param {string} phase - PDCA phase
 * @param {string} feature - Feature name
 * @param {string} blockedByPhase - Previous phase that blocks this (optional)
 * @returns {string} Guidance message for additionalContext
 */
function generateTaskGuidance(phase, feature, blockedByPhase = '') {
  const phaseInfo = PDCA_PHASES[phase.toLowerCase()];
  if (!phaseInfo) return '';

  const subject = generatePdcaTaskSubject(phase, feature);
  const metadata = getPdcaTaskMetadata(phase, feature);

  let guidance = `💡 Task System: Create task "${subject}" with metadata ${JSON.stringify(metadata)}`;

  if (blockedByPhase) {
    const prevPhaseInfo = PDCA_PHASES[blockedByPhase.toLowerCase()];
    if (prevPhaseInfo) {
      guidance += ` | blockedBy: [${prevPhaseInfo.name}] ${feature}`;
    }
  }

  return guidance;
}

/**
 * Get the previous PDCA phase for dependency
 * @param {string} currentPhase - Current PDCA phase
 * @returns {string|null} Previous phase or null
 */
function getPreviousPdcaPhase(currentPhase) {
  const order = {
    plan: null,
    design: 'plan',
    do: 'design',
    check: 'do',
    act: 'check'
  };
  return order[currentPhase.toLowerCase()] || null;
}

/**
 * Find existing PDCA status file
 * @returns {Object|null} PDCA status or null
 */
function findPdcaStatus() {
  const statusPath = path.join(PROJECT_DIR, 'docs/.pdca-status.json');
  try {
    if (fs.existsSync(statusPath)) {
      return JSON.parse(fs.readFileSync(statusPath, 'utf8'));
    }
  } catch (e) { /* ignore */ }
  return null;
}

/**
 * Get current PDCA phase from status
 * @param {string} feature - Feature name
 * @returns {string|null} Current phase or null
 */
function getCurrentPdcaPhase(feature) {
  const status = findPdcaStatus();
  if (!status || !status.features) return null;

  const featureStatus = status.features[feature];
  if (!featureStatus) return null;

  return featureStatus.currentPhase || null;
}

// ============================================================
// 11. Debug Logging (v1.4.0 - Hooks Reliability)
// ============================================================

/**
 * Debug log paths by platform
 */
const DEBUG_LOG_PATHS = {
  claude: process.platform === 'win32'
    ? path.join(process.env.TEMP || 'C:\\Temp', 'bkit-hook-debug.log')
    : '/tmp/bkit-hook-debug.log',
  gemini: process.platform === 'win32'
    ? path.join(process.env.TEMP || 'C:\\Temp', 'bkit-hook-debug-gemini.log')
    : '/tmp/bkit-hook-debug-gemini.log',
  unknown: process.platform === 'win32'
    ? path.join(process.env.TEMP || 'C:\\Temp', 'bkit-hook-debug.log')
    : '/tmp/bkit-hook-debug.log'
};

/**
 * Get debug log file path based on platform
 * @returns {string} Full path to debug log file
 */
function getDebugLogPath() {
  return DEBUG_LOG_PATHS[BKIT_PLATFORM] || DEBUG_LOG_PATHS.unknown;
}

/**
 * Debug log to temporary file
 * Only writes when BKIT_DEBUG environment variable is set to 'true'
 * @param {string} category - Log category (SessionStart, PreToolUse, Agent:name:Stop, etc.)
 * @param {string} message - Log message
 * @param {Object} data - Optional structured data
 */
function debugLog(category, message, data = {}) {
  // v1.4.0: Only log when BKIT_DEBUG is enabled (default: disabled for production)
  if (process.env.BKIT_DEBUG !== 'true') return;

  try {
    const logPath = getDebugLogPath();
    const timestamp = new Date().toISOString();
    const dataStr = Object.keys(data).length > 0
      ? `, ${JSON.stringify(data)}`
      : '';
    const logLine = `[${timestamp}] [${category}] ${message}${dataStr}\n`;

    fs.appendFileSync(logPath, logLine);
  } catch (e) {
    // Fail silently - logging should never break the hook
  }
}

// ============================================================
// 12. PDCA Status Management (v1.4.0 P4 - Schema v2.0)
// ============================================================

/**
 * PDCA Status file path
 */
const PDCA_STATUS_PATH = path.join(PROJECT_DIR, 'docs/.pdca-status.json');

/**
 * v2.0 Schema: Default initial status
 */
function createInitialStatusV2() {
  const now = new Date().toISOString();
  return {
    version: "2.0",
    lastUpdated: now,

    // v2.0: Multi-feature support
    activeFeatures: [],
    primaryFeature: null,

    // Feature-specific status
    features: {},

    // v2.0: Pipeline status
    pipeline: {
      currentPhase: 1,
      level: 'Dynamic',  // Default level
      phaseHistory: []
    },

    // v2.0: Session context
    session: {
      startedAt: now,
      onboardingCompleted: false,
      lastActivity: now
    },

    // History (kept from v1.0)
    history: []
  };
}

/**
 * Migrate v1.0 schema to v2.0
 * @param {Object} oldStatus - v1.0 status object
 * @returns {Object} v2.0 status object
 */
function migrateStatusToV2(oldStatus) {
  const now = new Date().toISOString();

  // Start with v2.0 defaults
  const newStatus = createInitialStatusV2();

  // Migrate features
  if (oldStatus.features) {
    newStatus.features = oldStatus.features;

    // Enhance each feature with v2.0 fields
    for (const [name, feat] of Object.entries(newStatus.features)) {
      if (!feat.requirements) feat.requirements = [];
      if (!feat.documents) feat.documents = {};
      if (!feat.timestamps) {
        feat.timestamps = {
          started: feat.startedAt || now,
          lastUpdated: feat.updatedAt || now
        };
      }
    }

    // Set active features from existing features
    newStatus.activeFeatures = Object.keys(newStatus.features).filter(
      f => newStatus.features[f].phase !== 'completed'
    );
  }

  // Migrate current feature
  if (oldStatus.currentFeature) {
    newStatus.primaryFeature = oldStatus.currentFeature;
    if (!newStatus.activeFeatures.includes(oldStatus.currentFeature)) {
      newStatus.activeFeatures.push(oldStatus.currentFeature);
    }
  }

  // Migrate pipeline phase
  if (oldStatus.currentPhase) {
    newStatus.pipeline.currentPhase = oldStatus.currentPhase;
  }

  // Keep history
  if (oldStatus.history) {
    newStatus.history = oldStatus.history;
  }

  // Update timestamps
  newStatus.lastUpdated = now;
  newStatus.session.lastActivity = now;

  debugLog('PDCA', 'Migrated status from v1.0 to v2.0');

  return newStatus;
}

/**
 * Initialize PDCA status file if not exists
 * Creates docs/.pdca-status.json with v2.0 schema
 */
function initPdcaStatusIfNotExists() {
  if (fs.existsSync(PDCA_STATUS_PATH)) return;

  // Ensure docs directory exists
  const docsDir = path.dirname(PDCA_STATUS_PATH);
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  const initialStatus = createInitialStatusV2();

  fs.writeFileSync(PDCA_STATUS_PATH, JSON.stringify(initialStatus, null, 2));
  _cache.set('pdca-status', initialStatus);
  debugLog('PDCA', 'Status file initialized (v2.0)', { path: PDCA_STATUS_PATH });
}

/**
 * Get current PDCA status with caching and auto-migration
 * @param {boolean} forceRefresh - Skip cache and read from file
 * @returns {Object|null} Full status object (v2.0) or null if not exists
 */
function getPdcaStatusFull(forceRefresh = false) {
  try {
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = _cache.get('pdca-status', 3000);  // 3 second TTL
      if (cached) return cached;
    }

    if (!fs.existsSync(PDCA_STATUS_PATH)) return null;

    let status = JSON.parse(fs.readFileSync(PDCA_STATUS_PATH, 'utf8'));

    // Auto-migrate v1.0 to v2.0
    if (!status.version || status.version === "1.0") {
      status = migrateStatusToV2(status);
      // Save migrated status
      savePdcaStatus(status);
    }

    // Cache the result
    _cache.set('pdca-status', status);

    return status;
  } catch (e) {
    debugLog('PDCA', 'Failed to read status', { error: e.message });
    return null;
  }
}

/**
 * Save PDCA status to file and update cache
 * @param {Object} status - Status object to save
 */
function savePdcaStatus(status) {
  try {
    status.lastUpdated = new Date().toISOString();
    if (status.session) {
      status.session.lastActivity = status.lastUpdated;
    }

    fs.writeFileSync(PDCA_STATUS_PATH, JSON.stringify(status, null, 2));
    _cache.set('pdca-status', status);
    debugLog('PDCA', 'Status saved', { version: status.version });
  } catch (e) {
    debugLog('PDCA', 'Failed to save status', { error: e.message });
  }
}

/**
 * Load PDCA status (alias for backward compatibility)
 * @returns {Object|null}
 */
function loadPdcaStatus() {
  return getPdcaStatusFull();
}

/**
 * Get status for specific feature
 * @param {string} feature - Feature name
 * @returns {Object|null} Feature status or null
 */
function getFeatureStatus(feature) {
  const status = getPdcaStatusFull();
  if (!status || !status.features) return null;
  return status.features[feature] || null;
}

/**
 * Update PDCA status for a feature (v2.0 enhanced)
 * FR-05: Returns result object for caller to check success/failure
 * @param {string} feature - Feature name
 * @param {string} phase - PDCA phase (plan|design|do|check|act|completed)
 * @param {Object} data - Additional data (matchRate, docPath, requirements, fulfillment, etc.)
 * @returns {{ success: boolean, feature?: string, phase?: string, error?: string }}
 */
function updatePdcaStatus(feature, phase, data = {}) {
  try {
    initPdcaStatusIfNotExists();

    const status = getPdcaStatusFull() || createInitialStatusV2();
    const phaseNumber = PDCA_PHASES[phase.toLowerCase()]?.order || 3;
    const now = new Date().toISOString();

    // v2.0: Ensure required structures exist
    if (!status.activeFeatures) status.activeFeatures = [];
    if (!status.features) status.features = {};
    if (!status.pipeline) status.pipeline = { currentPhase: 1, level: 'Dynamic', phaseHistory: [] };
    if (!status.session) status.session = { startedAt: now, onboardingCompleted: false, lastActivity: now };
    if (!status.history) status.history = [];

    // Update or create feature status (v2.0 enhanced structure)
    if (!status.features[feature]) {
      status.features[feature] = {
        phase: phase.toLowerCase(),
        phaseNumber,
        matchRate: null,
        iterationCount: 0,
        requirements: [],
        documents: {},
        timestamps: {
          started: now,
          lastUpdated: now
        }
      };
    }

    // Update feature fields
    const feat = status.features[feature];
    feat.phase = phase.toLowerCase();
    feat.phaseNumber = phaseNumber;
    feat.timestamps.lastUpdated = now;

    // Merge additional data
    if (data.matchRate !== undefined) feat.matchRate = data.matchRate;
    if (data.iterationCount !== undefined) feat.iterationCount = data.iterationCount;
    if (data.requirements) feat.requirements = data.requirements;
    if (data.fulfillment) feat.fulfillment = data.fulfillment;

    // Track document paths
    if (data.planDoc) feat.documents.plan = data.planDoc;
    if (data.designDoc) feat.documents.design = data.designDoc;
    if (data.analysisDoc) feat.documents.analysis = data.analysisDoc;
    if (data.reportDoc) feat.documents.report = data.reportDoc;

    // Mark completion timestamp
    if (phase === 'completed') {
      feat.timestamps.completed = now;
    }

    // v2.0: Update activeFeatures list
    if (phase === 'completed') {
      status.activeFeatures = status.activeFeatures.filter(f => f !== feature);
    } else if (!status.activeFeatures.includes(feature)) {
      status.activeFeatures.push(feature);
    }

    // v2.0: Update primaryFeature
    status.primaryFeature = feature;

    // v2.0: Update session activity
    status.session.lastActivity = now;
    status.lastUpdated = now;

    // Add history entry
    const historyEntry = {
      timestamp: now,
      feature,
      phase: phase.toLowerCase(),
      action: data.matchRate ? 'analyzed' : (phase === 'completed' ? 'completed' : 'updated')
    };

    if (data.matchRate || data.iterationCount || data.fulfillment) {
      historyEntry.details = {};
      if (data.matchRate) historyEntry.details.matchRate = data.matchRate;
      if (data.iterationCount) historyEntry.details.iteration = data.iterationCount;
      if (data.fulfillment) historyEntry.details.fulfillmentScore = data.fulfillment.score;
    }

    status.history.push(historyEntry);

    // Keep history to last 100 entries
    if (status.history.length > 100) {
      status.history = status.history.slice(-100);
    }

    // Save using savePdcaStatus (updates cache)
    savePdcaStatus(status);
    debugLog('PDCA', `Status updated (v2.0): ${feature} → ${phase}`, data);

    // FR-05: Return success result
    return { success: true, feature, phase };

  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    debugLog('PDCA', 'Failed to update status', { error: errorMsg });
    // FR-05: Return failure result with error details
    return { success: false, feature, phase, error: errorMsg };
  }
}

/**
 * Add entry to PDCA history
 * @param {Object} entry - History entry (without timestamp)
 */
function addPdcaHistory(entry) {
  try {
    const status = getPdcaStatusFull();
    if (!status) return;

    const now = new Date().toISOString();
    status.history.push({
      timestamp: now,
      ...entry
    });

    // Keep history to last 100 entries
    if (status.history.length > 100) {
      status.history = status.history.slice(-100);
    }

    status.lastUpdated = now;
    fs.writeFileSync(PDCA_STATUS_PATH, JSON.stringify(status, null, 2));

  } catch (e) {
    debugLog('PDCA', 'Failed to add history', { error: e.message });
  }
}

/**
 * Mark feature as completed
 * @param {string} feature - Feature name
 */
function completePdcaFeature(feature) {
  updatePdcaStatus(feature, 'completed', {
    completedAt: new Date().toISOString()
  });
}

/**
 * Extract feature name from multiple sources
 * Priority: 1) explicit param, 2) agent output, 3) file path, 4) current status
 * @param {Object} sources - Possible sources for feature name
 * @returns {string} Feature name or empty string
 */
function extractFeatureFromContext(sources = {}) {
  // 1. Explicit parameter
  if (sources.explicit && typeof sources.explicit === 'string') {
    return sources.explicit;
  }

  // 2. Agent output (parse from string)
  if (sources.agentOutput && typeof sources.agentOutput === 'string') {
    const patterns = [
      /feature[:\s]+['"]?(\w[\w-]*)['"]?/i,
      /analyzing\s+['"]?(\w[\w-]*)['"]?/i,
      /for\s+['"]?(\w[\w-]*)['"]?\s+feature/i
    ];
    for (const pattern of patterns) {
      const match = sources.agentOutput.match(pattern);
      if (match && match[1]) return match[1];
    }
  }

  // 3. File path
  if (sources.filePath && typeof sources.filePath === 'string') {
    const extracted = extractFeature(sources.filePath);
    if (extracted) return extracted;
  }

  // 4. Current status
  if (sources.currentStatus && sources.currentStatus.currentFeature) {
    return sources.currentStatus.currentFeature;
  }

  return '';
}

// ============================================================
// 12-B. v1.4.0 Multi-Feature Context Management (P4-005)
// ============================================================

/**
 * Set the primary active feature
 * @param {string} feature - Feature name to set as primary
 * @returns {boolean} Success status
 */
function setActiveFeature(feature) {
  if (!feature || typeof feature !== 'string') {
    debugLog('PDCA', 'setActiveFeature: Invalid feature name');
    return false;
  }

  try {
    const status = getPdcaStatusFull(true);

    // Add to activeFeatures if not present
    if (!status.activeFeatures.includes(feature)) {
      status.activeFeatures.push(feature);
    }

    // Set as primary
    status.primaryFeature = feature;
    status.lastUpdated = new Date().toISOString();

    // Update session activity
    if (status.session) {
      status.session.lastActivity = status.lastUpdated;
    }

    savePdcaStatus(status);
    debugLog('PDCA', 'Primary feature set', { feature });
    return true;
  } catch (e) {
    debugLog('PDCA', 'setActiveFeature failed', { error: e.message });
    return false;
  }
}

/**
 * Add a feature to the active features list
 * @param {string} feature - Feature name to add
 * @param {boolean} setAsPrimary - Whether to set as primary (default: false)
 * @returns {boolean} Success status
 */
function addActiveFeature(feature, setAsPrimary = false) {
  if (!feature || typeof feature !== 'string') {
    debugLog('PDCA', 'addActiveFeature: Invalid feature name');
    return false;
  }

  try {
    const status = getPdcaStatusFull(true);

    // Add to activeFeatures if not present
    if (!status.activeFeatures.includes(feature)) {
      status.activeFeatures.push(feature);
    }

    // Initialize feature structure if not exists
    if (!status.features[feature]) {
      const now = new Date().toISOString();
      status.features[feature] = {
        phase: 'plan',
        createdAt: now,
        lastUpdated: now,
        documents: {},
        iterations: { count: 0, history: [] },
        requirements: { total: 0, fulfilled: 0, items: [] }
      };
    }

    // Set as primary if requested or no primary exists
    if (setAsPrimary || !status.primaryFeature) {
      status.primaryFeature = feature;
    }

    status.lastUpdated = new Date().toISOString();
    savePdcaStatus(status);
    debugLog('PDCA', 'Feature added to active list', { feature, setAsPrimary });
    return true;
  } catch (e) {
    debugLog('PDCA', 'addActiveFeature failed', { error: e.message });
    return false;
  }
}

/**
 * Remove a feature from the active features list
 * @param {string} feature - Feature name to remove
 * @returns {boolean} Success status
 */
function removeActiveFeature(feature) {
  if (!feature || typeof feature !== 'string') {
    debugLog('PDCA', 'removeActiveFeature: Invalid feature name');
    return false;
  }

  try {
    const status = getPdcaStatusFull(true);

    // Remove from activeFeatures
    status.activeFeatures = status.activeFeatures.filter(f => f !== feature);

    // If removed feature was primary, select new primary
    if (status.primaryFeature === feature) {
      status.primaryFeature = status.activeFeatures.length > 0
        ? status.activeFeatures[0]
        : null;
    }

    status.lastUpdated = new Date().toISOString();
    savePdcaStatus(status);
    debugLog('PDCA', 'Feature removed from active list', { feature, newPrimary: status.primaryFeature });
    return true;
  } catch (e) {
    debugLog('PDCA', 'removeActiveFeature failed', { error: e.message });
    return false;
  }
}

/**
 * Get all active features
 * @returns {Object} Active features info with primary indicator
 */
function getActiveFeatures() {
  try {
    const status = getPdcaStatusFull();
    return {
      activeFeatures: status.activeFeatures || [],
      primaryFeature: status.primaryFeature || null,
      features: Object.entries(status.features || {})
        .filter(([name]) => (status.activeFeatures || []).includes(name))
        .reduce((acc, [name, data]) => {
          acc[name] = {
            phase: data.phase,
            matchRate: data.matchRate,
            lastUpdated: data.lastUpdated,
            isPrimary: name === status.primaryFeature
          };
          return acc;
        }, {})
    };
  } catch (e) {
    debugLog('PDCA', 'getActiveFeatures failed', { error: e.message });
    return { activeFeatures: [], primaryFeature: null, features: {} };
  }
}

/**
 * Switch to a different feature context
 * @param {string} feature - Feature name to switch to
 * @returns {Object} Switch result with feature context
 */
function switchFeatureContext(feature) {
  if (!feature || typeof feature !== 'string') {
    return { success: false, error: 'Invalid feature name' };
  }

  try {
    const status = getPdcaStatusFull(true);

    // Check if feature exists
    if (!status.features[feature]) {
      return {
        success: false,
        error: `Feature '${feature}' not found. Use addActiveFeature() to create it.`
      };
    }

    // Add to active if not present
    if (!status.activeFeatures.includes(feature)) {
      status.activeFeatures.push(feature);
    }

    // Set as primary
    const previousPrimary = status.primaryFeature;
    status.primaryFeature = feature;
    status.lastUpdated = new Date().toISOString();

    // Update session
    if (status.session) {
      status.session.lastActivity = status.lastUpdated;
    }

    savePdcaStatus(status);

    // Return context info
    const featureData = status.features[feature];
    return {
      success: true,
      previousFeature: previousPrimary,
      currentFeature: feature,
      context: {
        phase: featureData.phase,
        matchRate: featureData.matchRate,
        iterationCount: featureData.iterations?.count || 0,
        documents: featureData.documents || {},
        requirements: featureData.requirements || {}
      }
    };
  } catch (e) {
    debugLog('PDCA', 'switchFeatureContext failed', { error: e.message });
    return { success: false, error: e.message };
  }
}

// ============================================================
// 13. v1.4.0 Intent Detection Functions (8-Language Support)
// ============================================================

/**
 * Detect new feature intent from user message
 * Supports 8 languages: EN, KO, JA, ZH, ES, FR, DE, IT
 * @param {string} userMessage - User input message
 * @returns {Object} IntentDetectionResult
 */
function detectNewFeatureIntent(userMessage) {
  if (!userMessage || typeof userMessage !== 'string') {
    return { isNewFeature: false, featureName: null, confidence: 0, intentType: 'unknown', extractedKeywords: [] };
  }

  const msg = userMessage.toLowerCase().trim();

  // 8개 언어 지원 패턴
  const patterns = {
    en: [
      { regex: /(create|implement|add|build|develop)\s+(?:a\s+)?(.+?)\s*(feature|functionality|module|system)/i, type: 'create' },
      { regex: /(make|write)\s+(?:a\s+)?(.+?)\s*(for|that|which)/i, type: 'create' },
      { regex: /new\s+(.+?)\s*(feature|module|component)/i, type: 'create' }
    ],
    ko: [
      { regex: /(.+?)(기능|feature)\s*(만들어|구현|추가|개발|작성)/i, type: 'create' },
      { regex: /(.+?)\s*(작성|생성|만들)\s*해\s*줘/i, type: 'create' },
      { regex: /(.+?)(을|를)\s*(구현|개발|추가)/i, type: 'create' },
      { regex: /새\s*(.+?)\s*(기능|모듈)/i, type: 'create' }
    ],
    ja: [
      { regex: /(.+?)(機能|フィーチャー)\s*(作って|実装|追加)/i, type: 'create' },
      { regex: /(.+?)(を)?(作成|実装|開発)(して|する)/i, type: 'create' },
      { regex: /新しい\s*(.+?)\s*(機能|モジュール)/i, type: 'create' }
    ],
    zh: [
      { regex: /(创建|实现|添加|开发)(.+?)(功能|模块)/i, type: 'create' },
      { regex: /(做|写|建)(.+?)(功能|系统)/i, type: 'create' },
      { regex: /新的?\s*(.+?)\s*(功能|模块)/i, type: 'create' }
    ],
    es: [
      { regex: /(crear|implementar|añadir|desarrollar)\s+(?:una?\s+)?(.+?)\s*(función|funcionalidad|módulo)/i, type: 'create' },
      { regex: /(hacer|escribir)\s+(?:una?\s+)?(.+)/i, type: 'create' }
    ],
    fr: [
      { regex: /(créer|implémenter|ajouter|développer)\s+(?:une?\s+)?(.+?)\s*(fonction|fonctionnalité|module)/i, type: 'create' },
      { regex: /(faire|écrire)\s+(?:une?\s+)?(.+)/i, type: 'create' }
    ],
    de: [
      { regex: /(erstellen|implementieren|hinzufügen|entwickeln)\s+(?:eine?n?\s+)?(.+?)\s*(Funktion|Funktionalität|Modul)/i, type: 'create' },
      { regex: /(machen|schreiben)\s+(?:eine?n?\s+)?(.+)/i, type: 'create' }
    ],
    it: [
      { regex: /(creare|implementare|aggiungere|sviluppare)\s+(?:una?\s+)?(.+?)\s*(funzione|funzionalità|modulo)/i, type: 'create' },
      { regex: /(fare|scrivere)\s+(?:una?\s+)?(.+)/i, type: 'create' }
    ]
  };

  // Bug fix / Modify patterns
  const modifyPatterns = [
    /fix\s+(.+)/i, /수정|고쳐|버그/i, /修正|バグ/i, /修复|bug/i,
    /corregir|arreglar/i, /corriger|réparer/i, /reparieren|korrigieren/i, /correggere|riparare/i
  ];

  // Check for modify intent first
  for (const pattern of modifyPatterns) {
    if (pattern.test(msg)) {
      return {
        isNewFeature: false,
        featureName: null,
        confidence: 0.7,
        intentType: 'fix',
        extractedKeywords: []
      };
    }
  }

  // Check for new feature patterns
  for (const lang of Object.keys(patterns)) {
    for (const { regex, type } of patterns[lang]) {
      const match = userMessage.match(regex);
      if (match) {
        // Extract feature name (usually in capture group 1 or 2)
        let featureName = match[2] || match[1] || '';
        featureName = featureName.trim().replace(/['"]/g, '').toLowerCase();

        // Clean up common words
        featureName = featureName.replace(/\s*(the|a|an|이|가|을|를|の|を)\s*/gi, ' ').trim();

        // Convert to kebab-case
        featureName = featureName.replace(/\s+/g, '-').replace(/[^a-z0-9가-힣ぁ-んァ-ン一-龥\-]/gi, '');

        if (featureName && featureName.length > 1) {
          return {
            isNewFeature: true,
            featureName: featureName,
            confidence: 0.85 + (lang === 'en' ? 0.1 : 0),
            intentType: type,
            extractedKeywords: [featureName],
            detectedLanguage: lang
          };
        }
      }
    }
  }

  return {
    isNewFeature: false,
    featureName: null,
    confidence: 0,
    intentType: 'unknown',
    extractedKeywords: []
  };
}

/**
 * Match implicit agent trigger from user message
 * @param {string} userMessage - User input
 * @returns {Object|null} { agent, confidence, pattern } or null
 */
function matchImplicitAgentTrigger(userMessage) {
  if (!userMessage || typeof userMessage !== 'string') return null;

  const msg = userMessage.toLowerCase();

  // 8개 언어 지원 에이전트 트리거 패턴
  const implicitPatterns = {
    'gap-detector': {
      patterns: [
        /is this (right|correct)/i, /does this match/i, /verify/i, /check/i,
        /맞아\??/, /괜찮아\??/, /설계대로/, /검증/, /확인/,
        /正しい/, /合ってる/, /これで(いい|大丈夫)/,
        /对吗/, /对不对/, /正确吗/,
        /está (bien|correcto)/i, /es correcto/i,
        /c'est (bon|correct)/i, /est-ce correct/i,
        /ist (das|es) (richtig|korrekt)/i,
        /è (giusto|corretto)/i, /va bene/i
      ],
      contextRequired: ['design', 'implementation']
    },
    'code-analyzer': {
      patterns: [
        /any (issues|problems)/i, /something (wrong|off)/i, /analyze/i, /quality/i,
        /이상해/, /뭔가.*이상/, /문제.*있/, /분석/, /품질/,
        /おかしい/, /問題/, /品質/,
        /有问题/, /质量/, /奇怪/,
        /hay (problemas|errores)/i, /algo (mal|raro)/i,
        /il y a (des problèmes|des erreurs)/i,
        /gibt es (Probleme|Fehler)/i,
        /ci sono (problemi|errori)/i
      ],
      contextRequired: ['code']
    },
    'pdca-iterator': {
      patterns: [
        /make.*better/i, /improve/i, /fix (this|it)/i, /iterate/i, /auto.?fix/i,
        /고쳐/, /더.*좋게/, /개선/, /반복/,
        /直して/, /修正/, /改善/,
        /改进/, /修复/, /改善/,
        /mejorar/i, /arreglar/i, /corregir/i,
        /améliorer/i, /corriger/i, /réparer/i,
        /verbessern/i, /reparieren/i, /korrigieren/i,
        /migliorare/i, /correggere/i, /riparare/i
      ],
      contextRequired: ['check', 'act']
    },
    'report-generator': {
      patterns: [
        /what did we/i, /status/i, /progress/i, /summary/i, /report/i,
        /뭐.*했어/, /진행.*상황/, /요약/, /보고서/,
        /何をした/, /進捗/, /状況/, /報告/,
        /做了什么/, /进度/, /状态/, /报告/,
        /qué hicimos/i, /estado/i, /progreso/i,
        /qu'avons-nous fait/i, /statut/i, /progrès/i,
        /was haben wir/i, /Status/i, /Fortschritt/i,
        /cosa abbiamo fatto/i, /stato/i, /progresso/i
      ],
      contextRequired: ['any']
    },
    'starter-guide': {
      patterns: [
        /help.*understand/i, /don't understand/i, /confused/i, /beginner/i,
        /이해.*안.*돼/, /설명해/, /어려워/, /모르겠/, /초보/,
        /わからない/, /教えて/, /難しい/, /初心者/,
        /不懂/, /不明白/, /太难/, /新手/,
        /no entiendo/i, /explica/i, /difícil/i, /principiante/i,
        /je ne comprends pas/i, /explique/i, /difficile/i, /débutant/i,
        /verstehe nicht/i, /erkläre/i, /schwierig/i, /Anfänger/i,
        /non capisco/i, /spiega/i, /difficile/i, /principiante/i
      ],
      contextRequired: ['any']
    }
  };

  for (const [agent, config] of Object.entries(implicitPatterns)) {
    for (const pattern of config.patterns) {
      if (pattern.test(msg)) {
        return {
          agent,
          confidence: 0.85,
          pattern: pattern.toString(),
          contextRequired: config.contextRequired
        };
      }
    }
  }

  return null;
}

/**
 * Match implicit skill trigger from user message
 * Supports all 18 bkit skills
 * @param {string} userMessage - User input
 * @returns {Object|null} { skill, confidence, pattern } or null
 */
function matchImplicitSkillTrigger(userMessage) {
  if (!userMessage || typeof userMessage !== 'string') return null;

  const msg = userMessage.toLowerCase();

  // 18개 스킬 전체 트리거 패턴
  const implicitSkillPatterns = {
    // === Level Skills (5) ===
    'starter': {
      patterns: [
        /static (website|site)/i, /portfolio/i, /landing page/i, /beginner/i, /first (website|project)/i,
        /정적\s*(웹|사이트)/, /포트폴리오/, /랜딩/, /초보/, /첫\s*(웹|프로젝트)/,
        /静的(サイト|ウェブ)/, /ポートフォリオ/, /初心者/, /初めて/,
        /静态(网站|网页)/, /作品集/, /初学者/, /新手/
      ],
      excludePatterns: [/backend/i, /database/i, /authentication/i, /login/i, /api/i]
    },
    'dynamic': {
      patterns: [
        /fullstack/i, /full-stack/i, /BaaS/i, /login (feature|system)/i, /authentication/i, /database/i,
        /풀스택/, /로그인\s*기능/, /인증/, /회원가입/, /데이터베이스/,
        /フルスタック/, /ログイン機能/, /認証/, /データベース/,
        /全栈/, /登录功能/, /身份验证/, /数据库/
      ],
      excludePatterns: [/kubernetes/i, /terraform/i, /microservice/i, /k8s/i]
    },
    'enterprise': {
      patterns: [
        /microservice/i, /kubernetes/i, /k8s/i, /terraform/i, /AWS/i, /enterprise/i,
        /마이크로서비스/, /쿠버네티스/, /테라폼/, /엔터프라이즈/,
        /マイクロサービス/, /クベルネテス/, /エンタープライズ/,
        /微服务/, /企业级/, /云架构/
      ],
      excludePatterns: []
    },
    'mobile-app': {
      patterns: [
        /mobile app/i, /react native/i, /flutter/i, /expo/i, /iOS app/i, /android app/i,
        /모바일\s*앱/, /리액트\s*네이티브/, /플러터/, /아이폰\s*앱/, /안드로이드\s*앱/,
        /モバイルアプリ/, /リアクトネイティブ/, /フラッター/,
        /移动应用/, /手机应用/
      ],
      excludePatterns: []
    },
    'desktop-app': {
      patterns: [
        /desktop app/i, /electron/i, /tauri/i, /mac app/i, /windows app/i,
        /데스크톱\s*앱/, /일렉트론/, /타우리/, /맥\s*앱/, /윈도우\s*앱/,
        /デスクトップアプリ/, /エレクトロン/,
        /桌面应用/, /桌面程序/
      ],
      excludePatterns: []
    },

    // === Core Skills (4) ===
    'zero-script-qa': {
      patterns: [
        /zero script qa/i, /log.based test/i, /docker log/i, /no test script/i,
        /제로\s*스크립트/, /로그\s*기반\s*테스트/, /도커\s*로그/,
        /ゼロスクリプト/, /ログベース/, /Dockerログ/,
        /零脚本/, /日志测试/, /Docker日志/
      ],
      excludePatterns: []
    },
    'bkit-templates': {
      patterns: [
        /template/i, /plan document/i, /design document/i, /analysis document/i,
        /템플릿/, /계획서/, /설계서/, /분석서/, /보고서/,
        /テンプレート/, /計画書/, /設計書/, /分析書/,
        /模板/, /计划书/, /设计书/, /分析报告/
      ],
      excludePatterns: []
    },
    'bkit-rules': {
      patterns: [
        /bkit rule/i, /PDCA rule/i, /coding standard/i,
        /bkit\s*규칙/, /PDCA\s*규칙/, /코딩\s*표준/,
        /ビーキットルール/, /PDCAルール/,
        /编码标准/
      ],
      excludePatterns: []
    },
    'development-pipeline': {
      patterns: [
        /pipeline/i, /development order/i, /where.*start/i, /what.*first/i, /9.*(phase|stage)/i,
        /파이프라인/, /개발\s*순서/, /뭐부터/, /어디서부터/, /순서/,
        /パイプライン/, /開発順序/, /何から/, /どこから/,
        /开发流程/, /从哪里开始/, /开发顺序/
      ],
      excludePatterns: []
    },

    // === Phase Skills (9) ===
    'phase-1-schema': {
      patterns: [
        /schema/i, /terminology/i, /data model/i, /entity/i, /phase.?1/i,
        /스키마/, /용어/, /데이터\s*모델/, /엔티티/,
        /スキーマ/, /用語/, /データモデル/,
        /模式/, /术语/, /数据模型/
      ],
      excludePatterns: []
    },
    'phase-2-convention': {
      patterns: [
        /convention/i, /coding style/i, /naming rule/i, /code standard/i, /phase.?2/i,
        /컨벤션/, /코딩\s*스타일/, /네이밍\s*규칙/, /코드\s*표준/,
        /コンベンション/, /コーディングスタイル/, /命名規則/,
        /编码规范/, /命名规则/, /代码标准/
      ],
      excludePatterns: []
    },
    'phase-3-mockup': {
      patterns: [
        /mockup/i, /prototype/i, /wireframe/i, /UI design/i, /phase.?3/i,
        /목업/, /프로토타입/, /와이어프레임/, /UI\s*디자인/,
        /モックアップ/, /プロトタイプ/, /ワイヤーフレーム/,
        /原型/, /线框图/, /UI设计/
      ],
      excludePatterns: []
    },
    'phase-4-api': {
      patterns: [
        /API design/i, /REST API/i, /backend/i, /endpoint/i, /phase.?4/i,
        /API\s*설계/, /백엔드/, /엔드포인트/,
        /API設計/, /バックエンド/, /エンドポイント/,
        /API设计/, /后端/, /接口/
      ],
      excludePatterns: []
    },
    'phase-5-design-system': {
      patterns: [
        /design system/i, /component library/i, /design token/i, /shadcn/i, /phase.?5/i,
        /디자인\s*시스템/, /컴포넌트\s*라이브러리/, /디자인\s*토큰/,
        /デザインシステム/, /コンポーネントライブラリ/,
        /设计系统/, /组件库/, /设计令牌/
      ],
      excludePatterns: []
    },
    'phase-6-ui-integration': {
      patterns: [
        /UI implementation/i, /API integration/i, /state management/i, /phase.?6/i,
        /UI\s*구현/, /API\s*연동/, /상태\s*관리/,
        /UI実装/, /API連携/, /状態管理/,
        /UI实现/, /API集成/, /状态管理/
      ],
      excludePatterns: []
    },
    'phase-7-seo-security': {
      patterns: [
        /SEO/i, /security/i, /meta tag/i, /XSS/i, /CSRF/i, /phase.?7/i,
        /검색\s*최적화/, /보안/, /메타\s*태그/,
        /セキュリティ/, /メタタグ/,
        /搜索优化/, /安全/, /元标签/
      ],
      excludePatterns: []
    },
    'phase-8-review': {
      patterns: [
        /code review/i, /architecture review/i, /quality check/i, /gap analysis/i, /phase.?8/i,
        /코드\s*리뷰/, /아키텍처\s*리뷰/, /품질\s*검사/, /갭\s*분석/,
        /コードレビュー/, /アーキテクチャレビュー/, /品質チェック/,
        /代码审查/, /架构审查/, /质量检查/
      ],
      excludePatterns: []
    },
    'phase-9-deployment': {
      patterns: [
        /deployment/i, /CI\/CD/i, /production/i, /vercel/i, /deploy/i, /phase.?9/i,
        /배포/, /프로덕션/, /운영\s*환경/,
        /デプロイ/, /本番/, /運用環境/,
        /部署/, /生产环境/, /运维/
      ],
      excludePatterns: []
    }
  };

  for (const [skill, config] of Object.entries(implicitSkillPatterns)) {
    // Check exclude patterns first
    const excluded = config.excludePatterns.some(pattern => pattern.test(msg));
    if (excluded) continue;

    for (const pattern of config.patterns) {
      if (pattern.test(msg)) {
        return {
          skill,
          confidence: 0.8,
          pattern: pattern.toString()
        };
      }
    }
  }

  return null;
}

// ============================================================
// 14. v1.4.0 Ambiguity Detection Functions
// ============================================================

/**
 * Check if text contains file path or extension
 * @param {string} text - Input text
 * @returns {boolean}
 */
function containsFilePath(text) {
  if (!text) return false;
  const patterns = [
    /\.(js|ts|tsx|jsx|py|go|rs|java|cpp|c|h|md|json|yaml|yml|css|scss|html)(\s|$)/i,
    /(src|lib|scripts|hooks|docs|tests?|spec|components?|pages?)\//i,
    /[A-Za-z]:\\|\/[A-Za-z]+\//  // Windows/Unix absolute paths
  ];
  return patterns.some(p => p.test(text));
}

/**
 * Check if text contains technical terms
 * @param {string} text - Input text
 * @returns {boolean}
 */
function containsTechnicalTerms(text) {
  if (!text) return false;
  const technicalTerms = [
    /function\s+\w+/i, /class\s+\w+/i, /interface\s+\w+/i, /const\s+\w+/i,
    /useState|useEffect|component|module|import|export/i,
    /REST|GraphQL|endpoint|API|HTTP|GET|POST|PUT|DELETE/i,
    /SELECT|INSERT|UPDATE|DELETE|JOIN|WHERE/i,
    /PDCA|gap-detector|pdca-iterator|pipeline/i,
    /npm|yarn|pnpm|pip|cargo|go mod/i
  ];
  return technicalTerms.some(p => p.test(text));
}

/**
 * Check if text has specific nouns (not vague)
 * @param {string} text - Input text
 * @returns {boolean}
 */
function hasSpecificNouns(text) {
  if (!text) return false;
  // Vague pronouns that indicate ambiguity
  const vaguePronouns = /\b(it|this|that|something|thing|stuff|이거|저거|그거|これ|それ|あれ|这个|那个)\b/i;
  return !vaguePronouns.test(text) || text.length > 30;
}

/**
 * Check if text has scope definition
 * @param {string} text - Input text
 * @returns {boolean}
 */
function hasScopeDefinition(text) {
  if (!text) return false;
  const scopeIndicators = [
    /\b(only|just|simple|basic|full|complete|all|entire|minimal|minimum)\b/i,
    /\b(한|전체|모든|간단|기본|최소)\b/,
    /\b(だけ|全部|全て|簡単|基本)\b/,
    /\b(只|全部|所有|简单|基本)\b/
  ];
  return scopeIndicators.some(p => p.test(text));
}

/**
 * Check for multiple interpretations
 * @param {string} text - Input text
 * @returns {boolean}
 */
function hasMultipleInterpretations(text) {
  if (!text) return false;
  // Words that could mean many things
  const ambiguousWords = /\b(better|good|nice|improve|update|change|fix|좋게|개선|변경|수정|良く|改善|变好|改进)\b/i;
  return ambiguousWords.test(text) && text.length < 50;
}

/**
 * Detect context conflicts
 * @param {string} request - User request
 * @param {Object} context - Current context (files, status)
 * @returns {boolean}
 */
function detectContextConflicts(request, context) {
  if (!context) return false;
  // Simple heuristic: if request mentions creating something that might exist
  const createWords = /\b(create|make|new|add|만들|생성|추가|作成|新しい|创建|新)\b/i;
  if (createWords.test(request) && context.existingFeature) {
    return true;
  }
  return false;
}

/**
 * Calculate ambiguity score for user request
 * @param {string} userRequest - User request text
 * @param {Object} context - Current context
 * @returns {Object} AmbiguityResult
 */
function calculateAmbiguityScore(userRequest, context = {}) {
  if (!userRequest || typeof userRequest !== 'string') {
    return { score: 100, factors: [{ type: 'empty_request', weight: 100 }], shouldClarify: true, bypassed: false };
  }

  // === Magic Word Bypass ===
  const bypassKeywords = ['!hotfix', '!prototype', '!bypass'];
  for (const keyword of bypassKeywords) {
    if (userRequest.includes(keyword)) {
      return {
        score: 0,
        factors: [],
        shouldClarify: false,
        bypassed: true,
        bypassReason: `Magic word "${keyword}" detected`
      };
    }
  }

  let score = 0;
  const factors = [];

  // === Addition Factors ===

  // 1. Missing specific nouns (+20)
  if (!hasSpecificNouns(userRequest)) {
    score += 20;
    factors.push({ type: 'missing_details', weight: 20, description: 'Vague pronouns used' });
  }

  // 2. Scope undefined (+20)
  if (!hasScopeDefinition(userRequest)) {
    score += 20;
    factors.push({ type: 'scope_undefined', weight: 20, description: 'Scope not specified' });
  }

  // 3. Multiple interpretations possible (+30)
  if (hasMultipleInterpretations(userRequest)) {
    score += 30;
    factors.push({ type: 'multi_interpretation', weight: 30, description: 'Request is ambiguous' });
  }

  // 4. Context conflicts (+30)
  if (detectContextConflicts(userRequest, context)) {
    score += 30;
    factors.push({ type: 'conflict_detected', weight: 30, description: 'May conflict with existing code' });
  }

  // 5. Very short request (+20)
  if (userRequest.length < 15) {
    score += 20;
    factors.push({ type: 'too_short', weight: 20, description: 'Request too brief' });
  }

  // === Deduction Factors ===

  // 6. Contains file path (-30)
  if (containsFilePath(userRequest)) {
    score -= 30;
    factors.push({ type: 'has_file_path', weight: -30, description: 'File path specified' });
  }

  // 7. Contains technical terms (-20)
  if (containsTechnicalTerms(userRequest)) {
    score -= 20;
    factors.push({ type: 'has_technical_terms', weight: -20, description: 'Technical terms used' });
  }

  // Ensure score is within 0-100
  score = Math.max(0, Math.min(100, score));

  return {
    score,
    factors,
    shouldClarify: score >= 50,
    clarifyingQuestions: score >= 50 ? generateClarifyingQuestions(userRequest, factors) : undefined,
    bypassed: false
  };
}

/**
 * Generate clarifying questions based on ambiguity factors
 * @param {string} userRequest - Original request
 * @param {Array} factors - Ambiguity factors
 * @returns {Array} ClarifyingQuestion[]
 */
function generateClarifyingQuestions(userRequest, factors) {
  const questions = [];
  const featureName = extractFeatureNameFromRequest(userRequest);

  for (const factor of factors) {
    switch (factor.type) {
      case 'scope_undefined':
        questions.push({
          question: `"${featureName || 'this feature'}"의 범위를 정해주세요`,
          header: 'Scope',
          options: [
            { label: '최소 기능 (권장)', description: '핵심 기능만 빠르게 구현' },
            { label: '기본 기능', description: '일반적인 기능 포함' },
            { label: '전체 기능', description: '모든 관련 기능 포함' }
          ]
        });
        break;

      case 'conflict_detected':
        questions.push({
          question: '기존 코드와의 관계를 정해주세요',
          header: 'Conflict',
          options: [
            { label: '확장', description: '기존 코드 위에 추가' },
            { label: '교체', description: '새 코드로 대체' },
            { label: '별도 생성', description: '새 파일/모듈로 분리' }
          ]
        });
        break;

      case 'multi_interpretation':
        questions.push({
          question: '어떤 종류의 작업인가요?',
          header: 'Task Type',
          options: [
            { label: '새 기능', description: '처음부터 새로 만들기' },
            { label: '수정/개선', description: '기존 코드 변경' },
            { label: '버그 수정', description: '문제 해결' }
          ]
        });
        break;

      case 'missing_details':
        questions.push({
          question: '더 구체적으로 설명해 주세요',
          header: 'Details',
          options: [
            { label: '자세히 설명', description: '추가 정보 제공' },
            { label: 'AI가 판단', description: '컨텍스트 기반 자동 결정' }
          ]
        });
        break;
    }
  }

  return questions.slice(0, 4); // Max 4 questions
}

/**
 * Extract feature name from user request
 * @param {string} request - User request
 * @returns {string} Feature name or empty string
 */
function extractFeatureNameFromRequest(request) {
  if (!request) return '';

  // Try to extract feature name using various patterns
  const patterns = [
    /(?:create|implement|add|build|make|develop)\s+(?:a\s+)?([a-z][a-z0-9-]*)/i,
    /([가-힣]+)\s*(?:기능|feature)/i,
    /(.+?)\s*(?:만들|구현|추가)/i
  ];

  for (const pattern of patterns) {
    const match = request.match(pattern);
    if (match && match[1] && match[1].length > 1) {
      return match[1].toLowerCase().trim();
    }
  }

  return '';
}

// ============================================================
// 15. v1.4.0 PDCA Automation Functions
// ============================================================

/**
 * Determine if PDCA should auto-start
 * @param {string} feature - Feature name
 * @param {string} taskClassification - Task classification
 * @returns {boolean}
 */
function shouldAutoStartPdca(feature, taskClassification) {
  // Quick Fix → No auto-start
  if (taskClassification === 'quick_fix') return false;

  // Minor Change → Optional based on config
  if (taskClassification === 'minor_change') {
    return getConfig('pdca.requireDesignDoc', false);
  }

  // Feature, Major Feature → Strongly recommended (true)
  return true;
}

/**
 * Auto advance PDCA phase
 * @param {string} feature - Feature name
 * @param {string} currentPhase - Current phase
 * @param {Object} result - Phase result (matchRate, etc.)
 * @returns {Object} { nextPhase, autoExecute, command }
 */
function autoAdvancePdcaPhase(feature, currentPhase, result = {}) {
  const matchRateThreshold = getConfig('pdca.matchRateThreshold', 90);

  const transitions = {
    'plan': { next: 'design', command: `/pdca-design ${feature}` },
    'design': { next: 'do', command: null }, // Do has no auto-command
    'do': { next: 'check', command: `/pdca-analyze ${feature}` },
    'check': {
      next: (result.matchRate || 0) >= matchRateThreshold ? 'completed' : 'act',
      command: (result.matchRate || 0) >= matchRateThreshold
        ? `/pdca-report ${feature}`
        : `/pdca-iterate ${feature}`
    },
    'act': { next: 'check', command: `/pdca-analyze ${feature}` }
  };

  const transition = transitions[currentPhase.toLowerCase()];
  if (!transition) {
    return { nextPhase: 'unknown', autoExecute: false, command: null };
  }

  return {
    nextPhase: typeof transition.next === 'function' ? transition.next() : transition.next,
    autoExecute: transition.command !== null,
    command: transition.command
  };
}

/**
 * Get Hook context (platform unified)
 * @returns {Object} HookContext
 */
function getHookContext() {
  const isGemini = isGeminiCli();

  return {
    platform: isGemini ? 'gemini' : 'claude',
    toolName: process.env.TOOL_NAME || 'unknown',
    toolInput: isGemini
      ? safeJsonParse(process.env.TOOL_INPUT, {})
      : safeJsonParse(process.env.TOOL_PARAMS, {}),
    filePath: process.env.FILE_PATH || '',
    sessionId: process.env.SESSION_ID || '',
    projectDir: PROJECT_DIR
  };
}

/**
 * Emit AskUserQuestion payload (platform unified)
 * @param {Object} options - Question options
 * @returns {string} Formatted output
 */
function emitUserPrompt(options) {
  const isGemini = isGeminiCli();

  const payload = {
    type: 'ask_user',
    questions: options.questions || [{
      question: options.question,
      header: options.header || 'Question',
      options: options.options || [],
      multiSelect: options.multiSelect || false
    }]
  };

  if (isGemini) {
    // Gemini CLI: JSON to stdout
    return JSON.stringify(payload);
  } else {
    // Claude Code: Formatted text with recommendations
    return formatAskUserQuestion(payload);
  }
}

/**
 * Format AskUserQuestion for Claude Code
 * @param {Object} payload - Question payload
 * @returns {string} Formatted text
 */
function formatAskUserQuestion(payload) {
  let output = '';
  for (const q of payload.questions) {
    output += `\n❓ **${q.header}**: ${q.question}\n`;
    if (q.options && q.options.length > 0) {
      q.options.forEach((opt, idx) => {
        const prefix = idx === 0 && opt.label.includes('권장') ? '→ ' : '  ';
        output += `${prefix}${idx + 1}. **${opt.label}**: ${opt.description}\n`;
      });
    }
  }
  return output.trim();
}

/**
 * Safe JSON parse with fallback
 * @param {string} str - JSON string
 * @param {*} fallback - Fallback value
 * @returns {*} Parsed value or fallback
 */
function safeJsonParse(str, fallback = null) {
  try {
    return str ? JSON.parse(str) : fallback;
  } catch (e) {
    return fallback;
  }
}

/**
 * Get bkit configuration with caching and environment variable overrides
 * v1.4.0 P4: Enhanced with caching and env var support
 *
 * Environment variable override format:
 * - BKIT_PDCA_THRESHOLD → pdca.matchRateThreshold
 * - BKIT_PDCA_MAX_ITERATIONS → pdca.maxIterations
 * - BKIT_PDCA_AUTO_ITERATE → pdca.autoIterate
 * - BKIT_TRIGGER_ENABLED → triggers.implicitEnabled
 * - BKIT_PIPELINE_AUTO → pipeline.autoTransition
 *
 * @param {boolean} forceRefresh - Force cache refresh
 * @returns {Object} Configuration object
 */
function getBkitConfig(forceRefresh = false) {
  // Check cache first (10 second TTL for config)
  if (!forceRefresh) {
    const cached = _cache.get('bkit-config', 10000);
    if (cached) return cached;
  }

  // Build configuration with environment variable overrides
  const config = {
    pdca: {
      matchRateThreshold: parseInt(process.env.BKIT_PDCA_THRESHOLD, 10) ||
        getConfig('pdca.matchRateThreshold', 90),
      maxIterations: parseInt(process.env.BKIT_PDCA_MAX_ITERATIONS, 10) ||
        getConfig('pdca.maxIterations', 5),
      autoIterate: process.env.BKIT_PDCA_AUTO_ITERATE !== undefined
        ? process.env.BKIT_PDCA_AUTO_ITERATE === 'true'
        : getConfig('pdca.autoIterate', true),
      requireDesignDoc: process.env.BKIT_PDCA_REQUIRE_DESIGN !== undefined
        ? process.env.BKIT_PDCA_REQUIRE_DESIGN === 'true'
        : getConfig('pdca.requireDesignDoc', true)
    },
    triggers: {
      implicitEnabled: process.env.BKIT_TRIGGER_ENABLED !== undefined
        ? process.env.BKIT_TRIGGER_ENABLED === 'true'
        : getConfig('triggers.implicitEnabled', true),
      confidenceThreshold: parseFloat(process.env.BKIT_TRIGGER_CONFIDENCE) ||
        getConfig('triggers.confidenceThreshold', 0.8),
      clarifyAmbiguity: process.env.BKIT_TRIGGER_CLARIFY !== undefined
        ? process.env.BKIT_TRIGGER_CLARIFY === 'true'
        : getConfig('triggers.clarifyAmbiguity', true)
    },
    pipeline: {
      autoTransition: process.env.BKIT_PIPELINE_AUTO !== undefined
        ? process.env.BKIT_PIPELINE_AUTO === 'true'
        : getConfig('pipeline.autoTransition', true),
      skipConfirmation: process.env.BKIT_PIPELINE_SKIP_CONFIRM !== undefined
        ? process.env.BKIT_PIPELINE_SKIP_CONFIRM === 'true'
        : getConfig('pipeline.skipConfirmation', false)
    },
    // v1.4.0 P4: Additional configuration sections
    multiFeature: {
      maxActiveFeatures: parseInt(process.env.BKIT_MAX_FEATURES, 10) ||
        getConfig('multiFeature.maxActiveFeatures', 5),
      autoSwitch: process.env.BKIT_AUTO_SWITCH !== undefined
        ? process.env.BKIT_AUTO_SWITCH === 'true'
        : getConfig('multiFeature.autoSwitch', true)
    },
    cache: {
      enabled: process.env.BKIT_CACHE_ENABLED !== undefined
        ? process.env.BKIT_CACHE_ENABLED === 'true'
        : getConfig('cache.enabled', true),
      ttl: parseInt(process.env.BKIT_CACHE_TTL, 10) ||
        getConfig('cache.ttl', 5000)
    }
  };

  // Cache the result
  _cache.set('bkit-config', config);

  return config;
}

// ============================================================
// 16. Requirement Fulfillment Functions (v1.4.0 - P2)
// ============================================================

/**
 * Extract requirements from Plan document
 * @param {string} planDocPath - Path to plan document
 * @returns {Array<{id: string, text: string, priority: string}>}
 */
function extractRequirementsFromPlan(planDocPath) {
  const requirements = [];

  try {
    const fullPath = path.isAbsolute(planDocPath)
      ? planDocPath
      : path.join(PROJECT_DIR, planDocPath);

    if (!fs.existsSync(fullPath)) {
      debugLog('RequirementTracer', 'Plan doc not found', { path: fullPath });
      return requirements;
    }

    const content = fs.readFileSync(fullPath, 'utf8');

    // Pattern 1: Markdown table with ID column
    const tablePattern = /\|\s*(FR-\d+|REQ-\d+|P\d+-\d+)\s*\|\s*([^|]+)\s*\|\s*(High|Medium|Low|Critical)?\s*\|/gi;
    let match;
    while ((match = tablePattern.exec(content)) !== null) {
      requirements.push({
        id: match[1].trim(),
        text: match[2].trim(),
        priority: match[3]?.trim() || 'Medium'
      });
    }

    // Pattern 2: List items with IDs
    const listPattern = /[-*]\s*\[(FR-\d+|REQ-\d+|P\d+-\d+)\]\s*(.+)/gi;
    while ((match = listPattern.exec(content)) !== null) {
      const id = match[1].trim();
      if (!requirements.find(r => r.id === id)) {
        requirements.push({
          id: id,
          text: match[2].trim(),
          priority: 'Medium'
        });
      }
    }

    // Pattern 3: Checkbox items
    const checkboxPattern = /[-*]\s*\[[ x]\]\s*(?:lib\/|scripts\/|hooks\/)?([^:]+):\s*`?(\w+)\(`?\)?/gi;
    while ((match = checkboxPattern.exec(content)) !== null) {
      const id = `IMPL-${String(requirements.length + 1).padStart(3, '0')}`;
      requirements.push({
        id: id,
        text: `${match[1]}: ${match[2]}()`,
        priority: 'High'
      });
    }

    debugLog('RequirementTracer', 'Requirements extracted', {
      path: fullPath,
      count: requirements.length
    });

  } catch (error) {
    debugLog('RequirementTracer', 'Error extracting requirements', { error: error.message });
  }

  return requirements;
}

/**
 * Calculate requirement fulfillment rate
 * @param {string} planDocPath - Path to plan document
 * @param {Object} implementationAnalysis - Analysis results from code
 * @returns {{ overall: number, requirements: Array, gaps: Array }}
 */
function calculateRequirementFulfillment(planDocPath, implementationAnalysis = {}) {
  const requirements = extractRequirementsFromPlan(planDocPath);

  if (requirements.length === 0) {
    return { overall: 0, requirements: [], gaps: ['No requirements found in plan document'] };
  }

  const results = [];
  const implementedFunctions = implementationAnalysis.functions || [];
  const implementedFiles = implementationAnalysis.files || [];

  for (const req of requirements) {
    let status = 'missing';
    let score = 0;

    const funcMatch = req.text.match(/`?(\w+)\(\)`?/);
    if (funcMatch) {
      const funcName = funcMatch[1];
      if (implementedFunctions.includes(funcName)) {
        status = 'fulfilled';
        score = 100;
      }
    }

    const fileMatch = req.text.match(/([\w\/.-]+\.(js|ts|tsx|jsx|py))/);
    if (fileMatch && status !== 'fulfilled') {
      const fileName = fileMatch[1];
      if (implementedFiles.some(f => f.includes(fileName))) {
        status = 'partial';
        score = 50;
      }
    }

    if (status === 'missing') {
      const keywords = req.text.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      const matchCount = keywords.filter(k =>
        implementedFunctions.some(f => f.toLowerCase().includes(k)) ||
        implementedFiles.some(f => f.toLowerCase().includes(k))
      ).length;

      if (matchCount > 0) {
        score = Math.min(50, matchCount * 20);
        status = score >= 50 ? 'partial' : 'missing';
      }
    }

    results.push({ id: req.id, text: req.text, priority: req.priority, status, score });
  }

  const overall = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
    : 0;

  const gaps = results
    .filter(r => r.status !== 'fulfilled')
    .map(r => `${r.id}: ${r.text} (${r.status})`);

  return { overall, requirements: results, gaps };
}

// ============================================================
// 17. Phase Transition Functions (v1.4.0 - P3)
// ============================================================

/**
 * Check if phase deliverables are complete
 * @param {number} phase - Phase number (1-9)
 * @param {string} feature - Feature name
 * @returns {{ complete: boolean, missing: string[], optional: string[] }}
 */
function checkPhaseDeliverables(phase, feature) {
  const deliverables = {
    1: { required: [`docs/01-plan/schema/${feature}.schema.md`], optional: [] },
    2: { required: [`docs/01-plan/conventions/${feature}.convention.md`], optional: [] },
    3: { required: [], optional: [`mockups/${feature}/`] },
    4: { required: [`docs/02-design/api/${feature}.api.md`], optional: [] },
    5: { required: [], optional: [`src/components/${feature}/`] },
    6: { required: [], optional: [`src/pages/${feature}/`] },
    7: { required: [], optional: [] },
    8: { required: [`docs/03-analysis/${feature}.analysis.md`], optional: [] },
    9: { required: [], optional: [`docs/04-report/${feature}.report.md`] }
  };

  const phaseDeliverables = deliverables[phase] || { required: [], optional: [] };
  const missing = [];
  const optionalCompleted = [];

  for (const req of phaseDeliverables.required) {
    const fullPath = path.join(PROJECT_DIR, req);
    if (!fs.existsSync(fullPath)) {
      missing.push(req);
    }
  }

  for (const opt of phaseDeliverables.optional) {
    const fullPath = path.join(PROJECT_DIR, opt);
    if (fs.existsSync(fullPath)) {
      optionalCompleted.push(opt);
    }
  }

  return { complete: missing.length === 0, missing, optional: optionalCompleted };
}

/**
 * Validate PDCA phase transition
 * @param {string} feature - Feature name
 * @param {string} fromPhase - Current phase
 * @param {string} toPhase - Target phase
 * @returns {{ valid: boolean, reason?: string, suggestion?: string }}
 */
function validatePdcaTransition(feature, fromPhase, toPhase) {
  const phaseOrder = ['plan', 'design', 'do', 'check', 'act', 'completed'];
  const fromIndex = phaseOrder.indexOf(fromPhase);
  const toIndex = phaseOrder.indexOf(toPhase);

  if (fromIndex === -1 || toIndex === -1) {
    return { valid: false, reason: `Invalid phase`, suggestion: `Valid: ${phaseOrder.join(', ')}` };
  }

  const isForward = toIndex > fromIndex;
  const isCheckActLoop = (fromPhase === 'check' && toPhase === 'act') ||
    (fromPhase === 'act' && toPhase === 'check');

  if (!isForward && !isCheckActLoop && toPhase !== 'completed') {
    return { valid: false, reason: `Cannot go from ${fromPhase} to ${toPhase}` };
  }

  if (fromPhase === 'plan' && toPhase === 'design' && !findPlanDoc(feature)) {
    return { valid: false, reason: 'Plan doc not found', suggestion: `/pdca-plan ${feature}` };
  }

  if (fromPhase === 'design' && toPhase === 'do' && !findDesignDoc(feature)) {
    return { valid: false, reason: 'Design doc not found', suggestion: `/pdca-design ${feature}` };
  }

  if (fromPhase === 'check' && toPhase === 'completed') {
    const status = getPdcaStatusFull();
    const matchRate = status.features?.[feature]?.matchRate || 0;
    if (matchRate < 90) {
      return { valid: false, reason: `Match rate ${matchRate}% < 90%`, suggestion: `/pdca-iterate ${feature}` };
    }
  }

  return { valid: true };
}

// ============================================================
// 18. Platform Compatibility (v1.4.0)
// ============================================================

/**
 * Check if running in Gemini CLI environment
 * @returns {boolean}
 */
function isGeminiCli() {
  return BKIT_PLATFORM === 'gemini';
}

/**
 * Check if running in Claude Code environment
 * @returns {boolean}
 */
function isClaudeCode() {
  return BKIT_PLATFORM === 'claude';
}

/**
 * Get platform-specific path from plugin root
 * @param {string} relativePath - Relative path from plugin root
 * @returns {string} Full path
 */
function getPluginPath(relativePath) {
  return path.join(PLUGIN_ROOT, relativePath);
}

/**
 * Get project path
 * @param {string} relativePath - Relative path from project root
 * @returns {string} Full path
 */
function getProjectPath(relativePath) {
  return path.join(PROJECT_DIR, relativePath);
}

/**
 * Get template file path
 * @param {string} templateName - Template name (plan, design, analysis, report)
 * @returns {string} Full path to template
 */
function getTemplatePath(templateName) {
  return path.join(PLUGIN_ROOT, 'templates', `${templateName}.template.md`);
}

// ============================================================
// Exports
// ============================================================

module.exports = {
  // Configuration
  getConfig,
  getConfigArray,
  loadConfig,

  // File Detection
  isSourceFile,
  isCodeFile,
  isUiFile,
  isEnvFile,

  // Tier Detection
  getLanguageTier,
  getTierDescription,
  getTierPdcaGuidance,
  isTier1,
  isTier2,
  isTier3,
  isTier4,
  isExperimentalTier,

  // Feature Detection
  extractFeature,

  // PDCA Document Detection
  findDesignDoc,
  findPlanDoc,

  // Task Classification
  classifyTask,
  classifyTaskByLines,
  getPdcaLevel,
  getPdcaGuidance,
  getPdcaGuidanceByLevel,

  // JSON Output
  outputAllow,
  outputBlock,
  outputEmpty,
  truncateContext,
  MAX_CONTEXT_LENGTH,

  // Level Detection
  detectLevel,

  // Input Helpers
  readStdin,
  readStdinSync,
  parseHookInput,

  // Constants
  PLUGIN_ROOT,
  PROJECT_DIR,
  TIER_EXTENSIONS,
  DEFAULT_EXCLUDE_PATTERNS,
  DEFAULT_FEATURE_PATTERNS,

  // Task System Integration (v1.3.1 - FR-01~05)
  PDCA_PHASES,
  getPdcaTaskMetadata,
  generatePdcaTaskSubject,
  generatePdcaTaskDescription,
  generateTaskGuidance,
  getPreviousPdcaPhase,
  findPdcaStatus,
  getCurrentPdcaPhase,

  // Platform Compatibility (v1.4.0)
  BKIT_PLATFORM,
  BKIT_PROJECT_DIR,
  detectPlatform,
  isGeminiCli,
  isClaudeCode,
  getPluginPath,
  getProjectPath,
  getTemplatePath,

  // Debug Logging (v1.4.0 - Hooks Reliability)
  DEBUG_LOG_PATHS,
  debugLog,
  getDebugLogPath,

  // PDCA Status Management (v1.4.0 - Hooks Reliability)
  PDCA_STATUS_PATH,
  initPdcaStatusIfNotExists,
  getPdcaStatusFull,
  getFeatureStatus,
  updatePdcaStatus,
  addPdcaHistory,
  completePdcaFeature,
  extractFeatureFromContext,
  savePdcaStatus,
  loadPdcaStatus,

  // v1.4.0 Multi-Feature Context Management (P4)
  setActiveFeature,
  addActiveFeature,
  removeActiveFeature,
  getActiveFeatures,
  switchFeatureContext,

  // v1.4.0 Intent Detection (8-Language Support)
  detectNewFeatureIntent,
  matchImplicitAgentTrigger,
  matchImplicitSkillTrigger,

  // v1.4.0 Ambiguity Detection
  containsFilePath,
  containsTechnicalTerms,
  hasSpecificNouns,
  hasScopeDefinition,
  hasMultipleInterpretations,
  detectContextConflicts,
  calculateAmbiguityScore,
  generateClarifyingQuestions,
  extractFeatureNameFromRequest,

  // v1.4.0 PDCA Automation
  shouldAutoStartPdca,
  autoAdvancePdcaPhase,
  getHookContext,
  emitUserPrompt,
  formatAskUserQuestion,
  safeJsonParse,
  getBkitConfig,

  // v1.4.0 Requirement Fulfillment (P2)
  extractRequirementsFromPlan,
  calculateRequirementFulfillment,

  // v1.4.0 Phase Transition (P3)
  checkPhaseDeliverables,
  validatePdcaTransition
};
