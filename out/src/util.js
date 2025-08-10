"use strict";
// Purpose: small helpers (color conversion, deep clone, debounce).
Object.defineProperty(exports, "__esModule", { value: true });
exports.deepClone = exports.toHex2 = exports.isHex = exports.clamp = void 0;
exports.rgbaToHex8 = rgbaToHex8;
exports.hex8ToRgba = hex8ToRgba;
exports.debounce = debounce;
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
exports.clamp = clamp;
const isHex = (v) => /^#([0-9a-f]{6}|[0-9a-f]{8})$/i.test(v);
exports.isHex = isHex;
const toHex2 = (n) => n.toString(16).padStart(2, "0");
exports.toHex2 = toHex2;
function rgbaToHex8(r, g, b, a) {
    return `#${(0, exports.toHex2)(r)}${(0, exports.toHex2)(g)}${(0, exports.toHex2)(b)}${(0, exports.toHex2)(a)}`;
}
function hex8ToRgba(hex) {
    const m = /^#?([0-9a-f]{6}|[0-9a-f]{8})$/i.exec(hex);
    if (!m)
        throw new Error("Invalid hex.");
    const h = m[1].length === 6 ? m[1] + "ff" : m[1];
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    const a = parseInt(h.slice(6, 8), 16);
    return { r, g, b, a };
}
const deepClone = (x) => JSON.parse(JSON.stringify(x));
exports.deepClone = deepClone;
function debounce(fn, ms = 150) {
    let t;
    return ((...args) => {
        if (t)
            clearTimeout(t);
        t = setTimeout(() => fn(...args), ms);
    });
}
//# sourceMappingURL=util.js.map