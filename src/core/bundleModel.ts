import { ThemeSpec } from "./types";

export class ThemeBundle {
	private items: ThemeSpec[] = [];

	constructor(initial?: ThemeSpec[]) {
		if (Array.isArray(initial)) this.items = initial.slice();
	}

	add (theme: ThemeSpec) {
		const name = theme.name || `Theme ${this.items.length + 1}`;
		const existing = this.items.find(t => (t.name || "").toLowerCase() === name.toLowerCase());
		if (existing) {
			const suffixed = `${name}-${Date.now()}`;
			this.items.push({ ...theme, name: suffixed });
		} else {
			this.items.push({ ...theme });
		}
	}

	clear () {
		this.items = [];
	}

	list (): ThemeSpec[] {
		return this.items.slice();
	}
}
