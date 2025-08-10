// Purpose: export flows (JSON, CSS, VSIX) for current ThemeState.

import * as vscode from "vscode";
import JSZip from "jszip";
import { ThemeState } from "./themeState";

function toThemeJson(state: ThemeState) {
	return {
		name: state.name,
		type: state.type,
		colors: state.colors,
		tokenColors: state.tokenColors,
		semanticTokenColors: state.semanticTokenColors,
	};
}

export async function exportJson(state: ThemeState, targetUri: vscode.Uri) {
	const json = JSON.stringify(toThemeJson(state), null, 2);
	await vscode.workspace.fs.writeFile(targetUri, Buffer.from(json, "utf8"));
}

function sanitizeVarName(key: string) {
	return key.replace(/[^a-z0-9\-_.]/gi, "_");
}

export async function exportCss(state: ThemeState, targetUri: vscode.Uri) {
	const lines: string[] = [];
	lines.push(":root {");
	for (const [k, v] of Object.entries(state.colors)) {
		lines.push(`  --themelab-${sanitizeVarName(k)}: ${v};`);
	}
	lines.push("}");
	await vscode.workspace.fs.writeFile(
		targetUri,
		Buffer.from(lines.join("\n"), "utf8")
	);
}

export async function exportVsix(state: ThemeState, targetUri: vscode.Uri) {
	const zip = new JSZip();
	const pkg = {
		name: state.name.toLowerCase().replace(/\s+/g, "-"),
		displayName: state.name,
		version: "0.0.1",
		publisher: "your-publisher-id",
		engines: { vscode: "^1.90.0" },
		contributes: {
			themes: [
				{
					label: state.name,
					uiTheme: state.type === "light" ? "vs" : "vs-dark",
					path: "./themes/theme-lab-color-theme.json",
				},
			],
		},
	};
	const themeJson = JSON.stringify(
		{ $schema: "vscode://schemas/color-theme", ...toThemeJson(state) },
		null,
		2
	);

	zip.file("package.json", JSON.stringify(pkg, null, 2));
	zip.folder("themes")!.file("theme-lab-color-theme.json", themeJson);

	const content = await zip.generateAsync({ type: "nodebuffer" });
	await vscode.workspace.fs.writeFile(targetUri, content);
}
