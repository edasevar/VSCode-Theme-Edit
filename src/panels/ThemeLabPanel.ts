import * as vscode from "vscode";
import * as path from "path";
import { loadTemplateJsonc } from "../core/templateParser";
import { ThemeSpec } from "../core/types";
import { blankTheme } from "../core/themeModel";
import { importJsonTheme } from "../core/importers/jsonImporter";
import { importVsixTheme } from "../core/importers/vsixImporter";
import { importCurrentTheme } from "../core/importers/currentThemeImporter";
import { applyLivePreview, resetLivePreview } from "../core/livePreview";
import { exportAsCss } from "../core/exporters/cssExporter";
import { exportAsJson } from "../core/exporters/jsonExporter";
import { exportAsVsix } from "../core/exporters/vsixExporter";
import { exportAsVsixBundle } from "../core/exporters/vsixBundleExporter";
import { Storage, UiState } from "../core/storage";
import { ThemeBundle } from "../core/bundleModel";
import { invalidColors, unknownColorKeys } from "../core/validation";

/**
 * Webview UI host: template loading, state, validation, import/export, bundle, autosave.
 */
export class ThemeLabPanel implements vscode.Disposable {
	public static readonly viewType = "themeLab.panel";
	private readonly panel: vscode.WebviewPanel;
	private disposables: vscode.Disposable[] = [];
	private theme: ThemeSpec;
	private liveEnabled = true;
	private knownKeys = new Set<string>();
	private storage: Storage;
	private bundle: ThemeBundle;

	constructor(private readonly ctx: vscode.ExtensionContext) {
		this.storage = new Storage(ctx);
		const persisted = this.storage.load();
		this.theme = persisted.theme ?? blankTheme();
		this.bundle = new ThemeBundle(persisted.bundle);

		this.panel = vscode.window.createWebviewPanel(
			ThemeLabPanel.viewType,
			"Theme Lab",
			vscode.ViewColumn.Active,
			{
				enableScripts: true,
				retainContextWhenHidden: true,
				localResourceRoots: [this.ctx.extensionUri]
			}
		);

		this.panel.webview.html = this.getHtml(this.panel.webview);

		// Load template -> descriptions/categories
		const tplPath = path.join(ctx.extensionPath, "assets", "template.jsonc");
		const { theme, descriptions, categories } = loadTemplateJsonc(tplPath);
		Object.values(categories).forEach(list => list.forEach(k => this.knownKeys.add(k)));

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

		this.panel.webview.onDidReceiveMessage(this.onMessage.bind(this), null, this.disposables);

		this.panel.onDidDispose(async () => {
			await resetLivePreview();
			this.dispose();
		});

		if (persisted.ui?.liveEnabled) {
			this.liveEnabled = true;
			void applyLivePreview(this.theme);
		}
	}

	private async onMessage (msg: any) {
		try {
			switch (msg.type) {
				case "uiStateChanged": {
					const ui = msg.ui as UiState;
					this.liveEnabled = !!ui.liveEnabled;
					await this.storage.saveUi(ui);
					break;
				}
				case "themeChanged": {
					this.theme = msg.theme as ThemeSpec;
					await this.storage.saveTheme(this.theme);
					await this.runValidation();
					if (this.liveEnabled) await applyLivePreview(this.theme);
					break;
				}

				case "toggleLive":
					this.liveEnabled = !!msg.value;
					await this.storage.saveUi({ ...(this.storage.load().ui ?? { filter: "" }), liveEnabled: this.liveEnabled });
					if (!this.liveEnabled) await resetLivePreview();
					else await applyLivePreview(this.theme);
					break;

				case "startBlank":
					this.theme = blankTheme();
					await this.onThemeUpdated();
					break;

				case "useCurrentTheme": {
					const t = await importCurrentTheme();
					if (t) {
						this.theme = t;
						await this.onThemeUpdated();
					} else {
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
						this.theme = importJsonTheme(file[0].fsPath);
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
						this.theme = await importVsixTheme(file[0].fsPath);
						await this.onThemeUpdated();
					}
					break;
				}

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

				case "exportJSON": {
					const data = exportAsJson(this.theme);
					await this.saveString(data, "json");
					break;
				}

				case "exportCSS": {
					const data = exportAsCss(this.theme);
					await this.saveString(data, "css");
					break;
				}

				case "exportVSIX":
					await exportAsVsix(this.theme);
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
					await exportAsVsixBundle(this.bundle.list());
					break;

				default:
					break;
			}
		} catch (err: any) {
			vscode.window.showErrorMessage(err?.message ?? String(err));
		}
	}

	private async onThemeUpdated (postBack: boolean = true) {
		await this.storage.saveTheme(this.theme);
		await this.runValidation();
		if (this.liveEnabled) await applyLivePreview(this.theme);
		if (postBack) {
			this.panel.webview.postMessage({ type: "themeLoaded", theme: this.theme });
		}
	}

	private async runValidation () {
		const unknown = unknownColorKeys(this.theme, this.knownKeys);
		const bad = invalidColors(this.theme);
		this.panel.webview.postMessage({ type: "problems", data: { unknown, bad } });
	}

	private async saveString (contents: string, ext: "json" | "css") {
		const defaultName = this.theme.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
		const dest = await vscode.window.showSaveDialog({
			filters: { [ext.toUpperCase()]: [ext] },
			defaultUri: vscode.Uri.file(`${defaultName}.${ext}`)
		});
		if (!dest) return;
		await vscode.workspace.fs.writeFile(dest, Buffer.from(contents, "utf8"));
		vscode.window.showInformationMessage(`Saved ${ext.toUpperCase()} to ${dest.fsPath}`);
	}

	private getHtml (webview: vscode.Webview): string {
		const mediaRoot = vscode.Uri.joinPath(this.ctx.extensionUri, "media");
		const cssUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaRoot, "app.css"));
		const jsUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaRoot, "app.js"));
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
  ">
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

	dispose (): void {
		this.disposables.forEach(d => d.dispose());
	}
}
