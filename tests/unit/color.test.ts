import * as assert from "assert";
import { normalizeColor, normalizeColorMap } from "../../src/core/color";

suite("color normalization", () => {
	test("#RRGGBB passes through", () => {
		assert.strictEqual(normalizeColor("#112233"), "#112233");
	});

	test("#RRGGBBAA converts to rgba()", () => {
		const out = normalizeColor("#11223344");
		// 0x44 = 68 / 255 ≈ 0.2667 -> rounded to 0.267
		assert.strictEqual(out, "rgba(17, 34, 51, 0.267)");
	});

	test("normalizeColorMap on mixed entries", () => {
		const res = normalizeColorMap({ a: "#ffffffcc", b: "#000000", x: 123 } as any);
		assert.strictEqual(res.a, "rgba(255, 255, 255, 0.8)");
		assert.strictEqual(res.b, "#000000");
		assert.strictEqual((res as any).x, 123);
	});
});
