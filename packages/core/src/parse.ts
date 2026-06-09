import type { Cell, CellExt, Section } from "./model";

export function extFromFilename(filename: string): CellExt {
  const ext = filename.split(".").pop()?.toLowerCase();

  if (ext === "md") return "md";
  if (ext === "html") return "html";
  if (ext === "css") return "css";
  if (ext === "js") return "js";
  if (ext === "json") return "json";
  if (ext === "ts") return "ts";

  return "unknown";
}

function parseSection(rest: string, index: number): Section {
  const parts = rest.trim().split(/\s+/);
  const first = parts[0];
  const hasLegacyId = Boolean(first && /^\d{3}$/.test(first));
  const id = hasLegacyId ? first! : String(index).padStart(3, "0");
  const title = hasLegacyId ? parts.slice(1).join(" ") : rest.trim();

  if (!title) {
    throw new Error("Section is missing title.");
  }

  return {
    id,
    title,
    cellIds: [],
  };
}

function parseCellHeader(rest: string): {
  id: string;
  filename: string;
  title: string;
  ext: CellExt;
} {
  const parts = rest.trim().split(/\s+/);
  const id = parts[0];
  const filename = parts.slice(1).join(" ");

  if (!id || !/^(\d{3}|\d{3}\.\d{3})$/.test(id)) {
    throw new Error(`Invalid cell id "${id}". Expected 000.`);
  }

  if (!filename) {
    throw new Error(`Cell ${id} is missing filename.`);
  }

  return {
    id,
    filename,
    title: filename.replace(/\.[^.]+$/, ""),
    ext: extFromFilename(filename),
  };
}

export function parseAstryx(source: string): {
  sections: Section[];
  cells: Cell[];
} {
  const lines = source.replace(/\r\n/g, "\n").split("\n");

  const sections: Section[] = [];
  const cells: Cell[] = [];

  let currentSection: Section | null = null;
  let currentCell:
    | {
        id: string;
        filename: string;
        title: string;
        ext: CellExt;
        sectionId: string;
        body: string[];
      }
    | null = null;

  function flushCell() {
    if (!currentCell) return;

    cells.push({
      id: currentCell.id,
      title: currentCell.title,
      filename: currentCell.filename,
      ext: currentCell.ext,
      sectionId: currentCell.sectionId,
      body: currentCell.body.join("\n").trimEnd(),
    });

    currentSection?.cellIds.push(currentCell.id);
    currentCell = null;
  }

  for (const line of lines) {
    const cellMatch = line.match(/^\*\*\*\s+(.*)$/);
    if (cellMatch) {
      flushCell();

      if (!currentSection) {
        currentSection = { id: "000", title: "Notebook", cellIds: [] };
        sections.push(currentSection);
      }

      const parsed = parseCellHeader(cellMatch[1]!);

      currentCell = {
        ...parsed,
        sectionId: currentSection.id,
        body: [],
      };

      continue;
    }

    const sectionMatch = line.match(/^\*\*\s+(.*)$/);
    if (sectionMatch) {
      flushCell();

      currentSection = parseSection(sectionMatch[1]!, sections.length);
      sections.push(currentSection);
      continue;
    }

    if (line.startsWith("* ")) {
      continue;
    }

    if (currentCell) {
      currentCell.body.push(line);
    }
  }

  flushCell();

  return { sections, cells };
}

export function serializeAstryx(sections: Section[], cells: Cell[]): string {
  const lines: string[] = ["* astryx 0.1", ""];

  for (const section of sections) {
    lines.push(`** ${section.title}`, "");

    for (const cellId of section.cellIds) {
      const cell = cells.find((candidate) => candidate.id === cellId);
      if (!cell) continue;

      lines.push(`*** ${cell.id} ${cell.filename}`);
      lines.push(cell.body.trimEnd());
      lines.push("");
    }
  }

  return lines.join("\n").trimEnd() + "\n";
}
