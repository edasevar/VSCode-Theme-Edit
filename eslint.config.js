import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
	js.configs.recommended,
	{
		files: ["src/**/*.ts"],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				ecmaVersion: 2022,
				sourceType: "module",
			},
			globals: {
				process: "readonly",
				console: "readonly",
				Buffer: "readonly",
			},
		},
		plugins: {
			"@typescript-eslint": tsPlugin,
		},
		rules: {
			"no-console": "off",
			"no-unused-vars": "off",
			"@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
			"@typescript-eslint/no-explicit-any": "warn",
		},
	},
	{
		files: ["tests/**/*.ts"],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				ecmaVersion: 2022,
				sourceType: "module",
			},
			globals: {
				suite: "readonly",
				test: "readonly",
				__dirname: "readonly",
			},
		},
		plugins: {
			"@typescript-eslint": tsPlugin,
		},
		rules: {
			"@typescript-eslint/no-explicit-any": "off",
			"no-unused-vars": "off",
		},
	},
	{
		files: ["media/**/*.js"],
		languageOptions: {
			globals: {
				console: "readonly",
				document: "readonly",
				window: "readonly",
				CSS: "readonly",
				prompt: "readonly",
				HTMLElement: "readonly",
				getComputedStyle: "readonly",
			},
		},
		rules: {
			"no-console": "off",
		},
	},
	{
		ignores: ["dist/**", "dist-tests/**", "node_modules/**", "**/*.js", "!media/**/*.js"],
	},
];
