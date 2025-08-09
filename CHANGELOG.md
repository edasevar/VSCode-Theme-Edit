# Changelog
All notable changes to the Theme Lab extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.6.0] - 2025-08-09

### 🔧 Color Rules & Live Preview
- Normalize `#RRGGBBAA` to `rgba(r,g,b,a)` for workbench, TextMate, and semantic token colors during live preview.
- TextMate `fontStyle` normalization: remove `normal`, map `underlined`→`underline`, dedupe unknowns, and enforce stable order `italic bold underline strikethrough`.
- Semantic token `fontStyle` strings converted to boolean flags `{ italic?, bold?, underline?, strikethrough? }`; `normal` sets all flags to `false`.
 - Live preview now sets `editor.semanticTokenColorCustomizations.enabled: true` when applying rules so semantic token colors take effect immediately.
 - Added setting `themeLab.semanticTokensEnabled` and command `Theme Lab: Toggle Semantic Token Colors` to control whether semantic token colors are enabled during live preview.

### 🛡️ Webview Robustness
- Guarded `postMessage` calls in `media/app.js` to avoid runtime errors if VS Code API is unavailable.

### 🧹 Maintenance
- Cleaned `package.json` (removed invalid JSON comment). Reverted `type: module` to keep Mocha tests working under CommonJS.
- Lint/build/tests: all pass (8 tests green).

## [1.5.0] - 2025-01-08

### ✨ Major UI/UX Enhancements
- **Redesigned Interface**: Complete visual overhaul with modern, VS Code-styled design
- **Enhanced Buttons**: New gradient buttons with hover effects and better visual hierarchy
- **Improved Dropdowns**: Fixed and enhanced dropdown styling with custom arrow indicators
- **Interactive Tooltips**: Comprehensive help system with contextual tooltips on all UI elements
- **Better Live Preview**: Enhanced live preview toggle with visual feedback and improved reliability
- **Enhanced Color Editing**: Improved color input fields with better validation and user guidance
- **Modern Tabs**: Redesigned sidebar tabs with better visual states and animations
- **Refined Typography**: Better font hierarchy and improved readability throughout
- **Visual Feedback**: Added loading indicators, success animations, and interactive states
- **Help System**: Added help icons and comprehensive tooltips to guide users through the interface

### 🔧 Technical Improvements
- Fixed dropdown event handling and styling issues
- Enhanced live preview functionality with better error handling
- Improved color picker integration with better visual feedback
- Enhanced search and filter functionality with better UX
- Better responsive layout with improved spacing and alignment

### 🎨 Design Enhancements
- Modern card-based layout for preview sections with hover effects
- Enhanced color coding for different UI elements
- Better visual hierarchy with improved spacing and typography
- Smooth animations and transitions throughout the interface
- Consistent iconography and visual language

## [1.4.1] - 2025-08-08

### 🔧 Bug Fixes and Development Experience Improvements

This maintenance release focuses on fixing critical development issues, improving code quality, and ensuring robust extension functionality.

#### 🐛 Fixed
- **VS Code API Compatibility**:
  - Fixed deprecated `extensionUri` usage, replaced with `extensionPath` for better compatibility
  - Replaced `workspace.fs` API calls with Node.js `fs` module for more reliable file operations
  - Fixed async/sync API usage inconsistencies that could cause runtime errors
- **Dependency Issues**:
  - Removed conflicting old `vscode` dependency that was causing TypeScript compilation errors
  - Fixed over 15 TypeScript compilation errors related to missing VS Code API definitions
  - Resolved WebView API compatibility issues (`asWebviewUri`, `cspSource`)
- **Testing Infrastructure**:
  - Fixed test compilation configuration that was preventing tests from running
  - Corrected test file paths and template asset resolution
  - Fixed TypeScript configuration inheritance issues in `tsconfig.tests.json`
- **Build System**:
  - Updated ESLint to modern v9+ configuration format (from deprecated `.eslintrc.json`)
  - Fixed ESLint configuration to properly handle TypeScript, browser globals, and test environments
  - Added proper TypeScript ESLint parser and plugins

#### ✨ Improved
- **Code Quality**:
  - Reduced linting issues from 100+ errors to only 13 minor warnings
  - All warnings are now related to acceptable `any` type usage for VS Code API integration
  - Added comprehensive ESLint rules for different file contexts (source, tests, webview)
- **Testing**:
  - All 8 unit tests now passing consistently
  - Fixed template parser test asset resolution
  - Improved test reliability and error reporting
- **Development Experience**:
  - Clean builds with zero TypeScript compilation errors
  - Proper source map generation for debugging
  - Modern ESLint configuration with better developer experience
  - Fixed all Node.js and browser environment conflicts

#### 🏗️ Technical Improvements
- **File System Operations**:
  - More reliable file operations using Node.js `fs.promises` API
  - Better error handling for asset loading and template parsing
  - Improved cross-platform file path handling
- **Extension Packaging**:
  - Cleaned up package.json dependencies for smaller bundle size
  - Proper main entry point configuration
  - Removed unused and conflicting dependencies
- **TypeScript Configuration**:
  - Fixed module resolution and compilation targets
  - Proper source map generation for better debugging
  - Resolved type definition conflicts

#### 📋 Development Notes
- **Prerequisites**: VS Code 1.102.0+ (unchanged)
- **Build Status**: ✅ Zero compilation errors
- **Test Status**: ✅ All tests passing
- **Lint Status**: ✅ Clean (only minor acceptable warnings)
- **Bundle Size**: Reduced by removing unnecessary dependencies

This release ensures the extension builds cleanly, tests reliably, and integrates properly with VS Code's APIs while maintaining all existing functionality.

---

## [1.4.0] - 2025-08-08

### ✨ Major UI and Feature Enhancements

This version introduces significant user interface improvements, advanced validation, theme bundling capabilities, and enhanced user experience features.

#### 🆕 Added
- **Enhanced User Interface**:
  - Tabbed interface with Preview, Problems, and Diff tabs
  - Visual color picker with alpha slider and color swatches
  - Undo/Redo functionality with keyboard shortcuts (Ctrl/Cmd+Z, Ctrl/Cmd+Y)
  - Enhanced preview with mock UI elements (buttons, inputs, tabs, explorer, problems panel)
- **Theme Bundling System**:
  - Collect multiple themes into bundles
  - Export bundles as multi-theme VSIX packages
  - Bundle counter showing current number of collected themes
  - Bundle management with add/clear functionality
- **Advanced Validation**:
  - Real-time color validation engine
  - Problems panel showing invalid colors and unknown keys
  - Visual indicators for validation issues
  - Template-based key validation against known VS Code color keys
- **Persistent State Management**:
  - Automatic saving and restoration of theme state
  - Persistent UI state (live preview toggle, filter settings, selected keys)
  - Bundle state persistence across sessions
  - Global state storage using VS Code's extension context
- **Enhanced Color Support**:
  - Interactive color picker overlay
  - Visual color swatches for quick selection
  - Alpha channel slider for precise transparency control
  - Hex color input with #RRGGBBAA support

#### 🏗️ Architecture Improvements
- **New Core Modules**:
  - `storage.ts`: Comprehensive state management system
  - `validation.ts`: Color validation and problem detection
  - `bundleModel.ts`: Theme bundle collection and management
  - `vsixBundleExporter.ts`: Multi-theme VSIX export functionality
- **Enhanced UI Components**:
  - Tabbed interface implementation
  - Modal color picker overlay
  - Problems panel with detailed validation results
  - Enhanced preview cards with better mock elements
- **Improved WebView**:
  - Better Content Security Policy configuration
  - Enhanced HTML structure with modern layout
  - Interactive elements with proper event handling
  - Responsive design improvements

#### 🔧 Technical Enhancements
- **State Management**:
  - `UiState` interface for UI preferences
  - `StoredState` interface for comprehensive state storage
  - Automatic state synchronization between UI and storage
- **Validation System**:
  - Real-time color format validation
  - Unknown color key detection
  - Problem reporting with detailed error information
- **Bundle System**:
  - `ThemeBundle` class for theme collection
  - Automatic theme deduplication with timestamp suffixes
  - Bundle export with proper package.json generation
  - README.md auto-generation for bundle packages

#### 📱 User Experience Improvements
- **Visual Feedback**:
  - Bundle counter pill showing collected themes count
  - Success messages for bundle operations
  - Enhanced button states and interactions
- **Keyboard Support**:
  - Undo/Redo keyboard shortcuts
  - Proper focus management in modal dialogs
- **Layout Enhancements**:
  - Better spacing and typography
  - Improved responsive layout
  - Enhanced visual hierarchy

#### 🐛 Fixed
- **UI Responsiveness**: Better handling of large theme files
- **State Synchronization**: Proper state updates between UI components
- **Memory Management**: Improved cleanup of event listeners and resources
- **Color Picker**: Better color format handling and validation

---

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

## Release Notes

### Version 1.2.0 Highlights

This update significantly enhances the Theme Lab experience with professional-grade features:

1. **Theme Bundling**: Create collections of related themes and export them as single extension packages
2. **Advanced Validation**: Real-time problem detection with detailed error reporting
3. **Enhanced UI**: Tabbed interface with dedicated preview, problems, and diff views
4. **Visual Color Picker**: Interactive color selection with alpha channel support
5. **Persistent State**: Automatic saving and restoration of all work across sessions
6. **Better UX**: Undo/redo support, improved navigation, and enhanced visual feedback

### Migration from 1.1.0

All existing functionality is preserved with enhancements:

1. **Automatic Migration**: Existing themes are automatically migrated to new storage system
2. **Enhanced Features**: All previous features now work better with improved validation and UI
3. **New Capabilities**: Explore theme bundling and advanced color picker features
4. **Better Performance**: More responsive interface with optimized state management

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
[1.5.0]: https://github.com/edasevar/VSCode-Theme-Edit/releases/tag/v1.5.0
[1.6.0]: https://github.com/edasevar/VSCode-Theme-Edit/releases/tag/v1.6.0
[1.4.1]: https://github.com/edasevar/VSCode-Theme-Edit/releases/tag/v1.4.1
[1.4.0]: https://github.com/edasevar/VSCode-Theme-Edit/releases/tag/v1.4.0
[1.2.0]: https://github.com/edasevar/VSCode-Theme-Edit/releases/tag/v1.2.0
[1.1.0]: https://github.com/edasevar/VSCode-Theme-Edit/releases/tag/v1.1.0
[1.0.0]: https://github.com/edasevar/VSCode-Theme-Edit/releases/tag/v1.0.0
