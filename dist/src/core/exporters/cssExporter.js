"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportAsCss = exportAsCss;
const color_1 = require("../color");
/**
 * Export CSS variables: map workbench color keys to --vscode-<key>
 * For #RRGGBBAA we emit rgba(r,g,b,a).
 */
function exportAsCss(theme) {
    const toVar = (k) => `--vscode-${k.replace(/\./g, "-")}`;
    const lines = [":root {"];
    for (const [k, v] of Object.entries(theme.colors)) {
        const value = typeof v === "string" ? (0, color_1.normalizeColor)(v) : v;
        lines.push(`  ${toVar(k)}: ${value};`);
    }
    lines.push("}");
    lines.push("", "/* Token examples */");
    lines.push(".tm-comment { color: var(--vscode-editorCodeLens-foreground, #888); }");
    return lines.join("\n");
}
//# sourceMappingURL=cssExporter.js.map