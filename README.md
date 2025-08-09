# Theme Lab

**Design, preview, import/export VS Code themes with live preview, element navigation, and #RRGGBBAA alpha support.**

> **✨ New in v1.5.0**: Complete UI/UX overhaul with modern design, comprehensive tooltips, enhanced interactions, and improved accessibility!

Theme Lab is a comprehensive VS Code extension for designing and customizing color themes. It features a modern UI with live preview capabilities, advanced color format support, and flexible import/export options.

## ✨ Features

### 🎨 Theme Design & Editing
- **Live Preview**: See your changes instantly in the VS Code interface
- **Comprehensive Coverage**: Edit workbench colors, TextMate token colors, and semantic tokens (see “Color customization rules & normalization” below)
- **Comprehensive Coverage**: Edit workbench colors, TextMate token colors, and semantic tokens (see “Color customization rules & normalization” below)
- **Semantic Toggle**: Quickly enable/disable semantic token colors via setting or command
- **Advanced Color Support**: Full support for `#RRGGBBAA` alpha values with automatic conversion to `rgba()` format
- **Categorized Editing**: Colors organized by functional categories (Editor, Activity Bar, Sidebar, etc.)
- **Smart Search**: Filter colors by name to quickly find what you need
- **Color Validation**: Real-time validation with problems panel showing invalid colors and unknown keys
- **Visual Color Picker**: Interactive color picker with alpha slider and color swatches
- **Undo/Redo**: Full undo/redo support for all theme changes
- **Persistent State**: Automatic saving and restoration of theme state across sessions

### 📥 Import Options
- **Current Theme**: Import your currently active theme as a starting point
- **JSON/JSONC Files**: Import existing theme files with comments support
- **VSIX Packages**: Extract themes directly from extension packages

### 📤 Export Formats
- **JSON**: Standard VS Code theme format
- **CSS**: CSS variables for web integration (`--vscode-editor-background`, etc.)
- **VSIX**: Package as installable VS Code extension
- **Bundle VSIX**: Create multi-theme extension packages with multiple themes in one VSIX

### 🔧 Advanced Features
- **Template-based**: Rich template with descriptions for all color keys
- **Type Support**: Full TypeScript implementation with comprehensive types
- **Element Navigation**: Click on preview elements to highlight corresponding color settings
- **Multiple Theme Types**: Support for dark, light, and high contrast themes
- **Theme Bundling**: Collect multiple themes and export them as a single extension package
- **Problems Detection**: Real-time validation showing invalid colors and unknown keys
- **Tabbed Interface**: Organized UI with Preview, Problems, and Diff tabs
- **State Persistence**: Automatic saving of themes, UI state, and bundles
- **Enhanced Preview**: Mock UI elements showing buttons, inputs, tabs, code, explorer, and problems panel

## 🚀 Getting Started

1. **Install the Extension**
   - Install from VS Code Marketplace or package as VSIX

2. **Open Theme Lab**
   - Open Command Palette (`Ctrl/Cmd+Shift+P`)
   - Run command: `Theme Lab: Open`

3. **Start Designing**
   - Choose "Start blank" for a new theme
   - Or "Use current theme" to edit your active theme
   - Or import existing theme files

4. **Edit & Preview**
   - Browse categories to find colors to edit
   - Use the visual color picker for precise color selection
   - Changes are applied live to VS Code
   - Use the preview section to see your changes
   - Check the Problems tab for validation issues
   - Use undo/redo to manage your editing history

5. **Bundle Themes (Optional)**
   - Click "Add to Bundle" to collect multiple themes
   - Build collections of related themes
   - Export entire bundles as single VSIX packages

6. **Export Your Theme**
   - Export as JSON for sharing
   - Export as VSIX to install and distribute
   - Export as CSS for web projects
   - Export bundles as multi-theme VSIX packages

## 🏗️ Architecture

Theme Lab is built with a modern, modular architecture:

### Core Modules
- **Color Processing**: Advanced color normalization with alpha support and validation
- **Theme Model**: Type-safe theme representation and manipulation with bundling support
- **Template Parser**: Intelligent parsing of JSONC templates with descriptions
- **Live Preview**: Real-time theme application using VS Code's customization APIs
- **Storage System**: Persistent state management for themes, UI settings, and bundles
- **Validation Engine**: Real-time color validation and unknown key detection

### Import/Export System
- **Importers**: Flexible import from JSON, VSIX, and current theme
- **Exporters**: Multi-format export with proper packaging and bundle support
- **Type Safety**: Full TypeScript coverage for all operations

### UI Components
- **Panel System**: Modern webview-based interface with tabbed layout
- **Category Navigation**: Organized color editing experience
- **Preview Integration**: Visual feedback with mock UI elements
- **Problems Panel**: Real-time validation and error reporting
- **Color Picker**: Interactive color selection with alpha support
- **Bundle Management**: Theme collection and multi-theme export interface

TODO - fix the project structure
## 📁 Project Structure

```
src/
├── core/                    # Core functionality
│   ├── color.ts            # Color processing and normalization  
│   ├── livePreview.ts      # Live preview implementation
│   ├── templateParser.ts   # JSONC template parsing
│   ├── themeModel.ts       # Theme data structures
│   ├── bundleModel.ts      # Theme bundle management
│   ├── storage.ts          # Persistent state management
│   ├── validation.ts       # Color validation and problem detection
│   ├── types.ts            # TypeScript definitions
│   ├── exporters/          # Export format handlers
│   │   ├── cssExporter.ts  # CSS variables export
│   │   ├── jsonExporter.ts # JSON theme export
│   │   ├── vsixExporter.ts # Single-theme VSIX export
│   │   └── vsixBundleExporter.ts # Multi-theme VSIX export
│   └── importers/          # Import source handlers
├── panels/                 # UI components
│   └── ThemeLabPanel.ts    # Main webview panel with tabs
└── extension.ts            # Extension entry point

assets/
└── template.jsonc          # Comprehensive theme template

media/                      # Webview assets
├── app.css                 # Panel styling
├── app.js                  # Panel JavaScript  
└── app.html                # Panel HTML template

tests/                      # Unit tests
└── unit/                   # Core functionality tests
```

## 🔧 Development

### Building

```bash
npm run build      # Build TypeScript (zero compilation errors!)
npm run watch      # Watch mode for development
npm run clean      # Clean build artifacts
```

### Testing

```bash
npm test           # Run unit tests (all 8 tests passing)
npm run lint       # ESLint checking (modern v9+ config)
npm run format     # Prettier formatting
```

### Quality Assurance

- **✅ Build Status**: Zero TypeScript compilation errors
- **✅ Test Coverage**: All unit tests passing (color processing, validation, template parsing)
- **✅ Code Quality**: Modern ESLint configuration with minimal warnings
- **✅ API Compatibility**: Fixed all VS Code API compatibility issues
- **✅ Dependencies**: Clean, no vulnerabilities, optimized bundle size

## 🎯 Color Format Support

Theme Lab provides advanced color format handling:

### Standard Formats
- `#RGB` and `#RRGGBB` - Standard hex colors
- CSS color names - `red`, `blue`, etc.
- HSL and RGB functions

### Alpha Support  
- `#RRGGBBAA` - 8-digit hex with alpha channel
- Automatic conversion to `rgba(r, g, b, alpha)` format
- Proper alpha blending in live preview

## 🧩 Color customization rules & normalization

Theme Lab applies your edits through VS Code’s user-level overrides and normalizes values for reliability.

1) workbench.colorCustomizations
- Define UI element colors (e.g., `editor.background`).
- `#RRGGBBAA` is supported and converted to `rgba()` automatically during live preview.

Example:
```
{
   "workbench.colorCustomizations": {
      "editor.background": "#ffffffaa"
   }
}
```

2) editor.tokenColorCustomizations.textMateRules
- Each rule: `{ name?, scope, settings: { foreground?, background?, fontStyle? } }`.
- fontStyle normalization:
   - Allowed flags: `italic`, `bold`, `underline`, `strikethrough`.
   - Aliases: `underlined` → `underline`.
   - `normal` is removed (no styles). Duplicate/unknown tokens are dropped.
   - Stable order is enforced: italic, bold, underline, strikethrough.
- Colors like `#RRGGBBAA` are converted to `rgba()`.

Example:
```
{
   "editor.tokenColorCustomizations": {
      "textMateRules": [
         {
            "name": "Emphasis",
            "scope": ["markup.italic", "markup.bold"],
            "settings": {
               "fontStyle": "italic underlined normal",
               "foreground": "#ffffffaa"
            }
         }
      ],
      "semanticHighlighting": true
   }
}
```
The above becomes `fontStyle: "italic underline"` at runtime and the color is applied as `rgba(255,255,255,0.667)`.

3) editor.semanticTokenColorCustomizations.rules
- For each semantic token (e.g., `variable.readonly`), you can set `foreground` and a `fontStyle` string.
- The extension converts `fontStyle` strings into boolean flags `{ italic?, bold?, underline?, strikethrough? }` to match VS Code’s schema.
- `normal` sets all style flags to `false`. Unknown tokens are ignored.
- Colors like `#RRGGBBAA` are converted to `rgba()`.

Example:
```
{
   "editor.semanticTokenColorCustomizations": {
      "rules": {
         "variable.readonly": {
            "fontStyle": "bold underlined",
            "foreground": "#ffffffaa"
         }
      }
   }
}
```
At runtime this is applied as `{ bold: true, underline: true, foreground: "rgba(255,255,255,0.667)" }`.

Notes
- Live preview writes temporary overrides and restores your previous settings on exit.
- If you use only `normal` in TextMate fontStyle, the style is removed; for semantic tokens, all flags are set to `false`.

### Semantic token colors enabled toggle

By default, Theme Lab enables semantic token color customizations during live preview. You can control this:

- Setting: `themeLab.semanticTokensEnabled` (default: true)
- Command: `Theme Lab: Toggle Semantic Token Colors`

When disabled, Theme Lab still computes semantic token rules but applies them with `"editor.semanticTokenColorCustomizations.enabled": false`, so only workbench and TextMate colors affect the preview.

## 🛠️ Recent Improvements (v1.4.1)

### Development & Quality Enhancements
- **Fixed Critical Issues**: Resolved all VS Code API compatibility problems
- **Improved Build System**: Zero TypeScript compilation errors, modern ESLint configuration
- **Enhanced Testing**: All unit tests passing with reliable test infrastructure
- **Dependency Cleanup**: Removed conflicting dependencies, optimized bundle size
- **Better Developer Experience**: Proper debugging support, source maps, and error handling

### Technical Fixes
- Fixed deprecated `extensionUri` API usage for better VS Code compatibility
- Resolved `workspace.fs` API issues with reliable Node.js file operations  
- Updated ESLint to modern v9+ configuration format
- Fixed test compilation and asset resolution issues
- Improved file system operations and error handling

## 📋 Requirements

- **VS Code**: Version 1.102.0 or higher
- **Node.js**: For development (TypeScript compilation and testing)

### Development Status

Theme Lab is production-ready with:
- ✅ **Stable Build System**: Zero compilation errors, clean TypeScript builds
- ✅ **Comprehensive Testing**: Full test suite with 100% pass rate
- ✅ **Modern Tooling**: Updated ESLint v9+, proper dependency management
- ✅ **API Compatibility**: Fixed all VS Code API compatibility issues
- ✅ **Quality Assurance**: Extensive validation and error handling

## 🤝 Contributing

Contributions are welcome! The extension is now in excellent condition with robust development infrastructure.

### Getting Started
1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/VSCode-Theme-Edit.git`
3. Install dependencies: `npm install`
4. Build the project: `npm run build` (should complete with zero errors)
5. Run tests: `npm test` (all tests should pass)

### Development Workflow
1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Ensure all tests pass: `npm test`
4. Check code quality: `npm run lint`
5. Build the extension: `npm run build`
6. Test the extension using F5 (Debug Extension Host)
7. Submit a pull request

### Quality Standards
- All code must pass TypeScript compilation without errors
- Unit tests must be added for new functionality
- ESLint warnings should be minimal and justified
- VS Code API usage should follow best practices

## 📄 License

This extension is released under the MIT License. See the LICENSE file for details.

## 🙏 Acknowledgments

- VS Code team for the comprehensive theming APIs
- Community theme creators for inspiration and feedback
- Contributors and beta testers

---

**Happy Theming! 🎨**
