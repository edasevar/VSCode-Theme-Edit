import * as vscode from 'vscode';
import { ThemeState } from '../services/ThemeState';
import { getWebviewHtml } from './html';

export class ThemeDesignerPanel {
	private static _panel: ThemeDesignerPanel | undefined;
	private readonly panel: vscode.WebviewPanel;
	private disposables: vscode.Disposable[] = [];

	private constructor(panel: vscode.WebviewPanel, private readonly state: ThemeState) {
		this.panel = panel;

		this.panel.webview.onDidReceiveMessage(async (msg) => {
			switch (msg.type) {
				case 'request:init':
					this.panel.webview.postMessage({
						type: 'init',
						payload: this.state.getWebviewInitPayload()
					});
					break;
				case 'update:color':
					await this.state.applyChange(msg.groupId, msg.key, msg.value);
					// apply live preview using workbench colorCustomizations
					await this.state.applyLivePreview();
					// tell webview to highlight the preview element
					this.panel.webview.postMessage({ type: 'highlight', key: msg.key });
					break;
				case 'reset:key':
					await this.state.resetKey(msg.key);
					await this.state.applyLivePreview();
					break;
			}
		}, null, this.disposables);

		this.panel.onDidDispose(this.dispose, null, this.disposables);
	}

	static createOrShow (extensionUri: vscode.Uri, state: ThemeState) {
		const column = vscode.ViewColumn.Beside;
		if (this._panel) return this._panel;

		const panel = vscode.window.createWebviewPanel(
			'themeDesigner',
			'Theme Designer',
			column,
			{
				enableScripts: true,
				retainContextWhenHidden: true
			}
		);

		const instance = new ThemeDesignerPanel(panel, state);
		panel.webview.html = getWebviewHtml(panel.webview, extensionUri);
		this._panel = instance;
		return instance;
	}

	static refreshIfOpen () {
		if (!this._panel) return;
		this._panel.panel.webview.postMessage({ type: 'init', payload: this._panel.state.getWebviewInitPayload() });
	}

	reveal () {
		this.panel.reveal();
	}

	dispose = () => {
		while (this.disposables.length) {
			const d = this.disposables.pop();
			d?.dispose();
		}
		ThemeDesignerPanel._panel = undefined;
	};
}
