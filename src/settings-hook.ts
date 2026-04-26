import fs from 'fs';
import path from 'path';

export interface InstallResult {
  added: boolean;
  message: string;
}

export interface UninstallResult {
  removed: boolean;
  message: string;
}

type SettingsObject = Record<string, unknown>;

interface ReadOk {
  ok: true;
  settings: SettingsObject;
}

interface ReadErr {
  ok: false;
  message: string;
}

function readSettings(settingsPath: string): ReadOk | ReadErr {
  if (!fs.existsSync(settingsPath)) {
    return { ok: true, settings: {} };
  }
  const raw = fs.readFileSync(settingsPath, 'utf8');
  if (raw.trim() === '') {
    return { ok: true, settings: {} };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    return {
      ok: false,
      message: `failed to parse ${settingsPath} — refusing to overwrite: ${(e as Error).message}`,
    };
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, message: `${settingsPath} is not a JSON object — refusing to overwrite` };
  }
  return { ok: true, settings: parsed as SettingsObject };
}

function writeSettingsAtomic(settingsPath: string, settings: SettingsObject): void {
  fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
  const tmp = `${settingsPath}.tmp.${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify(settings, null, 2) + '\n');
  fs.renameSync(tmp, settingsPath);
}

function isOurHookGroup(group: unknown, cliPath: string): boolean {
  if (!group || typeof group !== 'object') return false;
  const hooks = (group as { hooks?: unknown }).hooks;
  if (!Array.isArray(hooks)) return false;
  return hooks.some(h => {
    if (!h || typeof h !== 'object') return false;
    const cmd = (h as { command?: unknown }).command;
    return typeof cmd === 'string' && cmd.startsWith(cliPath);
  });
}

export function installSessionStartHookAt(settingsPath: string, cliPath: string): InstallResult {
  const result = readSettings(settingsPath);
  if (!result.ok) return { added: false, message: result.message };
  const settings = result.settings;

  let hooks = settings.hooks as Record<string, unknown> | undefined;
  if (hooks === undefined) {
    hooks = {};
    settings.hooks = hooks;
  } else if (typeof hooks !== 'object' || Array.isArray(hooks) || hooks === null) {
    return { added: false, message: `${settingsPath}: \`hooks\` is not an object — refusing to overwrite` };
  }

  let sessionStart = hooks.SessionStart as unknown[] | undefined;
  if (sessionStart === undefined) {
    sessionStart = [];
    hooks.SessionStart = sessionStart;
  } else if (!Array.isArray(sessionStart)) {
    return { added: false, message: `${settingsPath}: \`hooks.SessionStart\` is not an array — refusing to overwrite` };
  }

  if (sessionStart.some(g => isOurHookGroup(g, cliPath))) {
    return { added: false, message: `${settingsPath} already has SessionStart hook for ${cliPath}` };
  }

  sessionStart.push({
    hooks: [{ type: 'command', command: `${cliPath} refresh` }],
  });

  writeSettingsAtomic(settingsPath, settings);
  return { added: true, message: `added SessionStart hook (${cliPath} refresh) to ${settingsPath}` };
}

export function uninstallSessionStartHookAt(settingsPath: string, cliPath: string): UninstallResult {
  if (!fs.existsSync(settingsPath)) {
    return { removed: false, message: `${settingsPath} does not exist (no change)` };
  }

  const result = readSettings(settingsPath);
  if (!result.ok) return { removed: false, message: result.message };
  const settings = result.settings;

  const hooks = settings.hooks;
  if (!hooks || typeof hooks !== 'object' || Array.isArray(hooks)) {
    return { removed: false, message: `no hooks in ${settingsPath} (no change)` };
  }
  const hooksObj = hooks as Record<string, unknown>;

  const sessionStart = hooksObj.SessionStart;
  if (!Array.isArray(sessionStart)) {
    return { removed: false, message: `no SessionStart hooks in ${settingsPath} (no change)` };
  }

  const filtered = (sessionStart as unknown[]).filter(g => !isOurHookGroup(g, cliPath));
  if (filtered.length === sessionStart.length) {
    return { removed: false, message: `no panes hook found in ${settingsPath} (no change)` };
  }

  if (filtered.length === 0) {
    delete hooksObj.SessionStart;
  } else {
    hooksObj.SessionStart = filtered;
  }

  if (Object.keys(hooksObj).length === 0) {
    delete settings.hooks;
  }

  writeSettingsAtomic(settingsPath, settings);
  return { removed: true, message: `removed SessionStart hook for ${cliPath} from ${settingsPath}` };
}
