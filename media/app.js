// Plain JS webview controller. No bundler/framework.
const vscode = acquireVsCodeApi();

const el = sel => document.querySelector(sel);
const els = sel => Array.from(document.querySelectorAll(sel));
const esc = s => (window.CSS && CSS.escape ? CSS.escape(s) : String(s).replace(/"/g, '\\"'));

let theme = {
	$schema: "vscode://schemas/color-theme",
	name: "My Theme",
	type: "dark",
	colors: {},
	tokenColors: [],
	semanticTokenColors: {}
};

let descriptions = {};
let categories = {};
let filteredKeys = [];

const categoriesRoot = el("#categories");
const colorsList = el("#colorsList");
const tokensEditor = el("#tokensEditor");
const semanticEditor = el("#semanticEditor");

function post(type, payload = {}) { vscode.postMessage({ type, ...payload }); }

function renderCategories() {
	categoriesRoot.innerHTML = "";
	Object.entries(categories).forEach(([cat, keys]) => {
		const div = document.createElement("div");
		div.className = "cat";
		const h = document.createElement("h3");
		h.textContent = cat;
		div.appendChild(h);

		keys.forEach(k => {
			const a = document.createElement("div");
			a.textContent = k;
			a.className = "key";
			a.addEventListener("click", () => {
				const field = el(`[data-key="${esc(k)}"]`);
				if (field) field.scrollIntoView({ behavior: "smooth", block: "center" });
				highlightPreview(k);
			});
			div.appendChild(a);
		});

		categoriesRoot.appendChild(div);
	});
}

function renderColors() {
	const keys = Object.keys(theme.colors).length ? Object.keys(theme.colors) : inferKeysFromTemplate();
	const f = el("#filter").value.trim().toLowerCase();
	filteredKeys = keys.filter(k => !f || k.toLowerCase().includes(f));

	colorsList.innerHTML = "";
	filteredKeys.forEach(k => {
		const rowKey = document.createElement("div");
		rowKey.textContent = k;
		rowKey.className = "key";

		const rowVal = document.createElement("input");
		rowVal.type = "text";
		rowVal.className = "color-input";
		rowVal.placeholder = "#rrggbb or #rrggbbaa";
		rowVal.value = theme.colors[k] || "";
		rowVal.setAttribute("data-key", k);
		rowVal.addEventListener("change", () => {
			theme.colors[k] = rowVal.value.trim();
			post("updateColor", { key: k, value: theme.colors[k] });
			highlightPreview(k);
		});

		colorsList.appendChild(rowKey);
		colorsList.appendChild(rowVal);

		if (descriptions[k]) {
			const desc = document.createElement("div");
			desc.className = "key-desc";
			desc.textContent = descriptions[k];
			colorsList.appendChild(desc);
		}
	});
}

function renderTokens() {
	tokensEditor.innerHTML = "";
	theme.tokenColors.forEach((rule, i) => {
		const row = document.createElement("div");
		row.className = "token-row";

		const name = document.createElement("input");
		name.type = "text";
		name.placeholder = "Name";
		name.value = rule.name || "";
		name.addEventListener("change", () => {
			rule.name = name.value;
			post("updateToken", { index: i, rule });
		});

		const scope = document.createElement("input");
		scope.type = "text";
		scope.placeholder = "Scope (comma-separated)";
		scope.value = Array.isArray(rule.scope) ? rule.scope.join(", ") : (rule.scope || "");
		scope.addEventListener("change", () => {
			rule.scope = scope.value.split(",").map(s => s.trim()).filter(Boolean);
			post("updateToken", { index: i, rule });
		});

		const color = document.createElement("input");
		color.type = "text";
		color.className = "color-input";
		color.placeholder = "#rrggbb or #rrggbbaa";
		color.value = (rule.settings && rule.settings.foreground) || "";
		color.addEventListener("change", () => {
			rule.settings = rule.settings || {};
			rule.settings.foreground = color.value.trim();
			post("updateToken", { index: i, rule });
		});

		row.appendChild(name);
		row.appendChild(scope);
		row.appendChild(color);
		tokensEditor.appendChild(row);
	});

	const add = document.createElement("button");
	add.textContent = "Add token rule";
	add.addEventListener("click", () => {
		theme.tokenColors.push({ name: "Rule", scope: "", settings: { foreground: "#cccccc" } });
		renderTokens();
	});
	tokensEditor.appendChild(add);
}

function renderSemantic() {
	semanticEditor.innerHTML = "";
	const keys = Object.keys(theme.semanticTokenColors);
	keys.forEach(k => {
		const row = document.createElement("div");
		row.className = "token-row";

		const name = document.createElement("input");
		name.type = "text";
		name.value = k;
		name.disabled = true;

		const color = document.createElement("input");
		color.type = "text";
		color.className = "color-input";
		color.placeholder = "#rrggbb or #rrggbbaa";
		const val = theme.semanticTokenColors[k];
		color.value = typeof val === "string" ? val : (val.foreground || "");
		color.addEventListener("change", () => {
			const v = color.value.trim();
			if (typeof val === "string") theme.semanticTokenColors[k] = v;
			else theme.semanticTokenColors[k] = { ...(val || {}), foreground: v };
			post("updateSemantic", { key: k, value: theme.semanticTokenColors[k] });
		});

		row.appendChild(name);
		row.appendChild(color);
		semanticEditor.appendChild(row);
	});

	const add = document.createElement("button");
	add.textContent = "Add semantic rule";
	add.addEventListener("click", () => {
		const key = prompt("Semantic token selector (e.g. function, class, *.declaration)");
		if (!key) return;
		theme.semanticTokenColors[key] = "#cccccc";
		renderSemantic();
		post("updateSemantic", { key, value: theme.semanticTokenColors[key] });
	});
	semanticEditor.appendChild(add);
}

/** Highlight preview card matching a color key */
function highlightPreview(key) {
	els(".prev-card").forEach(c => c.classList.remove("highlight"));
	const match = els(`.prev-card`).find(d => d.getAttribute("data-element") === key);
	if (match) {
		match.classList.add("highlight");
		match.scrollIntoView({ behavior: "smooth", block: "nearest" });
	}
}

function inferKeysFromTemplate() {
	const all = new Set();
	Object.values(categories).forEach(list => list.forEach(k => all.add(k)));
	return Array.from(all);
}

// --- header controls
el("#liveToggle").addEventListener("change", e => post("toggleLive", { value: e.target.checked }));
el("#startBlank").addEventListener("click", () => post("startBlank"));
el("#useCurrent").addEventListener("click", () => post("useCurrentTheme"));
el("#importJSON").addEventListener("click", () => post("importJSON"));
el("#importVSIX").addEventListener("click", () => post("importVSIX"));
el("#exportJSON").addEventListener("click", () => post("exportJSON"));
el("#exportCSS").addEventListener("click", () => post("exportCSS"));
el("#exportVSIX").addEventListener("click", () => post("exportVSIX"));
el("#themeName").addEventListener("change", e => post("rename", { name: e.target.value }));
el("#themeType").addEventListener("change", e => post("setType", { value: e.target.value }));
el("#filter").addEventListener("input", () => renderColors());

// Messages from extension
window.addEventListener("message", ev => {
	const msg = ev.data;
	if (msg.type === "templateLoaded") {
		descriptions = msg.descriptions || {};
		categories = msg.categories || {};
		el("#themeName").value = "My Theme";
		el("#themeType").value = "dark";
		renderCategories();
		renderColors();
		renderTokens();
		renderSemantic();
	}
	if (msg.type === "themeLoaded") {
		theme = msg.theme;
		el("#themeName").value = theme.name || "My Theme";
		el("#themeType").value = theme.type || "dark";
		renderColors();
		renderTokens();
		renderSemantic();
	}
});

// initial render
renderCategories();
renderColors();
renderTokens();
renderSemantic();
