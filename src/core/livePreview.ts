import * as vscode from "vscode";
import { ThemeSpec, TextMateRule } from "./types";
import { normalizeColor, normalizeColorMap } from "./color";

// Restore originals on dispose
let previousWorkbench: Record<string, string> | undefined;
let previousTextmate: { textMateRules?: TextMateRule[]; semanticHighlighting?: boolean } | undefined;
let previousSemantic: Record<string, { foreground?: string; fontstyle?: string }> | undefined;

/**
 * Live preview via user-level overrides:
 * - workbench.colorCustomizations
 * - editor.tokenColorCustomizations
 * - editor.semanticTokenColorCustomizations
 * Converts #RRGGBBAA -> rgba() for reliability.
 */
export async function applyLivePreview (theme: ThemeSpec): Promise<void> {
	const cfg = vscode.workspace.getConfiguration();
	const semanticEnabled = cfg.get<boolean>("themeLab.semanticTokensEnabled", true);

	if (previousWorkbench === undefined) {
		previousWorkbench = cfg.get("workbench.colorCustomizations");
		previousTextmate = cfg.get("editor.tokenColorCustomizations");
		previousSemantic = cfg.get("editor.semanticTokenColorCustomizations");
	}

	const workbench = normalizeColorMap(theme.colors);

	const textMateRules = theme.tokenColors.map(tmRule => {
		const r: TextMateRule = JSON.parse(JSON.stringify(tmRule));
		if (r.settings) {
			if (typeof r.settings.foreground === "string") {
				r.settings.foreground = normalizeColor(r.settings.foreground);
			}
			if (typeof r.settings.background === "string") {
				r.settings.background = normalizeColor(r.settings.background);
			}
			// Normalize TextMate fontStyle: remove 'normal', map 'underlined'->'underline', dedupe and sort
			if (typeof r.settings.fontStyle === "string") {
				const raw = r.settings.fontStyle.trim();
				if (raw.length) {
					const parts = raw.split(/\s+/)
						.map(s => s.toLowerCase())
						.filter(s => s !== "normal");
					const mapped = parts.map(s => (s === "underlined" ? "underline" : s));
					const allowed = ["italic", "bold", "underline", "strikethrough"] as const;
					const unique = Array.from(new Set(mapped)).filter(s => (allowed as readonly string[]).includes(s));
					// stable order for determinism
					const ordered = allowed.filter(a => unique.includes(a));
					r.settings.fontStyle = ordered.join(" ") || undefined;
				} else {
					r.settings.fontStyle = undefined;
				}
			}
		}
		return r;
	});

	const semanticRules: Record<string, { foreground?: string; italic?: boolean; bold?: boolean; underline?: boolean; strikethrough?: boolean }> = {};
	for (const [k, v] of Object.entries(theme.semanticTokenColors)) {
		if (typeof v === "string") {
			semanticRules[k] = { foreground: normalizeColor(v) };
		} else {
			const out: { foreground?: string; italic?: boolean; bold?: boolean; underline?: boolean; strikethrough?: boolean } = {};
			if (typeof v.foreground === "string") out.foreground = normalizeColor(v.foreground);
			// Convert fontStyle string to boolean flags per VS Code schema
			if (typeof v.fontStyle === "string") {
				const parts = v.fontStyle.trim().toLowerCase().split(/\s+/).filter(Boolean);
				const has = (s: string) => parts.includes(s);
				if (parts.length === 1 && parts[0] === "normal") {
					out.italic = out.bold = out.underline = out.strikethrough = false;
				} else {
					out.italic = has("italic") || undefined;
					out.bold = has("bold") || undefined;
					out.underline = has("underline") || has("underlined") || undefined;
					out.strikethrough = has("strikethrough") || has("strike") || has("struck") || undefined;
				}
			}
			semanticRules[k] = out;
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
	{ enabled: !!semanticEnabled, rules: semanticRules },
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
