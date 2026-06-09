export type CellExt = "md" | "html" | "json" | "css" | "unknown";

export type NotebookConfig = {
  title: string;
  version: string;
  theme: {
    preset: string;
    density: string;
    radius: string;
  };
  preview: {
    width: number;
    height: number;
    device: string;
  };
  paths: {
    data: string;
    out: string;
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
