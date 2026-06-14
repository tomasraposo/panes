import fs from 'fs';
import path from 'path';
import { homedir } from 'os';
import { spawn } from 'child_process';
import { parseMarkdown } from '../markdown.ts';
import { getCacheDir, getDataDir, getMemoryDir } from '../paths.ts';
import { atomicWrite, FRESHNESS_TTL_MS, isFresh } from '../util.ts';
import type { Pane, PaneContent, RefreshResult, WriteResult } from './Pane.ts';

const FILENAME = '30-claude.md';
const SLASH_COMMAND_PATH_FRAGMENT = '.claude/commands/panes.md';
const LOG_FILENAME = 'refresh-claude.log';

/**
 * Official Claude icon — extracted from /Applications/Claude.app's TrayIconTemplate@3x.png
 * and stored at widget/assets/claude-icon.png. Rendered as an empty span; the widget's CSS
 * uses `mask-image` so the icon recolors with `currentColor` (inherits the title color).
 */
const CLAUDE_ICON = '<span class="pane-title-icon" aria-hidden="true"></span>';

const PLACEHOLDER: PaneContent = {
  title: 'no Claude pane yet',
  body: 'Run `/panes` from a Claude Code session to populate this pane.',
  icon: CLAUDE_ICON,
};

export class ClaudePane implements Pane {
  readonly id = 'claude';
  readonly displayName = 'Claude';
  get dataPath(): string {
    return this.filePath();
  }

  async load(): Promise<PaneContent> {
    const file = this.filePath();
    if (!fs.existsSync(file)) return PLACEHOLDER;
    const { title: rawTitle, body } = parseMarkdown(fs.readFileSync(file, 'utf8'), 'Claude');
    const title = rawTitle.replace(/^Claude\s*[—\-:]\s*/i, '').trim() || rawTitle;
    return { title, body, icon: CLAUDE_ICON };
  }

  async writeContent(content: string): Promise<WriteResult> {
    fs.mkdirSync(getDataDir(), { recursive: true });
    const target = this.filePath();
    atomicWrite(target, content);
    return {
      ok: true,
      message: `wrote ${target} (${content.length} bytes)`,
      path: target,
      bytes: content.length,
    };
  }

  async refresh({ force = false }: { force?: boolean } = {}): Promise<RefreshResult> {
    if (process.env.PANES_HOOK_INVOCATION === '1') {
      return { ok: true, message: '' };
    }

    const file = this.filePath();
    if (!force) {
      const { fresh, ageMs } = isFresh(file);
      if (fresh) {
        return {
          ok: true,
          message: `pane is fresh (${Math.round(ageMs / 1000)}s old < ${FRESHNESS_TTL_MS / 1000}s); skipping (use --force to override)`,
        };
      }
    }

    const slashCommandPath = path.join(homedir(), SLASH_COMMAND_PATH_FRAGMENT);
    if (!fs.existsSync(slashCommandPath)) {
      return { ok: false, message: `slash command not found at ${slashCommandPath}` };
    }
    // The slash-command body uses a {{MEMORY_DIR}} placeholder so it carries no hardcoded
    // path. Resolve it here (CWD-independent) before handing the prompt to headless claude.
    const promptContent = fs
      .readFileSync(slashCommandPath, 'utf8')
      .replace(/\{\{MEMORY_DIR\}\}/g, getMemoryDir());

    const cacheDir = getCacheDir();
    fs.mkdirSync(cacheDir, { recursive: true });
    const logPath = path.join(cacheDir, LOG_FILENAME);
    const logFd = fs.openSync(logPath, 'w');

    const child = spawn('claude', [
      '-p',
      '--no-session-persistence',
      '--permission-mode', 'bypassPermissions',
    ], {
      detached: true,
      stdio: ['pipe', logFd, logFd],
      env: { ...process.env, PANES_HOOK_INVOCATION: '1' },
    });
    child.stdin?.write(promptContent);
    child.stdin?.end();
    child.unref();
    fs.closeSync(logFd);

    return { ok: true, message: `backgrounded (pid ${child.pid ?? '?'}, log ${logPath})` };
  }

  filePath(): string {
    return path.join(getDataDir(), FILENAME);
  }
}
