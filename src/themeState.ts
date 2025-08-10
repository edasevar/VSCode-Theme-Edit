// Purpose: hold working theme state and map to VS Code settings format.

export type FontStyle =
	| ""
	| "bold"
	| "italic"
	| "underline"
	| "strikethrough"
	| string; // multi allowed: "bold italic"

export interface ThemeState {
	name: string;
	type: "light" | "dark";
	colors: Record<string, string>; // workbench color keys -> hex8 or hex6
	semanticTokenColors: Record<
		string,
		{ foreground?: string; fontStyle?: string } | Record<string, any>
	>;
	tokenColors: Array<{
		name?: string;
		scope: string | string[];
		settings: { foreground?: string; fontStyle?: string };
	}>;
}

export function blankTheme(
	name = "Theme Lab Theme",
	type: "light" | "dark" = "dark"
): ThemeState {
	return { name, type, colors: {}, semanticTokenColors: {}, tokenColors: [] };
}

export function toSettings(state: ThemeState) {
	// workbench
	const workbench = state.colors;

	// semantic tokens
	const semantic: any = { enabled: true };
	for (const [token, def] of Object.entries(state.semanticTokenColors)) {
		if (token === "enabled") continue;
		semantic[token] = def;
	}

	// textMate tokens
	const textMateRules = state.tokenColors.map((r) => ({
		scope: r.scope,
		settings: r.settings,
	}));

	const tokenCustomizations: any = {
		textMateRules,
	};

	const editorCustomizations: any = {};
	const kind = state.type === "light" ? "light" : "dark";
	editorCustomizations[kind] = { textMateRules };

	return {
		workbench,
		semantic,
		tokenCustomizations,
		editorCustomizations,
	};
}
