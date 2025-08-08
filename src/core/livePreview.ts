import * as vscode from "vscode";
import { ThemeSpec, TextMateRule } from "./types";
import { normalizeColor, normalizeColorMap } from "./color";

// Restore originals on dispose
let previousWorkbench: any | undefined;
let previousTextmate: any | undefined;
let previousSemantic: any | undefined;

/**
 * Live preview via user-level overrides:
 * - workbench.colorCustomizations
 * - editor.tokenColorCustomizations
 * - editor.semanticTokenColorCustomizations
 * Converts #RRGGBBAA -> rgba() for reliability.
 */
export async function applyLivePreview (theme: ThemeSpec): Promise<void> {
	const cfg = vscode.workspace.getConfiguration();

	if (previousWorkbench === undefined) {
		previousWorkbench = cfg.get("workbench.colorCustomizations");
		previousTextmate = cfg.get("editor.tokenColorCustomizations");
		previousSemantic = cfg.get("editor.semanticTokenColorCustomizations");
	}

	// Normalize workbench colors
	const workbench = normalizeColorMap(theme.colors);

	// Normalize TextMate rules’ colors
	const textMateRules = theme.tokenColors.map(tmRule => {
		const r: TextMateRule = JSON.parse(JSON.stringify(tmRule));
		if (r.settings) {
			if (typeof r.settings.foreground === "string") {
				r.settings.foreground = normalizeColor(r.settings.foreground);
			}
			if (typeof r.settings.background === "string") {
				r.settings.background = normalizeColor(r.settings.background);
			}
		}
		return r;
	});

	// Normalize semantic token rules
	const semanticRules: Record<string, any> = {};
	for (const [k, v] of Object.entries(theme.semanticTokenColors)) {
		if (typeof v === "string") {
			semanticRules[k] = { foreground: normalizeColor(v) };
		} else {
			semanticRules[k] = {
				...v,
				foreground: normalizeColor(v.foreground)
			};
		}
	}

	await cfg.update("workbench.colorCustomizations", workbench, vscode.ConfigurationTarget.Global);
	await cfg.update(
		"editor.tokenColorCustomizations",
		{ textMateRules, semanticHighlighting: true },
		vscode.ConfigurationTarget.Global
	);
	await cfg.update(
		"editor.semanticTokenColorCustomizations",
		{ rules: semanticRules },
		vscode.ConfigurationTarget.Global
	);
}

export async function resetLivePreview (): Promise<void> {
	const cfg = vscode.workspace.getConfiguration();
	await cfg.update("workbench.colorCustomizations", previousWorkbench, vscode.ConfigurationTarget.Global);
	await cfg.update("editor.tokenColorCustomizations", previousTextmate, vscode.ConfigurationTarget.Global);
	await cfg.update(
		"editor.semanticTokenColorCustomizations",
		previousSemantic,
		vscode.ConfigurationTarget.Global
	);

	previousWorkbench = previousTextmate = previousSemantic = undefined;
}
