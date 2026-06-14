import path from 'path';
import { homedir } from 'os';

function getPanesHome(): string {
  return process.env.PANES_HOME ?? path.join(homedir(), '.panes');
}

export function getDataDir(): string {
  return process.env.PANES_DATA_DIR ?? path.join(getPanesHome(), 'data');
}

export function getCacheDir(): string {
  return process.env.PANES_CACHE_DIR ?? path.join(getPanesHome(), 'cache');
}

export function getActivePanePath(): string {
  return path.join(getPanesHome(), 'active.json');
}

export function getFilterPath(): string {
  return path.join(getPanesHome(), 'filter.json');
}

/**
 * Directory holding the Claude Code project memory the Claude pane reads from.
 * Claude Code stores a project's memory at ~/.claude/projects/<abs-path with '/' → '-'>/memory,
 * so the default is derived from the workspace path — no hardcoded username.
 * Override the whole dir with PANES_MEMORY_DIR, or just the workspace with PANES_WORKSPACE.
 */
export function getMemoryDir(): string {
  if (process.env.PANES_MEMORY_DIR) return process.env.PANES_MEMORY_DIR;
  const workspace = process.env.PANES_WORKSPACE ?? path.join(homedir(), 'Talkdesk');
  const encoded = workspace.replace(/\//g, '-');
  return path.join(homedir(), '.claude', 'projects', encoded, 'memory');
}
