import fs from 'fs';
import path from 'path';
import { getDataDir } from '../paths.ts';
import { parseMarkdown } from '../markdown.ts';
import type { Pane, PaneContent, RefreshResult } from './Pane.ts';

const FILENAME = '50-jira.md';
const FRESHNESS_TTL_MS = 5 * 60 * 1000;
const DEFAULT_JIRA_BASE = 'https://talkdesk.atlassian.net';
const JQL = 'assignee = currentUser() AND statusCategory != Done ORDER BY updated DESC';
const MAX_RESULTS = 25;
const SUMMARY_MAX = 70;

const PLACEHOLDER: PaneContent = {
  title: 'no Jira data yet',
  body: 'Click `↻` or run `panes refresh --force` to fetch (requires `JIRA_EMAIL` + `JIRA_TOKEN`).',
};

interface JiraIssue {
  key: string;
  fields: {
    summary: string;
    status: { name: string };
    updated: string;
  };
}

interface RefreshOpts {
  force?: boolean;
  fetchImpl?: typeof fetch;
}

export class JiraPane implements Pane {
  readonly id = 'jira';
  readonly displayName = 'Jira';
  get dataPath(): string {
    return this.filePath();
  }

  async load(): Promise<PaneContent> {
    const file = this.filePath();
    if (!fs.existsSync(file)) return PLACEHOLDER;
    const { title, body } = parseMarkdown(fs.readFileSync(file, 'utf8'), 'Jira');
    return { title, body };
  }

  async refresh(opts: RefreshOpts = {}): Promise<RefreshResult> {
    const file = this.filePath();
    if (!opts.force && fs.existsSync(file)) {
      const ageMs = Date.now() - fs.statSync(file).mtimeMs;
      if (ageMs < FRESHNESS_TTL_MS) {
        return {
          ok: true,
          message: `pane is fresh (${Math.round(ageMs / 1000)}s); skipping (use --force)`,
        };
      }
    }

    const email = process.env.JIRA_EMAIL;
    const token = process.env.JIRA_TOKEN;
    if (!email || !token) {
      return { ok: false, message: 'JIRA_EMAIL or JIRA_TOKEN not set in environment' };
    }

    try {
      const md = await fetchAndFormat({ email, token, fetchImpl: opts.fetchImpl ?? fetch });
      const dataDir = getDataDir();
      fs.mkdirSync(dataDir, { recursive: true });
      const tmp = `${file}.tmp.${process.pid}`;
      fs.writeFileSync(tmp, md);
      fs.renameSync(tmp, file);
      return { ok: true, message: `wrote ${file} (${md.length} bytes)` };
    } catch (e) {
      return { ok: false, message: `Jira fetch failed: ${(e as Error).message}` };
    }
  }

  filePath(): string {
    return path.join(getDataDir(), FILENAME);
  }
}

interface FetchOpts {
  email: string;
  token: string;
  fetchImpl: typeof fetch;
}

async function fetchAndFormat(opts: FetchOpts): Promise<string> {
  const baseUrl = process.env.JIRA_BASE_URL ?? DEFAULT_JIRA_BASE;
  const url = `${baseUrl}/rest/api/3/search/jql?jql=${encodeURIComponent(JQL)}&fields=summary,status,updated&maxResults=${MAX_RESULTS}`;
  const auth = Buffer.from(`${opts.email}:${opts.token}`).toString('base64');
  const res = await opts.fetchImpl(url, {
    headers: {
      Authorization: `Basic ${auth}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Jira API ${res.status}: ${errText.slice(0, 200)}`);
  }
  const json = (await res.json()) as { issues: JiraIssue[] };
  return formatIssues(json.issues);
}

function formatIssues(issues: JiraIssue[]): string {
  if (issues.length === 0) {
    return '# Jira\n\n_No open tickets assigned._\n';
  }
  const today = new Date();
  const rows = issues.map(i => {
    const updated = new Date(i.fields.updated);
    const ageMs = today.getTime() - updated.getTime();
    const last = formatRelativeAge(ageMs);
    const summary = (i.fields.summary ?? '').replace(/\|/g, '\\|').slice(0, SUMMARY_MAX);
    const status = (i.fields.status?.name ?? '?').toUpperCase();
    return { key: i.key, status, summary, last };
  });
  const lines = [
    '# Jira — assigned',
    '',
    '| Key | Status | Summary | Last |',
    '| --- | ------ | ------- | ---- |',
    ...rows.map(r => `| ${r.key} | ${r.status} | ${r.summary} | ${r.last} |`),
    '',
  ];
  return lines.join('\n');
}

function formatRelativeAge(ageMs: number): string {
  const hours = ageMs / (1000 * 60 * 60);
  const days = hours / 24;
  if (hours < 24) return `${Math.max(1, Math.floor(hours))}h`;
  if (days < 7) return `${Math.floor(days)}d`;
  if (days < 30) return `${Math.floor(days / 7)}w`;
  return `${Math.floor(days / 30)}m`;
}
