import * as assert from "assert";
import * as path from "path";
import { loadTemplateJsonc } from "../../src/core/templateParser";

suite("templateParser", () => {
	test("extracts descriptions and categories", () => {
		const { descriptions, categories, theme } = loadTemplateJsonc(
			path.join(__dirname, "../../assets/template.jsonc")
		);

		assert.ok(theme);
		assert.ok(Object.keys(descriptions).length > 0, "should pull trailing comments");
		assert.ok(Object.keys(categories).length > 0, "should infer categories");
		const hasSection = Object.keys(categories).some(k => k && categories[k].length >= 0);
		assert.ok(hasSection, "should have at least one category section");
	});
});
