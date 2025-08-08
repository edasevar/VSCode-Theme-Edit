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
