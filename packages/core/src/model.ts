export type CellExt = "md" | "html" | "css" | "js" | "json" | "ts" | "unknown";

export type NotebookConfig = {
  title: string;
  version: string;
  preview: {
    width: number;
    height: number;
  };
  paths: {
    data: string;
    out: string;
  };
  execution: {
    timeoutMs: number;
    stdoutBytes: number;
    stderrBytes: number;
    resultBytes: number;
    maxConcurrentRuns: number;
  };
};

export type Section = {
  id: string;
  title: string;
  cellIds: string[];
};

export type Cell = {
  id: string;
  title: string;
  filename: string;
  ext: CellExt;
  sectionId: string;
  body: string;
};

export type Notebook = {
  name: string;
  source: string;
  config: NotebookConfig;
  sections: Section[];
  cells: Cell[];
};

export type NotebookSummary = {
  name: string;
  title: string;
};
