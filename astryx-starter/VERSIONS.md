# Astryx Version Plan

## v0.0 — HTML Notebook Shell

Purpose: prove the notebook shape.

Features:

```txt
Bun server
browser shell
notebook folders
astryx.toml
notebook.astryx
vertical cell feed
.md cells
.html cells
.json cells
built-in ax-* primitives
iframe previews
save notebook
export HTML
```

No TSX. No benchmark runner. No desktop wrapper.

## v0.1 — Screenshots and Better Authoring

Features:

```txt
Playwright screenshot button
cell insert/delete/move
cell title rename
one-cell save/rewrite
optional .css cells
theme.css support
out/ file browser
```

## v0.2 — TypeScript Cells

Features:

```txt
.ts cells executed by Bun
cell output records
JSON/table outputs
data.json/data.text helpers
out.write/out.json helpers
```

Execution remains local and trusted.

## v0.3 — TSX Component Cells

Features:

```txt
.tsx cells
React adapter first
Bun/Vite transform
iframe component preview
component export
```

No Astro core yet.

## v0.4 — Bench Cells

Features:

```txt
.bench cells
mount_ms
heap_mb
screenshot
viewport matrix
simple run history
bench results saved to out/
```

## v1.0 — IDE/Desktop Ready

Features:

```txt
Tauri wrapper or IDE webview
stable file format
stable config
stable output model
optional generated .astryx/index.jsonl
project-level notebook browser
```

## Later adapters

Potential adapters:

```txt
Astro island export adapter
Svelte adapter
Solid adapter
Vue adapter
Web Component adapter
```

Astro is an adapter/export target, not the v0 kernel.
