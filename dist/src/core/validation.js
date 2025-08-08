"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidColor = isValidColor;
exports.unknownColorKeys = unknownColorKeys;
exports.invalidColors = invalidColors;
const HEX6 = /^#([0-9a-fA-F]{6})$/;
const HEX8 = /^#([0-9a-fA-F]{8})$/;
const RGBA = /^rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*(0(\.\d+)?|1(\.0+)?)\s*\)$/;
/** Simple color validator: #RRGGBB, #RRGGBBAA or rgba(r,g,b,a). */
function isValidColor(value) {
    if (!value || typeof value !== "string")
        return false;
    const v = value.trim();
    return HEX6.test(v) || HEX8.test(v) || RGBA.test(v);
}
/** Unknown color keys: not present in template-derived map. */
function unknownColorKeys(theme, knownKeys) {
    return Object.keys(theme.colors).filter(k => !knownKeys.has(k));
}
/** Invalid color strings. */
function invalidColors(theme) {
    const out = [];
    for (const [k, v] of Object.entries(theme.colors)) {
        if (!isValidColor(v))
            out.push({ key: k, value: v });
    }
    return out;
}
//# sourceMappingURL=validation.js.map