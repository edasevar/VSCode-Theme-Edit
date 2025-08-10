"use strict";
// Purpose: export flows (JSON, CSS, VSIX) for current ThemeState.
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportJson = exportJson;
exports.exportCss = exportCss;
exports.exportVsix = exportVsix;
const vscode = __importStar(require("vscode"));
const jszip_1 = __importDefault(require("jszip"));
function toThemeJson(state) {
    return {
        name: state.name,
        type: state.type,
        colors: state.colors,
        tokenColors: state.tokenColors,
        semanticTokenColors: state.semanticTokenColors,
    };
}
async function exportJson(state, targetUri) {
    const json = JSON.stringify(toThemeJson(state), null, 2);
    await vscode.workspace.fs.writeFile(targetUri, Buffer.from(json, "utf8"));
}
function sanitizeVarName(key) {
    return key.replace(/[^a-z0-9\-_.]/gi, "_");
}
async function exportCss(state, targetUri) {
    const lines = [];
    lines.push(":root {");
    for (const [k, v] of Object.entries(state.colors)) {
        lines.push(`  --themelab-${sanitizeVarName(k)}: ${v};`);
    }
    lines.push("}");
    await vscode.workspace.fs.writeFile(targetUri, Buffer.from(lines.join("\n"), "utf8"));
}
async function exportVsix(state, targetUri) {
    const zip = new jszip_1.default();
    const pkg = {
        name: state.name.toLowerCase().replace(/\s+/g, "-"),
        displayName: state.name,
        version: "0.0.1",
        publisher: "your-publisher-id",
        engines: { vscode: "^1.90.0" },
        contributes: {
            themes: [
                {
                    label: state.name,
                    uiTheme: state.type === "light" ? "vs" : "vs-dark",
                    path: "./themes/theme-lab-color-theme.json",
                },
            ],
        },
    };
    const themeJson = JSON.stringify({ $schema: "vscode://schemas/color-theme", ...toThemeJson(state) }, null, 2);
    zip.file("package.json", JSON.stringify(pkg, null, 2));
    zip.folder("themes").file("theme-lab-color-theme.json", themeJson);
    const content = await zip.generateAsync({ type: "nodebuffer" });
    await vscode.workspace.fs.writeFile(targetUri, content);
}
//# sourceMappingURL=exporters.js.map