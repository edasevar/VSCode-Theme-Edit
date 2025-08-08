"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportAsCss = exportAsCss;
var color_1 = require("../color");
/**
 * Export CSS variables: map workbench color keys to --vscode-<key>
 * For #RRGGBBAA we emit rgba(r,g,b,a).
 */
function exportAsCss(theme) {
    var toVar = function (k) { return "--vscode-".concat(k.replace(/\./g, "-")); };
    var lines = [":root {"];
    for (var _i = 0, _a = Object.entries(theme.colors); _i < _a.length; _i++) {
        var _b = _a[_i], k = _b[0], v = _b[1];
        var value = typeof v === "string" ? (0, color_1.normalizeColor)(v) : v;
        lines.push("  ".concat(toVar(k), ": ").concat(value, ";"));
    }
    lines.push("}");
    // Optional: minimal token preview classes
    lines.push("", "/* Token examples */");
    lines.push(".tm-comment { color: var(--vscode-editorCodeLens-foreground, #888); }");
    return lines.join("\n");
}
