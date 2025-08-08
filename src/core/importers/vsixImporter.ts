import AdmZip from "adm-zip";
import { parse } from "jsonc-parser";
import { ThemeSpec } from "../../core/types";

/**
 * Open a .vsix and extract the first contributed theme JSON found.
 * (You can extend to handle multiple themes selection.)
 */
export function importVsixTheme (vsixPath: string): ThemeSpec {
	const zip = new AdmZip(vsixPath);
	const entries = zip.getEntries();

	const pkgEntry = entries.find(e => /(^|\/)extension\/package\.json$/.test(e.entryName));
	if (!pkgEntry) throw new Error("package.json not found in VSIX");

	const pkg = JSON.parse(pkgEntry.getData().toString("utf8"));
	const themeContrib = pkg.contributes?.themes?.[0];
	if (!themeContrib) throw new Error("No themes contributed in VSIX");

	const themeRel = String(themeContrib.path).replace(/^\.\//, "");
	const themeEntry = entries.find(e => e.entryName.endsWith(`/extension/${themeRel}`));
	if (!themeEntry) throw new Error(`Theme file ${themeRel} not found inside VSIX`);

	const themeJson = themeEntry.getData().toString("utf8");
	return parse(themeJson) as ThemeSpec;
}
