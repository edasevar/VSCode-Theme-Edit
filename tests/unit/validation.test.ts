import * as assert from "assert";
import { isValidColor } from "../../src/core/validation";

suite("validation", () => {
	test("accepts #rrggbb", () => assert.ok(isValidColor("#112233")));
	test("accepts #rrggbbaa", () => assert.ok(isValidColor("#11223344")));
	test("accepts rgba()", () => assert.ok(isValidColor("rgba(255, 0, 0, 0.5)")));
	test("rejects bad", () => assert.ok(!isValidColor("not-a-color")));
});
