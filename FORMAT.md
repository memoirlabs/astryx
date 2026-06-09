# Astryx Source Format

This describes the current prototype source format. The target direction is a Markdown-native `notebook.md` described in [MASTER.md](/Volumes/T9/cursor/astryx/MASTER.md).

Astryx source files are simple star-block documents.

## Header

```astryx
* astryx 0.1
```

The header identifies the file as an Astryx notebook.

## Sections

```astryx
** Start
```

Parsed as:

```json
{
  "id": "000",
  "title": "Start"
}
```

## Cells

```astryx
*** 001 Card.html
<main>
  <h1>Hello</h1>
</main>
```

Parsed as:

```json
{
  "id": "001",
  "filename": "Card.html",
  "title": "Card",
  "ext": "html",
  "body": "<main>..."
}
```

## Parser rule

```txt
A line beginning with `* ` is a notebook marker.
A line beginning with `** ` is a section.
A line beginning with `*** ` is a cell.
Everything after a cell header belongs to that cell until the next star header.
```

## Supported IDs

```txt
cell: 000
cell: 001
cell: 002
```

Cell IDs are global within the notebook source and count upward. Legacy `010.020` IDs are still accepted for old notebooks.

## Supported v0 extensions

```txt
.md
.html
.css
.ts
.json
```

Unknown extensions are shown as plain text.
