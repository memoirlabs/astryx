import type { Cell } from "../../core/src/model";
import { previewCss } from "./style";

export function collectNotebookCss(cells: Cell[]): string {
  return cells
    .filter((cell) => cell.ext === "css")
    .map((cell) => `/* ${cell.id} ${cell.filename} */\n${cell.body}`)
    .join("\n\n");
}

export function renderHtmlFragment(html: string, cells: Cell[] = []): string {
  const customCss = collectNotebookCss(cells);

  return `<style>
${previewCss(customCss)}
</style>
${html}
`;
}

export function renderHtmlDocument(html: string, cells: Cell[] = []): string {
  return renderHtmlFragment(html, cells);
}

export function exportFilename(cellId: string, title: string, ext: string): string {
  const safeTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return `${cellId}-${safeTitle || "cell"}.${ext}`;
}
