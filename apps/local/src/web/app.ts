import type { Cell, Notebook, Section } from "@astryx/core/model";
import type { CellCheckResult, CellRunResult, RunOutput } from "@astryx/core/run";
import { extFromFilename, serializeAstryx } from "@astryx/core/parse";
import { renderMarkdown } from "@astryx/renderer/markdown";
import { renderHtmlFragment } from "@astryx/renderer/render";

type NotebookSummary = {
  name: string;
  title: string;
};

type State = {
  notebooks: NotebookSummary[];
  currentNotebookName: string | null;
  notebook: Notebook | null;
  runs: Record<string, CellRunResult>;
  checks: Record<string, CellCheckResult>;
  message: string;
  error: string;
};

const state: State = {
  notebooks: [],
  currentNotebookName: null,
  notebook: null,
  runs: {},
  checks: {},
  message: "",
  error: "",
};

const appElement = document.querySelector<HTMLDivElement>("#app");
if (!appElement) throw new Error("Missing #app");
const app = appElement;

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function loadNotebooks() {
  const res = await fetch("/api/notebooks");
  const payload = (await res.json()) as { notebooks: NotebookSummary[] };
  state.notebooks = payload.notebooks;

  if (!state.currentNotebookName) {
    state.currentNotebookName = state.notebooks[0]?.name ?? null;
  }

  if (state.currentNotebookName) {
    await loadNotebook(state.currentNotebookName);
  }
}

async function loadNotebook(name: string) {
  state.message = "";
  state.error = "";
  state.currentNotebookName = name;

  const res = await fetch(`/api/notebook/${encodeURIComponent(name)}`);
  const payload = (await res.json()) as { notebook: Notebook } | { error: string };

  if ("error" in payload) {
    state.error = payload.error;
    render();
    return;
  }

  state.notebook = payload.notebook;
  state.runs = {};
  state.checks = {};
  render();
}

function serializeNotebook(notebook: Notebook): string {
  return serializeAstryx(notebook.sections, notebook.cells);
}

async function saveNotebook() {
  if (!state.notebook || !state.currentNotebookName) return;

  const source = serializeNotebook(state.notebook);

  const res = await fetch(`/api/notebook/${encodeURIComponent(state.currentNotebookName)}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ source }),
  });

  const payload = (await res.json()) as { ok: true; notebook: Notebook } | { error: string };

  if ("error" in payload) {
    state.error = payload.error;
    state.message = "";
  } else {
    state.notebook = payload.notebook;
    state.message = "Saved notebook.astryx";
    state.error = "";
  }

  render();
}

async function exportHtml(cellId: string) {
  if (!state.currentNotebookName) return;

  await saveNotebook();

  const res = await fetch(
    `/api/export-html/${encodeURIComponent(state.currentNotebookName)}/${encodeURIComponent(cellId)}`,
    { method: "POST" },
  );

  const payload = (await res.json()) as { ok: true; path: string } | { error: string };

  if ("error" in payload) {
    state.error = payload.error;
    state.message = "";
  } else {
    state.message = `Exported ${payload.path}`;
    state.error = "";
  }

  render();
}

async function screenshotCell(cellId: string) {
  if (!state.currentNotebookName) return;

  await saveNotebook();

  const res = await fetch(
    `/api/screenshot/${encodeURIComponent(state.currentNotebookName)}/${encodeURIComponent(cellId)}`,
    { method: "POST" },
  );

  const payload = (await res.json()) as { ok: true; path: string } | { error: string };

  if ("error" in payload) {
    state.error = payload.error;
    state.message = "";
  } else {
    state.message = `Saved screenshot ${payload.path}`;
    state.error = "";
  }

  render();
}

async function runCell(cellId: string) {
  if (!state.currentNotebookName) return;

  await saveNotebook();

  state.message = "Running cell...";
  state.error = "";
  render();

  const res = await fetch(
    `/api/run-cell/${encodeURIComponent(state.currentNotebookName)}/${encodeURIComponent(cellId)}`,
    { method: "POST" },
  );

  const payload = (await res.json()) as
    | { ok: true; result: CellRunResult }
    | { error: string };

  if ("error" in payload) {
    state.error = payload.error;
    state.message = "";
  } else {
    state.runs[cellId] = payload.result;
    state.message = payload.result.ok
      ? `Ran ${cellId} in ${payload.result.durationMs} ms`
      : `Run failed for ${cellId}`;
    state.error = "";
  }

  render();
}

async function checkCell(cellId: string) {
  if (!state.currentNotebookName) return;

  await saveNotebook();

  state.message = "Checking types...";
  state.error = "";
  render();

  const res = await fetch(
    `/api/check-cell/${encodeURIComponent(state.currentNotebookName)}/${encodeURIComponent(cellId)}`,
    { method: "POST" },
  );

  const payload = (await res.json()) as
    | { ok: true; result: CellCheckResult }
    | { error: string };

  if ("error" in payload) {
    state.error = payload.error;
    state.message = "";
  } else {
    state.checks[cellId] = payload.result;
    state.message = payload.result.ok
      ? `Types OK for ${cellId} in ${payload.result.durationMs} ms`
      : `Typecheck failed for ${cellId}`;
    state.error = "";
  }

  render();
}

function updateCellBody(cellId: string, body: string) {
  if (!state.notebook) return;
  const cell = state.notebook.cells.find((candidate) => candidate.id === cellId);
  if (!cell) return;
  cell.body = body;
  delete state.runs[cellId];
  delete state.checks[cellId];
  render();
}

function titleFromFilename(filename: string): string {
  return filename.replace(/\.[^.]+$/, "");
}

function replaceFilenameExt(filename: string, ext: string): string {
  const base = filename.replace(/\.[^.]+$/, "") || "Cell";
  return `${base}.${ext}`;
}

function updateCellFilename(cellId: string, filename: string) {
  if (!state.notebook) return;
  const cell = state.notebook.cells.find((candidate) => candidate.id === cellId);
  if (!cell) return;

  const clean = filename.trim();
  if (!clean || clean.includes("\n")) return;

  cell.filename = clean;
  cell.title = titleFromFilename(clean);
  cell.ext = extFromFilename(clean);
  delete state.runs[cellId];
  delete state.checks[cellId];
  render();
}

function updateCellExt(cellId: string, ext: string) {
  if (!state.notebook) return;
  const cell = state.notebook.cells.find((candidate) => candidate.id === cellId);
  if (!cell) return;

  updateCellFilename(cellId, replaceFilenameExt(cell.filename, ext));
}

function htmlPreview(cell: Cell): string {
  if (!state.notebook) return "";
  const fragment = renderHtmlFragment(cell.body, state.notebook.cells);
  const escaped = escapeHtml(fragment);
  const width = state.notebook.config.preview.width;
  const height = state.notebook.config.preview.height;

  return `
    <iframe
      class="cell-frame"
      sandbox=""
      width="${width}"
      height="${height}"
      srcdoc="${escaped}"
    ></iframe>
  `;
}

function jsonPreview(cell: Cell): string {
  try {
    return `<pre class="json-preview">${escapeHtml(JSON.stringify(JSON.parse(cell.body), null, 2))}</pre>`;
  } catch (error) {
    return `<pre class="json-preview error">Invalid JSON\n${escapeHtml(String(error))}</pre>`;
  }
}

function runOutput(output: RunOutput): string {
  if (output.kind === "text") {
    return `<pre class="run-output-text">${escapeHtml(output.value)}</pre>`;
  }

  if (output.kind === "json") {
    return `<pre class="run-output-json">${escapeHtml(JSON.stringify(output.value, null, 2))}</pre>`;
  }

  return `<pre class="run-output-json">${escapeHtml(JSON.stringify(output.value, null, 2))}</pre>`;
}

function scriptPreview(cell: Cell): string {
  const result = state.runs[cell.id];
  const check = state.checks[cell.id];

  const checkHtml = check
    ? `
      <div class="run-panel ${check.ok ? "run-ok" : "run-failed"}">
        <div class="run-status">
          <strong>${check.ok ? "Types OK" : "Type Error"}</strong>
          <span>${check.durationMs} ms</span>
          <span>check ${escapeHtml(check.checkId)}</span>
        </div>
        ${check.error ? `<pre class="run-error">${escapeHtml(check.error.message)}</pre>` : ""}
        ${check.stdout ? `<pre class="run-stream">stdout\n${escapeHtml(check.stdout)}${check.stdoutTruncated ? "\n[truncated]" : ""}</pre>` : ""}
        ${check.stderr ? `<pre class="run-stream error-stream">stderr\n${escapeHtml(check.stderr)}${check.stderrTruncated ? "\n[truncated]" : ""}</pre>` : ""}
      </div>
    `
    : "";

  if (!result) {
    return `
      <div class="run-panel muted-panel">
        <div class="run-status">Not run yet.</div>
      </div>
      ${checkHtml}
    `;
  }

  const outputHtml = result.outputs.length
    ? result.outputs.map(runOutput).join("")
    : `<div class="run-empty">No structured outputs.</div>`;

  return `
    <div class="run-panel ${result.ok ? "run-ok" : "run-failed"}">
      <div class="run-status">
        <strong>${result.ok ? "OK" : "Failed"}</strong>
        <span>${result.durationMs} ms</span>
        <span>run ${escapeHtml(result.runId)}</span>
      </div>

      ${result.error ? `<pre class="run-error">${escapeHtml(result.error.stack ?? result.error.message)}</pre>` : ""}
      ${outputHtml}
      ${result.stdout ? `<pre class="run-stream">stdout\n${escapeHtml(result.stdout)}${result.stdoutTruncated ? "\n[truncated]" : ""}</pre>` : ""}
      ${result.stderr ? `<pre class="run-stream error-stream">stderr\n${escapeHtml(result.stderr)}${result.stderrTruncated ? "\n[truncated]" : ""}</pre>` : ""}
    </div>
    ${checkHtml}
  `;
}

function outputForCell(cell: Cell): string {
  if (cell.ext === "html") return htmlPreview(cell);
  if (cell.ext === "md") return `<div class="md-preview">${renderMarkdown(cell.body)}</div>`;
  if (cell.ext === "json") return jsonPreview(cell);
  if (cell.ext === "css") return `<pre class="code-preview">${escapeHtml(cell.body)}</pre>`;
  if (cell.ext === "js" || cell.ext === "ts") return scriptPreview(cell);
  return `<pre class="code-preview">${escapeHtml(cell.body)}</pre>`;
}

function cellActions(cell: Cell): string {
  if (cell.ext === "js" || cell.ext === "ts") {
    return `
      <div class="cell-actions">
        ${cell.ext === "ts" ? `<button data-action="check-cell" data-cell-id="${cell.id}">Check Types</button>` : ""}
        <button data-action="run-cell" data-cell-id="${cell.id}">Run TS</button>
      </div>
    `;
  }

  if (cell.ext !== "html") return "";

  return `
    <div class="cell-actions">
      <button data-action="export-html" data-cell-id="${cell.id}">Export Fragment</button>
      <button data-action="screenshot" data-cell-id="${cell.id}">Screenshot PNG</button>
    </div>
  `;
}

function renderCell(cell: Cell): string {
  return `
    <article class="cell-card" id="cell-${cell.id}">
      <header class="cell-header">
        <div class="cell-meta">
          <span class="cell-id">${cell.id}</span>
          <input
            class="cell-filename"
            aria-label="Cell filename"
            data-cell-id="${cell.id}"
            value="${escapeHtml(cell.filename)}"
          />
        </div>
        <select class="cell-type" aria-label="Cell type" data-cell-id="${cell.id}">
          ${["html", "css", "md", "ts", "json"].map((ext) => `
            <option value="${ext}" ${cell.ext === ext ? "selected" : ""}>.${ext}</option>
          `).join("")}
          ${cell.ext === "js" ? `<option value="js" selected>.js</option>` : ""}
          ${cell.ext === "unknown" ? `<option value="unknown" selected>unknown</option>` : ""}
        </select>
      </header>

      <div class="cell-body">
        <textarea
          class="cell-editor"
          spellcheck="false"
          data-cell-id="${cell.id}"
        >${escapeHtml(cell.body)}</textarea>

        <div class="cell-output">
          ${outputForCell(cell)}
          ${cellActions(cell)}
        </div>
      </div>
    </article>
  `;
}

function renderSection(section: Section): string {
  if (!state.notebook) return "";

  const cells = section.cellIds
    .map((cellId) => state.notebook!.cells.find((cell) => cell.id === cellId))
    .filter((cell): cell is Cell => Boolean(cell));

  return `
    <section class="notebook-section">
      <h2>${escapeHtml(section.title)}</h2>
      ${cells.map(renderCell).join("\n")}
    </section>
  `;
}

function renderOutline(): string {
  if (!state.notebook) return "";

  return state.notebook.sections
    .map((section) => {
      const cellLinks = section.cellIds
        .map((cellId) => {
          const cell = state.notebook!.cells.find((candidate) => candidate.id === cellId);
          if (!cell) return "";
          return `<a href="#cell-${cell.id}">${cell.id} ${escapeHtml(cell.title)}</a>`;
        })
        .join("");

      return `
        <div class="outline-section">
          <div class="outline-title">${escapeHtml(section.title)}</div>
          ${cellLinks}
        </div>
      `;
    })
    .join("");
}

function renderNotebookPicker(): string {
  return `
    <select id="notebook-picker">
      ${state.notebooks
        .map(
          (notebook) => `
            <option value="${escapeHtml(notebook.name)}" ${notebook.name === state.currentNotebookName ? "selected" : ""}>
              ${escapeHtml(notebook.title)}
            </option>
          `,
        )
        .join("")}
    </select>
  `;
}

function render() {
  if (!state.notebook) {
    app.innerHTML = `
      <main class="empty-shell">
        <h1>Astryx</h1>
        <p>No notebook loaded.</p>
        ${state.error ? `<pre class="error-box">${escapeHtml(state.error)}</pre>` : ""}
      </main>
    `;
    return;
  }

  app.innerHTML = `
    <div class="shell">
      <header class="topbar">
        <div class="brand">
          <strong>Astryx</strong>
          ${renderNotebookPicker()}
        </div>
        <div class="top-actions">
          ${state.message ? `<span class="message">${escapeHtml(state.message)}</span>` : ""}
          ${state.error ? `<span class="error-message">${escapeHtml(state.error)}</span>` : ""}
          <button id="save-button">Save</button>
        </div>
      </header>

      <aside class="outline">
        ${renderOutline()}
      </aside>

      <main class="notebook-feed">
        <h1>${escapeHtml(state.notebook.config.title)}</h1>
        ${state.notebook.sections.map(renderSection).join("\n")}
      </main>
    </div>
  `;

  document.querySelector<HTMLButtonElement>("#save-button")?.addEventListener("click", () => {
    void saveNotebook();
  });

  document.querySelector<HTMLSelectElement>("#notebook-picker")?.addEventListener("change", (event) => {
    const target = event.target as HTMLSelectElement;
    void loadNotebook(target.value);
  });

  document.querySelectorAll<HTMLTextAreaElement>(".cell-editor").forEach((textarea) => {
    textarea.addEventListener("input", () => {
      const cellId = textarea.dataset.cellId;
      if (!cellId || !state.notebook) return;
      const cell = state.notebook.cells.find((candidate) => candidate.id === cellId);
      if (cell) cell.body = textarea.value;
      delete state.runs[cellId];
      delete state.checks[cellId];

      const card = textarea.closest(".cell-card");
      const output = card?.querySelector<HTMLDivElement>(".cell-output");
      if (output && cell) {
        output.innerHTML = `${outputForCell(cell)}${cellActions(cell)}`;
        bindCellActionButtons(output);
      }
    });
  });

  document.querySelectorAll<HTMLInputElement>(".cell-filename").forEach((input) => {
    input.addEventListener("change", () => {
      const cellId = input.dataset.cellId;
      if (cellId) updateCellFilename(cellId, input.value);
    });
  });

  document.querySelectorAll<HTMLSelectElement>(".cell-type").forEach((select) => {
    select.addEventListener("change", () => {
      const cellId = select.dataset.cellId;
      if (cellId) updateCellExt(cellId, select.value);
    });
  });

  bindCellActionButtons(document);
}

function bindCellActionButtons(root: ParentNode) {
  root.querySelectorAll<HTMLButtonElement>('[data-action="export-html"]').forEach((button) => {
    button.addEventListener("click", () => {
      const cellId = button.dataset.cellId;
      if (cellId) void exportHtml(cellId);
    });
  });

  root.querySelectorAll<HTMLButtonElement>('[data-action="screenshot"]').forEach((button) => {
    button.addEventListener("click", () => {
      const cellId = button.dataset.cellId;
      if (cellId) void screenshotCell(cellId);
    });
  });

  root.querySelectorAll<HTMLButtonElement>('[data-action="run-cell"]').forEach((button) => {
    button.addEventListener("click", () => {
      const cellId = button.dataset.cellId;
      if (cellId) void runCell(cellId);
    });
  });

  root.querySelectorAll<HTMLButtonElement>('[data-action="check-cell"]').forEach((button) => {
    button.addEventListener("click", () => {
      const cellId = button.dataset.cellId;
      if (cellId) void checkCell(cellId);
    });
  });
}

loadNotebooks().catch((error) => {
  state.error = error instanceof Error ? error.stack ?? error.message : String(error);
  render();
});
