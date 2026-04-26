import { describe, it, expect } from 'vitest';
import { parseMarkdown } from '../src/markdown.ts';

describe('parseMarkdown', () => {
  it('extracts a # heading as the title', () => {
    const { title, body } = parseMarkdown('# Hello World\n\nbody line\n', 'fallback.md');
    expect(title).toBe('Hello World');
    expect(body).toBe('body line');
  });

  it('uses the fallback title when no heading is present', () => {
    const { title, body } = parseMarkdown('just body, no heading\n', 'fallback.md');
    expect(title).toBe('fallback.md');
    expect(body).toBe('just body, no heading');
  });

  it('skips leading blank lines before the heading', () => {
    const { title } = parseMarkdown('\n\n# After blanks\nbody\n', 'fallback.md');
    expect(title).toBe('After blanks');
  });

  it('preserves multi-line body and trims trailing blank lines', () => {
    const { body } = parseMarkdown('# Title\nline 1\nline 2\n\n\n', 'f.md');
    expect(body).toBe('line 1\nline 2');
  });
});
