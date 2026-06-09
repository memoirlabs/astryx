# Screenshots and Exports

## Export HTML

Every `.html` cell gets an **Export HTML** button.

The server writes:

```txt
notebooks/<name>/out/<cell-id>-<cell-title>.html
```

The exported HTML includes:

```txt
Astryx reset CSS
Astryx built-in theme CSS
optional notebook CSS cells
cell HTML body
```

## Screenshot PNG

Every `.html` cell also gets a **Screenshot PNG** button.

It uses Playwright if available.

Install browser support:

```bash
bun run screenshots:install
```

Then click **Screenshot PNG**.

The server writes:

```txt
notebooks/<name>/out/<cell-id>-<cell-title>.png
```

If Playwright is unavailable, the API returns an error. Export HTML still works.
