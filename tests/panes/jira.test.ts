import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { JiraPane } from '../../src/panes/JiraPane.ts';

let tmpRoot: string;
let dataDir: string;
const prevEnv: Record<string, string | undefined> = {};

beforeEach(() => {
  tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'panes-jira-test-'));
  dataDir = path.join(tmpRoot, 'data');
  fs.mkdirSync(dataDir, { recursive: true });

  prevEnv.PANES_DATA_DIR = process.env.PANES_DATA_DIR;
  prevEnv.JIRA_EMAIL = process.env.JIRA_EMAIL;
  prevEnv.JIRA_TOKEN = process.env.JIRA_TOKEN;
  prevEnv.JIRA_BASE_URL = process.env.JIRA_BASE_URL;

  process.env.PANES_DATA_DIR = dataDir;
  process.env.JIRA_EMAIL = 'me@example.com';
  process.env.JIRA_TOKEN = 'test-token';
  process.env.JIRA_BASE_URL = 'https://example.atlassian.net';
});

afterEach(() => {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
  for (const [k, v] of Object.entries(prevEnv)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
});

function mockFetch(payload: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
    text: async () => JSON.stringify(payload),
  } as Response);
}

describe('JiraPane', () => {
  it('returns placeholder content when no cache file exists', async () => {
    const pane = new JiraPane();
    const { title, body } = await pane.load();
    expect(title).toBe('no Jira data yet');
    expect(body).toContain('panes refresh --force');
  });

  it('refresh writes a cache file with formatted issues', async () => {
    const pane = new JiraPane();
    const fetchImpl = mockFetch({
      issues: [
        {
          key: 'INFRA-1',
          fields: {
            summary: 'Audit ASG counts',
            status: { name: 'In Review' },
            updated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          },
        },
        {
          key: 'APIGW-2',
          fields: {
            summary: 'Delete TF dirs',
            status: { name: 'Review Needed' },
            updated: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          },
        },
      ],
    });

    const result = await pane.refresh({ force: true, fetchImpl });
    expect(result.ok).toBe(true);

    const cached = fs.readFileSync(path.join(dataDir, '50-jira.md'), 'utf8');
    expect(cached).toContain('# Jira — assigned');
    expect(cached).toContain('| Key | Status | Summary | Last |');
    expect(cached).toContain('| INFRA-1 | IN REVIEW | Audit ASG counts | 3d |');
    expect(cached).toContain('| APIGW-2 | REVIEW NEEDED | Delete TF dirs | 12h |');
  });

  it('load reads the cache file and splits title from body', async () => {
    fs.writeFileSync(
      path.join(dataDir, '50-jira.md'),
      '# Jira — assigned\n\n| Key | Status |\n| --- | --- |\n| X-1 | DONE |\n',
    );
    const pane = new JiraPane();
    const { title, body } = await pane.load();
    expect(title).toBe('Jira — assigned');
    expect(body).toContain('| X-1 | DONE |');
  });

  it('refresh respects 5-min freshness debounce when not forced', async () => {
    fs.writeFileSync(path.join(dataDir, '50-jira.md'), '# already here\n');
    const fetchImpl = mockFetch({ issues: [] });
    const pane = new JiraPane();
    const result = await pane.refresh({ force: false, fetchImpl });
    expect(result.ok).toBe(true);
    expect(result.message).toMatch(/skipping/);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('refresh fails cleanly when JIRA_EMAIL/TOKEN are missing', async () => {
    delete process.env.JIRA_EMAIL;
    const fetchImpl = mockFetch({ issues: [] });
    const pane = new JiraPane();
    const result = await pane.refresh({ force: true, fetchImpl });
    expect(result.ok).toBe(false);
    expect(result.message).toContain('JIRA_EMAIL or JIRA_TOKEN not set');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('refresh surfaces Jira API errors as ok=false', async () => {
    const fetchImpl = mockFetch({ errorMessages: ['Unauthorized'] }, 401);
    const pane = new JiraPane();
    const result = await pane.refresh({ force: true, fetchImpl });
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/Jira API 401/);
  });

  it('does not implement writeContent (read-only pane)', () => {
    const pane = new JiraPane();
    expect(pane.writeContent).toBeUndefined();
  });

  it('builds the correct Jira REST URL with JQL + auth', async () => {
    const fetchImpl = mockFetch({ issues: [] });
    const pane = new JiraPane();
    await pane.refresh({ force: true, fetchImpl });
    expect(fetchImpl).toHaveBeenCalledOnce();
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toContain('https://example.atlassian.net/rest/api/3/search/jql');
    expect(url).toContain('assignee%20%3D%20currentUser');
    const expectedAuth = 'Basic ' + Buffer.from('me@example.com:test-token').toString('base64');
    expect((init as RequestInit).headers).toMatchObject({ Authorization: expectedAuth });
  });
});
