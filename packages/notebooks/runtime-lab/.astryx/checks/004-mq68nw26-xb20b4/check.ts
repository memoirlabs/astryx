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

ctx.text("this output should still be captured before the throw");
throw new Error("intentional runtime failure");

export {};
