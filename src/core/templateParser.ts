import * as fs from "fs";
import { parse } from "jsonc-parser";
import { CategorizedKeys, CategoryNode, DescriptionsIndex, ThemeSpec } from "./types";

/**
 * Parse the JSONC template:
 *  1) JSONC -> ThemeSpec
 *  2) trailing comments -> descriptions
 *  3) CAPITALIZED section headers -> flat categories (legacy)
 *  4) category tree -> Section → prefix groups (editor., statusBar., etc.)
 */
export function loadTemplateJsonc (templatePath: string): {
	theme: ThemeSpec;
	descriptions: DescriptionsIndex;
	categories: CategorizedKeys;
	tree: CategoryNode[];
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
	const tree = buildTree(categories);

	return { theme, descriptions, categories, tree };
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

/** Legacy (flat) sections from comment banners. */
function categorizeKeys (colorBlock: string): CategorizedKeys {
	const lines = colorBlock.split(/\r?\n/);
	const result: CategorizedKeys = {};
	let current = "General";

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
			if (m) current = m[1].trim() || "General";
			waitingForTitle = false;
			continue;
		}

		const keyMatch = line.match(/^\s*"([^"]+)"/);
		if (keyMatch) {
			result[current] ??= [];
			result[current].push(keyMatch[1]);
		}
	}

	if (!Object.keys(result).length) result["General"] = [];
	return result;
}

/** Build a nicer tree: Section -> prefix groups (e.g. "editor.", "statusBar.") -> keys */
function buildTree (sections: CategorizedKeys): CategoryNode[] {
	const nodes: CategoryNode[] = [];
	for (const [section, keys] of Object.entries(sections)) {
		const groups = new Map<string, string[]>();
		for (const k of keys) {
			const prefix = (k.split(".")[0] || "misc").trim();
			const label = title(prefix);
			if (!groups.has(label)) groups.set(label, []);
			groups.get(label)!.push(k);
		}
		const children: CategoryNode[] = [];
		for (const [label, groupKeys] of Array.from(groups.entries()).sort()) {
			children.push({ id: `${section}/${label}`, label, keys: groupKeys.sort() });
		}
		nodes.push({ id: section, label: section, children: children.sort((a, b) => a.label.localeCompare(b.label)) });
	}
	nodes.sort((a, b) => a.label.localeCompare(b.label));
	return nodes;
}

function title (s: string): string {
	return s
		.replace(/([A-Z])/g, " $1")
		.replace(/[-_.]/g, " ")
		.replace(/\s+/g, " ")
		.replace(/^\s|\s$/g, "")
		.replace(/(^|\s)\S/g, c => c.toUpperCase());
}
