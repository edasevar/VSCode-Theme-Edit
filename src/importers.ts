// Purpose: import flows: VSIX (zip), theme JSON, or current theme/customizations.

import * as vscode from "vscode";
import JSZip from "jszip";
import {
	readCurrentThemeJson,
	readAppliedCustomizations,
} from "./currentTheme";
import { ThemeState, blankTheme } from "./themeState";
import { parse } from "jsonc-parser";

export async function importFromVsix(uri: vscode.Uri): Promise<ThemeState> {
	const data = await vscode.workspace.fs.readFile(uri);
	const zip = await JSZip.loadAsync(Buffer.from(data));
	// Find theme JSON(s)
	let themeJson: any | undefined;
	for (const name of Object.keys(zip.files)) {
		if (name.endsWith(".json") && name.includes("/themes/")) {
			const content = await zip.files[name].async("string");
			try {
				themeJson = JSON.parse(content);
				break;
			} catch {
				continue;
			}
		}
		if (name.endsWith("package.json") && !themeJson) {
			// optional: could read to locate themes path
		}
	}
	if (!themeJson) throw new Error("No theme JSON found inside VSIX.");

	return fromThemeJson(themeJson);
}

export function fromThemeJson(themeJson: any): ThemeState {
	const type = /light/i.test(themeJson.type) ? "light" : "dark";
	const colors = themeJson.colors || {};
	const tokenColors = themeJson.tokenColors || [];
	const sem = themeJson.semanticTokenColors || {};
	return {
		name: themeJson.name || "Imported Theme",
		type,
		colors,
		tokenColors,
		semanticTokenColors: sem,
	};
}

export async function importFromJson(uri: vscode.Uri): Promise<ThemeState> {
	const raw = Buffer.from(await vscode.workspace.fs.readFile(uri)).toString(
		"utf8"
	);
	const json = parse(raw);
	return fromThemeJson(json);
}

export async function importFromCurrent(): Promise<ThemeState> {
	const raw = await readCurrentThemeJson();
	const { workbench, semantic, token } = readAppliedCustomizations();
	// Merge: base -> applied
	const base = raw ? fromThemeJson(raw) : blankTheme();
	base.colors = { ...(base.colors || {}), ...(workbench || {}) };
	base.semanticTokenColors = {
		...(base.semanticTokenColors || {}),
		...(semantic || {}),
	};
	// tokenColorCustomizations may be of the shape { light|dark: { textMateRules: [] }} or { textMateRules: [] }
	const textMateRules =
		token?.textMateRules ||
		token?.light?.textMateRules ||
		token?.dark?.textMateRules ||
		base.tokenColors ||
		[];
	base.tokenColors = textMateRules;
	return base;
}

export function importBlank(type: "light" | "dark" = "dark"): ThemeState {
	return blankTheme("Theme Lab Theme", type);
}
