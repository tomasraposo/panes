export interface PaneContent {
  title: string;
  body: string;
  /** Optional inline SVG/HTML rendered before the title text. Caller-trusted; not escaped. */
  icon?: string;
}

export interface RefreshResult {
  ok: boolean;
  message: string;
}

export interface WriteResult {
  ok: boolean;
  message: string;
  path: string;
  bytes: number;
}

export interface Pane {
  readonly id: string;
  readonly displayName: string;
  readonly dataPath: string;
  load(): Promise<PaneContent>;
  refresh?(opts?: { force?: boolean }): Promise<RefreshResult>;
  writeContent?(content: string): Promise<WriteResult>;
}
