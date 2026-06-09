# Astryx v0 Specification

This describes the current prototype. The long-term source-format direction is in [MASTER.md](/Volumes/T9/cursor/astryx/MASTER.md): move toward a Markdown-native `notebook.md` source with fenced HTML/CSS/TS cells.

## Goal

Astryx v0 is a minimal notebook shell for frontend/UI work.

It should feel like a notebook: cells stacked vertically, each cell has source and output, and rendered cells can be exported.

It should not feel like a full web app project, Jupyter clone, or containerized runtime.

## Core decisions

```txt
1. Use notebook folders, not single monolithic notebook blobs.
2. Use `notebook.astryx` as the human source file.
3. Use `astryx.toml` only for simple notebook config.
4. Use Bun for local file/server work.
5. Use a browser page as the shell.
6. Use iframes for rendered HTML cells.
7. Render plain HTML, not an Astryx-specific UI vocabulary.
8. Support optional CSS cells.
9. Add component rendering later only if plain HTML/TS is not enough.
```

## Notebook folder

```txt
button-lab/
  astryx.toml
  notebook.astryx
  data/
  out/
```

Optional later:

```txt
button-lab/
  .astryx/
    index.jsonl
    runs.jsonl
    cache/
```

The hidden `.astryx/` directory is generated state. The notebook remains valid if it is deleted.

## `astryx.toml`

Only config belongs here.

```toml
title = "Button Lab"
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
```

No source code. No cell list. No output blobs.

## `notebook.astryx`

A source file made of star blocks.

```txt
*      notebook marker
**     section
***    cell
****   reserved for future sub-blocks
```

Example:

```astryx
* astryx 0.1

** Start

*** 000 Welcome.md
# Welcome

*** 001 Card.html
<main>
  <h1>Hello</h1>
</main>
```

## Numbering

Use simple global cell numbers.

```txt
000      first cell
001      second cell
002      third cell
```

Sections are labels, not part of the cell ID. The notebook folder is already the notebook boundary.

```txt
notebooks/button-lab/notebook.astryx
  ** Component States
  *** 000 Intro.md
  *** 001 BasicButton.html
```

## v0 cell types

```txt
.md      markdown note cell
.html    rendered HTML island
.css     CSS injected into HTML previews
.json    formatted data cell
.ts      bounded local Bun TypeScript cell
```

Future cell types should be added only when plain HTML/CSS/TS stops being enough.

## Rendering

For `.html` cells:

```txt
cell HTML
+ tiny reset CSS
+ optional .css cells
→ iframe srcdoc
```

For `.md` cells:

```txt
cell markdown → simple markdown preview
```

For `.json` cells:

```txt
cell JSON → formatted JSON preview
```

For `.ts` cells:

```txt
cell TypeScript
→ temporary .astryx/runs/<run-id>/run.ts
→ child Bun process
→ captured stdout/stderr/result
```

## Export actions

For `.html` cells:

```txt
Export HTML     → writes out/{cell-id}-{cell-title}.html
Screenshot PNG  → writes out/{cell-id}-{cell-title}.png if Playwright is installed
```

## Shell layout

The v0 shell is a vertical notebook feed:

```txt
Top bar
Outline rail
Notebook feed
  Section
    Cell card
      Source editor
      Output preview
      Actions
```

## What v0 intentionally excludes

```txt
Jupyter protocol
Docker/container runtime
Astro runtime
React runtime
component compilation
WASM build pipeline
cloud execution
multi-user state
full IDE extension
```

Those can come later only after the notebook shell feels good.
