# Theme Lab (VS Code Extension)

Design, preview, and export VS Code themes with live preview and token/semantic editing.

## Features
- Live theme preview while editing
- Import from VSIX or theme JSON
- Start from a blank theme or use the current theme as a base
- Export finalized themes
  
### Security & Accessibility
- Webview uses a per-panel CSP nonce for scripts and limits sources to the webview’s origin.
- Inputs include title attributes for better accessibility. 
- The inlined template is provided as application/json to avoid JS injection.

## Commands
- Theme Lab: Open (`theme-lab.open`)
- Theme Lab: Import VSIX (`theme-lab.importVsix`)
- Theme Lab: Import Theme JSON (`theme-lab.importJson`)
- Theme Lab: Start Blank Theme (`theme-lab.startBlank`)
- Theme Lab: Use Current Theme (`theme-lab.useCurrent`)

## Setting
- `theme-lab.preview.applyToWorkspace` (boolean, default: true)
	- Apply live preview by writing to workspace settings (recommended). If off, uses global settings.

## Requirements
- VS Code ^1.102.0

## Develop locally
- Install: npm install
- Build once: npm run compile
- Watch: npm run watch
- Package VSIX: npm run package (uses vsce)
- Launch: Run the "Run Extension" debug configuration in VS Code

### Template format flexibility
- Colors: flat map or grouped categories supported.
- tokenColors: array or grouped object supported.
- semanticTokenColors: either { types, modifiers } or a flat map is supported.

## Changelog
See CHANGELOG.md for updates.

---
Update (2025-08-09): Added README, initialized CHANGELOG, and populated project memory.
