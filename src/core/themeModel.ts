import { ThemeSpec } from "./types";

/** Empty starter theme (start blank) */
export const blankTheme = (): ThemeSpec => ({
	$schema: "vscode://schemas/color-theme",
	name: "My Theme",
	type: "dark",
	colors: {},
	tokenColors: [],
	semanticTokenColors: {}
});

/** Shallow merge utility (not used directly yet, but handy for future) */
export function mergeTheme (base: ThemeSpec, incoming: ThemeSpec): ThemeSpec {
	return {
		$schema: incoming.$schema || base.$schema,
		name: incoming.name || base.name,
		type: incoming.type || base.type,
		colors: { ...base.colors, ...incoming.colors },
		tokenColors: incoming.tokenColors?.length ? incoming.tokenColors : base.tokenColors,
		semanticTokenColors: { ...base.semanticTokenColors, ...incoming.semanticTokenColors }
	};
}
