// Purpose: activate Theme Lab, open webview, handle messages, apply live preview, import/export.

import * as vscode from "vscode";
import { ThemeState } from "./themeState";
import { parse as parseJsonc } from "jsonc-parser";
import {
	importBlank,
	importFromCurrent,
	importFromJson,
	importFromVsix,
} from "./importers";
import { exportCss, exportJson, exportVsix } from "./exporters";

let panel: vscode.WebviewPanel | undefined;
let state: ThemeState | undefined;

function settingsTarget(): vscode.ConfigurationTarget {
	const applyToWs = vscode.workspace
		.getConfiguration("theme-lab")
		.get<boolean>("preview.applyToWorkspace", true);
	return applyToWs
		? vscode.ConfigurationTarget.Workspace
		: vscode.ConfigurationTarget.Global;
}

async function applyLivePreview(s: ThemeState) {
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
	await ed.update(
		"tokenColorCustomizations",
		{ [kind]: { textMateRules: tmr } },
		target
	);
}

function getMediaUri(
	webview: vscode.Webview,
	ctx: vscode.ExtensionContext,
	p: string[]
) {
	return webview
		.asWebviewUri(vscode.Uri.joinPath(ctx.extensionUri, ...p))
		.toString();
}

async function ensureStateWith(
	mode: "blank" | "current" | "import-json" | "import-vsix",
	ctx: vscode.ExtensionContext
) {
	if (mode === "blank") state = importBlank("dark");
	if (mode === "current") state = await importFromCurrent();
	if (mode === "import-json") {
		const pick = await vscode.window.showOpenDialog({
			filters: { "JSON Files": ["json"] },
			canSelectMany: false,
		});
		if (!pick) return;
		state = await importFromJson(pick[0]);
	}
	if (mode === "import-vsix") {
		const pick = await vscode.window.showOpenDialog({
			filters: { "VSIX Files": ["vsix"] },
			canSelectMany: false,
		});
		if (!pick) return;
		state = await importFromVsix(pick[0]);
	}
	if (state) await applyLivePreview(state);
}

export function activate(context: vscode.ExtensionContext) {
	const open = vscode.commands.registerCommand("theme-lab.open", async () => {
		if (!panel) {
			panel = vscode.window.createWebviewPanel(
				"themeLab",
				"Theme Lab",
				{ viewColumn: vscode.ViewColumn.One, preserveFocus: false },
				{
					enableScripts: true,
					retainContextWhenHidden: true,
					localResourceRoots: [
						vscode.Uri.joinPath(context.extensionUri, "media"),
						vscode.Uri.joinPath(context.extensionUri, "assets"),
					],
				}
			);

			// Always grab the webview reference first and reuse it.
			const webview = panel.webview;

			const html = Buffer.from(
				await vscode.workspace.fs.readFile(
					vscode.Uri.joinPath(context.extensionUri, "media", "webview.html")
				)
			).toString("utf8");

			// Read the template (prefers assets/template.json, falls back to template.jsonc), then inline it.
			async function readTemplateText(): Promise<string> {
				const jsonUri = vscode.Uri.joinPath(
					context.extensionUri,
					"assets",
					"template.json"
				);
				const jsoncUri = vscode.Uri.joinPath(
					context.extensionUri,
					"assets",
					"template.jsonc"
				);
				try {
					return Buffer.from(
						await vscode.workspace.fs.readFile(jsonUri)
					).toString("utf8");
				} catch {
					try {
						return Buffer.from(
							await vscode.workspace.fs.readFile(jsoncUri)
						).toString("utf8");
					} catch {
						return "{}";
					}
				}
			}
			const templateRaw = await readTemplateText();
			const templateObj = parseJsonc(templateRaw) ?? {};
			const safeJsonForInline = (s: string) =>
				s
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
			const nonce =
				Math.random().toString(36).slice(2) + Date.now().toString(36);
			panel.webview.html = html
				.replace(/\{\{script\}\}/g, scriptUri)
				.replace(/\{\{styles\}\}/g, stylesUri)
				.replace(/\{\{previewCss\}\}/g, previewCssUri)
				.replace(/\{\{cspSource\}\}/g, cspSource)
				.replace(/\{\{templateInline\}\}/g, templateInline)
				.replace(/\{\{nonce\}\}/g, nonce);

			panel.onDidDispose(() => (panel = undefined));

			webview.onDidReceiveMessage(async (msg: any) => {
				try {
					if (msg.type === "init-request") {
						// default boot path: use current theme if available, else blank
						if (!state) state = await importFromCurrent();
						webview.postMessage({ type: "init-data", state });
					}

					if (msg.type === "set-state") {
						state = msg.state as ThemeState;
						await applyLivePreview(state!);
					}

					if (msg.type === "choose-start") {
						await ensureStateWith(msg.mode, context);
						webview.postMessage({ type: "init-data", state });
					}

					if (msg.type === "export") {
						const fmt = msg.format as "json" | "css" | "vsix";
						if (!state) return;
						if (fmt === "json") {
							const dest = await vscode.window.showSaveDialog({
								saveLabel: "Export JSON Theme",
								filters: { JSON: ["json"] },
								defaultUri: vscode.Uri.file(
									`${state.name.replace(/\s+/g, "-")}.json`
								),
							});
							if (dest) await exportJson(state, dest);
						} else if (fmt === "css") {
							const dest = await vscode.window.showSaveDialog({
								saveLabel: "Export CSS Variables",
								filters: { CSS: ["css"] },
								defaultUri: vscode.Uri.file(
									`${state.name.replace(/\s+/g, "-")}.css`
								),
							});
							if (dest) await exportCss(state, dest);
						} else if (fmt === "vsix") {
							const dest = await vscode.window.showSaveDialog({
								saveLabel: "Export VSIX",
								filters: { VSIX: ["vsix"] },
								defaultUri: vscode.Uri.file(
									`${state.name.replace(/\s+/g, "-")}.vsix`
								),
							});
							if (dest) await exportVsix(state, dest);
						}
					}
				} catch (err: any) {
					vscode.window.showErrorMessage(`Theme Lab: ${err?.message || err}`);
				}
			});
		}

		panel.reveal(vscode.ViewColumn.One, false);
	});

	const importVsixCmd = vscode.commands.registerCommand(
		"theme-lab.importVsix",
		async () => {
			await ensureStateWith("import-vsix", context);
			vscode.commands.executeCommand("theme-lab.open");
		}
	);

	const importJsonCmd = vscode.commands.registerCommand(
		"theme-lab.importJson",
		async () => {
			await ensureStateWith("import-json", context);
			vscode.commands.executeCommand("theme-lab.open");
		}
	);

	const startBlankCmd = vscode.commands.registerCommand(
		"theme-lab.startBlank",
		async () => {
			await ensureStateWith("blank", context);
			vscode.commands.executeCommand("theme-lab.open");
		}
	);

	const useCurrentCmd = vscode.commands.registerCommand(
		"theme-lab.useCurrent",
		async () => {
			await ensureStateWith("current", context);
			vscode.commands.executeCommand("theme-lab.open");
		}
	);

	context.subscriptions.push(
		open,
		importVsixCmd,
		importJsonCmd,
		startBlankCmd,
		useCurrentCmd
	);
}

export function deactivate() {}
