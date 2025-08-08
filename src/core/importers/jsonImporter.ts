import * as fs from "fs";
import { parse } from "jsonc-parser";
import { ThemeSpec } from "../../core/types";

/** Load a theme from a .json/.jsonc path */
export function importJsonTheme (filePath: string): ThemeSpec {
	const raw = fs.readFileSync(filePath, "utf8");
	return parse(raw) as ThemeSpec;
}
