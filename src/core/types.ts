export type ThemeType = "dark" | "light" | "hc";

export interface TextMateRule {
	name?: string;
	scope?: string | string[];
	settings: {
		foreground?: string;
		background?: string;
		fontStyle?: string;
	};
}

export type SemanticRuleValue = string | { foreground?: string; fontStyle?: string };

export interface ThemeSpec {
	$schema?: string;
	name: string;
	type: ThemeType;
	colors: Record<string, string>;
	tokenColors: TextMateRule[];
	semanticTokenColors: Record<string, SemanticRuleValue>;
}

export interface DescriptionsIndex {
	[key: string]: string;
}

export interface CategorizedKeys {
	[category: string]: string[];
}

/** Rich category tree for the sidebar (Section → Prefix group → Keys). */
export interface CategoryNode {
	id: string;                 // e.g., "Editor"
	label: string;              // display label
	keys?: string[];            // direct keys under this node
	children?: CategoryNode[];  // sub-groups
}
