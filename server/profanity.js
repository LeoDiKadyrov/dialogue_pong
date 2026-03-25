/**
 * Server-side profanity filter
 * Same as client version but imported server-side
 */

const BLOCKED_WORDS = [
  'fuck',
  'fack', // catches leet variant f4ck (4 → a)
  'shit',
  'ass',
  'bitch',
  'cunt',
  'dick',
  'pussy',
  'bastard',
  'damn',
  'piss',
  'asshole',
];

// Common leet substitution map — used for detection only, not displayed
const LEET_MAP = {
  '4': 'a', '@': 'a',
  '3': 'e',
  '1': 'i', '!': 'i',
  '0': 'o',
  '5': 's', '$': 's',
  '7': 't',
};

/**
 * Normalize text for filter comparison: strip accents + apply leet substitutions.
 * Does NOT modify the original — only used to detect blocked words.
 * @param {string} text
 * @returns {string}
 */
function normalizeForFilter(text) {
  // NFD decomposes accented chars (é → e + combining accent), then strip combining chars
  const noAccents = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  // Map leet chars to their letter equivalents
  return noAccents.replace(/[4@3!105$7]/g, (c) => LEET_MAP[c] ?? c).toLowerCase();
}

/**
 * Filter profanity from a message.
 * Detects blocked words in normalized form, replaces matching spans in original text.
 * Collects ALL replacements first (indexed against normalized), then applies them
 * in a single pass from end to start to avoid offset drift.
 * @param {string} text - Raw message text
 * @returns {string} Filtered message with bad words replaced by ***
 */
export function filterMessage(text) {
  if (!text || typeof text !== 'string') return text;

  const normalized = normalizeForFilter(text);

  // Collect all replacement ranges from the normalized string in one pass
  const allReplacements = [];
  for (const word of BLOCKED_WORDS) {
    const normRegex = new RegExp(`\\b${word}\\b`, 'gi');
    let match;
    while ((match = normRegex.exec(normalized)) !== null) {
      allReplacements.push({ start: match.index, end: match.index + match[0].length });
    }
  }

  if (allReplacements.length === 0) return text;

  // Sort by start position and deduplicate overlapping ranges
  allReplacements.sort((a, b) => a.start - b.start);
  const merged = [allReplacements[0]];
  for (let i = 1; i < allReplacements.length; i++) {
    const prev = merged[merged.length - 1];
    const curr = allReplacements[i];
    if (curr.start < prev.end) {
      // Overlapping — extend the previous range
      prev.end = Math.max(prev.end, curr.end);
    } else {
      merged.push(curr);
    }
  }

  // Apply replacements from end to start to preserve earlier indices
  let result = text;
  for (let i = merged.length - 1; i >= 0; i--) {
    const { start, end } = merged[i];
    result = result.slice(0, start) + '***' + result.slice(end);
  }
  return result;
}
