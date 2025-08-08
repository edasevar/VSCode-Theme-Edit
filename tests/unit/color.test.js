"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var assert = require("assert");
var color_1 = require("../../src/core/color");
suite("color normalization", function () {
    test("#RRGGBB passes through", function () {
        assert.strictEqual((0, color_1.normalizeColor)("#112233"), "#112233");
    });
    test("#RRGGBBAA converts to rgba()", function () {
        var out = (0, color_1.normalizeColor)("#11223344");
        // 0x44 = 68 / 255 ≈ 0.2667 -> rounded to 0.267
        assert.strictEqual(out, "rgba(17, 34, 51, 0.267)");
    });
    test("normalizeColorMap on mixed entries", function () {
        var res = (0, color_1.normalizeColorMap)({ a: "#ffffffcc", b: "#000000", x: 123 });
        assert.strictEqual(res.a, "rgba(255, 255, 255, 0.8)");
        assert.strictEqual(res.b, "#000000");
        assert.strictEqual(res.x, 123);
    });
});
