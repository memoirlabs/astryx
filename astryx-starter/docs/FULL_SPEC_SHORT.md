# Astryx Short Spec

## Shape

```txt
notebooks/<name>/
  astryx.toml
  notebook.astryx
  data/
  out/
```

## Source hierarchy

```txt
*      notebook marker
**     section
***    cell
****   reserved
```

## Numbering

```txt
010          section
010.010      cell
010.020      cell
```

## v0 cells

```txt
.md      markdown
.html    rendered island
.json    data preview
.css     optional theme override
```

## Built-in rendering

```txt
HTML cell
+ Astryx reset/theme/primitives
+ optional CSS cells
= iframe srcdoc preview
```

## Default shell

```txt
Bun server
browser UI
vertical notebook feed
source + output per cell
export/screenshot actions
```
