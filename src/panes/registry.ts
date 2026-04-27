import fs from 'fs';
import path from 'path';
import { ClaudePane } from './ClaudePane.ts';
import { JiraPane } from './JiraPane.ts';
import type { Pane } from './Pane.ts';
import { getActivePanePath } from '../paths.ts';
import { atomicWrite } from '../util.ts';

export const PANE_IDS = ['claude', 'jira'] as const;
export type PaneId = typeof PANE_IDS[number];

export function isPaneId(s: string): s is PaneId {
  return (PANE_IDS as readonly string[]).includes(s);
}

export function getPane(id: string): Pane {
  switch (id) {
    case 'jira': return new JiraPane();
    case 'claude':
    default: return new ClaudePane();
  }
}

export function readActivePaneId(): PaneId {
  const p = getActivePanePath();
  if (!fs.existsSync(p)) return 'claude';
  try {
    const parsed = JSON.parse(fs.readFileSync(p, 'utf8'));
    if (typeof parsed?.id === 'string' && isPaneId(parsed.id)) return parsed.id;
  } catch {
    // fall through
  }
  return 'claude';
}

export function writeActivePaneId(id: PaneId): void {
  const p = getActivePanePath();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  atomicWrite(p, JSON.stringify({ id }) + '\n');
}
