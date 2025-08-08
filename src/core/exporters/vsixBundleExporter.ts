import * as vscode from "vscode";
import AdmZip from "adm-zip";
import { ThemeSpec } from "../types";

/**
 * Bundle multiple themes into one VSIX, adding:
 *  - package.json with contributes.themes[]
 *  - README.md auto-generated
 *  - icon.png (1x1 transparent PNG)
 */
export async function exportAsVsixBundle (themes: ThemeSpec[]): Promise<void> {
	if (!themes.length) {
		vscode.window.showWarningMessage("Bundle is empty. Add at least one theme.");
		return;
	}

	const defaultName = safeKebab(`${themes[0].name || "theme"}-bundle`);
	const saveUri = await vscode.window.showSaveDialog({
		filters: { VSIX: ["vsix"] },
		saveLabel: "Save Bundle VSIX",
		defaultUri: vscode.Uri.file(`${defaultName}.vsix`)
	});
	if (!saveUri) return;

	const zip = new AdmZip();

	const contributes = themes.map((t, i) => ({
		label: t.name || `Theme ${i + 1}`,
		uiTheme: t.type === "light" ? "vs" : t.type === "hc" ? "hc-black" : "vs-dark",
		path: `./themes/${safeKebab(t.name || `theme-${i + 1}`)}.json`
	}));

	const pkgJson = {
		name: defaultName,
		displayName: titleCase(defaultName),
		icon: "icon.png",
		publisher: "local",
		version: "0.0.1",
		engines: { vscode: "^1.90.0" },
		categories: ["Themes"],
		contributes: { themes: contributes }
	};

	zip.addFile("extension/package.json", Buffer.from(JSON.stringify(pkgJson, null, 2), "utf8"));

	const readme = [
		`# ${titleCase(defaultName)}`,
		"",
		"This VSIX bundles multiple VS Code themes:",
		...themes.map((t, i) => `- **${t.name || `Theme ${i + 1}`}** (${t.type})`)
	].join("\n");
	zip.addFile("extension/README.md", Buffer.from(readme, "utf8"));

	const transparentPngBase64 =
		"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";
	zip.addFile("extension/icon.png", Buffer.from(transparentPngBase64, "base64"));

	for (let i = 0; i < themes.length; i++) {
		const t = themes[i];
		const p = `extension/themes/${safeKebab(t.name || `theme-${i + 1}`)}.json`;
		zip.addFile(p, Buffer.from(JSON.stringify(t, null, 2), "utf8"));
	}

	await vscode.workspace.fs.writeFile(saveUri, zip.toBuffer());
	vscode.window.showInformationMessage(`Saved bundle VSIX to ${saveUri.fsPath}`);
}

function safeKebab (s: string): string {
	return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function titleCase (s: string): string {
	return s.replace(/(^|-)([a-z])/g, (_, p1, c) => (p1 ? " " : "") + c.toUpperCase());
}
