import { ThemeSpec } from "../types";

export function exportAsJson (theme: ThemeSpec): string {
	return JSON.stringify(theme, null, 2);
}
