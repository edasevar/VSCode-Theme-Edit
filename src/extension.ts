import * as vscode from 'vscode';
import { ThemeDesignerPanel } from './panel/ThemeDesignerPanel';
import { ImportExport } from './services/ImportExport';
import { TemplateLoader } from './services/TemplateLoader';
import { ThemeState } from './services/ThemeState';

let state: ThemeState;

export async function activate (context: vscode.ExtensionContext) {
	state = new ThemeState(context);

	// Open designer
	context.subscriptions.push(
		vscode.commands.registerCommand('themeDesigner.open', async () => {
			const panel = ThemeDesignerPanel.createOrShow(context.extensionUri, state);
			panel.reveal();
		})
	);

	// Import JSON
	context.subscriptions.push(
		vscode.commands.registerCommand('themeDesigner.import.json', async () => {
			const jsonDoc = await ImportExport.pickJson();
			if (!jsonDoc) return;
			await state.loadFromJson(jsonDoc);
			ThemeDesignerPanel.refreshIfOpen();
		})
	);

	// Import VSIX
	context.subscriptions.push(
		vscode.commands.registerCommand('themeDesigner.import.vsix', async () => {
			const theme = await ImportExport.pickVsixAndExtractTheme();
			if (!theme) return;
			await state.loadFromJson(theme);
			ThemeDesignerPanel.refreshIfOpen();
		})
	);

	// Import current theme (best-effort)
	context.subscriptions.push(
		vscode.commands.registerCommand('themeDesigner.import.current', async () => {
			const theme = await ImportExport.readCurrentTheme();
			if (!theme) {
				vscode.window.showWarningMessage('Could not resolve current theme JSON. Falling back to workbench color customizations.');
			}
			await state.loadFromJson(theme ?? await ImportExport.readCustomizationsFallback());
			ThemeDesignerPanel.refreshIfOpen();
		})
	);

	// Exporters
	context.subscriptions.push(
		vscode.commands.registerCommand('themeDesigner.export.json', async () => {
			await ImportExport.exportJson(state.getThemeJson(), state.themeName());
		}),
		vscode.commands.registerCommand('themeDesigner.export.css', async () => {
			await ImportExport.exportCss(state.getThemeJson(), state.themeName());
		}),
		vscode.commands.registerCommand('themeDesigner.export.vsix', async () => {
			await ImportExport.exportVsix(state.getThemeJson(), state.themeName());
		})
	);

	// Initialize default from template if blank
	if (!state.hasTheme()) {
		const template = await TemplateLoader.loadTemplate(context.extensionUri);
		await state.loadFromJson(template); // parsed from your template with groups + descriptions
	}
}

export function deactivate () {
	// ensure live preview cleanup
	if (state) {
		state.dispose();
	}
}
