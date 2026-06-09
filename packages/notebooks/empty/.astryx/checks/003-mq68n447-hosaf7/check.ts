type AstryxOutput =
  | { kind: "text"; value: string }
  | { kind: "json"; value: unknown }
  | { kind: "table"; value: unknown[] };

type AstryxContext = {
  text(value: unknown): void;
  json(value: unknown): void;
  table(value: unknown[]): void;
  data: {
    path(...parts: string[]): string;
    text(path: string): Promise<string>;
    json<T = unknown>(path: string): Promise<T>;
  };
  out: {
    path(...parts: string[]): string;
    writeText(path: string, value: unknown): Promise<void>;
    writeJson(path: string, value: unknown): Promise<void>;
  };
};

declare const ctx: AstryxContext;

ctx.text("Hello from a bounded local TypeScript cell.");
ctx.json({
  cell: "003",
  runtime: "bun",
  ok: true
});

export {};
