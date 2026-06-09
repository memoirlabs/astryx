import { mkdir } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";


const outputs = [];
const dataRoot = "/Volumes/T9/cursor/astryx/notebooks/empty/data";
const outRoot = "/Volumes/T9/cursor/astryx/notebooks/empty/out";
const resultPath = "/Volumes/T9/cursor/astryx/notebooks/empty/.astryx/runs/003-mq68n44a-mfm4cq/result.json";

function safeJoin(base, ...parts) {
  const resolvedBase = resolve(base);
  const full = resolve(resolvedBase, ...parts);
  if (full !== resolvedBase && !full.startsWith(`${resolvedBase}${sep}`)) {
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
ctx.text("Hello from a bounded local TypeScript cell.");
ctx.json({
  cell: "003",
  runtime: "bun",
  ok: true
});
} catch (caught) {
  error = serializeError(caught);
  process.exitCode = 1;
}

await Bun.write(resultPath, JSON.stringify({ outputs, error }, null, 2));
