# Astryx Master Plan

This document is the source of truth for what Astryx is, where things live, and what we are building toward.

## One Sentence

Astryx is a local-first notebook for plain Markdown, HTML, CSS, JSON, and TypeScript, with a browser app that renders cells, typechecks/runs TypeScript locally, and exports useful artifacts.

It is not Jupyter, not a full app framework, not a fake UI library, and not a sandbox platform.

## The Key Distinction

There are two different things:

```txt
1. Notebook source
   The file a person opens in Cursor, VS Code, vim, or any editor.

2. Notebook renderer/editor
   The browser UI that turns that source into previews, runs, outputs, screenshots, and exports.
```

Jupyter works the same way conceptually. A `.ipynb` file is JSON; the Jupyter frontend reads that JSON and renders Markdown, code, and output MIME types in the browser. The raw file is not the browser experience.

Astryx should keep the same separation, but with a source file that is pleasant to read in an IDE.

## Product Goals

Astryx should make it easy to:

```txt
write notes
write normal HTML
write CSS beside that HTML
run small TypeScript cells
preview HTML/CSS in a browser
capture structured TypeScript outputs
export fragments, screenshots, and later benchmarks
keep every notebook as a normal local folder
```

The product should feel like a notebook, not like a generated app project.

## Non-Goals

Do not build these into the core right now:

```txt
Jupyter protocol
Docker runtime
remote execution
multi-user collaboration
fake Astryx UI primitives
required React
required Astro
full hostile-code sandboxing
full IDE extension
```

Those may become integrations later, but they should not shape the first clean version.

## Current Prototype

The current prototype uses:

```txt
notebooks/<name>/
  astryx.toml
  notebook.astryx
  data/
  out/
  .astryx/       generated run state
```

`notebook.astryx` is a star-block source file:

```astryx
* astryx 0.1

** Section

*** 000 Note.md
# Note

*** 001 Demo.html
<button>Save</button>

*** 002 Styles.css
button {
  padding: 8px 12px;
}

*** 003 Run.ts
ctx.json({ ok: true });
```

This works, but it is not the ideal long-term source format because it is custom syntax.

## Target Source Format

The target should be Markdown-native:

```txt
notebooks/<name>/
  astryx.toml
  notebook.md
  data/
  out/
  .astryx/
```

Example:

````md
# Button Lab

Plain notes render naturally in any Markdown preview.

```html id=001 name=button
<button class="primary">Save</button>
```

```css id=002 name=styles
.primary {
  background: black;
  color: white;
}
```

```ts id=003 name=data
ctx.json({ ok: true });
```
````

Why this is better:

```txt
readable in any IDE
normal Markdown preview works for notes
HTML/CSS/TS are obvious fenced code blocks
no custom star syntax to learn
browser app can still parse cells
no second generated Markdown representation needed
```

Important: do not maintain both `notebook.astryx` and `notebook.md` as separate source files. That will drift. The source should be one file.

## Rendering Model

The browser app is the renderer.

Current cell behavior should be:

```txt
.md    render Markdown text
.html  render an HTML fragment
.css   inject into HTML previews/exports
.json  render formatted JSON
.ts    typecheck, run locally, and render outputs
```

HTML cells should be fragments by default, not full documents:

```html
<button>Save</button>
```

not:

```html
<!doctype html>
<html>
...
</html>
```

If we later need full-document mode, it should be explicit, for example:

````md
```html mode=document
<!doctype html>
...
```
````

## TypeScript Execution

TypeScript cells typecheck and run locally through Bun, but not in the server process.

Execution path:

```txt
browser clicks Run
→ local Bun server
→ packages/runtime-bun
→ child Bun process
→ .astryx/runs/<run-id>/
→ result returned to browser
```

Default limits should stay conservative:

```toml
[execution]
timeoutMs = 5000
stdoutBytes = 1048576
stderrBytes = 1048576
resultBytes = 5242880
maxConcurrentRuns = 1
```

This is operational isolation. It is not security sandboxing. Astryx notebooks are local trusted code.

## Output Model

TypeScript cells should produce outputs through a small context API:

```ts
ctx.text("hello");
ctx.json({ ok: true });
ctx.table([{ name: "alpha", score: 1 }]);

const input = await ctx.data.json<{ ok: boolean }>("input.json");
await ctx.out.writeJson("result.json", input);
```

The browser should render outputs by type:

```txt
text   preformatted text
json   formatted JSON
table  table/grid view
stdout preformatted stream
stderr error stream
error  message and stack
```

This mirrors the Jupyter idea of typed outputs without adopting the Jupyter protocol.

## Export Model

Default exports should be literal and unsurprising:

```txt
HTML cell export       HTML fragment + injected CSS
Screenshot            rendered fragment in Chromium
TS output export       JSON run result, later
Benchmark export       run report, later
```

Do not wrap HTML fragments in full documents unless the user asks for document mode.

## Repo Layout

Current repo layout:

```txt
apps/local/
  package.json         @astryx/local
  src/server/          Bun HTTP server and APIs
  src/web/             browser notebook shell

packages/core/
  package.json         @astryx/core
  src/model.ts         shared notebook types
  src/config.ts        tiny TOML config parser
  src/parse.ts         notebook source parser/serializer
  src/run.ts           run result/output types

packages/renderer/
  package.json         @astryx/renderer
  src/markdown.ts      markdown preview renderer
  src/render.ts        HTML fragment rendering/export helpers
  src/style.ts         tiny reset CSS

packages/runtime-bun/
  package.json         @astryx/runtime-bun
  src/index.ts         bounded local TS execution

scripts/
  new-notebook.ts      creates a notebook folder

notebooks/
  empty/               minimal example
  button-lab/          HTML/CSS/TS example
  runtime-lab/         runtime behavior tests
```

## Package Responsibilities

`packages/core` should know about notebook data, not browser UI or Bun process execution.

`packages/renderer` should convert cells into display/export strings. It should not invent a design system.

`packages/runtime-bun` should typecheck and run TS cells with limits. It should not know about browser layout.

`apps/local` should glue everything together: filesystem, API routes, browser bundle, and notebook UI.

## Current Problems To Fix

The prototype still needs cleanup:

```txt
1. Move from notebook.astryx to notebook.md.
2. Make cell type/filename editing reliable in the browser UI.
3. Make HTML fragment export the default everywhere.
4. Remove stale generated artifacts from examples.
5. Keep config small and obvious.
6. Add insertion/deletion/reordering controls.
7. Add tests around parser, renderer, and runtime behavior.
```

## Roadmap

### Phase 1: Clean Source

```txt
adopt notebook.md as the source file
parse Markdown headings and fenced code blocks as cells
keep notebook.astryx compatibility only as migration support
make IDE viewing useful without a special extension
```

### Phase 2: Better Browser Editing

```txt
edit cell name/type in the UI
insert/delete/move cells
save without corrupting source
show render mode clearly
show run state clearly
```

### Phase 3: Runtime Output

```txt
stabilize ctx API
persist run records
export run results
render tables nicely
add output size/timeout UI
```

### Phase 4: Visual Workflows

```txt
screenshot matrix
viewport controls
simple benchmark cells
compare screenshots/runs
```

### Phase 5: Packaging

```txt
Tauri or local desktop shell
project-level notebook browser
optional IDE integration
```

## Design Principle

When deciding between a clever Astryx-specific feature and a boring web-native feature, choose the boring web-native feature.

Use:

```txt
Markdown for notes
HTML for markup
CSS for style
TypeScript for logic
JSON for data
local folders for notebooks
browser app for rich rendering
```

Avoid inventing syntax, UI vocabulary, or execution semantics unless there is a concrete problem that normal web primitives cannot solve.
