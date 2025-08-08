import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import AdmZip from 'adm-zip';
import JSZip from 'jszip';
import { ThemeJson } from '../types/theme';
import { cssFromTheme } from '../utils/css';

export class ImportExport {
	static async pickJson (): Promise<ThemeJson | undefined> {
		const sel = await vscode.window.showOpenDialog({ filters: { 'JSON': ['json'] }, canSelectMany: false });
		if (!sel) return;
		const txt = await fs.readFile(sel[0].fsPath, 'utf-8');
		return JSON.parse(txt);
	}

	static async pickVsixAndExtractTheme (): Promise<ThemeJson | undefined> {
		const sel = await vscode.window.showOpenDialog({ filters: { 'VSIX': ['vsix'] }, canSelectMany: false });
		if (!sel) return;
		const zip = new AdmZip(sel[0].fsPath);
		// try common location: extension root or under themes/
		const entries = zip.getEntries();
		const themeEntry = entries.find(e => /themes?\/.*\.json$/i.test(e.entryName)) ?? entries.find(e => /\.json$/i.test(e.entryName));
		if (!themeEntry) {
			vscode.window.showErrorMessage('Could not find theme JSON in VSIX.');
			return;
		}
		const json = JSON.parse(themeEntry.getData().toString('utf-8'));
		return json;
	}

	static async readCurrentTheme (): Promise<ThemeJson | undefined> {
		// Best-effort: find active theme extension by label and read its JSON
		const currentLabel = vscode.workspace.getConfiguration('workbench').get<string>('colorTheme');
		if (!currentLabel) return;
		const ext = vscode.extensions.all.find(e => {
			const contrib = e.packageJSON?.contributes?.themes as any[] | undefined;
			return contrib?.some(t => t.label === currentLabel || t.id === currentLabel || t.uiTheme || t.path);
		});
		if (!ext) return;
		const contrib = ext.packageJSON?.contributes?.themes as any[] | undefined;
		const theme = contrib?.find(t => t.label === currentLabel) ?? contrib?.[0];
		if (!theme) return;
		const themePath = path.join(ext.extensionPath, theme.path);
		const txt = await fs.readFile(themePath, 'utf-8');
		return JSON.parse(txt);
	}

	static async readCustomizationsFallback (): Promise<ThemeJson> {
		const colors = vscode.workspace.getConfiguration().get<any>('workbench.colorCustomizations') ?? {};
		const tokenColors = vscode.workspace.getConfiguration().get<any>('editor.tokenColorCustomizations') ?? {};
		return {
			$schema: "vscode://schemas/color-theme",
			name: "Imported from current customizations",
			type: "dark",
			colors,
			tokenColors: Array.isArray(tokenColors) ? tokenColors : [],
			semanticTokenColors: {}
		};
	}

	static async exportJson (theme: ThemeJson, name: string) {
		const uri = await vscode.window.showSaveDialog({ filters: { 'JSON': ['json'] }, defaultUri: vscode.Uri.file(`${name || 'theme'}.json`) });
		if (!uri) return;
		await fs.writeFile(uri.fsPath, JSON.stringify(theme, null, 2), 'utf-8');
		vscode.window.showInformationMessage('Theme exported as JSON.');
	}

	static async exportCss (theme: ThemeJson, name: string) {
		const uri = await vscode.window.showSaveDialog({ filters: { 'CSS': ['css'] }, defaultUri: vscode.Uri.file(`${name || 'theme'}.css`) });
		if (!uri) return;
		const css = cssFromTheme(theme);
		await fs.writeFile(uri.fsPath, css, 'utf-8');
		vscode.window.showInformationMessage('Theme exported as CSS variables.');
	}

	static async exportVsix (theme: ThemeJson, name: string) {
		const zip = new JSZip();
		// minimal extension structure
		const manifest = {
			name: (name || 'theme-designer-theme').toLowerCase().replace(/\s+/g, '-'),
			displayName: name || 'My Theme',
			publisher: "you",
			version: "0.0.1",
			engines: { vscode: "^1.90.0" },
			contributes: {
				themes: [
					{
						label: name || "My Theme",
						uiTheme: theme.type === 'light' ? "vs" : "vs-dark",
						path: "./themes/theme.json"
					}
				]
			}
		};
		zip.file('package.json', JSON.stringify(manifest, null, 2));
		zip.folder('themes')?.file('theme.json', JSON.stringify(theme, null, 2));

		const buf = await zip.generateAsync({ type: 'nodebuffer' });
		const uri = await vscode.window.showSaveDialog({ filters: { 'VSIX': ['vsix'] }, defaultUri: vscode.Uri.file(`${name || 'theme'}.vsix`) });
		if (!uri) return;
		await fs.writeFile(uri.fsPath, buf);
		vscode.window.showInformationMessage('Theme exported as VSIX. You can install it via Extensions: Install from VSIX.');
	}
}
