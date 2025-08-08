import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { parse } from "jsonc-parser";
import { ThemeSpec } from "../../core/types";

/**
 * Find the active theme's JSON by label in installed extensions.
 */
export async function importCurrentTheme (): Promise<ThemeSpec | null> {
	const label = vscode.workspace.getConfiguration("workbench").get<string>("colorTheme");
	if (!label) return null;

	for (const ext of vscode.extensions.all) {
		const contributes = (ext.packageJSON?.contributes?.themes ?? []) as any[];
		for (const t of contributes) {
			if (t.label === label) {
				const themePath = path.join(ext.extensionPath, t.path);
				if (fs.existsSync(themePath)) {
					const raw = fs.readFileSync(themePath, "utf8");
					return parse(raw) as ThemeSpec;
				}
			}
		}
	}
	return null;
}
