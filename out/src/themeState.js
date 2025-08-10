"use strict";
// Purpose: hold working theme state and map to VS Code settings format.
Object.defineProperty(exports, "__esModule", { value: true });
exports.blankTheme = blankTheme;
exports.toSettings = toSettings;
function blankTheme(name = "Theme Lab Theme", type = "dark") {
    return { name, type, colors: {}, semanticTokenColors: {}, tokenColors: [] };
}
function toSettings(state) {
    // workbench
    const workbench = state.colors;
    // semantic tokens
    const semantic = { enabled: true };
    for (const [token, def] of Object.entries(state.semanticTokenColors)) {
        if (token === "enabled")
            continue;
        semantic[token] = def;
    }
    // textMate tokens
    const textMateRules = state.tokenColors.map((r) => ({
        scope: r.scope,
        settings: r.settings,
    }));
    const tokenCustomizations = {
        textMateRules,
    };
    const editorCustomizations = {};
    const kind = state.type === "light" ? "light" : "dark";
    editorCustomizations[kind] = { textMateRules };
    return {
        workbench,
        semantic,
        tokenCustomizations,
        editorCustomizations,
    };
}
//# sourceMappingURL=themeState.js.map