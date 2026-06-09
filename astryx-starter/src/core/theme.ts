export const resetCss = `
* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
}

body {
  min-height: 100vh;
}
`;

export const defaultThemeCss = `
:root {
  --ax-bg: #f6f6f2;
  --ax-surface: #ffffff;
  --ax-text: #151515;
  --ax-muted: #686864;
  --ax-border: #deded6;
  --ax-button-bg: #151515;
  --ax-button-text: #ffffff;
  --ax-button-border: #151515;
  --ax-radius: 14px;
  --ax-shadow: 0 18px 50px rgba(0, 0, 0, 0.10);

  --ax-space-1: 4px;
  --ax-space-2: 8px;
  --ax-space-3: 12px;
  --ax-space-4: 16px;
  --ax-space-5: 24px;
}

body {
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", sans-serif;
  background: var(--ax-bg);
  color: var(--ax-text);
  padding: var(--ax-space-4);
}

ax-card,
ax-panel,
ax-stack,
ax-row,
ax-grid,
ax-title,
ax-subtitle,
ax-text,
ax-muted,
ax-badge,
ax-button,
ax-code {
  display: block;
}

ax-card {
  max-width: 360px;
  border: 1px solid var(--ax-border);
  border-radius: var(--ax-radius);
  background: var(--ax-surface);
  padding: var(--ax-space-4);
  box-shadow: var(--ax-shadow);
}

ax-panel {
  border: 1px solid var(--ax-border);
  border-radius: var(--ax-radius);
  background: var(--ax-surface);
  padding: var(--ax-space-4);
}

ax-title {
  font-size: 22px;
  font-weight: 750;
  line-height: 1.1;
  margin-bottom: var(--ax-space-2);
}

ax-subtitle {
  color: var(--ax-muted);
  font-weight: 650;
  margin-bottom: var(--ax-space-2);
}

ax-text {
  color: var(--ax-text);
  line-height: 1.5;
  margin-bottom: var(--ax-space-3);
}

ax-muted {
  color: var(--ax-muted);
}

ax-row {
  display: flex;
  gap: var(--ax-space-2);
  align-items: center;
  flex-wrap: wrap;
}

ax-stack {
  display: flex;
  flex-direction: column;
  gap: var(--ax-space-3);
}

ax-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--ax-space-3);
}

ax-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  border: 1px solid var(--ax-button-border);
  border-radius: calc(var(--ax-radius) * 0.7);
  background: var(--ax-button-bg);
  color: var(--ax-button-text);
  padding: 8px 12px;
  font-weight: 650;
}

ax-button[variant="ghost"] {
  background: transparent;
  color: var(--ax-text);
  border-color: var(--ax-border);
}

ax-badge {
  width: fit-content;
  border: 1px solid var(--ax-border);
  border-radius: 999px;
  padding: 3px 8px;
  color: var(--ax-muted);
  font-size: 12px;
  margin-bottom: var(--ax-space-2);
}

ax-code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 13px;
  background: #111;
  color: #f6f6f2;
  border-radius: 10px;
  padding: 10px;
  white-space: pre-wrap;
}
`;

export function previewCss(customCss = ""): string {
  return [resetCss, defaultThemeCss, customCss].filter(Boolean).join("\n\n");
}
