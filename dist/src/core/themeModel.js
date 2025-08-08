"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blankTheme = void 0;
exports.mergeTheme = mergeTheme;
/** Empty starter theme (start blank) */
const blankTheme = () => ({
    $schema: "vscode://schemas/color-theme",
    name: "My Theme",
    type: "dark",
    colors: {},
    tokenColors: [],
    semanticTokenColors: {}
});
exports.blankTheme = blankTheme;
/** Shallow merge utility (handy later) */
function mergeTheme(base, incoming) {
    return {
        $schema: incoming.$schema || base.$schema,
        name: incoming.name || base.name,
        type: incoming.type || base.type,
        colors: { ...base.colors, ...incoming.colors },
        tokenColors: incoming.tokenColors?.length ? incoming.tokenColors : base.tokenColors,
        semanticTokenColors: { ...base.semanticTokenColors, ...incoming.semanticTokenColors }
    };
}
//# sourceMappingURL=themeModel.js.map