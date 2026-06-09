import { existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join, normalize } from "node:path";
import { normalizeConfig } from "../core/config";
import type { Cell, Notebook, NotebookSummary } from "../core/model";
import { parseAstryx } from "../core/parse";
import { exportFilename, renderHtmlDocument } from "../core/render";

const root = process.cwd();
const notebooksRoot = join(root, "notebooks");
const webRoot = join(root, "src", "web");

function safeJoin(base: string, ...parts: string[]): string {
  const full = normalize(join(base, ...parts));
  if (!full.startsWith(base)) {
    throw new Error("Path escaped base directory.");
  }
  return full;
}

async function readText(path: string): Promise<string> {
  return await Bun.file(path).text();
}

async function writeText(path: string, value: string): Promise<void> {
  await Bun.write(path, value);
}

async function loadNotebook(name: string): Promise<Notebook> {
  const notebookDir = safeJoin(notebooksRoot, name);
  const configText = await readText(join(notebookDir, "astryx.toml"));
  const source = await readText(join(notebookDir, "notebook.astryx"));
  const config = normalizeConfig(configText);
  const parsed = parseAstryx(source);

  return {
    name,
    source,
    config,
    sections: parsed.sections,
    cells: parsed.cells,
  };
}

function listNotebooks(): NotebookSummary[] {
  if (!existsSync(notebooksRoot)) return [];

  return readdirSync(notebooksRoot)
    .filter((name) => {
      const dir = join(notebooksRoot, name);
      return (
        statSync(dir).isDirectory() &&
        existsSync(join(dir, "astryx.toml")) &&
        existsSync(join(dir, "notebook.astryx"))
      );
    })
    .map((name) => {
      try {
        const configText = Bun.file(join(notebooksRoot, name, "astryx.toml")).text();
        // Keep list sync/simple for v0. Title falls back below if async text is not resolved here.
        void configText;
      } catch {
        // ignored
      }
      return { name, title: name };
    });
}

async function listNotebooksWithTitles(): Promise<NotebookSummary[]> {
  if (!existsSync(notebooksRoot)) return [];

  const summaries: NotebookSummary[] = [];

  for (const name of readdirSync(notebooksRoot)) {
    const dir = join(notebooksRoot, name);
    if (!statSync(dir).isDirectory()) continue;
    if (!existsSync(join(dir, "astryx.toml"))) continue;
    if (!existsSync(join(dir, "notebook.astryx"))) continue;

    try {
      const config = normalizeConfig(await readText(join(dir, "astryx.toml")));
      summaries.push({ name, title: config.title });
    } catch {
      summaries.push({ name, title: name });
    }
  }

  return summaries;
}

function findCell(notebook: Notebook, cellId: string): Cell {
  const cell = notebook.cells.find((candidate) => candidate.id === cellId);
  if (!cell) throw new Error(`Cell not found: ${cellId}`);
  return cell;
}

async function buildWebApp(): Promise<Response> {
  const result = await Bun.build({
    entrypoints: [join(webRoot, "app.ts")],
    target: "browser",
    format: "esm",
    sourcemap: "inline",
    minify: false,
  });

  if (!result.success) {
    return new Response(
      result.logs.map((log) => log.message).join("\n"),
      { status: 500, headers: { "content-type": "text/plain" } },
    );
  }

  const js = await result.outputs[0]!.text();
  return new Response(js, {
    headers: { "content-type": "application/javascript; charset=utf-8" },
  });
}

async function screenshotHtml(html: string, outputPath: string): Promise<void> {
  let playwright: typeof import("playwright");

  try {
    playwright = await import("playwright");
  } catch {
    throw new Error(
      "Playwright is not installed. Run `bun install` and `bun run screenshots:install`, then try again.",
    );
  }

  const browser = await playwright.chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  try {
    await page.setContent(html, { waitUntil: "networkidle" });
    await page.screenshot({ path: outputPath, fullPage: true });
  } finally {
    await browser.close();
  }
}

function jsonError(error: unknown, status = 500): Response {
  return Response.json(
    {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    },
    { status },
  );
}

const server = Bun.serve({
  port: Number(process.env.PORT ?? 7331),

  async fetch(req) {
    try {
      const url = new URL(req.url);

      if (url.pathname === "/") {
        return new Response(Bun.file(join(webRoot, "index.html")), {
          headers: { "content-type": "text/html; charset=utf-8" },
        });
      }

      if (url.pathname === "/app.js") {
        return await buildWebApp();
      }

      if (url.pathname === "/style.css") {
        return new Response(Bun.file(join(webRoot, "style.css")), {
          headers: { "content-type": "text/css; charset=utf-8" },
        });
      }

      if (url.pathname === "/api/notebooks") {
        if (req.method !== "GET") return jsonError("Method not allowed", 405);
        return Response.json({ notebooks: await listNotebooksWithTitles() });
      }

      if (url.pathname.startsWith("/api/notebook/")) {
        const name = decodeURIComponent(url.pathname.replace("/api/notebook/", ""));

        if (req.method === "GET") {
          return Response.json({ notebook: await loadNotebook(name) });
        }

        if (req.method === "PUT") {
          const body = (await req.json()) as { source?: string };
          if (typeof body.source !== "string") {
            return jsonError("Missing source string.", 400);
          }

          const notebookDir = safeJoin(notebooksRoot, name);
          await writeText(join(notebookDir, "notebook.astryx"), body.source);

          return Response.json({ ok: true, notebook: await loadNotebook(name) });
        }

        return jsonError("Method not allowed", 405);
      }

      if (url.pathname.startsWith("/api/export-html/")) {
        if (req.method !== "POST") return jsonError("Method not allowed", 405);

        const parts = url.pathname.replace("/api/export-html/", "").split("/");
        const name = decodeURIComponent(parts[0] ?? "");
        const cellId = decodeURIComponent(parts[1] ?? "");
        const notebook = await loadNotebook(name);
        const cell = findCell(notebook, cellId);

        if (cell.ext !== "html") {
          return jsonError("Only .html cells can be exported as HTML.", 400);
        }

        const notebookDir = safeJoin(notebooksRoot, name);
        const outDir = safeJoin(notebookDir, notebook.config.paths.out);
        mkdirSync(outDir, { recursive: true });

        const filename = exportFilename(cell.id, cell.title, "html");
        const outputPath = safeJoin(outDir, filename);
        const html = renderHtmlDocument(cell.body, notebook.cells);

        await writeText(outputPath, html);

        return Response.json({ ok: true, path: `${notebook.config.paths.out}/${filename}` });
      }

      if (url.pathname.startsWith("/api/screenshot/")) {
        if (req.method !== "POST") return jsonError("Method not allowed", 405);

        const parts = url.pathname.replace("/api/screenshot/", "").split("/");
        const name = decodeURIComponent(parts[0] ?? "");
        const cellId = decodeURIComponent(parts[1] ?? "");
        const notebook = await loadNotebook(name);
        const cell = findCell(notebook, cellId);

        if (cell.ext !== "html") {
          return jsonError("Only .html cells can be screenshotted.", 400);
        }

        const notebookDir = safeJoin(notebooksRoot, name);
        const outDir = safeJoin(notebookDir, notebook.config.paths.out);
        mkdirSync(outDir, { recursive: true });

        const filename = exportFilename(cell.id, cell.title, "png");
        const outputPath = safeJoin(outDir, filename);
        const html = renderHtmlDocument(cell.body, notebook.cells);

        await screenshotHtml(html, outputPath);

        return Response.json({ ok: true, path: `${notebook.config.paths.out}/${filename}` });
      }

      return new Response("Not found", { status: 404 });
    } catch (error) {
      return jsonError(error);
    }
  },
});

console.log(`Astryx running at http://localhost:${server.port}`);
console.log(`Found notebooks: ${listNotebooks().map((n) => n.name).join(", ") || "none"}`);
