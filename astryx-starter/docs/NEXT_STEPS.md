# Next Steps

Build only in this order.

## v0.1: notebook editing

```txt
cell insert
cell delete
cell rename
cell move up/down
renumber helper
```

## v0.2: TypeScript cells

```txt
.ts cells
Bun evaluation
text/json/table output
no hidden mutable notebook state yet
```

## v0.3: TSX/component cells

```txt
.tsx cells
Bun/Vite transform
iframe component render
React adapter first
```

## v0.4: benchmark cells

```txt
.bench cells
mount time
screenshot
heap estimate
viewport matrix
```

## v0.5: desktop wrapper

```txt
Tauri shell
same web UI
same Bun/core code where possible
```

Do not add remote execution, collaboration, Docker, or Jupyter compatibility until the local notebook experience is excellent.
