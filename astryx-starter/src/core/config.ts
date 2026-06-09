import type { NotebookConfig } from "./model";

type Table = Record<string, string | number>;

type RawConfig = {
  root: Table;
  tables: Record<string, Table>;
};

function parseValue(value: string): string | number {
  const trimmed = value.trim();

  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1);
  }

  const numberValue = Number(trimmed);
  if (Number.isFinite(numberValue) && trimmed !== "") {
    return numberValue;
  }

  return trimmed;
}

export function parseTinyToml(source: string): RawConfig {
  const raw: RawConfig = { root: {}, tables: {} };
  let current: Table = raw.root;

  for (const line of source.replace(/\r\n/g, "\n").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const tableMatch = trimmed.match(/^\[([a-zA-Z0-9_-]+)\]$/);
    if (tableMatch) {
      const tableName = tableMatch[1]!;
      raw.tables[tableName] ??= {};
      current = raw.tables[tableName]!;
      continue;
    }

    const keyValueMatch = trimmed.match(/^([a-zA-Z0-9_-]+)\s*=\s*(.+)$/);
    if (!keyValueMatch) continue;

    current[keyValueMatch[1]!] = parseValue(keyValueMatch[2]!);
  }

  return raw;
}

export function normalizeConfig(source: string): NotebookConfig {
  const raw = parseTinyToml(source);

  return {
    title: String(raw.root.title ?? "Untitled Notebook"),
    version: String(raw.root.version ?? "0.1"),
    theme: {
      preset: String(raw.tables.theme?.preset ?? "default"),
      density: String(raw.tables.theme?.density ?? "normal"),
      radius: String(raw.tables.theme?.radius ?? "soft"),
    },
    preview: {
      width: Number(raw.tables.preview?.width ?? 390),
      height: Number(raw.tables.preview?.height ?? 844),
      device: String(raw.tables.preview?.device ?? "mobile"),
    },
    paths: {
      data: String(raw.tables.paths?.data ?? "data"),
      out: String(raw.tables.paths?.out ?? "out"),
    },
  };
}
