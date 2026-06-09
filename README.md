# Astryx Starter

Astryx is a small local-first notebook prototype for HTML, CSS, Markdown, JSON, and TypeScript cells.

This starter intentionally begins with the smallest buildable thing:

```txt
Bun local host
+ browser notebook shell
+ vertical cell feed
+ HTML / CSS / Markdown / JSON cells
+ bounded local TypeScript cells
+ export HTML
+ optional screenshot PNG through Playwright
```

No Docker. No Jupyter protocol. No fake UI framework. No Astro. No WASM.

## Quick start

```bash
bun install
bun run new button-lab
bun run dev
```

Open:

```txt
http://localhost:7331
```

## Master Plan

Read [MASTER.md](/Volumes/T9/cursor/astryx/MASTER.md) for the product direction, source/rendering distinction, repo layout, current problems, and roadmap.

## Notebook folder shape

```txt
notebooks/
  button-lab/
    astryx.toml
    notebook.astryx
    data/
    out/
```

Meaning:

```txt
astryx.toml       small config
notebook.astryx   source cells
data/             user input files
out/              exported output files
```

## Repo shape

```txt
apps/local/              @astryx/local, Bun server and browser shell
packages/core/           @astryx/core, notebook model/config/parser/run types
packages/renderer/       @astryx/renderer, markdown/html rendering
packages/runtime-bun/    @astryx/runtime-bun, bounded local cell execution
scripts/                 local project scripts
notebooks/               example/local notebooks
```

## TypeScript cells

`.ts` cells run as trusted local code in a child Bun process and can be typechecked per cell. They are bounded by notebook execution config, but they are not a hostile-code sandbox.

```astryx
*** 003 FirstRun.ts
ctx.text("Hello from TypeScript");
ctx.json({ ok: true });
await ctx.out.writeJson("result.json", { ok: true });
```

Execution defaults:

```toml
[execution]
timeoutMs = 5000
stdoutBytes = 1048576
stderrBytes = 1048576
resultBytes = 5242880
maxConcurrentRuns = 1
```

## View and render support

Current cell views:

```txt
.html  iframe preview, export HTML, screenshot PNG
.md    simple markdown preview
.json  formatted JSON preview
.css   code preview and injected into HTML previews
.ts    Check Types and Run TS buttons with text/json/table/stdout/stderr result view
```

Only `.html` has full visual export/screenshot rendering today. `.ts` renders execution results, not components.

## Starter source example

```astryx
* astryx 0.1

** Start

*** 000 Welcome.md
# Button Lab

Write notes and cells below.

*** 001 Card.html
<main>
  <h1>Hello Astryx</h1>
  <p>Write normal HTML.</p>
  <button>Primary</button>
</main>

*** 002 Styles.css
body {
  padding: 24px;
}

*** 003 Data.json
{
  "name": "Astryx",
  "status": "v0"
}
```

## Screenshot support

Screenshots use Playwright if installed.

```bash
bun run screenshots:install
```

Then use the **Screenshot PNG** button on an `.html` cell.

If Playwright is not installed, export HTML still works.

## What to build next

1. Cell-level insert/delete/move controls.
2. Better editor behavior for plain HTML/CSS/TS.
3. Richer `.ts` helpers and output records.
4. `.bench` cells for mount time, heap, JS size, screenshot, and viewport tests.
5. Tauri wrapper after the web shell feels good.
