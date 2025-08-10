"use strict";
// Purpose: activate Theme Lab, open webview, handle messages, apply live preview, import/export.
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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const jsonc_parser_1 = require("jsonc-parser");
const importers_1 = require("./importers");
const exporters_1 = require("./exporters");
let panel;
let state;
function settingsTarget() {
    const applyToWs = vscode.workspace
        .getConfiguration("theme-lab")
        .get("preview.applyToWorkspace", true);
    return applyToWs
        ? vscode.ConfigurationTarget.Workspace
        : vscode.ConfigurationTarget.Global;
}
async function applyLivePreview(s) {
    const wb = vscode.workspace.getConfiguration("workbench");
    const ed = vscode.workspace.getConfiguration("editor");
    const target = settingsTarget();
    await wb.update("colorCustomizations", s.colors, target);
    const semantic = { enabled: true, ...s.semanticTokenColors };
    await ed.update("semanticTokenColorCustomizations", semantic, target);
    const tmr = s.tokenColors.map((r) => ({
        scope: r.scope,
        settings: r.settings,
    }));
    const kind = s.type === "light" ? "light" : "dark";
    await ed.update("tokenColorCustomizations", { [kind]: { textMateRules: tmr } }, target);
}
function getMediaUri(webview, ctx, p) {
    return webview
        .asWebviewUri(vscode.Uri.joinPath(ctx.extensionUri, ...p))
        .toString();
}
async function ensureStateWith(mode, ctx) {
    if (mode === "blank")
        state = (0, importers_1.importBlank)("dark");
    if (mode === "current")
        state = await (0, importers_1.importFromCurrent)();
    if (mode === "import-json") {
        const pick = await vscode.window.showOpenDialog({
            filters: { "JSON Files": ["json"] },
            canSelectMany: false,
        });
        if (!pick)
            return;
        state = await (0, importers_1.importFromJson)(pick[0]);
    }
    if (mode === "import-vsix") {
        const pick = await vscode.window.showOpenDialog({
            filters: { "VSIX Files": ["vsix"] },
            canSelectMany: false,
        });
        if (!pick)
            return;
        state = await (0, importers_1.importFromVsix)(pick[0]);
    }
    if (state)
        await applyLivePreview(state);
}
function activate(context) {
    const open = vscode.commands.registerCommand("theme-lab.open", async () => {
        if (!panel) {
            panel = vscode.window.createWebviewPanel("themeLab", "Theme Lab", { viewColumn: vscode.ViewColumn.One, preserveFocus: false }, {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(context.extensionUri, "media"),
                    vscode.Uri.joinPath(context.extensionUri, "assets"),
                ],
            });
            // Always grab the webview reference first and reuse it.
            const webview = panel.webview;
            const html = Buffer.from(await vscode.workspace.fs.readFile(vscode.Uri.joinPath(context.extensionUri, "media", "webview.html"))).toString("utf8");
            // Read the template (prefers assets/template.json, falls back to template.jsonc), then inline it.
            async function readTemplateText() {
                const jsonUri = vscode.Uri.joinPath(context.extensionUri, "assets", "template.json");
                const jsoncUri = vscode.Uri.joinPath(context.extensionUri, "assets", "template.jsonc");
                try {
                    return Buffer.from(await vscode.workspace.fs.readFile(jsonUri)).toString("utf8");
                }
                catch {
                    try {
                        return Buffer.from(await vscode.workspace.fs.readFile(jsoncUri)).toString("utf8");
                    }
                    catch {
                        return "{}";
                    }
                }
            }
            const templateRaw = await readTemplateText();
            const templateObj = (0, jsonc_parser_1.parse)(templateRaw) ?? {};
            const safeJsonForInline = (s) => s
                .replace(/</g, "\\u003c")
                .replace(/\u2028/g, "\\u2028")
                .replace(/\u2029/g, "\\u2029");
            const templateInline = safeJsonForInline(JSON.stringify(templateObj));
            const scriptUri = getMediaUri(webview, context, ["media", "webview.js"]);
            const stylesUri = getMediaUri(webview, context, ["media", "webview.css"]);
            const previewCssUri = getMediaUri(webview, context, [
                "media",
                "preview.css",
            ]);
            const cspSource = webview.cspSource;
            const nonce = Math.random().toString(36).slice(2) + Date.now().toString(36);
            panel.webview.html = html
                .replace(/\{\{script\}\}/g, scriptUri)
                .replace(/\{\{styles\}\}/g, stylesUri)
                .replace(/\{\{previewCss\}\}/g, previewCssUri)
                .replace(/\{\{cspSource\}\}/g, cspSource)
                .replace(/\{\{templateInline\}\}/g, templateInline)
                .replace(/\{\{nonce\}\}/g, nonce);
            panel.onDidDispose(() => (panel = undefined));
            webview.onDidReceiveMessage(async (msg) => {
                try {
                    if (msg.type === "init-request") {
                        // default boot path: use current theme if available, else blank
                        if (!state)
                            state = await (0, importers_1.importFromCurrent)();
                        webview.postMessage({ type: "init-data", state });
                    }
                    if (msg.type === "set-state") {
                        state = msg.state;
                        await applyLivePreview(state);
                    }
                    if (msg.type === "choose-start") {
                        await ensureStateWith(msg.mode, context);
                        webview.postMessage({ type: "init-data", state });
                    }
                    if (msg.type === "export") {
                        const fmt = msg.format;
                        if (!state)
                            return;
                        if (fmt === "json") {
                            const dest = await vscode.window.showSaveDialog({
                                saveLabel: "Export JSON Theme",
                                filters: { JSON: ["json"] },
                                defaultUri: vscode.Uri.file(`${state.name.replace(/\s+/g, "-")}.json`),
                            });
                            if (dest)
                                await (0, exporters_1.exportJson)(state, dest);
                        }
                        else if (fmt === "css") {
                            const dest = await vscode.window.showSaveDialog({
                                saveLabel: "Export CSS Variables",
                                filters: { CSS: ["css"] },
                                defaultUri: vscode.Uri.file(`${state.name.replace(/\s+/g, "-")}.css`),
                            });
                            if (dest)
                                await (0, exporters_1.exportCss)(state, dest);
                        }
                        else if (fmt === "vsix") {
                            const dest = await vscode.window.showSaveDialog({
                                saveLabel: "Export VSIX",
                                filters: { VSIX: ["vsix"] },
                                defaultUri: vscode.Uri.file(`${state.name.replace(/\s+/g, "-")}.vsix`),
                            });
                            if (dest)
                                await (0, exporters_1.exportVsix)(state, dest);
                        }
                    }
                }
                catch (err) {
                    vscode.window.showErrorMessage(`Theme Lab: ${err?.message || err}`);
                }
            });
        }
        panel.reveal(vscode.ViewColumn.One, false);
    });
    const importVsixCmd = vscode.commands.registerCommand("theme-lab.importVsix", async () => {
        await ensureStateWith("import-vsix", context);
        vscode.commands.executeCommand("theme-lab.open");
    });
    const importJsonCmd = vscode.commands.registerCommand("theme-lab.importJson", async () => {
        await ensureStateWith("import-json", context);
        vscode.commands.executeCommand("theme-lab.open");
    });
    const startBlankCmd = vscode.commands.registerCommand("theme-lab.startBlank", async () => {
        await ensureStateWith("blank", context);
        vscode.commands.executeCommand("theme-lab.open");
    });
    const useCurrentCmd = vscode.commands.registerCommand("theme-lab.useCurrent", async () => {
        await ensureStateWith("current", context);
        vscode.commands.executeCommand("theme-lab.open");
    });
    context.subscriptions.push(open, importVsixCmd, importJsonCmd, startBlankCmd, useCurrentCmd);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map