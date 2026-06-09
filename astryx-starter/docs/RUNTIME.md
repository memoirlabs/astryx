# Runtime Model

Astryx v0 uses one runtime:

```txt
Bun local server + browser shell
```

No Jupyter protocol.
No Docker.
No WASM compiler.
No Astro runtime.
No per-cell Bun spawn.

## What Bun does

```txt
read notebooks from disk
parse notebook.astryx
serve the web shell
save notebook.astryx
export HTML to out/
run optional Playwright screenshots
```

## What the browser does

```txt
renders the vertical notebook feed
shows source textareas
renders markdown/json/html outputs
renders HTML cells inside iframe srcdoc previews
```

## Why this is the right v0

It gives immediate local filesystem access and a real notebook UI without a heavy kernel.

The first milestone is not arbitrary code execution. It is a good source/edit/render/export loop.
