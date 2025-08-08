"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.importVsixTheme = importVsixTheme;
const adm_zip_1 = __importDefault(require("adm-zip"));
const jsonc_parser_1 = require("jsonc-parser");
/**
 * Open a .vsix and extract the first contributed theme JSON found.
 * (You can extend to handle multiple themes selection.)
 */
function importVsixTheme(vsixPath) {
    const zip = new adm_zip_1.default(vsixPath);
    const entries = zip.getEntries();
    const pkgEntry = entries.find(e => /(^|\/)extension\/package\.json$/.test(e.entryName));
    if (!pkgEntry)
        throw new Error("package.json not found in VSIX");
    const pkg = JSON.parse(pkgEntry.getData().toString("utf8"));
    const themeContrib = pkg.contributes?.themes?.[0];
    if (!themeContrib)
        throw new Error("No themes contributed in VSIX");
    const themeRel = String(themeContrib.path).replace(/^\.\//, "");
    const themeEntry = entries.find(e => e.entryName.endsWith(`/extension/${themeRel}`));
    if (!themeEntry)
        throw new Error(`Theme file ${themeRel} not found inside VSIX`);
    const themeJson = themeEntry.getData().toString("utf8");
    return (0, jsonc_parser_1.parse)(themeJson);
}
//# sourceMappingURL=vsixImporter.js.map