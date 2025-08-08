import { parse } from 'jsonc-parser';

/** Parse JSON with comments (JSONC) */
export function parseJsonWithComments (text: string): unknown {
	return parse(text);
}
