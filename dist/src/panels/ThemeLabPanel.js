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
const fs = __importStar(require("fs"));
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
 * Webview UI host: template loading, state, validation, import/export, bundle, autosave.
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
            localResourceRoots: [vscode.Uri.file(this.ctx.extensionPath)],
            portMapping: [], // Explicitly disable port mappings
            enableCommandUris: false, // Disable command URIs that might trigger workers
        });
        this.panel.webview.html = this.getHtml(this.panel.webview);
        // Load template from assets (fallback to bundled default if the main one is missing)
        const tplPrimary = vscode.Uri.file(path.join(this.ctx.extensionPath, "assets", "template.jsonc"));
        const tplFallback = vscode.Uri.file(path.join(this.ctx.extensionPath, "assets", "template.default.jsonc"));
        const tplPath = this.uriExistsSync(tplPrimary) ? tplPrimary.fsPath : tplFallback.fsPath;
        const { theme, descriptions, categories, tree } = (0, templateParser_1.loadTemplateJsonc)(tplPath);
        // record known keys for validation
        Object.values(categories).forEach(list => list.forEach(k => this.knownKeys.add(k)));
        // boot payload => webview
        this.panel.webview.postMessage({
            type: "templateLoaded",
            descriptions,
            categories,
            tree,
            templateName: theme.name,
            persisted: {
                theme: this.theme,
                ui: persisted.ui,
                bundleCount: this.bundle.list().length
            }
        });
        this.panel.webview.onDidReceiveMessage(this.onMessage.bind(this), null, this.disposables);
        this.panel.onDidDispose(async () => {
            await (0, livePreview_1.resetLivePreview)();
            this.dispose();
        });
        if (persisted.ui?.liveEnabled) {
            this.liveEnabled = true;
            void (0, livePreview_1.applyLivePreview)(this.theme);
        }
    }
    uriExistsSync(uri) {
        try {
            return fs.existsSync(uri.fsPath);
        }
        catch {
            return false;
        }
    }
    async onMessage(msg) {
        try {
            switch (msg.type) {
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
                        const importedTheme = await (0, vsixImporter_1.importVsixTheme)(file[0].fsPath);
                        if (importedTheme) {
                            this.theme = importedTheme;
                            await this.onThemeUpdated();
                        }
                        else {
                            vscode.window.showWarningMessage("Failed to import theme from the selected VSIX file.");
                        }
                    }
                    break;
                }
                case "loadTemplate": {
                    const file = await vscode.window.showOpenDialog({
                        canSelectFiles: true,
                        filters: { Template: ["jsonc", "json"] },
                        canSelectMany: false
                    });
                    if (file?.[0]) {
                        const { descriptions, categories, tree } = (0, templateParser_1.loadTemplateJsonc)(file[0].fsPath);
                        // refresh known keys
                        this.knownKeys.clear();
                        Object.values(categories).forEach(list => list.forEach(k => this.knownKeys.add(k)));
                        // send new template data
                        this.panel.webview.postMessage({
                            type: "templateLoaded",
                            descriptions,
                            categories,
                            tree,
                            templateName: path.basename(file[0].fsPath),
                            persisted: {
                                theme: this.theme,
                                ui: this.storage.load().ui,
                                bundleCount: this.bundle.list().length
                            }
                        });
                        await this.runValidation();
                    }
                    break;
                }
                case "updateColor":
                    if (typeof msg.key === "string") {
                        this.theme.colors[msg.key] = msg.value;
                    }
                    else {
                        throw new Error("Invalid key type: expected a string.");
                    }
                    await this.onThemeUpdated(false);
                    break;
                case "updateToken": {
                    const idx = Number(msg.index);
                    this.theme.tokenColors[idx] = msg.rule;
                    await this.onThemeUpdated(false);
                    break;
                }
                case "updateSemantic":
                    if (typeof msg.key === "string") {
                        this.theme.semanticTokenColors[msg.key] = msg.value; // Type from webview message
                    }
                    await this.onThemeUpdated(false);
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
                    await this.onThemeUpdated(false);
                    break;
                case "setType":
                    this.theme.type = msg.value === "light" ? "light" : msg.value === "hc" ? "hc" : "dark";
                    await this.onThemeUpdated(false);
                    break;
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
            if (err instanceof Error) {
                vscode.window.showErrorMessage(err.message);
            }
            else {
                vscode.window.showErrorMessage(String(err));
            }
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
        this.panel.webview.postMessage({ type: "problems", data: { unknown, bad } });
    }
    async saveString(contents, ext) {
        const defaultName = this.theme.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const dest = await vscode.window.showSaveDialog({
            filters: { [ext.toUpperCase()]: [ext] },
            defaultUri: vscode.Uri.file(`${defaultName}.${ext}`)
        });
        if (!dest)
            return;
        await fs.promises.writeFile(dest.fsPath, contents, "utf8");
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
  content="
    default-src 'none';
    img-src ${webview.cspSource} blob: data:;
    style-src ${webview.cspSource} 'unsafe-inline';
    script-src ${webview.cspSource} 'nonce-${nonce}';
    font-src ${webview.cspSource};
    worker-src 'none';
    child-src 'none';
    frame-src 'none';
    connect-src 'none';
    manifest-src 'none';
  ">
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="service-worker" content="none" />
<meta name="theme-color" content="#1e1e1e" />
<meta name="mobile-web-app-capable" content="no" />
<meta name="apple-mobile-web-app-capable" content="no" />
<link href="${cssUri}" rel="stylesheet" />
<title>Theme Lab</title>
<script nonce="${nonce}">
  // Immediate service worker prevention - runs before any other scripts
  (function() {
    'use strict';
    
    // Override navigator.serviceWorker immediately
    if (typeof navigator !== 'undefined') {
      Object.defineProperty(navigator, 'serviceWorker', {
        get: function() {
          return {
            register: function() {
              return Promise.reject(new Error('Service workers disabled in webview'));
            },
            ready: Promise.reject(new Error('Service workers disabled in webview')),
            controller: null,
            getRegistration: function() {
              return Promise.resolve(undefined);
            },
            getRegistrations: function() {
              return Promise.resolve([]);
            }
          };
        },
        configurable: false,
        enumerable: true
      });
    }
    
    // Prevent any other service worker attempts
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', function() {
        // Prevent any last-minute service worker registration
      });
    }
  })();
</script>
</head>
<body>
  <header>
    <h1>Theme Lab</h1>
    <div class="row">
      <input id="themeName" placeholder="Theme name" class="tooltip" data-tooltip="Enter a name for your custom theme" />
      <select id="themeType" class="tooltip" data-tooltip="Choose theme appearance type: dark, light, or high contrast">
        <option value="dark">Dark Theme</option>
        <option value="light">Light Theme</option>
        <option value="hc">High Contrast</option>
      </select>
      <label class="tooltip" data-tooltip="Enable real-time preview of changes in VS Code interface">
        <input type="checkbox" id="liveToggle" checked /> Live preview
      </label>
      <button id="undoBtn" title="Undo recent changes (Ctrl/Cmd+Z)" class="secondary tooltip" data-tooltip="Undo the last change">↶ Undo</button>
      <button id="redoBtn" title="Redo recent changes (Ctrl/Cmd+Y)" class="secondary tooltip" data-tooltip="Redo the last undone change">↷ Redo</button>
    </div>
    <div class="row">
      <button id="startBlank" class="secondary tooltip" data-tooltip="Start with a completely blank theme template">🆕 Start Blank</button>
      <button id="useCurrent" class="secondary tooltip" data-tooltip="Import the currently active VS Code theme">📥 Import Current</button>
      <button id="importJSON" class="secondary tooltip" data-tooltip="Import theme from a JSON/JSONC file">📄 Import JSON</button>
      <button id="importVSIX" class="secondary tooltip" data-tooltip="Import theme from a VS Code extension package">📦 Import VSIX</button>
      <button id="loadTemplateBtn" class="secondary tooltip" data-tooltip="Load a different template structure">🔧 Load Template</button>
      <span class="spacer"></span>
      <button id="bundleAdd" class="tooltip" data-tooltip="Add current theme to the bundle for multi-theme export">➕ Add to Bundle</button>
      <button id="bundleClear" class="secondary tooltip" data-tooltip="Clear all themes from the current bundle">🗑️ Clear Bundle</button>
      <button id="exportBundleVSIX" class="tooltip" data-tooltip="Export all bundled themes as a single VS Code extension">📦 Export Bundle</button>
      <span id="bundleCount" class="pill tooltip" data-tooltip="Number of themes in current bundle">0</span>
      <span class="spacer"></span>
      <button id="exportJSON" class="tooltip" data-tooltip="Export current theme as JSON file">💾 Export JSON</button>
      <button id="exportCSS" class="tooltip" data-tooltip="Export current theme as CSS variables">🎨 Export CSS</button>
      <button id="exportVSIX" class="tooltip" data-tooltip="Export current theme as VS Code extension package">📦 Export VSIX</button>
    </div>
  </header>

  <main>
    <aside id="categories"></aside>

    <section id="editor">
      <div id="searchBar">
        <input id="filter" placeholder="Search color keys..." class="tooltip" data-tooltip="Filter color keys by name (e.g., 'editor', 'button', 'sidebar')" />
        <span class="help-icon tooltip" data-tooltip="Use specific keywords to find related colors quickly. Try 'editor' for editor colors, 'ui' for interface colors.">?</span>
      </div>
      <div id="colorsList"></div>

      <h2>Token Colors <span class="help-icon tooltip" data-tooltip="Token colors control syntax highlighting for code elements like keywords, strings, comments, etc.">?</span></h2>
      <div id="tokensEditor"></div>

      <h2>Semantic Tokens <span class="help-icon tooltip" data-tooltip="Semantic tokens provide advanced syntax highlighting based on code meaning, not just syntax patterns.">?</span></h2>
      <div id="semanticEditor"></div>
    </section>

    <section id="sidebar">
      <div class="tabs">
        <button data-tab="preview" class="tab active tooltip" data-tooltip="Live preview of your theme with sample VS Code interface elements">🔍 Preview</button>
        <button data-tab="problems" class="tab tooltip" data-tooltip="View validation issues like invalid colors or unknown color keys">⚠️ Issues</button>
        <button data-tab="diff" class="tab tooltip" data-tooltip="See changes made to the selected color">📋 Changes</button>
      </div>

      <div id="tab-preview" class="tabpage active">
        <h2>Live Preview</h2>

        <div class="preview-grid">
          <!-- Title bar -->
          <div class="prev-card" data-element="titleBar.activeBackground">
            <h3>Title Bar</h3>
            <div class="vstitle"><span>index.ts — Theme Lab</span><span>🗕 🗖 ✖</span></div>
          </div>

          <!-- Buttons & input -->
          <div class="prev-card" data-element="button.background">
            <h3>Button & Input</h3>
            <div class="row">
              <button class="demo-btn">Primary</button>
              <input class="demo-input" placeholder="Type here…" />
            </div>
          </div>

          <!-- Activity bar -->
          <div class="prev-card" data-element="activityBar.background">
            <h3>Activity Bar</h3>
            <div class="activity">
              <div class="activity-item active" title="Explorer">🧭</div>
              <div class="activity-item" title="Search">🔎</div>
              <div class="activity-item" title="Source Control">🔀</div>
              <div class="activity-item" title="Run">▶</div>
            </div>
          </div>

          <!-- Editor shell -->
          <div class="prev-card" data-element="tab.activeBackground">
            <h3>Editor Shell</h3>
            <div class="vscontainer">
              <div class="vssidebar">
                <b>EXPLORER</b>
                <ul class="explorer">
                  <li class="active">src</li>
                  <li>media</li>
                </ul>
              </div>
              <div class="vseditor">
                <div class="vstabs">
                  <div class="vstab active">index.ts</div>
                  <div class="vstab">README.md</div>
                </div>
                <pre class="ed"><code>
<span class="line"><span class="tok-comment">// Quick sample</span></span>
<span class="line hl"><span class="tok-keyword">function</span> <span class="tok-func">hello</span>(<span class="tok-var">name</span>: <span class="tok-keyword">string</span>) {</span>
<span class="line">  <span class="tok-keyword">const</span> <span class="tok-var">msg</span> = <span class="tok-string">\`Hello, \${name}\`</span>;</span>
<span class="line">  <span class="tok-keyword">return</span> <span class="tok-var">msg</span>;</span>
<span class="line">}</span>
<span class="line"><span class="tok-var">hello</span>(<span class="tok-string">"World"</span>);<span class="cursor"></span></span>
                </code></pre>
              </div>
            </div>
          </div>

          <!-- Panel -->
          <div class="prev-card" data-element="panel.background">
            <h3>Panel</h3>
            <div class="panel">
              <div class="panel-header">Problems</div>
              <div class="panel-body">
                <div class="panel-row warn">src/index.ts:42 Unused variable</div>
                <div class="panel-row bad">src/app.ts:5  Cannot read property 'x'</div>
              </div>
            </div>
          </div>

          <!-- Status bar -->
          <div class="prev-card" data-element="statusBar.background">
            <h3>Status Bar</h3>
            <div class="vstitle" style="background: var(--pv-statusbar-bg); color: var(--pv-statusbar-fg);">
              <span>$(branch) main</span><span>UTF-8  LF  TypeScript</span>
            </div>
          </div>
        </div>

        <p class="hint">Selecting a key highlights the matching card and updates the preview using your colors.</p>
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