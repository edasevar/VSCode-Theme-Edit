# Theme Lab

**Design, preview, import/export VS Code themes with live preview, element navigation, and #RRGGBBAA alpha support.**

Theme Lab is a comprehensive VS Code extension for designing and customizing color themes. It features a modern UI with live preview capabilities, advanced color format support, and flexible import/export options.

## ✨ Features

### 🎨 Theme Design & Editing
- **Live Preview**: See your changes instantly in the VS Code interface
- **Comprehensive Coverage**: Edit workbench colors, TextMate token colors, and semantic tokens
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
npm run build      # Build TypeScript
npm run watch      # Watch mode for development
```

### Testing

```bash
npm run test       # Run unit tests
npm run lint       # ESLint checking
npm run format     # Prettier formatting
```

### Commands

- `npm run clean` - Clean build artifacts
- `npm run vscode:prepublish` - Prepare for publishing

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

## 📋 Requirements

- **VS Code**: Version 1.102.0 or higher
- **Node.js**: For development (TypeScript compilation)

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality  
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

This extension is released under the MIT License. See the LICENSE file for details.

## 🙏 Acknowledgments

- VS Code team for the comprehensive theming APIs
- Community theme creators for inspiration and feedback
- Contributors and beta testers

---

**Happy Theming! 🎨**
