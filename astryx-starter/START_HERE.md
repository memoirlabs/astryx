# Start Here

Astryx v0 is a local TypeScript notebook shell for frontend/UI work.

It starts intentionally small:

```txt
Bun local host
+ browser notebook UI
+ vertical cells
+ built-in ax-* visual primitives
+ HTML / Markdown / JSON cells
+ export HTML
+ optional screenshot PNG through Playwright
```

## Run it

```bash
bun install
bun run dev
```

Open:

```txt
http://localhost:7331
```

## Create a notebook

```bash
bun run new my-notebook
```

This creates:

```txt
notebooks/my-notebook/
  astryx.toml
  notebook.astryx
  data/
  out/
```

## Edit a notebook

Open the browser shell, choose the notebook from the top picker, edit any cell, then press **Save**.

HTML cells render immediately inside iframe previews.

## Export output

On an `.html` cell:

- **Export HTML** writes a standalone file to `out/`.
- **Screenshot PNG** writes a PNG to `out/` if Playwright is installed.

Install screenshot support:

```bash
bun run screenshots:install
```

## What to build next

1. Add cell insert/delete/move.
2. Add `.ts` cells using Bun.
3. Add `.tsx` cells using Bun/Vite.
4. Add `.bench` cells.
5. Add a Tauri desktop wrapper only after the web shell feels good.
