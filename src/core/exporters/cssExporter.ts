import { ThemeSpec } from "../types";
import { normalizeColor } from "../color";

/**
 * Export CSS variables: map workbench color keys to --vscode-<key>
 * For #RRGGBBAA we emit rgba(r,g,b,a).
 */
export function exportAsCss (theme: ThemeSpec): string {
	const toVar = (k: string) => `--vscode-${k.replace(/\./g, "-")}`;
	const lines: string[] = [":root {"];

	for (const [k, v] of Object.entries(theme.colors)) {
		const value = typeof v === "string" ? normalizeColor(v) : v;
		lines.push(`  ${toVar(k)}: ${value};`);
	}
	lines.push("}");

	// Optional: minimal token preview classes
	lines.push("", "/* Token examples */");
	lines.push(".tm-comment { color: var(--vscode-editorCodeLens-foreground, #888); }");

	return lines.join("\n");
}
