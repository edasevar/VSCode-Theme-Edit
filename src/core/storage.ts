import * as vscode from "vscode";
import { ThemeSpec } from "./types";

const KEY = {
	LAST_THEME: "themeLab:lastTheme",
	UI_STATE: "themeLab:uiState",
	BUNDLE: "themeLab:bundle"
};

export interface UiState {
	liveEnabled: boolean;
	filter: string;
	selectedKey?: string;
}

export interface StoredState {
	theme?: ThemeSpec;
	ui?: UiState;
	bundle?: ThemeSpec[];
}

export class Storage {
	constructor(private readonly ctx: vscode.ExtensionContext) {}

	load (): StoredState {
		return {
			theme: this.ctx.globalState.get<ThemeSpec>(KEY.LAST_THEME) ?? undefined,
			ui: this.ctx.globalState.get<UiState>(KEY.UI_STATE) ?? undefined,
			bundle: this.ctx.globalState.get<ThemeSpec[]>(KEY.BUNDLE) ?? []
		};
	}

	async saveTheme (theme: ThemeSpec) {
		await this.ctx.globalState.update(KEY.LAST_THEME, theme);
	}

	async saveUi (ui: UiState) {
		await this.ctx.globalState.update(KEY.UI_STATE, ui);
	}

	async saveBundle (bundle: ThemeSpec[]) {
		await this.ctx.globalState.update(KEY.BUNDLE, bundle);
	}
}
