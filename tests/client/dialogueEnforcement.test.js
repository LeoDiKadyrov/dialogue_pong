import { describe, it, expect } from 'vitest';

// Isolated test of the guard logic
function shouldSubmitOnKeyShortcut(text) {
  return text.trim().length > 0;
}

describe('dialogue keyboard shortcut guard', () => {
  it('allows submit when text has content', () => {
    expect(shouldSubmitOnKeyShortcut('hello')).toBe(true);
  });

  it('blocks submit when text is empty string', () => {
    expect(shouldSubmitOnKeyShortcut('')).toBe(false);
  });

  it('blocks submit when text is whitespace only', () => {
    expect(shouldSubmitOnKeyShortcut('   ')).toBe(false);
    expect(shouldSubmitOnKeyShortcut('\t\n')).toBe(false);
  });

  it('allows submit when text has trailing spaces but real content', () => {
    expect(shouldSubmitOnKeyShortcut('  hi  ')).toBe(true);
  });
});
