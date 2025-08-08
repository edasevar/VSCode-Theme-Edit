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
exports.ThemeLabPanel = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const templateParser_1 = require("../core/templateParser");
const themeModel_1 = require("../core/themeModel");
const jsonImporter_1 = require("../core/importers/jsonImporter");
const vsixImporter_1 = require("../core/importers/vsixImporter");
const currentThemeImporter_1 = require("../core/importers/currentThemeImporter");
const livePreview_1 = require("../core/livePreview");
const cssExporter_1 = require("../core/exporters/cssExporter");
const jsonExporter_1 = require("../core/exporters/jsonExporter");
const vsixExporter_1 = require("../core/exporters/vsixExporter");
/**
 * Webview UI host. Handles:
 *  - loading template and sending descriptions/categories to the webview
 *  - receiving edits and applying live preview
 *  - import/export commands
 */
class ThemeLabPanel {
    ctx;
    static viewType = "themeLab.panel";
    panel;
    disposables = [];
    theme;
    liveEnabled = true;
    constructor(ctx) {
        this.ctx = ctx;
        this.theme = (0, themeModel_1.blankTheme)();
        this.panel = vscode.window.createWebviewPanel(ThemeLabPanel.viewType, "Theme Lab", vscode.ViewColumn.Active, {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [vscode.Uri.file(path.join(ctx.extensionPath, "media"))]
        });
        this.panel.webview.html = this.getHtml(this.panel.webview);
        // Load template (descriptions + categories) and send to webview
        const tplPath = path.join(ctx.extensionPath, "assets", "template.jsonc");
        const { theme, descriptions, categories } = (0, templateParser_1.loadTemplateJsonc)(tplPath);
        this.panel.webview.postMessage({
            type: "templateLoaded",
            descriptions,
            categories,
            templateName: theme.name
        });
        // Listen for messages from the Webview
        this.panel.webview.onDidReceiveMessage(this.onMessage.bind(this), null, this.disposables);
        // Reset live preview when panel is closed
        this.panel.onDidDispose(async () => {
            await (0, livePreview_1.resetLivePreview)();
            this.dispose();
        });
    }
    async onMessage(msg) {
        try {
            switch (msg.type) {
                case "toggleLive":
                    this.liveEnabled = !!msg.value;
                    if (!this.liveEnabled)
                        await (0, livePreview_1.resetLivePreview)();
                    else
                        await (0, livePreview_1.applyLivePreview)(this.theme);
                    break;
                case "startBlank":
                    this.theme = (0, themeModel_1.blankTheme)();
                    await this.maybeApply();
                    break;
                case "useCurrentTheme": {
                    const t = await (0, currentThemeImporter_1.importCurrentTheme)();
                    if (t) {
                        this.theme = t;
                        await this.maybeApply();
                        this.panel.webview.postMessage({ type: "themeLoaded", theme: this.theme });
                    }
                    else {
                        vscode.window.showWarningMessage("Could not locate current theme file.");
                    }
                    break;
                }
                case "importJSON": {
                    const file = await vscode.window.showOpenDialog({
                        canSelectFiles: true,
                        filters: { JSON: ["json", "jsonc"] },
                        canSelectMany: false
                    });
                    if (file?.[0]) {
                        this.theme = (0, jsonImporter_1.importJsonTheme)(file[0].fsPath);
                        await this.maybeApply();
                        this.panel.webview.postMessage({ type: "themeLoaded", theme: this.theme });
                    }
                    break;
                }
                case "importVSIX": {
                    const file = await vscode.window.showOpenDialog({
                        canSelectFiles: true,
                        filters: { VSIX: ["vsix"] },
                        canSelectMany: false
                    });
                    if (file?.[0]) {
                        this.theme = (0, vsixImporter_1.importVsixTheme)(file[0].fsPath);
                        await this.maybeApply();
                        this.panel.webview.postMessage({ type: "themeLoaded", theme: this.theme });
                    }
                    break;
                }
                case "updateColor":
                    this.theme.colors[msg.key] = msg.value;
                    await this.maybeApply();
                    break;
                case "updateToken": {
                    const idx = Number(msg.index);
                    this.theme.tokenColors[idx] = msg.rule;
                    await this.maybeApply();
                    break;
                }
                case "updateSemantic":
                    this.theme.semanticTokenColors[msg.key] = msg.value;
                    await this.maybeApply();
                    break;
                case "exportJSON": {
                    const data = (0, jsonExporter_1.exportAsJson)(this.theme);
                    await this.saveString(data, "json");
                    break;
                }
                case "exportCSS": {
                    const data = (0, cssExporter_1.exportAsCss)(this.theme);
                    await this.saveString(data, "css");
                    break;
                }
                case "exportVSIX":
                    await (0, vsixExporter_1.exportAsVsix)(this.theme);
                    break;
                case "rename":
                    this.theme.name = String(msg.name || "My Theme");
                    break;
                case "setType":
                    this.theme.type = msg.value === "light" ? "light" : msg.value === "hc" ? "hc" : "dark";
                    await this.maybeApply();
                    break;
                default:
                    break;
            }
        }
        catch (err) {
            vscode.window.showErrorMessage(err?.message ?? String(err));
        }
    }
    async maybeApply() {
        if (this.liveEnabled)
            await (0, livePreview_1.applyLivePreview)(this.theme);
    }
    async saveString(contents, ext) {
        const defaultName = this.theme.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const dest = await vscode.window.showSaveDialog({
            filters: { [ext.toUpperCase()]: [ext] },
            defaultUri: vscode.Uri.file(`${defaultName}.${ext}`)
        });
        if (!dest)
            return;
        await vscode.workspace.fs.writeFile(dest, Buffer.from(contents, "utf8"));
        vscode.window.showInformationMessage(`Saved ${ext.toUpperCase()} to ${dest.fsPath}`);
    }
    getHtml(webview) {
        const mediaRoot = vscode.Uri.file(path.join(this.ctx.extensionPath, "media"));
        const cssUri = vscode.Uri.file(path.join(mediaRoot.fsPath, "app.css")).with({ scheme: 'vscode-resource' });
        const jsUri = vscode.Uri.file(path.join(mediaRoot.fsPath, "app.js")).with({ scheme: 'vscode-resource' });
        const nonce = String(Math.random()).slice(2);
        return /* html */ `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta http-equiv="Content-Security-Policy"
  content="default-src 'none'; img-src ${webview.cspSource} blob:; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; font-src ${webview.cspSource};">
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<link href="${cssUri}" rel="stylesheet" />
<title>Theme Lab</title>
</head>
<body>
  <header>
    <h1>Theme Lab</h1>
    <div class="row">
      <input id="themeName" placeholder="Theme name" />
      <select id="themeType">
        <option value="dark">dark</option>
        <option value="light">light</option>
        <option value="hc">hc</option>
      </select>
      <label><input type="checkbox" id="liveToggle" checked /> Live preview</label>
    </div>
    <div class="row">
      <button id="startBlank">Start blank</button>
      <button id="useCurrent">Use current theme</button>
      <button id="importJSON">Import JSON</button>
      <button id="importVSIX">Import VSIX</button>
      <span class="spacer"></span>
      <button id="exportJSON">Export JSON</button>
      <button id="exportCSS">Export CSS</button>
      <button id="exportVSIX">Export VSIX</button>
    </div>
  </header>

  <main>
    <aside id="categories"></aside>

    <section id="editor">
      <div id="searchBar">
        <input id="filter" placeholder="Find color key…" />
      </div>
      <div id="colorsList"></div>

      <h2>Tokens</h2>
      <div id="tokensEditor"></div>

      <h2>Semantic Tokens</h2>
      <div id="semanticEditor"></div>
    </section>

    <section id="preview">
      <h2>Live Preview (Webview)</h2>
      <div class="preview-grid">
        <div class="prev-card" data-element="button.background">
          <h3>Button</h3>
          <button class="demo-btn">Primary</button>
        </div>
        <div class="prev-card" data-element="input.background">
          <h3>Input</h3>
          <input class="demo-input" placeholder="Type here…" />
        </div>
        <div class="prev-card" data-element="tab.activeBackground">
          <h3>Tabs</h3>
          <div class="demo-tabs">
            <div class="tab active">Active</div>
            <div class="tab">Idle</div>
          </div>
        </div>
        <div class="prev-card" data-element="editor.background">
          <h3>Code</h3>
          <pre class="code"><code>// Quick sample
function hello(name) {
  const msg = \`Hello, \${name}\`;
  return msg;
}</code></pre>
        </div>
      </div>
      <p class="hint">Selecting a key highlights the matching card above so you *see* what you’re changing.</p>
    </section>
  </main>

  <script nonce="${nonce}" src="${jsUri}"></script>
</body>
</html>
`;
    }
    dispose() {
        this.disposables.forEach(d => d.dispose());
    }
}
exports.ThemeLabPanel = ThemeLabPanel;
//# sourceMappingURL=ThemeLabPanel.js.map