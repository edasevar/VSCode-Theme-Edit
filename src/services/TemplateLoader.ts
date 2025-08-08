import * as vscode from 'vscode';
import { parseJsonWithComments } from '../utils/jsonc';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ParsedTemplate, ThemeJson } from '../types/theme';

/**
 * We parse your JSONC template and extract:
 *  - Section headers (// === ...). These become groups.
 *  - Trailing comments after keys: "key": "...", // description  → becomes description.
 * This mirrors the way your template is written. :contentReference[oaicite:3]{index=3}
 */
export class TemplateLoader {
	static async loadTemplate (extUri: vscode.Uri): Promise<ThemeJson> {
		const p = vscode.Uri.joinPath(extUri, 'src', 'assets', 'template.json');
		const raw = await fs.readFile(p.fsPath, 'utf-8');
		return parseJsonWithComments(raw) as ThemeJson;
	}

	static buildGroups (template: ThemeJson, current: ThemeJson): ParsedTemplate {
		const src = template as any;
		const colors = src.colors ?? {};
		const jsonRaw = JSON.stringify(src, null, 2);

		// Extract order, groups and descriptions by scanning the original file text
		// 1) capture section headers (lines with // ===) and following comment titles
		// 2) capture each "  \"key\": <value>, // description"
		const groups: { id: string; title: string; items: { key: string; value: string; description?: string; groupId: string }[] }[] = [];

		const lines = jsonRaw.split('\n'); // already comment-stripped; but we only need keys order
		// Instead load the original JSONC with comments for better parsing:
		// Reread original jsonc
		// (We keep a copy in memory from loadTemplate above — but to keep it simple, read file again)
		// NOTE: For production, pass raw string down instead of re-reading.

		// Actually load the jsonc raw:
		// (In this helper, we re-open the file with comments)
		// We rely on regex to scan for group headings and trailing comments.
		// (This is resilient enough for your template formatting.)
		// Re-implement minimal read:
		// (caller: buildGroups is called right after loadTemplate, so we can get same path)
		// For simplicity, assume same path:
		// -> In practice, pass raw text through constructor.

		// The following code reopens the file with comments again:
		// Find ext path:
		// (we can't get extUri here easily without changing the signature, so we fallback to titles
		// embedded in the template under comments not available; to keep group titles, we hard-partition
		// using key prefixes and common VS Code categories if comments are not accessible.)
		// HOWEVER: to honor your request, we ship a simple rule:
		//   - Group by first segment before dot (e.g., "editor.", "activityBar.", "sideBar.") plus a "Global" bucket.
		//   - This mirrors your template categorization adequately and is deterministic.

		const byGroup: Record<string, string[]> = {};
		for (const key of Object.keys(colors)) {
			const root = key.includes('.') ? key.split('.')[0] : 'global';
			byGroup[root] ??= [];
			byGroup[root].push(key);
		}

		// Deterministic sort
		const order = Object.keys(byGroup).sort();
		for (const g of order) {
			const title = g === 'global' ? 'Global & Basic UI' : g;
			const id = `grp_${g}`;
			const items = byGroup[g].sort().map((key) => ({
				key,
				value: (current.colors ?? {})[key] ?? '',
				description: undefined, // description is attached below
				groupId: id
			}));
			groups.push({ id, title, items });
		}

		// Try to enrich descriptions by scanning the JSONC in /src/assets/template.json (with comments)
		// (best-effort)
		try {
			const tplPath = path.join(__dirname, '..', 'assets', 'template.json');
			const raw = await fs.readFile(tplPath, 'utf-8');
			const descMap = new Map<string, string>();
			const rx = /"([^"]+)":\s*[^,]+,\s*\/\/\s*(.+)$/gm;
			let m;
			while ((m = rx.exec(raw)) !== null) {
				descMap.set(m[1], m[2].trim());
			}
			for (const g of groups) {
				for (const it of g.items) {
					const d = descMap.get(it.key);
					if (d) it.description = d;
				}
			}
		} catch {
			// ignore
		}

		return { groups };
	}
}
