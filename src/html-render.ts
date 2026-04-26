import { marked } from 'marked';
import escapeHtml from 'escape-html';
import type { Pane } from './panes/Pane.ts';

marked.setOptions({ gfm: true, breaks: false });

const STATUS_GREEN = ['DONE', 'OK', 'MERGED', 'CLOSED', 'LIVE', 'SHIPPED', 'PASSED', 'READY'];
const STATUS_AMBER = [
  'TODO', 'TO-DO', 'PENDING', 'WIP', 'IN PROGRESS', 'IN REVIEW',
  'REVIEW NEEDED', 'READY FOR DEPLOYMENT', 'IN-PROGRESS',
];
const STATUS_RED = ['GAPS', 'BLOCKED', 'FAILED', 'FAIL', 'ERROR', 'BROKEN'];

export async function renderHtml(pane: Pane): Promise<string> {
  const { title, body, icon } = await pane.load();
  return paneCard(title, body, { refreshable: typeof pane.refresh === 'function', icon });
}

function paneCard(
  title: string,
  bodyMd: string,
  opts: { refreshable: boolean; icon?: string },
): string {
  const titleHtml = `${opts.icon ?? ''}${escapeHtml(title)}`;
  let bodyHtml = marked.parse(bodyMd, { async: false }) as string;
  bodyHtml = applyStatusPills(bodyHtml);
  const refreshBtn = opts.refreshable
    ? `<button class="pane-refresh" title="Refresh pane (force)" type="button" aria-label="Refresh">↻</button>`
    : '';
  return [
    `<article class="pane">`,
    `<header class="pane-title">`,
    `<span class="pane-title-text">${titleHtml}</span>`,
    `<button class="pane-settings-toggle" title="Settings" type="button" aria-label="Settings">⚙</button>`,
    refreshBtn,
    `</header>`,
    `<div class="pane-body">${bodyHtml}</div>`,
    `</article>`,
  ].join('');
}

function applyStatusPills(html: string): string {
  let out = html;
  out = wrapPills(out, STATUS_GREEN, 'green');
  out = wrapPills(out, STATUS_AMBER, 'amber');
  out = wrapPills(out, STATUS_RED, 'red');
  return out;
}

function wrapPills(html: string, words: string[], color: string): string {
  let out = html;
  for (const word of words) {
    const escaped = word.replace(/[-]/g, '\\-').replace(/ /g, '\\s+');
    const re = new RegExp(`<td>(\\s*)(${escaped})(\\s*)</td>`, 'gi');
    out = out.replace(
      re,
      (_match, lead, w, trail) =>
        `<td>${lead}<span class="pane-pill pane-pill-${color}">${w}</span>${trail}</td>`,
    );
  }
  return out;
}

