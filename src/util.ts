// Purpose: small helpers (color conversion, deep clone, debounce).

export type Hex8 = string; // #RRGGBBAA

export const clamp = (n: number, min: number, max: number) =>
	Math.max(min, Math.min(max, n));

export const isHex = (v: string) => /^#([0-9a-f]{6}|[0-9a-f]{8})$/i.test(v);

export const toHex2 = (n: number) => n.toString(16).padStart(2, "0");

export function rgbaToHex8(r: number, g: number, b: number, a: number): Hex8 {
	return `#${toHex2(r)}${toHex2(g)}${toHex2(b)}${toHex2(a)}`;
}

export function hex8ToRgba(hex: Hex8): {
	r: number;
	g: number;
	b: number;
	a: number;
} {
	const m = /^#?([0-9a-f]{6}|[0-9a-f]{8})$/i.exec(hex);
	if (!m) throw new Error("Invalid hex.");
	const h = m[1].length === 6 ? m[1] + "ff" : m[1];
	const r = parseInt(h.slice(0, 2), 16);
	const g = parseInt(h.slice(2, 4), 16);
	const b = parseInt(h.slice(4, 6), 16);
	const a = parseInt(h.slice(6, 8), 16);
	return { r, g, b, a };
}

export const deepClone = <T>(x: T): T => JSON.parse(JSON.stringify(x));

export function debounce<T extends (...args: any[]) => void>(
	fn: T,
	ms = 150
): T {
	let t: NodeJS.Timeout | undefined;
	return ((...args: any[]) => {
		if (t) clearTimeout(t);
		t = setTimeout(() => fn(...args), ms);
	}) as T;
}
