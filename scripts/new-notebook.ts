import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const name = process.argv[2] ?? "empty";

if (!/^[a-z0-9][a-z0-9-]*$/i.test(name)) {
  throw new Error(
    `Invalid notebook name "${name}". Use letters, numbers, and hyphens only.`,
  );
}

const notebookDir = join(process.cwd(), "notebooks", name);
const dataDir = join(notebookDir, "data");
const outDir = join(notebookDir, "out");

if (existsSync(notebookDir)) {
  throw new Error(`Notebook already exists: notebooks/${name}`);
}

mkdirSync(dataDir, { recursive: true });
mkdirSync(outDir, { recursive: true });
await Bun.write(join(dataDir, ".gitkeep"), "");
await Bun.write(join(outDir, ".gitkeep"), "");

const title = name
  .split("-")
  .filter(Boolean)
  .map((part) => part[0]!.toUpperCase() + part.slice(1))
  .join(" ");

const config = `title = "${title}"
version = "0.1"

[preview]
width = 390
height = 844

[paths]
data = "data"
out = "out"

[execution]
timeoutMs = 5000
stdoutBytes = 1048576
stderrBytes = 1048576
resultBytes = 5242880
maxConcurrentRuns = 1
`;

const source = `* astryx 0.1

** Start

*** 000 Welcome.md
# ${title}

Start writing cells below.

Astryx notebooks are small folders with a source file, data folder, and output folder.

*** 001 Blank.html
<main>
  <h1>New cell</h1>
  <p>Write normal HTML here.</p>
  <button>Button</button>
</main>

*** 002 Data.json
{
  "name": "Astryx",
  "status": "empty"
}

*** 003 FirstRun.js
ctx.text("Hello from a bounded local JavaScript cell.");
ctx.json({
  cell: "003",
  runtime: "bun",
  ok: true
});
`;

await Bun.write(join(notebookDir, "astryx.toml"), config);
await Bun.write(join(notebookDir, "notebook.astryx"), source);

console.log(`Created notebooks/${name}`);
console.log("Run: bun run dev");
