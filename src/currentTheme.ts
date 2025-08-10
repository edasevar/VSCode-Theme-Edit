// Purpose: load the active theme's JSON from installed extensions if available.

import * as vscode from "vscode";
import * as path from "path";
import { promises as fs } from "fs";

export async function readCurrentThemeJson(): Promise<any | undefined> {
	const label = vscode.workspace
		.getConfiguration("workbench")
		.get<string>("colorTheme");
	if (!label) return undefined;

	for (const ext of vscode.extensions.all) {
		const contrib: any = ext.packageJSON?.contributes?.themes;
		if (!Array.isArray(contrib)) continue;
		for (const t of contrib) {
			if (t?.label === label) {
				const themePath = path.join(ext.extensionPath, t.path);
				try {
					const raw = await fs.readFile(themePath, "utf8");
					return JSON.parse(raw);
				} catch {
					return undefined;
				}
			}
		}
	}
	return undefined;
}

export function readAppliedCustomizations() {
	const wb =
		vscode.workspace
			.getConfiguration("workbench")
			.get<any>("colorCustomizations") || {};
	const sem = vscode.workspace
		.getConfiguration("editor")
		.get<any>("semanticTokenColorCustomizations") || { enabled: true };
	const tmc =
		vscode.workspace
			.getConfiguration("editor")
			.get<any>("tokenColorCustomizations") || {};
	return { workbench: wb, semantic: sem, token: tmc };
}
