## Project Memory: Theme Lab

Update 2025-08-09 (v0.2.0)
- Restored full webview.html with tabs/panes and preview anchors; linked stylesheets via injected URIs.
- Maintained strict CSP with per-panel nonce; removed redundant inline acquireVsCodeApi to avoid duplicate globals.
- Hardened webview.js to parse multiple template shapes (grouped/flat colors, grouped/array tokenColors, semantic tokens either types/modifiers or flat).
- Added a11y titles for color/alpha inputs.
- No public API changes; build remains green.


Date: 2025-08-09

Summary
- Initialized README with features, commands, settings, dev instructions.
- Created CHANGELOG and added 0.1.0 entry.

Metadata
- Name: theme-lab (display: Theme Lab)
- Version: 0.1.0
- Publisher: edasevar
- VS Code engine: ^1.102.0
- Icon: assets/icon.png
- Main: out/src/extension.js

Commands
- theme-lab.open — Theme Lab: Open
- theme-lab.importVsix — Theme Lab: Import VSIX
- theme-lab.importJson — Theme Lab: Import Theme JSON
- theme-lab.startBlank — Theme Lab: Start Blank Theme
- theme-lab.useCurrent — Theme Lab: Use Current Theme

Setting
- theme-lab.preview.applyToWorkspace (default: true)

Scripts
- vscode:prepublish → npm run compile
- compile → tsc -p .
- watch → tsc -w -p .
- build → npm run compile
- package → vsce package
- lint → placeholder

Dependencies
- runtime: jszip ^3.10.1, jsonc-parser ^3.3.1
- dev: @types/vscode ^1.102.0, typescript ^5.9.2, vsce ^2.15.0

Notes
- README/CHANGELOG created today. Keep CHANGELOG updated with semantic entries.


Directory Structure (auto)
<!-- DIR_TREE:START -->
```
Theme-Lab/
├─ .gitignore
├─ assets/
│  ├─ icon.png
│  └─ template.json
├─ CHANGELOG.md
├─ media/
│  ├─ preview.css
│  ├─ webview.css
│  ├─ webview.html
│  └─ webview.js
├─ package.json
├─ README.md
├─ scripts/
│  └─ update-dir-tree.js
├─ src/
│  ├─ currentTheme.ts
│  ├─ exporters.ts
│  ├─ extension.ts
│  ├─ importers.ts
│  ├─ themeState.ts
│  └─ util.ts
├─ tsconfig.json
└─ VSCodeMemory/
   └─ Theme-Lab_memory.md
```
<!-- DIR_TREE:END -->
