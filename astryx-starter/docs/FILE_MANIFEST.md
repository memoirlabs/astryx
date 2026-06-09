# File Manifest

## Root

```txt
package.json       Bun scripts and dependencies
tsconfig.json      TypeScript config
README.md          overview and quick start
START_HERE.md      fastest entry point
SPEC.md            v0 product/spec decisions
FORMAT.md          notebook.astryx source format
IMPLEMENTATION.md  implementation notes
VERSIONS.md        version roadmap
```

## scripts/

```txt
new-notebook.ts    creates a fresh notebook folder
```

## src/core/

```txt
model.ts           shared notebook types
config.ts          tiny TOML parser and config normalizer
parse.ts           star-block parser for notebook.astryx
theme.ts           built-in Astryx preview theme and ax-* primitives
markdown.ts        tiny markdown renderer
render.ts          HTML iframe document renderer and export filenames
```

## src/server/

```txt
index.ts           Bun HTTP server, notebook APIs, export and screenshot endpoints
```

## src/web/

```txt
index.html         web shell document
app.ts             browser notebook UI
style.css          shell styling only, not notebook styling
```

## notebooks/

```txt
empty/             default minimal starter notebook
button-lab/        example component/mockup notebook
```

Each notebook has:

```txt
astryx.toml        notebook config
notebook.astryx    source cells
data/              user input files
out/               generated outputs
```
