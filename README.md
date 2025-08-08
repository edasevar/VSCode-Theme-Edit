# VSCode Theme Edit Extension

A Visual Studio Code extension for designing, editing, and previewing custom themes directly in VS Code. Easily import, export, and manage your theme templates with a modern UI.

## Features
- Live theme designer panel
- Import/export theme templates
- Preview theme changes instantly
- JSONC and CSS utilities for theme manipulation

## Getting Started

### Installation
1. Clone this repository.
2. Run `npm install` to install dependencies.
3. Press `F5` in VS Code to launch the extension in a new Extension Development Host window.

### Usage
- Open the command palette (`Ctrl+Shift+P`) and search for `Theme Designer: Open Panel`.
- Use the panel to create, edit, and preview your custom themes.
- Import/export templates via the panel or the command palette.

## Project Structure
- `src/` - Extension source code
- `media/` - Webview assets (CSS, JS, HTML)
- `types/` - Shared TypeScript types
- `services/` - Theme import/export and state management
- `utils/` - Utility functions for CSS/JSONC

## Development
- Run `npm run lint` to check code style.
- Run `npm run test` to execute tests.
- Run `npm run build` to compile the extension.

## Contributing
Pull requests are welcome! Please follow the coding standards and add tests for new features.

## License
MIT

---
For more details, see the documentation in the `docs/` folder.
