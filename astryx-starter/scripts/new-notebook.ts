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

[theme]
preset = "default"
density = "normal"
radius = "soft"

[preview]
width = 390
height = 844
device = "mobile"

[paths]
data = "data"
out = "out"
`;

const source = `* astryx 0.1

** 010 Start

*** 010.010 Welcome.md
# ${title}

Start writing cells below.

Astryx notebooks are small folders with a source file, data folder, and output folder.

*** 010.020 Blank.html
<ax-card>
  <ax-badge>Empty</ax-badge>
  <ax-title>New Astryx Cell</ax-title>
  <ax-text>
    Replace this with your own HTML, component mockup, UI state, or generated interface.
  </ax-text>
  <ax-row>
    <ax-button>Primary</ax-button>
    <ax-button variant="ghost">Secondary</ax-button>
  </ax-row>
</ax-card>

*** 010.030 Data.json
{
  "name": "Astryx",
  "status": "empty"
}
`;

await Bun.write(join(notebookDir, "astryx.toml"), config);
await Bun.write(join(notebookDir, "notebook.astryx"), source);

console.log(`Created notebooks/${name}`);
console.log("Run: bun run dev");
