import { appendFile } from "node:fs/promises";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import type { Cell, NotebookConfig } from "@astryx/core/model";
import type { CellCheckResult, CellRunResult, RunOutput } from "@astryx/core/run";

type RunOptions = {
  notebookDir: string;
  cell: Cell;
  config: NotebookConfig;
};

type CappedText = {
  text: string;
  truncated: boolean;
};

type RunnerResultFile = {
  outputs?: RunOutput[];
  error?: {
    message: string;
    stack?: string;
  };
};

function safeJoin(base: string, ...parts: string[]): string {
  const resolvedBase = resolve(base);
  const full = resolve(resolvedBase, ...parts);
  if (full !== resolvedBase && !full.startsWith(`${resolvedBase}${sep}`)) {
    throw new Error("Path escaped base directory.");
  }
  return full;
}

function runIdFor(cell: Cell): string {
  const suffix = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  return `${cell.id.replaceAll(".", "-")}-${suffix}`;
}

function checkIdFor(cell: Cell): string {
  const suffix = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  return `${cell.id.replaceAll(".", "-")}-${suffix}`;
}

function escapeTemplateBody(body: string): string {
  return body.replaceAll("\\", "\\\\").replaceAll("`", "\\`").replaceAll("${", "\\${");
}

function splitLeadingImports(body: string): {
  imports: string;
  statements: string;
} {
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const imports: string[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index]!;
    const trimmed = line.trim();

    if (trimmed === "") {
      imports.push(line);
      index += 1;
      continue;
    }

    if (!trimmed.startsWith("import ")) break;

    imports.push(line);
    index += 1;

    if (!trimmed.endsWith(";")) {
      while (index < lines.length) {
        const next = lines[index]!;
        imports.push(next);
        index += 1;
        if (next.trim().endsWith(";")) break;
      }
    }
  }

  return {
    imports: imports.join("\n").trimEnd(),
    statements: lines.slice(index).join("\n"),
  };
}

function generatedRunnerSource(options: {
  cellBody: string;
  dataRoot: string;
  outRoot: string;
  resultPath: string;
}): string {
  const parts = splitLeadingImports(options.cellBody);

  return `import { mkdir } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
${escapeTemplateBody(parts.imports)}

const outputs = [];
const dataRoot = ${JSON.stringify(options.dataRoot)};
const outRoot = ${JSON.stringify(options.outRoot)};
const resultPath = ${JSON.stringify(options.resultPath)};

function safeJoin(base, ...parts) {
  const resolvedBase = resolve(base);
  const full = resolve(resolvedBase, ...parts);
  if (full !== resolvedBase && !full.startsWith(\`\${resolvedBase}\${sep}\`)) {
    throw new Error("Path escaped base directory.");
  }
  return full;
}

function serializeError(error) {
  if (error instanceof Error) {
    return { message: error.message, stack: error.stack };
  }
  return { message: String(error) };
}

await mkdir(outRoot, { recursive: true });
await mkdir(dirname(resultPath), { recursive: true });

const ctx = {
  text(value) {
    outputs.push({ kind: "text", value: String(value) });
  },
  json(value) {
    outputs.push({ kind: "json", value });
  },
  table(value) {
    if (!Array.isArray(value)) {
      throw new Error("ctx.table expects an array.");
    }
    outputs.push({ kind: "table", value });
  },
  data: {
    path(...parts) {
      return safeJoin(dataRoot, ...parts);
    },
    async text(path) {
      return await Bun.file(safeJoin(dataRoot, path)).text();
    },
    async json(path) {
      return JSON.parse(await Bun.file(safeJoin(dataRoot, path)).text());
    },
  },
  out: {
    path(...parts) {
      return safeJoin(outRoot, ...parts);
    },
    async writeText(path, value) {
      const target = safeJoin(outRoot, path);
      await mkdir(dirname(target), { recursive: true });
      await Bun.write(target, String(value));
    },
    async writeJson(path, value) {
      const target = safeJoin(outRoot, path);
      await mkdir(dirname(target), { recursive: true });
      await Bun.write(target, JSON.stringify(value, null, 2));
    },
  },
};

let error;

try {
${escapeTemplateBody(parts.statements)}
} catch (caught) {
  error = serializeError(caught);
  process.exitCode = 1;
}

await Bun.write(resultPath, JSON.stringify({ outputs, error }, null, 2));
`;
}

async function readCappedText(
  stream: ReadableStream<Uint8Array> | null,
  limit: number,
): Promise<CappedText> {
  if (!stream) return { text: "", truncated: false };

  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  let truncated = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    if (total + value.length > limit) {
      const remaining = Math.max(0, limit - total);
      if (remaining > 0) {
        chunks.push(value.slice(0, remaining));
      }
      truncated = true;
      await reader.cancel();
      break;
    }

    chunks.push(value);
    total += value.length;
  }

  const bytes = new Uint8Array(chunks.reduce((sum, chunk) => sum + chunk.length, 0));
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }

  return {
    text: new TextDecoder().decode(bytes),
    truncated,
  };
}

async function readResultFile(path: string, maxBytes: number): Promise<RunnerResultFile> {
  const file = Bun.file(path);
  if (!(await file.exists())) {
    return {};
  }

  if (file.size > maxBytes) {
    return {
      error: {
        message: `Run result exceeded ${maxBytes} bytes.`,
      },
    };
  }

  return JSON.parse(await file.text()) as RunnerResultFile;
}

function ctxTypeDeclaration(): string {
  return `type AstryxOutput =
  | { kind: "text"; value: string }
  | { kind: "json"; value: unknown }
  | { kind: "table"; value: unknown[] };

type AstryxContext = {
  text(value: unknown): void;
  json(value: unknown): void;
  table(value: unknown[]): void;
  data: {
    path(...parts: string[]): string;
    text(path: string): Promise<string>;
    json<T = unknown>(path: string): Promise<T>;
  };
  out: {
    path(...parts: string[]): string;
    writeText(path: string, value: unknown): Promise<void>;
    writeJson(path: string, value: unknown): Promise<void>;
  };
};

declare const ctx: AstryxContext;
`;
}

export async function runTypeScriptCell(options: RunOptions): Promise<CellRunResult> {
  if (options.cell.ext !== "ts" && options.cell.ext !== "js") {
    throw new Error("Only .ts cells can be executed by the Bun runtime.");
  }

  const runId = runIdFor(options.cell);
  const notebookDir = resolve(options.notebookDir);
  const stateDir = safeJoin(notebookDir, ".astryx");
  const runsDir = safeJoin(stateDir, "runs");
  const runDir = safeJoin(runsDir, runId);
  const resultPath = safeJoin(runDir, "result.json");
  const runPath = safeJoin(runDir, options.cell.ext === "js" ? "run.js" : "run.ts");
  const dataRoot = safeJoin(notebookDir, options.config.paths.data);
  const outRoot = safeJoin(notebookDir, options.config.paths.out);

  mkdirSync(runDir, { recursive: true });
  mkdirSync(dataRoot, { recursive: true });
  mkdirSync(outRoot, { recursive: true });

  await Bun.write(
    runPath,
    generatedRunnerSource({
      cellBody: options.cell.body,
      dataRoot,
      outRoot,
      resultPath,
    }),
  );

  const started = performance.now();
  let timedOut = false;

  const proc = Bun.spawn({
    cmd: [process.execPath, runPath],
    cwd: notebookDir,
    stdout: "pipe",
    stderr: "pipe",
    stdin: "ignore",
  });

  const timeout = setTimeout(() => {
    timedOut = true;
    proc.kill("SIGKILL");
  }, options.config.execution.timeoutMs);

  const [exitCode, stdout, stderr] = await Promise.all([
    proc.exited,
    readCappedText(proc.stdout, options.config.execution.stdoutBytes),
    readCappedText(proc.stderr, options.config.execution.stderrBytes),
  ]);

  clearTimeout(timeout);

  const durationMs = Math.round(performance.now() - started);
  const result = await readResultFile(resultPath, options.config.execution.resultBytes);
  const ok = !timedOut && exitCode === 0 && !result.error;

  const finalResult: CellRunResult = {
    runId,
    ok,
    exitCode,
    durationMs,
    stdout: stdout.text,
    stderr: stderr.text,
    stdoutTruncated: stdout.truncated,
    stderrTruncated: stderr.truncated,
    outputs: result.outputs ?? [],
    timedOut,
  };

  if (result.error) {
    finalResult.error = result.error;
  } else if (timedOut) {
    finalResult.error = {
      message: `Run exceeded ${options.config.execution.timeoutMs} ms timeout.`,
    };
  }

  const runsLogPath = join(stateDir, "runs.jsonl");
  if (!existsSync(runsLogPath)) {
    await Bun.write(runsLogPath, "");
  }

  await appendFile(
    join(stateDir, "runs.jsonl"),
    `${JSON.stringify({
      runId,
      cellId: options.cell.id,
      ok: finalResult.ok,
      durationMs: finalResult.durationMs,
      createdAt: new Date().toISOString(),
    })}\n`,
  );

  return finalResult;
}

export async function checkTypeScriptCell(options: RunOptions): Promise<CellCheckResult> {
  if (options.cell.ext !== "ts") {
    throw new Error("Only .ts cells can be typechecked.");
  }

  const checkId = checkIdFor(options.cell);
  const notebookDir = resolve(options.notebookDir);
  const stateDir = safeJoin(notebookDir, ".astryx");
  const checksDir = safeJoin(stateDir, "checks");
  const checkDir = safeJoin(checksDir, checkId);
  const checkPath = safeJoin(checkDir, "check.ts");

  mkdirSync(checkDir, { recursive: true });

  await Bun.write(checkPath, `${ctxTypeDeclaration()}\n${options.cell.body}\n\nexport {};\n`);

  const started = performance.now();
  let timedOut = false;

  const proc = Bun.spawn({
    cmd: [
      process.execPath,
      "x",
      "tsc",
      "--noEmit",
      "--pretty",
      "false",
      "--target",
      "ES2022",
      "--module",
      "ESNext",
      "--moduleResolution",
      "Bundler",
      "--types",
      "bun-types",
      "--strict",
      "--skipLibCheck",
      checkPath,
    ],
    cwd: notebookDir,
    stdout: "pipe",
    stderr: "pipe",
    stdin: "ignore",
  });

  const timeout = setTimeout(() => {
    timedOut = true;
    proc.kill("SIGKILL");
  }, options.config.execution.timeoutMs);

  const [exitCode, stdout, stderr] = await Promise.all([
    proc.exited,
    readCappedText(proc.stdout, options.config.execution.stdoutBytes),
    readCappedText(proc.stderr, options.config.execution.stderrBytes),
  ]);

  clearTimeout(timeout);

  const durationMs = Math.round(performance.now() - started);
  const ok = !timedOut && exitCode === 0;
  const result: CellCheckResult = {
    checkId,
    ok,
    exitCode,
    durationMs,
    stdout: stdout.text,
    stderr: stderr.text,
    stdoutTruncated: stdout.truncated,
    stderrTruncated: stderr.truncated,
    timedOut,
  };

  if (timedOut) {
    result.error = {
      message: `Typecheck exceeded ${options.config.execution.timeoutMs} ms timeout.`,
    };
  }

  return result;
}
