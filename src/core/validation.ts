import { ThemeSpec } from "./types";

const HEX6 = /^#([0-9a-fA-F]{6})$/;
const HEX8 = /^#([0-9a-fA-F]{8})$/;
const RGBA = /^rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*(0(\.\d+)?|1(\.0+)?)\s*\)$/;

/** Simple color validator: #RRGGBB, #RRGGBBAA or rgba(r,g,b,a). */
export function isValidColor (value: string): boolean {
	if (!value || typeof value !== "string") return false;
	const v = value.trim();
	return HEX6.test(v) || HEX8.test(v) || RGBA.test(v);
}

/** Unknown color keys: not present in template-derived map. */
export function unknownColorKeys (theme: ThemeSpec, knownKeys: Set<string>): string[] {
	return Object.keys(theme.colors).filter(k => !knownKeys.has(k));
}

/** Invalid color strings. */
export function invalidColors (theme: ThemeSpec): { key: string; value: string }[] {
	const out: { key: string; value: string }[] = [];
	for (const [k, v] of Object.entries(theme.colors)) {
		if (!isValidColor(v)) out.push({ key: k, value: v });
	}
	return out;
}
