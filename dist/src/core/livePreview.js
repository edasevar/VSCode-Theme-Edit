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
exports.applyLivePreview = applyLivePreview;
exports.resetLivePreview = resetLivePreview;
const vscode = __importStar(require("vscode"));
const color_1 = require("./color");
// Restore originals on dispose
let previousWorkbench;
let previousTextmate;
let previousSemantic;
/**
 * Live preview via user-level overrides:
 * - workbench.colorCustomizations
 * - editor.tokenColorCustomizations
 * - editor.semanticTokenColorCustomizations
 * Converts #RRGGBBAA -> rgba() for reliability.
 */
async function applyLivePreview(theme) {
    const cfg = vscode.workspace.getConfiguration();
    const semanticEnabled = cfg.get("themeLab.semanticTokensEnabled", true);
    if (previousWorkbench === undefined) {
        previousWorkbench = cfg.get("workbench.colorCustomizations");
        previousTextmate = cfg.get("editor.tokenColorCustomizations");
        previousSemantic = cfg.get("editor.semanticTokenColorCustomizations");
    }
    const workbench = (0, color_1.normalizeColorMap)(theme.colors);
    const textMateRules = theme.tokenColors.map(tmRule => {
        const r = JSON.parse(JSON.stringify(tmRule));
        if (r.settings) {
            if (typeof r.settings.foreground === "string") {
                r.settings.foreground = (0, color_1.normalizeColor)(r.settings.foreground);
            }
            if (typeof r.settings.background === "string") {
                r.settings.background = (0, color_1.normalizeColor)(r.settings.background);
            }
            // Normalize TextMate fontStyle: remove 'normal', map 'underlined'->'underline', dedupe and sort
            if (typeof r.settings.fontStyle === "string") {
                const raw = r.settings.fontStyle.trim();
                if (raw.length) {
                    const parts = raw.split(/\s+/)
                        .map(s => s.toLowerCase())
                        .filter(s => s !== "normal");
                    const mapped = parts.map(s => (s === "underlined" ? "underline" : s));
                    const allowed = ["italic", "bold", "underline", "strikethrough"];
                    const unique = Array.from(new Set(mapped)).filter(s => allowed.includes(s));
                    // stable order for determinism
                    const ordered = allowed.filter(a => unique.includes(a));
                    r.settings.fontStyle = ordered.join(" ") || undefined;
                }
                else {
                    r.settings.fontStyle = undefined;
                }
            }
        }
        return r;
    });
    const semanticRules = {};
    for (const [k, v] of Object.entries(theme.semanticTokenColors)) {
        if (typeof v === "string") {
            semanticRules[k] = { foreground: (0, color_1.normalizeColor)(v) };
        }
        else {
            const out = {};
            if (typeof v.foreground === "string")
                out.foreground = (0, color_1.normalizeColor)(v.foreground);
            // Convert fontStyle string to boolean flags per VS Code schema
            if (typeof v.fontStyle === "string") {
                const parts = v.fontStyle.trim().toLowerCase().split(/\s+/).filter(Boolean);
                const has = (s) => parts.includes(s);
                if (parts.length === 1 && parts[0] === "normal") {
                    out.italic = out.bold = out.underline = out.strikethrough = false;
                }
                else {
                    out.italic = has("italic") || undefined;
                    out.bold = has("bold") || undefined;
                    out.underline = has("underline") || has("underlined") || undefined;
                    out.strikethrough = has("strikethrough") || has("strike") || has("struck") || undefined;
                }
            }
            semanticRules[k] = out;
        }
    }
    await cfg.update("workbench.colorCustomizations", workbench, vscode.ConfigurationTarget.Global);
    await cfg.update("editor.tokenColorCustomizations", { textMateRules, semanticHighlighting: true }, vscode.ConfigurationTarget.Global);
    await cfg.update("editor.semanticTokenColorCustomizations", { enabled: !!semanticEnabled, rules: semanticRules }, vscode.ConfigurationTarget.Global);
}
async function resetLivePreview() {
    const cfg = vscode.workspace.getConfiguration();
    await cfg.update("workbench.colorCustomizations", previousWorkbench, vscode.ConfigurationTarget.Global);
    await cfg.update("editor.tokenColorCustomizations", previousTextmate, vscode.ConfigurationTarget.Global);
    await cfg.update("editor.semanticTokenColorCustomizations", previousSemantic, vscode.ConfigurationTarget.Global);
    previousWorkbench = previousTextmate = previousSemantic = undefined;
}
//# sourceMappingURL=livePreview.js.map