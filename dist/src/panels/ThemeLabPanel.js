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
const vsixBundleExporter_1 = require("../core/exporters/vsixBundleExporter");
const storage_1 = require("../core/storage");
const bundleModel_1 = require("../core/bundleModel");
const validation_1 = require("../core/validation");
/**
 * Webview UI host.
 *  - loads template and sends descriptions/categories
 *  - maintains theme model with undo/redo via webview events
 *  - autosaves theme + UI state
 *  - handles import/export including multi-theme bundle
 *  - emits validation problems to webview
 */
class ThemeLabPanel {
    ctx;
    static viewType = "themeLab.panel";
    panel;
    disposables = [];
    theme;
    liveEnabled = true;
    knownKeys = new Set();
    storage;
    bundle;
    constructor(ctx) {
        this.ctx = ctx;
        this.storage = new storage_1.Storage(ctx);
        const persisted = this.storage.load();
        this.theme = persisted.theme ?? (0, themeModel_1.blankTheme)();
        this.bundle = new bundleModel_1.ThemeBundle(persisted.bundle);
        this.panel = vscode.window.createWebviewPanel(ThemeLabPanel.viewType, "Theme Lab", vscode.ViewColumn.Active, {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [vscode.Uri.file(path.join(ctx.extensionPath, "media"))]
        });
        this.panel.webview.html = this.getHtml(this.panel.webview);
        // Load template -> descriptions/categories
        const tplPath = path.join(ctx.extensionPath, "assets", "template.jsonc");
        const { theme, descriptions, categories } = (0, templateParser_1.loadTemplateJsonc)(tplPath);
        // record known keys for validation
        Object.values(categories).forEach(list => list.forEach(k => this.knownKeys.add(k)));
        // Send boot payload
        this.panel.webview.postMessage({
            type: "templateLoaded",
            descriptions,
            categories,
            templateName: theme.name,
            persisted: {
                theme: this.theme,
                ui: persisted.ui,
                bundleCount: this.bundle.list().length
            }
        });
        // Listen for messages from the Webview
        this.panel.webview.onDidReceiveMessage(this.onMessage.bind(this), null, this.disposables);
        // Reset live preview when panel is closed
        this.panel.onDidDispose(async () => {
            await (0, livePreview_1.resetLivePreview)();
            this.dispose();
        });
        // Apply live if persisted theme and toggle
        if (persisted.ui?.liveEnabled) {
            this.liveEnabled = true;
            void (0, livePreview_1.applyLivePreview)(this.theme);
        }
    }
    async onMessage(msg) {
        try {
            switch (msg.type) {
                // ---------- State / Autosave ----------
                case "uiStateChanged": {
                    const ui = msg.ui;
                    this.liveEnabled = !!ui.liveEnabled;
                    await this.storage.saveUi(ui);
                    break;
                }
                case "themeChanged": {
                    this.theme = msg.theme;
                    await this.storage.saveTheme(this.theme);
                    await this.runValidation();
                    if (this.liveEnabled)
                        await (0, livePreview_1.applyLivePreview)(this.theme);
                    break;
                }
                case "toggleLive":
                    this.liveEnabled = !!msg.value;
                    await this.storage.saveUi({ ...(this.storage.load().ui ?? { filter: "" }), liveEnabled: this.liveEnabled });
                    if (!this.liveEnabled)
                        await (0, livePreview_1.resetLivePreview)();
                    else
                        await (0, livePreview_1.applyLivePreview)(this.theme);
                    break;
                // ---------- New session controls ----------
                case "startBlank":
                    this.theme = (0, themeModel_1.blankTheme)();
                    await this.onThemeUpdated();
                    break;
                case "useCurrentTheme": {
                    const t = await (0, currentThemeImporter_1.importCurrentTheme)();
                    if (t) {
                        this.theme = t;
                        await this.onThemeUpdated();
                    }
                    else {
                        vscode.window.showWarningMessage("Could not locate current theme file.");
                    }
                    break;
                }
                // ---------- Import ----------
                case "importJSON": {
                    const file = await vscode.window.showOpenDialog({
                        canSelectFiles: true,
                        filters: { JSON: ["json", "jsonc"] },
                        canSelectMany: false
                    });
                    if (file?.[0]) {
                        this.theme = (0, jsonImporter_1.importJsonTheme)(file[0].fsPath);
                        await this.onThemeUpdated();
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
                        this.theme = await (0, vsixImporter_1.importVsixTheme)(file[0].fsPath);
                        await this.onThemeUpdated();
                    }
                    break;
                }
                // ---------- Simple edit endpoints (used by undo/redo diff) ----------
                case "updateColor":
                    this.theme.colors[msg.key] = msg.value;
                    await this.onThemeUpdated(false);
                    break;
                case "updateToken": {
                    const idx = Number(msg.index);
                    this.theme.tokenColors[idx] = msg.rule;
                    await this.onThemeUpdated(false);
                    break;
                }
                case "updateSemantic":
                    this.theme.semanticTokenColors[msg.key] = msg.value;
                    await this.onThemeUpdated(false);
                    break;
                case "rename":
                    this.theme.name = String(msg.name || "My Theme");
                    await this.onThemeUpdated(false);
                    break;
                case "setType":
                    this.theme.type = msg.value === "light" ? "light" : msg.value === "hc" ? "hc" : "dark";
                    await this.onThemeUpdated(false);
                    break;
                // ---------- Export ----------
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
                // ---------- Bundle ----------
                case "bundleAdd":
                    this.bundle.add(this.theme);
                    await this.storage.saveBundle(this.bundle.list());
                    this.panel.webview.postMessage({ type: "bundleCount", count: this.bundle.list().length });
                    vscode.window.showInformationMessage(`Added "${this.theme.name}" to bundle (${this.bundle.list().length}).`);
                    break;
                case "bundleClear":
                    this.bundle.clear();
                    await this.storage.saveBundle(this.bundle.list());
                    this.panel.webview.postMessage({ type: "bundleCount", count: 0 });
                    vscode.window.showInformationMessage("Bundle cleared.");
                    break;
                case "exportBundleVSIX":
                    await (0, vsixBundleExporter_1.exportAsVsixBundle)(this.bundle.list());
                    break;
                default:
                    break;
            }
        }
        catch (err) {
            vscode.window.showErrorMessage(err?.message ?? String(err));
        }
    }
    async onThemeUpdated(postBack = true) {
        await this.storage.saveTheme(this.theme);
        await this.runValidation();
        if (this.liveEnabled)
            await (0, livePreview_1.applyLivePreview)(this.theme);
        if (postBack) {
            this.panel.webview.postMessage({ type: "themeLoaded", theme: this.theme });
        }
    }
    async runValidation() {
        const unknown = (0, validation_1.unknownColorKeys)(this.theme, this.knownKeys);
        const bad = (0, validation_1.invalidColors)(this.theme);
        this.panel.webview.postMessage({
            type: "problems",
            data: {
                unknown,
                bad
            }
        });
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
        const cssUri = webview.asWebviewUri(vscode.Uri.file(path.join(mediaRoot.fsPath, "app.css")));
        const jsUri = webview.asWebviewUri(vscode.Uri.file(path.join(mediaRoot.fsPath, "app.js")));
        const nonce = String(Math.random()).slice(2);
        return /* html */ `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta http-equiv="Content-Security-Policy"
  content="default-src 'none'; img-src ${webview.cspSource} blob: data:; 
  	style-src ${webview.cspSource} 'unsafe-inline'; 
  	script-src 'nonce-${nonce}'; 
	font-src ${webview.cspSource};">
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
      <button id="undoBtn" title="Undo (Ctrl/Cmd+Z)">Undo</button>
      <button id="redoBtn" title="Redo (Ctrl/Cmd+Y)">Redo</button>
    </div>
    <div class="row">
      <button id="startBlank">Start blank</button>
      <button id="useCurrent">Use current theme</button>
      <button id="importJSON">Import JSON</button>
      <button id="importVSIX">Import VSIX</button>
      <span class="spacer"></span>
      <button id="bundleAdd">Add to Bundle</button>
      <button id="bundleClear">Clear Bundle</button>
      <button id="exportBundleVSIX">Export Bundle VSIX</button>
      <span id="bundleCount" class="pill">0</span>
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

    <section id="sidebar">
      <div class="tabs">
        <button data-tab="preview" class="tab active">Preview</button>
        <button data-tab="problems" class="tab">Problems</button>
        <button data-tab="diff" class="tab">Diff</button>
      </div>

      <div id="tab-preview" class="tabpage active">
        <h2>Live Preview</h2>
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
              <div class="tabi active">Active</div>
              <div class="tabi">Idle</div>
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

          <div class="prev-card" data-element="list.activeSelectionBackground">
            <h3>Explorer (mock)</h3>
            <ul class="explorer">
              <li class="folder open">src
                <ul>
                  <li>extension.ts</li>
                  <li>theme.json</li>
                </ul>
              </li>
              <li class="folder">media</li>
            </ul>
          </div>

          <div class="prev-card" data-element="panel.background">
            <h3>Problems (mock)</h3>
            <ul class="problems">
              <li>sample.ts:1:1  Unused var</li>
              <li>main.ts:10:5  Missing semicolon</li>
            </ul>
          </div>
        </div>
        <p class="hint">Selecting a key highlights the matching card so you *see* what you’re changing.</p>
      </div>

      <div id="tab-problems" class="tabpage">
        <h2>Problems</h2>
        <div id="problemsList"></div>
      </div>

      <div id="tab-diff" class="tabpage">
        <h2>Diff</h2>
        <div id="diffView" class="diff"></div>
      </div>
    </section>
  </main>

  <!-- Color picker overlay -->
  <div id="pickerOverlay" class="overlay hidden">
    <div class="overlay-card">
      <h3>Color Picker</h3>
      <div class="picker-row">
        <label>Base</label>
        <input id="pickerBase" type="color"/>
        <input id="pickerHex" type="text" placeholder="#rrggbb or #rrggbbaa" />
      </div>
      <div class="picker-row">
        <label>Alpha</label>
        <input id="pickerAlpha" type="range" min="0" max="100" value="100"/>
        <span id="pickerAlphaVal">100%</span>
      </div>
      <div class="swatches" id="swatches"></div>
      <div class="row right">
        <button id="pickerCancel">Cancel</button>
        <button id="pickerApply">Apply</button>
      </div>
    </div>
  </div>

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