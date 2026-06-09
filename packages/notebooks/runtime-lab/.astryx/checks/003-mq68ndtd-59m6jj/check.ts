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

type RuntimeInput = {
  name: string;
  values: number[];
  enabled: boolean;
};

const input = await ctx.data.json<RuntimeInput>("input.json");
const total = input.values.reduce((sum, value) => sum + value, 0);

await ctx.out.writeJson("runtime-lab-result.json", {
  name: input.name,
  total,
  enabled: input.enabled
});

ctx.json({
  read: input.name,
  total,
  wrote: "runtime-lab-result.json"
});

export {};
