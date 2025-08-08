"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeColor = normalizeColor;
exports.normalizeColorMap = normalizeColorMap;
/**
 * Normalize color strings:
 * - "#RRGGBBAA" -> "rgba(r,g,b,a)"
 * - "#RRGGBB" and others -> unchanged
 */
function normalizeColor(input) {
    if (!input || typeof input !== "string")
        return input;
    var trimmed = input.trim();
    // Match #RRGGBBAA
    var m = /^#([0-9a-fA-F]{8})$/.exec(trimmed);
    if (!m)
        return trimmed;
    var hex = m[1];
    var r = parseInt(hex.slice(0, 2), 16);
    var g = parseInt(hex.slice(2, 4), 16);
    var b = parseInt(hex.slice(4, 6), 16);
    var a = parseInt(hex.slice(6, 8), 16) / 255;
    var aStr = (Math.round(a * 1000) / 1000).toString();
    return "rgba(".concat(r, ", ").concat(g, ", ").concat(b, ", ").concat(aStr, ")");
}
/** Apply normalizeColor to an object of key->color (non-destructive copy) */
function normalizeColorMap(map) {
    var out = Array.isArray(map) ? [] : {};
    for (var _i = 0, _a = Object.entries(map); _i < _a.length; _i++) {
        var _b = _a[_i], k = _b[0], v = _b[1];
        out[k] = typeof v === "string" ? normalizeColor(v) : v;
    }
    return out;
}
