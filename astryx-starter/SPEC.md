# Astryx v0 Specification

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
7. Use built-in styling primitives by default.
8. Do not require user CSS for empty notebooks.
9. Add TypeScript/TSX later, after HTML cells work perfectly.
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
  theme.css
```

The hidden `.astryx/` directory is generated state. The notebook remains valid if it is deleted.

## `astryx.toml`

Only config belongs here.

```toml
title = "Button Lab"
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

** 010 Start

*** 010.010 Welcome.md
# Welcome

*** 010.020 Card.html
<ax-card>
  <ax-title>Hello</ax-title>
</ax-card>
```

## Numbering

Use gapped section/cell numbers.

```txt
010          section
010.010      first cell in section
010.020      second cell
010.030      third cell
```

This lets the app insert between cells later:

```txt
010.010
010.015 inserted cell
010.020
```

## v0 cell types

```txt
.md      markdown note cell
.html    rendered HTML island
.json    formatted data cell
.css     optional custom CSS cell, supported but not default
```

Future:

```txt
.ts      Bun TypeScript logic cell
.tsx     TypeScript component cell
.bench   benchmark recipe
```

## Built-in HTML primitives

Astryx owns the default visual system. HTML cells can use custom tags styled by the renderer:

```html
<ax-card>
<ax-panel>
<ax-stack>
<ax-row>
<ax-grid>
<ax-title>
<ax-subtitle>
<ax-text>
<ax-muted>
<ax-badge>
<ax-button>
<ax-code>
```

Example:

```html
<ax-card>
  <ax-badge>Preview</ax-badge>
  <ax-title>Revenue</ax-title>
  <ax-text>$18,240 this month</ax-text>
  <ax-button>Open</ax-button>
</ax-card>
```

## Rendering

For `.html` cells:

```txt
cell HTML
+ built-in reset CSS
+ built-in theme CSS
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
TSX compilation
WASM build pipeline
cloud execution
multi-user state
full IDE extension
```

Those can come later only after the notebook shell feels good.
