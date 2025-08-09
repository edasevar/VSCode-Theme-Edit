# Theme Lab — Project Memory

Last updated: 2025-08-09

## Tech stack
- VS Code extension (engines.vscode ^1.102.0)
- TypeScript 5.9, Mocha tests, ESLint v9, Prettier
- Webview UI (media/app.html, app.js, app.css)

## Key decisions & changes (v1.6.0)
- Live preview normalization
  - Convert #RRGGBBAA -> rgba(r,g,b,a) for workbench, TextMate, and semantic token colors.
  - TextMate fontStyle normalization: remove "normal", map "underlined"->"underline", dedupe, enforce order `italic`, `bold`, `underline`, `strikethrough`.
  - Semantic token fontStyle strings converted to boolean flags { italic?, bold?, underline?, strikethrough? } with "normal" => all false.
- Webview robustness: Guarded vscode.postMessage in media/app.js to avoid runtime errors when VS Code API is unavailable.
 - Live preview applies semantic token customizations with `enabled: true` so boolean style flags/foregrounds are active.
- package.json: Removed invalid JSON comment; reverted "type": "module" to keep Mocha tests working under CommonJS.

## Current status
- Build: PASS (tsc -p tsconfig.build.json)
- Tests: PASS (8/8)
- Lint: No errors; a few acceptable no-explicit-any warnings in color.ts and currentThemeImporter.ts.

## Files touched
- src/core/livePreview.ts: color and fontStyle normalization logic.
- media/app.js: safe post() wrapper.
- README.md: documented color rules & examples.
- CHANGELOG.md: added 1.6.0 entry.
- package.json: cleanup and CJS module mode.

## How live preview writes settings
- workbench.colorCustomizations: normalized color map
- editor.tokenColorCustomizations: { textMateRules, semanticHighlighting: true }
- editor.semanticTokenColorCustomizations: { rules: mappedFlags }
- On reset: previous values restored

## Known TODOs / Next steps
- Add unit tests for fontStyle normalization and semantic mapping.
- Tighten types to remove remaining any warnings.
- Optionally re-enable ESM (type: module) by migrating tests to ESM or using .cjs outputs for tests.

## Reference snippets
- TextMate example:
  - Input: fontStyle: "italic underlined normal" -> Output: "italic underline"
- Semantic example:
  - Input: { fontStyle: "bold underlined", foreground: "#ffffffaa" }
  - Output: { bold: true, underline: true, foreground: "rgba(255,255,255,0.667)" }
