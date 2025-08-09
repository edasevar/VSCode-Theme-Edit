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
exports.exportAsVsixBundle = exportAsVsixBundle;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const adm_zip_1 = __importDefault(require("adm-zip"));
/**
 * Bundle multiple themes into one VSIX, adding:
 *  - package.json with contributes.themes[]
 *  - README.md auto-generated
 *  - icon.png (1x1 transparent PNG)
 */
async function exportAsVsixBundle(themes) {
    if (!themes.length) {
        vscode.window.showWarningMessage("Bundle is empty. Add at least one theme.");
        return;
    }
    const defaultName = safeKebab(`${themes[0].name || "theme"}-bundle`);
    const saveUri = await vscode.window.showSaveDialog({
        filters: { VSIX: ["vsix"] },
        saveLabel: "Save Bundle VSIX",
        defaultUri: vscode.Uri.file(`${defaultName}.vsix`)
    });
    if (!saveUri)
        return;
    const zip = new adm_zip_1.default();
    const contributes = themes.map((t, i) => ({
        label: t.name || `Theme ${i + 1}`,
        uiTheme: t.type === "light" ? "vs" : t.type === "hc" ? "hc-black" : "vs-dark",
        path: `./themes/${safeKebab(t.name || `theme-${i + 1}`)}.json`
    }));
    const pkgJson = {
        name: defaultName,
        displayName: titleCase(defaultName),
        icon: "icon.png",
        publisher: "local",
        version: "0.0.1",
        engines: { vscode: "^1.90.0" },
        categories: ["Themes"],
        contributes: { themes: contributes }
    };
    zip.addFile("extension/package.json", Buffer.from(JSON.stringify(pkgJson, null, 2), "utf8"));
    const readme = [
        `# ${titleCase(defaultName)}`,
        "",
        "This VSIX bundles multiple VS Code themes:",
        ...themes.map((t, i) => `- **${t.name || `Theme ${i + 1}`}** (${t.type})`)
    ].join("\n");
    zip.addFile("extension/README.md", Buffer.from(readme, "utf8"));
    const transparentPngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";
    zip.addFile("extension/icon.png", Buffer.from(transparentPngBase64, "base64"));
    for (let i = 0; i < themes.length; i++) {
        const t = themes[i];
        const p = `extension/themes/${safeKebab(t.name || `theme-${i + 1}`)}.json`;
        zip.addFile(p, Buffer.from(JSON.stringify(t, null, 2), "utf8"));
    }
    await fs.promises.writeFile(saveUri.fsPath, zip.toBuffer());
    vscode.window.showInformationMessage(`Saved bundle VSIX to ${saveUri.fsPath}`);
}
function safeKebab(s) {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function titleCase(s) {
    return s.replace(/(^|-)([a-z])/g, (_, p1, c) => (p1 ? " " : "") + c.toUpperCase());
}
//# sourceMappingURL=vsixBundleExporter.js.map