"use strict";
// Purpose: load the active theme's JSON from installed extensions if available.
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.readCurrentThemeJson = readCurrentThemeJson;
exports.readAppliedCustomizations = readAppliedCustomizations;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs_1 = require("fs");
async function readCurrentThemeJson() {
    const label = vscode.workspace
        .getConfiguration("workbench")
        .get("colorTheme");
    if (!label)
        return undefined;
    for (const ext of vscode.extensions.all) {
        const contrib = ext.packageJSON?.contributes?.themes;
        if (!Array.isArray(contrib))
            continue;
        for (const t of contrib) {
            if (t?.label === label) {
                const themePath = path.join(ext.extensionPath, t.path);
                try {
                    const raw = await fs_1.promises.readFile(themePath, "utf8");
                    return JSON.parse(raw);
                }
                catch {
                    return undefined;
                }
            }
        }
    }
    return undefined;
}
function readAppliedCustomizations() {
    const wb = vscode.workspace
        .getConfiguration("workbench")
        .get("colorCustomizations") || {};
    const sem = vscode.workspace
        .getConfiguration("editor")
        .get("semanticTokenColorCustomizations") || { enabled: true };
    const tmc = vscode.workspace
        .getConfiguration("editor")
        .get("tokenColorCustomizations") || {};
    return { workbench: wb, semantic: sem, token: tmc };
}
//# sourceMappingURL=currentTheme.js.map