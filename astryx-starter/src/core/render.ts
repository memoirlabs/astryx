import type { Cell } from "./model";
import { previewCss } from "./theme";

export function collectNotebookCss(cells: Cell[]): string {
  return cells
    .filter((cell) => cell.ext === "css")
    .map((cell) => `/* ${cell.id} ${cell.filename} */\n${cell.body}`)
    .join("\n\n");
}

export function renderHtmlDocument(html: string, cells: Cell[] = []): string {
  const customCss = collectNotebookCss(cells);

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
${previewCss(customCss)}
</style>
</head>
<body>
${html}
</body>
</html>`;
}

export function exportFilename(cellId: string, title: string, ext: string): string {
  const safeTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return `${cellId}-${safeTitle || "cell"}.${ext}`;
}
