"use strict";
// Purpose: import flows: VSIX (zip), theme JSON, or current theme/customizations.
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
exports.importFromVsix = importFromVsix;
exports.fromThemeJson = fromThemeJson;
exports.importFromJson = importFromJson;
exports.importFromCurrent = importFromCurrent;
exports.importBlank = importBlank;
const vscode = __importStar(require("vscode"));
const jszip_1 = __importDefault(require("jszip"));
const currentTheme_1 = require("./currentTheme");
const themeState_1 = require("./themeState");
const jsonc_parser_1 = require("jsonc-parser");
async function importFromVsix(uri) {
    const data = await vscode.workspace.fs.readFile(uri);
    const zip = await jszip_1.default.loadAsync(Buffer.from(data));
    // Find theme JSON(s)
    let themeJson;
    for (const name of Object.keys(zip.files)) {
        if (name.endsWith(".json") && name.includes("/themes/")) {
            const content = await zip.files[name].async("string");
            try {
                themeJson = JSON.parse(content);
                break;
            }
            catch {
                continue;
            }
        }
        if (name.endsWith("package.json") && !themeJson) {
            // optional: could read to locate themes path
        }
    }
    if (!themeJson)
        throw new Error("No theme JSON found inside VSIX.");
    return fromThemeJson(themeJson);
}
function fromThemeJson(themeJson) {
    const type = /light/i.test(themeJson.type) ? "light" : "dark";
    const colors = themeJson.colors || {};
    const tokenColors = themeJson.tokenColors || [];
    const sem = themeJson.semanticTokenColors || {};
    return {
        name: themeJson.name || "Imported Theme",
        type,
        colors,
        tokenColors,
        semanticTokenColors: sem,
    };
}
async function importFromJson(uri) {
    const raw = Buffer.from(await vscode.workspace.fs.readFile(uri)).toString("utf8");
    const json = (0, jsonc_parser_1.parse)(raw);
    return fromThemeJson(json);
}
async function importFromCurrent() {
    const raw = await (0, currentTheme_1.readCurrentThemeJson)();
    const { workbench, semantic, token } = (0, currentTheme_1.readAppliedCustomizations)();
    // Merge: base -> applied
    const base = raw ? fromThemeJson(raw) : (0, themeState_1.blankTheme)();
    base.colors = { ...(base.colors || {}), ...(workbench || {}) };
    base.semanticTokenColors = {
        ...(base.semanticTokenColors || {}),
        ...(semantic || {}),
    };
    // tokenColorCustomizations may be of the shape { light|dark: { textMateRules: [] }} or { textMateRules: [] }
    const textMateRules = token?.textMateRules ||
        token?.light?.textMateRules ||
        token?.dark?.textMateRules ||
        base.tokenColors ||
        [];
    base.tokenColors = textMateRules;
    return base;
}
function importBlank(type = "dark") {
    return (0, themeState_1.blankTheme)("Theme Lab Theme", type);
}
//# sourceMappingURL=importers.js.map