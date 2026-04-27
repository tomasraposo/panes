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
