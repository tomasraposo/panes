import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'path';
import { homedir } from 'os';
import { getMemoryDir } from '../src/paths.ts';

describe('getMemoryDir', () => {
  let savedMemoryDir: string | undefined;
  let savedWorkspace: string | undefined;

  beforeEach(() => {
    savedMemoryDir = process.env.PANES_MEMORY_DIR;
    savedWorkspace = process.env.PANES_WORKSPACE;
    delete process.env.PANES_MEMORY_DIR;
    delete process.env.PANES_WORKSPACE;
  });

  afterEach(() => {
    if (savedMemoryDir === undefined) delete process.env.PANES_MEMORY_DIR;
    else process.env.PANES_MEMORY_DIR = savedMemoryDir;
    if (savedWorkspace === undefined) delete process.env.PANES_WORKSPACE;
    else process.env.PANES_WORKSPACE = savedWorkspace;
  });

  it('defaults to the Talkdesk workspace memory dir derived from $HOME — no hardcoded user', () => {
    const encoded = path.join(homedir(), 'Talkdesk').replace(/\//g, '-');
    const expected = path.join(homedir(), '.claude', 'projects', encoded, 'memory');
    expect(getMemoryDir()).toBe(expected);
  });

  it('encodes a custom PANES_WORKSPACE path into the projects dir', () => {
    process.env.PANES_WORKSPACE = '/Users/someone/my-repo';
    expect(getMemoryDir()).toBe(
      path.join(homedir(), '.claude', 'projects', '-Users-someone-my-repo', 'memory'),
    );
  });

  it('PANES_MEMORY_DIR overrides everything, including PANES_WORKSPACE', () => {
    process.env.PANES_MEMORY_DIR = '/tmp/custom/memory';
    process.env.PANES_WORKSPACE = '/Users/someone/my-repo';
    expect(getMemoryDir()).toBe('/tmp/custom/memory');
  });
});
