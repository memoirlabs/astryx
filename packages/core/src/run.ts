export type RunOutput =
  | {
      kind: "text";
      value: string;
    }
  | {
      kind: "json";
      value: unknown;
    }
  | {
      kind: "table";
      value: unknown[];
    };

export type CellRunResult = {
  runId: string;
  ok: boolean;
  exitCode: number | null;
  durationMs: number;
  stdout: string;
  stderr: string;
  stdoutTruncated: boolean;
  stderrTruncated: boolean;
  outputs: RunOutput[];
  error?: {
    message: string;
    stack?: string;
  };
  timedOut?: boolean;
};

export type CellCheckResult = {
  checkId: string;
  ok: boolean;
  exitCode: number | null;
  durationMs: number;
  stdout: string;
  stderr: string;
  stdoutTruncated: boolean;
  stderrTruncated: boolean;
  timedOut?: boolean;
  error?: {
    message: string;
  };
};
