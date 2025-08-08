"use strict";
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
exports.importVsixTheme = importVsixTheme;
const adm_zip_1 = __importDefault(require("adm-zip"));
const jsonc_parser_1 = require("jsonc-parser");
const vscode = __importStar(require("vscode"));
/**
 * Open a .vsix and extract the selected contributed theme JSON.
 * If multiple themes exist, prompt the user to choose.
 */
async function importVsixTheme(vsixPath) {
    const zip = new adm_zip_1.default(vsixPath);
    const entries = zip.getEntries();
    const pkgEntry = entries.find(e => /(^|\/)extension\/package\.json$/.test(e.entryName));
    if (!pkgEntry)
        throw new Error("package.json not found in VSIX");
    const pkg = JSON.parse(pkgEntry.getData().toString("utf8"));
    const themes = (pkg.contributes?.themes ?? []);
    if (!themes.length)
        throw new Error("No themes contributed in VSIX");
    let picked = themes[0];
    if (themes.length > 1) {
        const items = themes.map((t) => ({
            label: t.label || t.id || t.path,
            description: t.uiTheme || "",
            path: String(t.path)
        }));
        const pick = await vscode.window.showQuickPick(items, {
            title: "Select a theme from VSIX",
            canPickMany: false
        });
        if (!pick)
            throw new Error("Selection cancelled.");
        picked = themes.find((t) => String(t.path) === pick.path);
    }
    const themeRel = String(picked.path).replace(/^\.\//, "");
    const themeEntry = entries.find(e => e.entryName.endsWith(`/extension/${themeRel}`));
    if (!themeEntry)
        throw new Error(`Theme file ${themeRel} not found inside VSIX`);
    const themeJson = themeEntry.getData().toString("utf8");
    return (0, jsonc_parser_1.parse)(themeJson);
}
//# sourceMappingURL=vsixImporter.js.map