import AdmZip from "adm-zip";
import { parse } from "jsonc-parser";
import { ThemeSpec } from "../../core/types";
import * as vscode from "vscode";

/**
 * Open a .vsix and extract the selected contributed theme JSON.
 * If multiple themes exist, prompt the user to choose.
 */
export async function importVsixTheme (vsixPath: string): Promise<ThemeSpec> {
	const zip = new AdmZip(vsixPath);
	const entries = zip.getEntries();

	const pkgEntry = entries.find(e => /(^|\/)extension\/package\.json$/.test(e.entryName));
	if (!pkgEntry) throw new Error("package.json not found in VSIX");

	const pkg = JSON.parse(pkgEntry.getData().toString("utf8"));
	const themes = (pkg.contributes?.themes ?? []) as any[];
	if (!themes.length) throw new Error("No themes contributed in VSIX");

	let picked = themes[0];
	if (themes.length > 1) {
		const items = themes.map((t: any) => ({
			label: t.label || t.id || t.path,
			description: t.uiTheme || "",
			path: String(t.path)
		}));

		const pick = await vscode.window.showQuickPick(items, {
			title: "Select a theme from VSIX",
			canPickMany: false
		});
		if (!pick) throw new Error("Selection cancelled.");
		picked = themes.find((t: any) => String(t.path) === pick.path);
	}

	const themeRel = String(picked.path).replace(/^\.\//, "");
	const themeEntry = entries.find(e => e.entryName.endsWith(`/extension/${themeRel}`));
	if (!themeEntry) throw new Error(`Theme file ${themeRel} not found inside VSIX`);

	const themeJson = themeEntry.getData().toString("utf8");
	return parse(themeJson) as ThemeSpec;
}
