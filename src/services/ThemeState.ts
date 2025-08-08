import * as vscode from 'vscode';
import { ParsedTemplate, ThemeJson } from '../types/theme';
import { TemplateLoader } from './TemplateLoader';

export class ThemeState {
	private theme: ThemeJson | undefined;
	private parsed: ParsedTemplate | undefined;

	constructor(private ctx: vscode.ExtensionContext) {}

	hasTheme () { return !!this.theme; }

	async loadFromJson (json: ThemeJson) {
		this.theme = json;
		// sync parsed template (groups + descriptions + values)
		const tpl = await TemplateLoader.loadTemplate(this.ctx.extensionUri);
		this.parsed = TemplateLoader.buildGroups(tpl, json);
		await this.applyLivePreview();
	}

	getThemeJson (): ThemeJson {
		if (!this.theme) throw new Error('Theme not loaded');
		return this.theme;
	}

	themeName (): string {
		return this.theme?.name || 'Untitled Theme';
	}

	getWebviewInitPayload () {
		if (!this.parsed) throw new Error('Template not parsed');
		return {
			themeName: this.themeName(),
			groups: this.parsed.groups
		};
	}

	async applyChange (groupId: string, key: string, value: string) {
		if (!this.theme) return;
		this.theme.colors = this.theme.colors || {};
		this.theme.colors[key] = value;
		// update parsed cache value
		const g = this.parsed?.groups.find(g => g.id === groupId);
		const it = g?.items.find(i => i.key === key);
		if (it) it.value = value;
	}

	async resetKey (key: string) {
		if (!this.theme || !this.parsed) return;
		delete this.theme.colors?.[key];
		const it = this.parsed.groups.flatMap(g => g.items).find(i => i.key === key);
		if (it) it.value = '';
	}

	async applyLivePreview () {
		if (!this.theme) return;
		const colors = this.theme.colors ?? {};
		const target = vscode.workspace.getConfiguration();
		await target.update('workbench.colorCustomizations', colors, vscode.ConfigurationTarget.Workspace);
	}

	dispose () {
		// remove our color customizations to avoid leaving the workspace dirty
		const target = vscode.workspace.getConfiguration();
		target.update('workbench.colorCustomizations', undefined, vscode.ConfigurationTarget.Workspace);
	}
}
