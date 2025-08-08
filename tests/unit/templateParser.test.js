"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var assert = require("assert");
var path = require("path");
var templateParser_1 = require("../../src/core/templateParser");
suite("templateParser", function () {
    test("extracts descriptions and categories", function () {
        var _a = (0, templateParser_1.loadTemplateJsonc)(path.join(__dirname, "../../assets/template.jsonc")), descriptions = _a.descriptions, categories = _a.categories, theme = _a.theme;
        assert.ok(theme);
        assert.ok(Object.keys(descriptions).length > 0, "should pull trailing comments");
        assert.ok(Object.keys(categories).length > 0, "should infer categories");
        // can't guarantee a specific section name across templates, but there should be at least one
        var hasSection = Object.keys(categories).some(function (k) { return k && categories[k].length >= 0; });
        assert.ok(hasSection, "should have at least one category section");
    });
});
