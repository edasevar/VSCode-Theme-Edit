# Changelog

All notable changes to the Theme Lab extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-08-08

### 🎉 Major Rewrite & Rebranding

This version represents a complete rewrite of the extension with significant improvements across all areas.

#### ✨ Added
- **New Name**: Rebranded from "VS Code Theme Designer" to "Theme Lab"
- **Advanced Color Support**: Full `#RRGGBBAA` alpha channel support with automatic conversion to `rgba()` format
- **Comprehensive Import System**:
  - Import current active theme
  - Import from JSON/JSONC files with comment support
  - Import from VSIX extension packages
- **Multiple Export Formats**:
  - JSON: Standard VS Code theme format
  - CSS: CSS variables with `--vscode-*` prefixes
  - VSIX: Packaged installable extension
- **Enhanced UI**:
  - Modern webview-based interface
  - Categorized color organization
  - Live search and filtering
  - Element navigation and preview
- **Template System**:
  - Comprehensive JSONC template with 2500+ color definitions
  - Inline descriptions for all color keys
  - Automatic categorization by UI sections
- **Live Preview**: Real-time theme application using VS Code's customization APIs
- **TypeScript Architecture**:
  - Complete rewrite in TypeScript
  - Modular, testable code structure
  - Comprehensive type definitions
  - Unit test coverage

#### 🏗️ Architecture Changes
- **New Modular Structure**:
  - `src/core/`: Core functionality modules
  - `src/panels/`: UI components
  - `src/core/exporters/`: Export format handlers  
  - `src/core/importers/`: Import source handlers
- **Build System Updates**:
  - Separate build and test configurations
  - ESLint and Prettier integration
  - Proper TypeScript compilation pipeline
- **Testing Infrastructure**:
  - Unit tests for core functionality
  - Mocha test framework
  - Color normalization test coverage

#### 🔧 Technical Improvements
- **Color Processing**:
  - Robust color normalization utilities
  - Alpha channel support with proper conversion
  - Type-safe color manipulation
- **Theme Model**:
  - Complete TypeScript definitions
  - Semantic token support
  - TextMate rule handling
- **Template Parser**:
  - JSONC parsing with comment extraction
  - Automatic categorization from section headers
  - Description mapping from inline comments
- **Live Preview System**:
  - Configuration-based preview using `workbench.colorCustomizations`
  - Semantic token customization support
  - Proper cleanup on disposal

#### 📦 Dependencies
- **Added**:
  - `adm-zip`: VSIX file handling
  - `jsonc-parser`: JSONC parsing support
  - `eslint`: Code linting
  - `prettier`: Code formatting
  - `mocha`: Testing framework
  - `rimraf`: Build cleanup
- **Removed**:
  - `jszip`: Replaced with `adm-zip`
  - `vsce`: Moved to development-time usage

#### 🗑️ Removed
- Legacy panel implementation
- Old service-based architecture  
- Obsolete import/export utilities
- Original theme state management
- CSS generation utilities (replaced with enhanced version)

#### 🔄 Changed
- **Extension Name**: "VS Code Theme Designer" → "Theme Lab"
- **Command Names**: `themeDesigner.*` → `themeLab.*`
- **Package Structure**: Reorganized for better maintainability
- **Build Output**: `out/` → `dist/` for consistency
- **Configuration**: Updated VS Code engine requirement to 1.102.0

#### 🐛 Fixed
- Color format compatibility issues
- Import/export reliability
- Live preview synchronization
- Memory leaks in webview management
- TypeScript compilation errors

---

## [1.0.0] - Previous Version

### Initial Release
- Basic theme designer functionality
- Simple color editing interface
- JSON import/export
- Limited preview capabilities

---

## Release Notes

### Version 1.1.0 Highlights

This major update transforms Theme Lab into a professional-grade theme development tool. The complete rewrite brings:

1. **Better User Experience**: Modern interface with live preview and smart organization
2. **Advanced Features**: Alpha channel support, multiple import sources, and comprehensive export options  
3. **Developer-Friendly**: Full TypeScript implementation with extensive testing
4. **Production-Ready**: Robust architecture suitable for complex theme development workflows

### Migration from 1.0.0

If upgrading from the previous version:

1. **Commands Changed**: Use `Theme Lab: Open` instead of previous commands
2. **No Data Loss**: All previous functionality is preserved with improvements
3. **Enhanced Capabilities**: Explore new import/export options and alpha color support
4. **Better Performance**: More responsive interface and reliable live preview

### Next Steps

We're committed to continuous improvement. Upcoming features include:
- Advanced color palette tools
- Theme sharing and marketplace integration
- Custom token definitions
- Collaborative editing features

Thank you for using Theme Lab! 🎨

<!-- Version Links -->
[1.1.0]: https://github.com/edasevar/VSCode-Theme-Edit/releases/tag/v1.1.0
[1.0.0]: https://github.com/edasevar/VSCode-Theme-Edit/releases/tag/v1.0.0
