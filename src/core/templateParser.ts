import * as fs from "fs";
import { parse } from "jsonc-parser";
import { CategorizedKeys, DescriptionsIndex, ThemeSpec } from "./types";

/**
 * Parse the JSONC template:
 *  1) JSONC -> ThemeSpec
 *  2) trailing comments -> descriptions
 *  3) CAPITALIZED section headers -> categories
 */
export function loadTemplateJsonc (templatePath: string): {
	theme: ThemeSpec;
	descriptions: DescriptionsIndex;
	categories: CategorizedKeys;
} {
	const raw = fs.readFileSync(templatePath, "utf8");

	const theme = parse(raw) as ThemeSpec;

	const colorBlock = extractBlock(raw, /"colors"\s*:\s*{/, "colors");
	const semanticBlock = extractBlock(raw, /"semanticTokenColors"\s*:\s*{/, "semanticTokenColors");

	const descriptions: DescriptionsIndex = {
		...extractTrailingComments(colorBlock),
		...extractTrailingComments(semanticBlock)
	};

	const categories = categorizeKeys(colorBlock);

	return { theme, descriptions, categories };
}

function extractBlock (source: string, startRegex: RegExp, _label: string): string {
	const startIdx = source.search(startRegex);
	if (startIdx === -1) return "";
	let i = startIdx;
	while (i < source.length && source[i] !== "{") i++;
	let depth = 0;
	let j = i;
	for (; j < source.length; j++) {
		if (source[j] === "{") depth++;
		else if (source[j] === "}") {
			depth--;
			if (depth === 0) {
				j++;
				break;
			}
		}
	}
	return source.slice(i, j);
}

function extractTrailingComments (block: string): DescriptionsIndex {
	const lines = block.split(/\r?\n/);
	const map: DescriptionsIndex = {};
	const keyLine = /^\s*"([^"]+)"\s*:\s*.+?(?:,)?\s*(?:\/\/\s*(.+))?$/;

	for (const line of lines) {
		const m = line.match(keyLine);
		if (m) {
			const key = m[1];
			const desc = (m[2] || "").trim();
			if (desc) map[key] = desc;
		}
	}
	return map;
}

/** Map color keys to nearest CAPITALIZED section heading like:
 *  // ======
 *  // EDITOR & MINIMAP
 */
function categorizeKeys (colorBlock: string): CategorizedKeys {
	const lines = colorBlock.split(/\r?\n/);
	const result: CategorizedKeys = {};
	let current = "Misc";

	const section = /^\s*\/\/\s*={5,}\s*$/;
	const sectionTitle = /^\s*\/\/\s*(.+?)\s*$/;

	let waitingForTitle = false;

	for (let idx = 0; idx < lines.length; idx++) {
		const line = lines[idx];

		if (section.test(line)) {
			waitingForTitle = true;
			continue;
		}
		if (waitingForTitle) {
			const m = line.match(sectionTitle);
			if (m) current = m[1].trim();
			waitingForTitle = false;
			continue;
		}

		const keyMatch = line.match(/^\s*"([^"]+)"/);
		if (keyMatch) {
			result[current] ??= [];
			result[current].push(keyMatch[1]);
		}
	}

	return result;
}
