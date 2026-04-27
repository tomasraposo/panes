import fs from 'fs';

export const FRESHNESS_TTL_MS = 5 * 60 * 1000;

export function atomicWrite(target: string, content: string): void {
  const tmp = `${target}.tmp.${process.pid}`;
  fs.writeFileSync(tmp, content);
  fs.renameSync(tmp, target);
}

export interface FreshnessResult {
  fresh: boolean;
  ageMs: number;
}

export function isFresh(filePath: string, ttlMs: number = FRESHNESS_TTL_MS): FreshnessResult {
  if (!fs.existsSync(filePath)) return { fresh: false, ageMs: Infinity };
  const ageMs = Date.now() - fs.statSync(filePath).mtimeMs;
  return { fresh: ageMs < ttlMs, ageMs };
}
