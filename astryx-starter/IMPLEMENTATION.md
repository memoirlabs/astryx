# Astryx Implementation Notes

## Shell

The v0 shell is a Bun-served web page.

```txt
bun run dev
http://localhost:7331
```

Bun owns filesystem access. The browser owns UI rendering.

## Server responsibilities

```txt
list notebooks
read config
read source
parse source
save source
export HTML
screenshot HTML if Playwright exists
```

## Browser responsibilities

```txt
show notebook list
show vertical feed
edit cell bodies
render previews
call export/screenshot APIs
save notebook source
```

## Why Bun local server first

A pure browser app requires File System Access API and awkward persistence rules. A Bun local server is simpler:

```txt
real files
real TypeScript
real local output folder
same UI can move to Tauri later
```

## Why HTML first

HTML cells prove the product shape without solving TypeScript compilation, package resolution, React rendering, or benchmarks.

```txt
HTML cell + built-in ax-* primitives + iframe = immediate useful notebook
```

## Why no default CSS file

The default notebook should look good without author CSS. CSS can come later as:

```txt
theme.css
.css cells
```

## Screenshot strategy

Screenshots are server-side through Playwright. HTML is rendered into a real Chromium page and captured to `out/`.

If Playwright is missing, the screenshot API returns a clear error and export HTML still works.
