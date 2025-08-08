import * as vscode from "vscode";
import { ThemeLabPanel } from "./panels/ThemeLabPanel";

/** Activate: register the single entry command and open the panel */
export function activate (context: vscode.ExtensionContext) {
	const cmd = vscode.commands.registerCommand("themeLab.open", () => {
		new ThemeLabPanel(context);
	});
	context.subscriptions.push(cmd);
}

/** Deactivate hook; no-op */
export function deactivate () {}
