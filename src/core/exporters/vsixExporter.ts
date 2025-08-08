import * as path from "path";
import * as vscode from "vscode";
import * as fs from "fs";
import AdmZip from "adm-zip";
import { ThemeSpec } from "../types";

/**
 * Create a minimal theme extension VSIX containing one theme file.
 */
export async function exportAsVsix (theme: ThemeSpec): Promise<void> {
	const saveUri = await vscode.window.showSaveDialog({
		filters: { VSIX: ["vsix"] },
		saveLabel: "Save VSIX",
		defaultUri: vscode.Uri.file(path.join(process.cwd(), toKebab(theme.name) + ".vsix"))
	});
	if (!saveUri) return;

	const zip = new AdmZip();

	const pkgJson = {
		name: toKebab(theme.name),
		displayName: theme.name,
		publisher: "local",
		version: "0.0.1",
		engines: { vscode: "^1.90.0" },
		categories: ["Themes"],
		contributes: {
			themes: [
				{
					label: theme.name,
					uiTheme: theme.type === "light" ? "vs" : theme.type === "hc" ? "hc-black" : "vs-dark",
					path: "./themes/theme.json"
				}
			]
		}
	};

	zip.addFile("extension/package.json", Buffer.from(JSON.stringify(pkgJson, null, 2), "utf8"));
	zip.addFile("extension/themes/theme.json", Buffer.from(JSON.stringify(theme, null, 2), "utf8"));

	await fs.promises.writeFile(saveUri.fsPath, zip.toBuffer());
	vscode.window.showInformationMessage(`Saved VSIX to ${saveUri.fsPath}`);
}

function toKebab (s: string): string {
	return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
