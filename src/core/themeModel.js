"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.blankTheme = void 0;
exports.mergeTheme = mergeTheme;
/** Empty starter theme (start blank) */
var blankTheme = function () { return ({
    $schema: "vscode://schemas/color-theme",
    name: "My Theme",
    type: "dark",
    colors: {},
    tokenColors: [],
    semanticTokenColors: {}
}); };
exports.blankTheme = blankTheme;
/** Shallow merge utility (not used directly yet, but handy for future) */
function mergeTheme(base, incoming) {
    var _a;
    return {
        $schema: incoming.$schema || base.$schema,
        name: incoming.name || base.name,
        type: incoming.type || base.type,
        colors: __assign(__assign({}, base.colors), incoming.colors),
        tokenColors: ((_a = incoming.tokenColors) === null || _a === void 0 ? void 0 : _a.length) ? incoming.tokenColors : base.tokenColors,
        semanticTokenColors: __assign(__assign({}, base.semanticTokenColors), incoming.semanticTokenColors)
    };
}
