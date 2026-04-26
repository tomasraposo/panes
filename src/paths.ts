import path from 'path';
import { homedir } from 'os';

export function getDataDir(): string {
  return process.env.PANES_DATA_DIR ?? path.join(homedir(), '.panes', 'data');
}

export function getCacheDir(): string {
  return process.env.PANES_CACHE_DIR ?? path.join(homedir(), '.panes', 'cache');
}
