/**
 * Normalize color strings:
 * - "#RRGGBBAA" -> "rgba(r,g,b,a)"
 * - "#RRGGBB" and others -> unchanged
 */
export function normalizeColor (input: string | undefined): string | undefined {
	if (!input || typeof input !== "string") return input;

	const trimmed = input.trim();

	// Match #RRGGBBAA
	const m = /^#([0-9a-fA-F]{8})$/.exec(trimmed);
	if (!m) return trimmed;

	const hex = m[1];
	const r = parseInt(hex.slice(0, 2), 16);
	const g = parseInt(hex.slice(2, 4), 16);
	const b = parseInt(hex.slice(4, 6), 16);
	const a = parseInt(hex.slice(6, 8), 16) / 255;

	const aStr = (Math.round(a * 1000) / 1000).toString();
	return `rgba(${r}, ${g}, ${b}, ${aStr})`;
}

/** Apply normalizeColor to an object of key->color (non-destructive copy) */
export function normalizeColorMap<T extends Record<string, any>> (map: T): T {
	const out: any = Array.isArray(map) ? [] : {};
	for (const [k, v] of Object.entries(map)) {
		out[k] = typeof v === "string" ? (normalizeColor(v) as any) : v;
	}
	return out as T;
}
