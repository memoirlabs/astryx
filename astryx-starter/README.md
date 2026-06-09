# Astryx Starter

Astryx is a small local-first TypeScript notebook prototype for UI cells, component mockups, data previews, and later component benchmarking.

This starter intentionally begins with the smallest buildable thing:

```txt
Bun local host
+ browser notebook shell
+ vertical cell feed
+ built-in Astryx visual primitives
+ HTML / Markdown / JSON cells
+ export HTML
+ optional screenshot PNG through Playwright
```

No Docker. No Jupyter protocol. No TSX compiler yet. No Astro yet. No WASM.

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

## Starter source example

```astryx
* astryx 0.1

** 010 Start

*** 010.010 Welcome.md
# Button Lab

Write notes and cells below.

*** 010.020 Card.html
<ax-card>
  <ax-badge>Preview</ax-badge>
  <ax-title>Hello Astryx</ax-title>
  <ax-text>No custom CSS required.</ax-text>
  <ax-row>
    <ax-button>Primary</ax-button>
    <ax-button variant="ghost">Secondary</ax-button>
  </ax-row>
</ax-card>

*** 010.030 Data.json
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
2. `.css` cells and optional notebook `theme.css`.
3. `.ts` cells run by Bun.
4. `.tsx` cells compiled by Bun/Vite.
5. `.bench` cells for mount time, heap, JS size, screenshot, and viewport tests.
6. Tauri wrapper after the web shell feels good.

## Extra docs

```txt
START_HERE.md
SPEC.md
FORMAT.md
IMPLEMENTATION.md
VERSIONS.md
docs/FILE_MANIFEST.md
docs/PRIMITIVES.md
docs/RUNTIME.md
docs/SCREENSHOTS_AND_EXPORTS.md
docs/NEXT_STEPS.md
docs/FULL_SPEC_SHORT.md
```
