import { describe, it, expect } from 'vitest';
import { renderHtml } from '../src/html-render.ts';
import type { Pane, RefreshResult, WriteResult } from '../src/panes/Pane.ts';

function fakePane(opts: {
  title?: string;
  body?: string;
  refreshable?: boolean;
  writable?: boolean;
}): Pane {
  const pane: Pane = {
    id: 'fake',
    load: async () => ({ title: opts.title ?? 'Fake Pane', body: opts.body ?? 'body' }),
  };
  if (opts.refreshable ?? true) {
    pane.refresh = async (): Promise<RefreshResult> => ({ ok: true, message: 'fake refresh' });
  }
  if (opts.writable ?? true) {
    pane.writeContent = async (c: string): Promise<WriteResult> => ({
      ok: true,
      message: 'fake write',
      path: '/fake',
      bytes: c.length,
    });
  }
  return pane;
}

describe('renderHtml', () => {
  it('renders a pane card from a Pane instance', async () => {
    const html = await renderHtml(fakePane({ title: 'Hello', body: 'world' }));
    expect(html).toContain('<article class="pane">');
    expect(html).toContain('<header class="pane-title">');
    expect(html).toContain('<span class="pane-title-text">Hello</span>');
    expect(html).toContain('<button class="pane-settings-toggle"');
    expect(html).toContain('<button class="pane-refresh"');
    expect(html).toContain('<div class="pane-body">');
    expect(html).toContain('world');
  });

  it('renders markdown bold and code as HTML', async () => {
    const html = await renderHtml(fakePane({ body: '**bold** and `code`' }));
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<code>code</code>');
  });

  it('renders markdown tables as <table>', async () => {
    const html = await renderHtml(fakePane({ body: '| a | b |\n| - | - |\n| 1 | 2 |\n' }));
    expect(html).toContain('<table>');
    expect(html).toContain('<th>a</th>');
    expect(html).toContain('<td>1</td>');
  });

  it('escapes HTML special characters in the title', async () => {
    const html = await renderHtml(fakePane({ title: 'a <b> & c' }));
    expect(html).toContain('a &lt;b&gt; &amp; c');
  });

  it('omits the refresh button when the pane has no refresh method', async () => {
    const html = await renderHtml(fakePane({ refreshable: false }));
    expect(html).not.toContain('class="pane-refresh"');
    expect(html).toContain('class="pane-settings-toggle"');
  });

  it('wraps DONE in a green pill when it is the whole cell content', async () => {
    const html = await renderHtml(fakePane({ body: '| status |\n| --- |\n| DONE |\n' }));
    expect(html).toContain('<span class="pane-pill pane-pill-green">DONE</span>');
  });

  it('wraps TODO and PENDING in amber pills', async () => {
    const html = await renderHtml(fakePane({ body: '| s |\n| - |\n| TODO |\n| PENDING |\n' }));
    expect(html).toContain('<span class="pane-pill pane-pill-amber">TODO</span>');
    expect(html).toContain('<span class="pane-pill pane-pill-amber">PENDING</span>');
  });

  it('wraps GAPS in a red pill', async () => {
    const html = await renderHtml(fakePane({ body: '| s |\n| - |\n| GAPS |\n' }));
    expect(html).toContain('<span class="pane-pill pane-pill-red">GAPS</span>');
  });

  it('does not pill status words inside larger sentences', async () => {
    const html = await renderHtml(fakePane({ body: '| col |\n| --- |\n| should be DONE soon |\n' }));
    expect(html).not.toContain('pane-pill-green');
  });

  it('matches multi-word statuses like "In Progress" case-insensitively', async () => {
    const html = await renderHtml(fakePane({ body: '| s |\n| - |\n| In Progress |\n' }));
    expect(html).toContain('<span class="pane-pill pane-pill-amber">In Progress</span>');
  });
});
