/**
 * profanity.test.js — Unit tests for server/profanity.js
 * Same behavioural contract as the client-side filter.
 * Both are tested independently to catch accidental divergence.
 */

import { describe, it, expect } from 'vitest';
import { filterMessage } from '../../server/profanity.js';

describe('filterMessage (server)', () => {
  it('returns clean text unchanged', () => {
    expect(filterMessage('Hello there!')).toBe('Hello there!');
  });

  it('replaces a blocked word with ***', () => {
    expect(filterMessage('what the fuck')).toBe('what the ***');
  });

  it('is case-insensitive — FUCK is replaced', () => {
    expect(filterMessage('FUCK this')).toBe('*** this');
  });

  it('is case-insensitive — mixed case is replaced', () => {
    expect(filterMessage('Shit happens')).toBe('*** happens');
  });

  it('respects word boundaries — "assignment" is NOT filtered', () => {
    expect(filterMessage('assignment')).toBe('assignment');
  });

  it('replaces multiple blocked words in one message', () => {
    const result = filterMessage('fuck and shit');
    expect(result).toBe('*** and ***');
  });

  it('returns an empty string unchanged', () => {
    expect(filterMessage('')).toBe('');
  });

  // Unicode normalization cases
  it('filters accented variants', () => {
    const result = filterMessage('fück this');
    expect(result).not.toContain('fück');
    expect(result).toContain('***');
  });

  it('filters leet substitution f4ck', () => {
    const result = filterMessage('f4ck this');
    expect(result).not.toContain('f4ck');
    expect(result).toContain('***');
  });

  it('filters leet substitution sh1t', () => {
    const result = filterMessage('sh1t happens');
    expect(result).not.toContain('sh1t');
    expect(result).toContain('***');
  });
});
