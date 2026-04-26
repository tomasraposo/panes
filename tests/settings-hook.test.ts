import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  installSessionStartHookAt,
  uninstallSessionStartHookAt,
} from '../src/settings-hook.ts';

const CLI_PATH = '/Users/tomasraposo/panes/cli.mjs';
const HOOK_CMD = `${CLI_PATH} refresh`;

let tmpRoot: string;
let settingsPath: string;

beforeEach(() => {
  tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'panes-settings-test-'));
  settingsPath = path.join(tmpRoot, '.claude', 'settings.json');
});

afterEach(() => {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

function readSettings(): Record<string, unknown> {
  const raw = fs.readFileSync(settingsPath, 'utf8');
  return JSON.parse(raw) as Record<string, unknown>;
}

function writeSettings(obj: Record<string, unknown>): void {
  fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
  fs.writeFileSync(settingsPath, JSON.stringify(obj, null, 2) + '\n');
}

describe('installSessionStartHookAt', () => {
  it('creates settings.json with hook when file is missing', () => {
    const result = installSessionStartHookAt(settingsPath, CLI_PATH);
    expect(result.added).toBe(true);
    expect(fs.existsSync(settingsPath)).toBe(true);
    const settings = readSettings();
    const groups = (settings as any).hooks.SessionStart;
    expect(groups).toHaveLength(1);
    expect(groups[0].hooks[0]).toEqual({ type: 'command', command: HOOK_CMD });
  });

  it('adds hook to empty {} settings', () => {
    writeSettings({});
    const result = installSessionStartHookAt(settingsPath, CLI_PATH);
    expect(result.added).toBe(true);
    const settings = readSettings();
    expect((settings as any).hooks.SessionStart[0].hooks[0].command).toBe(HOOK_CMD);
  });

  it('is idempotent — second install is a no-op', () => {
    installSessionStartHookAt(settingsPath, CLI_PATH);
    const after1 = fs.readFileSync(settingsPath, 'utf8');
    const result = installSessionStartHookAt(settingsPath, CLI_PATH);
    expect(result.added).toBe(false);
    expect(result.message).toMatch(/already has SessionStart hook/);
    const after2 = fs.readFileSync(settingsPath, 'utf8');
    expect(after2).toBe(after1);
  });

  it('preserves unrelated SessionStart hooks', () => {
    writeSettings({
      hooks: {
        SessionStart: [
          { hooks: [{ type: 'command', command: '/usr/local/bin/other-tool init' }] },
        ],
      },
    });
    const result = installSessionStartHookAt(settingsPath, CLI_PATH);
    expect(result.added).toBe(true);
    const groups = (readSettings() as any).hooks.SessionStart;
    expect(groups).toHaveLength(2);
    expect(groups[0].hooks[0].command).toBe('/usr/local/bin/other-tool init');
    expect(groups[1].hooks[0].command).toBe(HOOK_CMD);
  });

  it('preserves unrelated top-level settings keys', () => {
    writeSettings({
      permissions: { allow: ['Bash(npm:*)'] },
      model: 'opus',
      enabledPlugins: { foo: true },
    });
    installSessionStartHookAt(settingsPath, CLI_PATH);
    const settings = readSettings() as any;
    expect(settings.permissions).toEqual({ allow: ['Bash(npm:*)'] });
    expect(settings.model).toBe('opus');
    expect(settings.enabledPlugins).toEqual({ foo: true });
    expect(settings.hooks.SessionStart[0].hooks[0].command).toBe(HOOK_CMD);
  });

  it('refuses on malformed JSON and leaves the file unchanged', () => {
    fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
    fs.writeFileSync(settingsPath, '{ not json');
    const result = installSessionStartHookAt(settingsPath, CLI_PATH);
    expect(result.added).toBe(false);
    expect(result.message).toMatch(/failed to parse/);
    expect(fs.readFileSync(settingsPath, 'utf8')).toBe('{ not json');
  });

  it('refuses when hooks is not an object', () => {
    writeSettings({ hooks: 'not-an-object' as unknown as Record<string, unknown> });
    const result = installSessionStartHookAt(settingsPath, CLI_PATH);
    expect(result.added).toBe(false);
    expect(result.message).toMatch(/`hooks` is not an object/);
  });
});

describe('uninstallSessionStartHookAt', () => {
  it('is no-op when settings.json is missing', () => {
    const result = uninstallSessionStartHookAt(settingsPath, CLI_PATH);
    expect(result.removed).toBe(false);
    expect(result.message).toMatch(/does not exist/);
  });

  it('is no-op when our hook is not present', () => {
    writeSettings({
      hooks: {
        SessionStart: [
          { hooks: [{ type: 'command', command: '/usr/local/bin/other init' }] },
        ],
      },
    });
    const result = uninstallSessionStartHookAt(settingsPath, CLI_PATH);
    expect(result.removed).toBe(false);
    expect(result.message).toMatch(/no panes hook found/);
  });

  it('removes our hook and preserves unrelated hooks', () => {
    writeSettings({
      hooks: {
        SessionStart: [
          { hooks: [{ type: 'command', command: '/usr/local/bin/other init' }] },
          { hooks: [{ type: 'command', command: HOOK_CMD }] },
        ],
      },
    });
    const result = uninstallSessionStartHookAt(settingsPath, CLI_PATH);
    expect(result.removed).toBe(true);
    const settings = readSettings() as any;
    expect(settings.hooks.SessionStart).toHaveLength(1);
    expect(settings.hooks.SessionStart[0].hooks[0].command).toBe('/usr/local/bin/other init');
  });

  it('removes the SessionStart key when last entry is ours; removes hooks key if empty', () => {
    writeSettings({
      permissions: { allow: ['Bash(test:*)'] },
      hooks: {
        SessionStart: [{ hooks: [{ type: 'command', command: HOOK_CMD }] }],
      },
    });
    const result = uninstallSessionStartHookAt(settingsPath, CLI_PATH);
    expect(result.removed).toBe(true);
    const settings = readSettings() as any;
    expect(settings.permissions).toEqual({ allow: ['Bash(test:*)'] });
    expect(settings.hooks).toBeUndefined();
  });

  it('refuses on malformed JSON and leaves the file unchanged', () => {
    fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
    fs.writeFileSync(settingsPath, '{ broken');
    const result = uninstallSessionStartHookAt(settingsPath, CLI_PATH);
    expect(result.removed).toBe(false);
    expect(result.message).toMatch(/failed to parse/);
    expect(fs.readFileSync(settingsPath, 'utf8')).toBe('{ broken');
  });
});
