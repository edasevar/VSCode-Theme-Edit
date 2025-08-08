export type ThemeJson = {
	$schema?: string;
	name?: string;
	type?: 'dark' | 'light' | 'hc' | string;
	colors?: Record<string, string>;
	semanticTokenColors?: Record<string, string | { foreground?: string; fontStyle?: string }>;
	tokenColors?: any[];
};

export type ParsedTemplate = {
	groups: {
		id: string;
		title: string;
		items: { key: string; value: string; description?: string; groupId: string }[];
	}[];
};
  