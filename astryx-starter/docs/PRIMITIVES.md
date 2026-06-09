# Astryx Built-in Visual Primitives

Astryx owns default notebook rendering. Users should not need CSS for normal notebooks.

HTML cells can use these tags:

```html
<ax-card>
<ax-panel>
<ax-stack>
<ax-row>
<ax-grid>
<ax-title>
<ax-subtitle>
<ax-text>
<ax-muted>
<ax-badge>
<ax-button>
<ax-code>
```

## Example

```html
<ax-card>
  <ax-badge>Preview</ax-badge>
  <ax-title>Hello Astryx</ax-title>
  <ax-text>This is styled automatically.</ax-text>
  <ax-row>
    <ax-button>Primary</ax-button>
    <ax-button variant="ghost">Secondary</ax-button>
  </ax-row>
</ax-card>
```

## Why custom tags

They make cells cleaner than class-heavy HTML:

```html
<div class="card"><h1 class="title">...</h1></div>
```

The notebook source stays readable and Astryx can change the styling under the hood.

## Custom CSS

Supported, but not default:

```astryx
*** 010.040 Overrides.css
ax-card {
  max-width: 480px;
}
```

CSS cells are injected after the built-in theme.
