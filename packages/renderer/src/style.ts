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
  font-family: system-ui, sans-serif;
}
`;

export function previewCss(customCss = ""): string {
  return [resetCss, customCss].filter(Boolean).join("\n\n");
}
