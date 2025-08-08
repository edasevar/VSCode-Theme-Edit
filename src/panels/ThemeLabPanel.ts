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

/**
 * Webview UI host. Handles:
 *  - loading template and sending descriptions/categories to the webview
 *  - receiving edits and applying live preview
 *  - import/export commands
 */
export class ThemeLabPanel implements vscode.Disposable {
	public static readonly viewType = "themeLab.panel";
	private readonly panel: vscode.WebviewPanel;
	private disposables: vscode.Disposable[] = [];
	private theme: ThemeSpec;
	private liveEnabled = true;

	constructor(private readonly ctx: vscode.ExtensionContext) {
		this.theme = blankTheme();

		this.panel = vscode.window.createWebviewPanel(
			ThemeLabPanel.viewType,
			"Theme Lab",
			vscode.ViewColumn.Active,
			{
				enableScripts: true,
				retainContextWhenHidden: true,
				localResourceRoots: [vscode.Uri.file(path.join(ctx.extensionPath, "media"))]
			}
		);

		this.panel.webview.html = this.getHtml(this.panel.webview);

		// Load template (descriptions + categories) and send to webview
		const tplPath = path.join(ctx.extensionPath, "assets", "template.jsonc");
		const { theme, descriptions, categories } = loadTemplateJsonc(tplPath);
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
			await resetLivePreview();
			this.dispose();
		});
	}

	private async onMessage (msg: any) {
		try {
			switch (msg.type) {
				case "toggleLive":
					this.liveEnabled = !!msg.value;
					if (!this.liveEnabled) await resetLivePreview();
					else await applyLivePreview(this.theme);
					break;

				case "startBlank":
					this.theme = blankTheme();
					await this.maybeApply();
					break;

				case "useCurrentTheme": {
					const t = await importCurrentTheme();
					if (t) {
						this.theme = t;
						await this.maybeApply();
						this.panel.webview.postMessage({ type: "themeLoaded", theme: this.theme });
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
						this.theme = importVsixTheme(file[0].fsPath);
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
					break;

				case "setType":
					this.theme.type = msg.value === "light" ? "light" : msg.value === "hc" ? "hc" : "dark";
					await this.maybeApply();
					break;

				default:
					break;
			}
		} catch (err: any) {
			vscode.window.showErrorMessage(err?.message ?? String(err));
		}
	}

	private async maybeApply () {
		if (this.liveEnabled) await applyLivePreview(this.theme);
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

	dispose (): void {
		this.disposables.forEach(d => d.dispose());
	}
}
