import * as vscode from "vscode";
import { ThemeLabPanel } from "./panels/ThemeLabPanel";

/** Activate: register the single entry command and open the panel */
export function activate (context: vscode.ExtensionContext) {
	const cmd = vscode.commands.registerCommand("themeLab.open", () => {
		new ThemeLabPanel(context);
	});
	context.subscriptions.push(cmd);

	const toggleSemantic = vscode.commands.registerCommand("themeLab.toggleSemanticTokens", async () => {
		const cfg = vscode.workspace.getConfiguration();
		const key = "themeLab.semanticTokensEnabled";
		const current = cfg.get<boolean>(key, true);
	const next = !current;
	await cfg.update(key, next, vscode.ConfigurationTarget.Global);
	// Also flip the VS Code semantic customization enabled flag immediately
	const semKey = "editor.semanticTokenColorCustomizations";
	const existing = cfg.get<Record<string, unknown>>(semKey);
	const updated: Record<string, unknown> = { ...(existing ?? {}), enabled: next };
	await cfg.update(semKey, updated, vscode.ConfigurationTarget.Global);
	vscode.window.showInformationMessage(`Theme Lab: Semantic token colors ${next ? "enabled" : "disabled"}.`);
		// Optionally reapply live preview if any ThemeLabPanel is open. We don't keep a global theme ref here, so we rely on panel logic to apply on next change.
	});
	context.subscriptions.push(toggleSemantic);
}

/** Deactivate hook; no-op */
export function deactivate () {}
