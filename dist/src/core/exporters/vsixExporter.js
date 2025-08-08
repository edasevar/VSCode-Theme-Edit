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
exports.exportAsVsix = exportAsVsix;
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const adm_zip_1 = __importDefault(require("adm-zip"));
/**
 * Create a minimal theme extension VSIX containing one theme file.
 */
async function exportAsVsix(theme) {
    const saveUri = await vscode.window.showSaveDialog({
        filters: { VSIX: ["vsix"] },
        saveLabel: "Save VSIX",
        defaultUri: vscode.Uri.file(path.join(process.cwd(), toKebab(theme.name) + ".vsix"))
    });
    if (!saveUri)
        return;
    const zip = new adm_zip_1.default();
    const pkgJson = {
        name: toKebab(theme.name),
        displayName: theme.name,
        publisher: "local",
        version: "0.0.1",
        engines: { vscode: "^1.90.0" },
        categories: ["Themes"],
        contributes: {
            themes: [
                {
                    label: theme.name,
                    uiTheme: theme.type === "light" ? "vs" : theme.type === "hc" ? "hc-black" : "vs-dark",
                    path: "./themes/theme.json"
                }
            ]
        }
    };
    zip.addFile("extension/package.json", Buffer.from(JSON.stringify(pkgJson, null, 2), "utf8"));
    zip.addFile("extension/themes/theme.json", Buffer.from(JSON.stringify(theme, null, 2), "utf8"));
    await fs.promises.writeFile(saveUri.fsPath, zip.toBuffer());
    vscode.window.showInformationMessage(`Saved VSIX to ${saveUri.fsPath}`);
}
function toKebab(s) {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
//# sourceMappingURL=vsixExporter.js.map