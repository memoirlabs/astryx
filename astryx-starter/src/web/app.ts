import type { Cell, Notebook, Section } from "../core/model";
import { renderMarkdown } from "../core/markdown";
import { renderHtmlDocument } from "../core/render";

type NotebookSummary = {
  name: string;
  title: string;
};

type State = {
  notebooks: NotebookSummary[];
  currentNotebookName: string | null;
  notebook: Notebook | null;
  message: string;
  error: string;
};

const state: State = {
  notebooks: [],
  currentNotebookName: null,
  notebook: null,
  message: "",
  error: "",
};

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("Missing #app");

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
  render();
}

function serializeNotebook(notebook: Notebook): string {
  const lines: string[] = ["* astryx 0.1", ""];

  for (const section of notebook.sections) {
    lines.push(`** ${section.id} ${section.title}`, "");

    for (const cellId of section.cellIds) {
      const cell = notebook.cells.find((candidate) => candidate.id === cellId);
      if (!cell) continue;

      lines.push(`*** ${cell.id} ${cell.filename}`);
      lines.push(cell.body.trimEnd());
      lines.push("");
    }
  }

  return lines.join("\n").trimEnd() + "\n";
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

function updateCellBody(cellId: string, body: string) {
  if (!state.notebook) return;
  const cell = state.notebook.cells.find((candidate) => candidate.id === cellId);
  if (!cell) return;
  cell.body = body;
  render();
}

function htmlPreview(cell: Cell): string {
  if (!state.notebook) return "";
  const doc = renderHtmlDocument(cell.body, state.notebook.cells);
  const escaped = escapeHtml(doc);
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

function outputForCell(cell: Cell): string {
  if (cell.ext === "html") return htmlPreview(cell);
  if (cell.ext === "md") return `<div class="md-preview">${renderMarkdown(cell.body)}</div>`;
  if (cell.ext === "json") return jsonPreview(cell);
  if (cell.ext === "css") return `<pre class="code-preview">${escapeHtml(cell.body)}</pre>`;
  return `<pre class="code-preview">${escapeHtml(cell.body)}</pre>`;
}

function cellActions(cell: Cell): string {
  if (cell.ext !== "html") return "";

  return `
    <div class="cell-actions">
      <button data-action="export-html" data-cell-id="${cell.id}">Export HTML</button>
      <button data-action="screenshot" data-cell-id="${cell.id}">Screenshot PNG</button>
    </div>
  `;
}

function renderCell(cell: Cell): string {
  return `
    <article class="cell-card" id="cell-${cell.id}">
      <header class="cell-header">
        <div>
          <span class="cell-id">${cell.id}</span>
          <strong>${escapeHtml(cell.filename)}</strong>
        </div>
        <span class="cell-ext">.${cell.ext}</span>
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
      <h2>${section.id} ${escapeHtml(section.title)}</h2>
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
          <div class="outline-title">${section.id} ${escapeHtml(section.title)}</div>
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

      const card = textarea.closest(".cell-card");
      const output = card?.querySelector<HTMLDivElement>(".cell-output");
      if (output && cell) {
        output.innerHTML = `${outputForCell(cell)}${cellActions(cell)}`;
        bindCellActionButtons(output);
      }
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
}

loadNotebooks().catch((error) => {
  state.error = error instanceof Error ? error.stack ?? error.message : String(error);
  render();
});
