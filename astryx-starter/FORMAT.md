# Astryx Source Format

Astryx source files are simple star-block documents.

## Header

```astryx
* astryx 0.1
```

The header identifies the file as an Astryx notebook.

## Sections

```astryx
** 010 Start
```

Parsed as:

```json
{
  "id": "010",
  "title": "Start"
}
```

## Cells

```astryx
*** 010.020 Card.html
<ax-card>
  <ax-title>Hello</ax-title>
</ax-card>
```

Parsed as:

```json
{
  "id": "010.020",
  "filename": "Card.html",
  "title": "Card",
  "ext": "html",
  "body": "<ax-card>..."
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
section: 010
cell:    010.020
```

The parser rejects invalid IDs.

## Supported v0 extensions

```txt
.md
.html
.json
.css
```

Unknown extensions are shown as plain text.
