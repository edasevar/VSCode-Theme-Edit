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
Object.defineProperty(exports, "__esModule", { value: true });
exports.importCurrentTheme = importCurrentTheme;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
const jsonc_parser_1 = require("jsonc-parser");
/**
 * Find the active theme's JSON by label in installed extensions.
 */
async function importCurrentTheme() {
    const label = vscode.workspace.getConfiguration("workbench").get("colorTheme");
    if (!label)
        return null;
    for (const ext of vscode.extensions.all) {
        const contributes = (ext.packageJSON?.contributes?.themes ?? []);
        for (const t of contributes) {
            if (t.label === label) {
                const themePath = path.join(ext.extensionPath, t.path);
                if (fs.existsSync(themePath)) {
                    const raw = fs.readFileSync(themePath, "utf8");
                    return (0, jsonc_parser_1.parse)(raw);
                }
            }
        }
    }
    return null;
}
//# sourceMappingURL=currentThemeImporter.js.map