import { ThemeJson } from '../types/theme';

/**
 * Generate CSS variables you can use on the web to preview/apply VS Code color tokens.
 * Example:  --editor-background: #000;
 * Also mirror the native token var syntax: --vscode-editor-background.
 */
export function cssFromTheme (theme: ThemeJson): string {
	const colors = theme.colors ?? {};
	const lines: string[] = [];
	lines.push(':root {');
	for (const [key, val] of Object.entries(colors)) {
		const cssKey = key.replace(/\./g, '-');
		lines.push(`  --${cssKey}: ${val};`);
		lines.push(`  --vscode-${cssKey}: ${val};`);
	}
	lines.push('}');
	return lines.join('\n') + '\n';
}
