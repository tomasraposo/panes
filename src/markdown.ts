import { marked } from 'marked';

export interface ParsedDoc {
  title: string;
  body: string;
}

/**
 * Extracts a leading H1 (`# Title`) into `title`; everything after is `body`.
 * Falls back to `fallbackTitle` when no leading H1 is present.
 *
 * Uses marked's lexer for the actual markdown tokenization — keeps semantics
 * aligned with how the rest of the renderer (also marked) interprets the input.
 */
export function parseMarkdown(content: string, fallbackTitle: string): ParsedDoc {
  const tokens = marked.lexer(content);
  let title = fallbackTitle;
  let bodyStartIdx = 0;

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (tok.type === 'space') continue;
    if (tok.type === 'heading' && tok.depth === 1) {
      title = tok.text;
      bodyStartIdx = i + 1;
    } else {
      bodyStartIdx = i;
    }
    break;
  }

  const body = tokens.slice(bodyStartIdx).map(t => t.raw).join('').trim();
  return { title, body };
}
