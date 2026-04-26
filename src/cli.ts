import fs from 'fs';
import path from 'path';
import { homedir } from 'os';
import { fileURLToPath } from 'url';
import { renderHtml } from './html-render.ts';
import type { Pane } from './panes/Pane.ts';
import { getPane, isPaneId, PANE_IDS, readActivePaneId, writeActivePaneId, type PaneId } from './panes/registry.ts';
import { getCacheDir, getDataDir } from './paths.ts';
import {
  installSessionStartHookAt,
  uninstallSessionStartHookAt,
} from './settings-hook.ts';

export interface CliResult {
  output: string;
  exitCode: number;
}

function resolvePane(args: string[]): Pane {
  const idx = args.indexOf('--pane');
  if (idx >= 0 && idx + 1 < args.length && isPaneId(args[idx + 1])) {
    return getPane(args[idx + 1]);
  }
  return getPane(readActivePaneId());
}

export async function execute(args: string[]): Promise<CliResult> {
  const [subcommand] = args;

  switch (subcommand) {
    case undefined:
    case 'help':
    case '--help':
    case '-h':
      return { output: usage(), exitCode: 0 };

    case 'render':
      return { output: await renderHtml(resolvePane(args.slice(1))), exitCode: 0 };

    case 'install':
      return runInstall();

    case 'uninstall':
      return runUninstall();

    case 'write':
      return runWrite(args.slice(1));

    case 'refresh':
      return runRefresh(args.slice(1));

    case 'filter':
      return runFilter(args.slice(1));

    case 'active':
      return runActive(args.slice(1));

    case 'meta':
      return runMeta(args.slice(1));

    default:
      return { output: `Unknown subcommand: ${subcommand}\n${usage()}`, exitCode: 2 };
  }
}

function usage(): string {
  return [
    'panes — desktop wallboard with pluggable Pane implementations',
    '',
    `Available panes: ${PANE_IDS.join(', ')}`,
    `Active pane: ${readActivePaneId()}  (override per-call with --pane <id>)`,
    '',
    'Usage:',
    '  panes render [--pane <id>]              Emit HTML for the active (or specified) pane.',
    '  panes install                           Set up data dir + symlinks for widget + slash command.',
    '  panes uninstall                         Remove the symlinks (preserves ~/.panes/ data).',
    '  panes write [--pane <id>]               Read stdin, atomically write the active pane.',
    '  panes active                            Print the active pane id.',
    `  panes active <id>                       Set the active pane (one of: ${PANE_IDS.join(', ')}).`,
    '  panes refresh [--force]    Trigger the active pane\'s refresh (e.g. claude -p for ClaudePane).',
    '                             Recursion-guarded; skipped if pane was updated in last 5 min.',
    '                             Used by SessionStart hook in ~/.claude/settings.json.',
    '  panes filter               Print current recency filter (~/.panes/filter.json).',
    '  panes filter <days>        Set recency window (positive integer; e.g. 30).',
    '  panes filter clear         Remove filter; show all items regardless of age.',
    '',
  ].join('\n');
}

async function runInstall(): Promise<CliResult> {
  const dataDir = getDataDir();
  const cacheDir = getCacheDir();
  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(cacheDir, { recursive: true });

  const root = repoRoot();
  const widgetTarget = path.join(homedir(), 'Library', 'Application Support', 'Übersicht', 'widgets', 'panes.widget');
  const widgetSource = path.join(root, 'widget');
  const slashCmdTarget = path.join(homedir(), '.claude', 'commands', 'panes.md');
  const slashCmdSource = path.join(root, 'claude', 'panes.md');

  fs.mkdirSync(path.dirname(widgetTarget), { recursive: true });
  fs.mkdirSync(path.dirname(slashCmdTarget), { recursive: true });

  const linkActions: string[] = [];
  for (const [src, tgt] of [[widgetSource, widgetTarget], [slashCmdSource, slashCmdTarget]] as [string, string][]) {
    const stat = fs.lstatSync(tgt, { throwIfNoEntry: false });
    if (stat) {
      if (stat.isSymbolicLink() && fs.readlinkSync(tgt) === src) {
        linkActions.push(`  = ${tgt} → ${src} (already linked)`);
        continue;
      }
      linkActions.push(`  ! ${tgt} exists and is not the expected link; skipping`);
      continue;
    }
    fs.symlinkSync(src, tgt);
    linkActions.push(`  + ${tgt} → ${src}`);
  }

  const settingsPath = path.join(homedir(), '.claude', 'settings.json');
  const cliPath = path.join(repoRoot(), 'cli.mjs');
  const hookResult = installSessionStartHookAt(settingsPath, cliPath);
  const hookActions = [`  ${hookResult.added ? '+' : '='} ${hookResult.message}`];

  return {
    output: ['panes install', '', 'Symlinks:', ...linkActions, '', 'SessionStart hook:', ...hookActions, ''].join('\n'),
    exitCode: 0,
  };
}

async function runUninstall(): Promise<CliResult> {
  const widgetTarget = path.join(homedir(), 'Library', 'Application Support', 'Übersicht', 'widgets', 'panes.widget');
  const slashCmdTarget = path.join(homedir(), '.claude', 'commands', 'panes.md');

  const actions: string[] = [];
  for (const tgt of [widgetTarget, slashCmdTarget]) {
    const stat = fs.lstatSync(tgt, { throwIfNoEntry: false });
    if (!stat) {
      actions.push(`  - ${tgt} (not present)`);
      continue;
    }
    if (!stat.isSymbolicLink()) {
      actions.push(`  ! ${tgt} is not a symlink; refusing to delete`);
      continue;
    }
    fs.unlinkSync(tgt);
    actions.push(`  - ${tgt}`);
  }

  const settingsPath = path.join(homedir(), '.claude', 'settings.json');
  const cliPath = path.join(repoRoot(), 'cli.mjs');
  const hookResult = uninstallSessionStartHookAt(settingsPath, cliPath);
  const hookActions = [`  ${hookResult.removed ? '-' : '='} ${hookResult.message}`];

  return {
    output: ['panes uninstall', '', 'Removed symlinks:', ...actions, '', 'SessionStart hook:', ...hookActions, '', 'Data preserved at ~/.panes/', ''].join('\n'),
    exitCode: 0,
  };
}

async function runWrite(args: string[]): Promise<CliResult> {
  const pane = resolvePane(args);
  if (!pane.writeContent) {
    return { output: `panes write: pane "${pane.id}" is not writable\n`, exitCode: 2 };
  }

  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  const content = Buffer.concat(chunks).toString('utf8');
  if (!content.trim()) {
    return { output: 'panes write: stdin is empty; nothing to write\n', exitCode: 2 };
  }

  const result = await pane.writeContent(content);
  return {
    output: `panes write: ${result.message}\n`,
    exitCode: result.ok ? 0 : 2,
  };
}

async function runRefresh(args: string[]): Promise<CliResult> {
  const pane = resolvePane(args);
  if (!pane.refresh) {
    return { output: `panes refresh: pane "${pane.id}" is not refreshable\n`, exitCode: 2 };
  }

  const force = args.includes('--force');
  const result = await pane.refresh({ force });
  return {
    output: result.message ? `panes refresh: [${pane.id}] ${result.message}\n` : '',
    exitCode: result.ok ? 0 : 1,
  };
}

async function runMeta(args: string[]): Promise<CliResult> {
  const pane = resolvePane(args);
  const meta = {
    id: pane.id,
    displayName: pane.displayName,
    dataPath: pane.dataPath,
  };
  return { output: `${JSON.stringify(meta)}\n`, exitCode: 0 };
}

async function runActive(args: string[]): Promise<CliResult> {
  const id = args[0];
  if (!id) {
    return { output: `${readActivePaneId()}\n`, exitCode: 0 };
  }
  if (!isPaneId(id)) {
    return {
      output: `panes active: invalid pane id '${id}' (allowed: ${PANE_IDS.join(', ')})\n`,
      exitCode: 2,
    };
  }
  writeActivePaneId(id as PaneId);
  return { output: `panes active: ${id}\n`, exitCode: 0 };
}

async function runFilter(args: string[]): Promise<CliResult> {
  const filterPath = path.join(homedir(), '.panes', 'filter.json');
  const arg = args[0];

  if (!arg) {
    if (!fs.existsSync(filterPath)) return { output: '{}\n', exitCode: 0 };
    return { output: fs.readFileSync(filterPath, 'utf8'), exitCode: 0 };
  }

  fs.mkdirSync(path.dirname(filterPath), { recursive: true });

  if (arg === 'clear' || arg === 'all') {
    if (fs.existsSync(filterPath)) fs.unlinkSync(filterPath);
    return { output: `panes filter: cleared (${filterPath})\n`, exitCode: 0 };
  }

  const days = parseInt(arg, 10);
  if (!Number.isFinite(days) || days <= 0) {
    return { output: `panes filter: invalid value '${arg}' (use a positive integer or 'clear')\n`, exitCode: 2 };
  }

  fs.writeFileSync(filterPath, JSON.stringify({ recencyDays: days }) + '\n');
  return { output: `panes filter: set recencyDays=${days} at ${filterPath}\n`, exitCode: 0 };
}

function repoRoot(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, '..');
}
