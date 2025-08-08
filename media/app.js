const vscode = acquireVsCodeApi();

const el = s => document.querySelector(s);
const els = s => Array.from(document.querySelectorAll(s));
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
let liveEnabled = true;
let selectedKey = undefined;

// Undo/redo stacks store deep copies of theme
const undoStack = [];
const redoStack = [];

function clone(obj) { return JSON.parse(JSON.stringify(obj)); }
function pushHistory() { undoStack.push(clone(theme)); redoStack.length = 0; updateUndoRedoButtons(); }
function undo() { if (!undoStack.length) return; redoStack.push(clone(theme)); theme = undoStack.pop(); renderAll(); postThemeChanged(); updateUndoRedoButtons(); }
function redo() { if (!redoStack.length) return; undoStack.push(clone(theme)); theme = redoStack.pop(); renderAll(); postThemeChanged(); updateUndoRedoButtons(); }
function updateUndoRedoButtons() { el("#undoBtn").disabled = undoStack.length === 0; el("#redoBtn").disabled = redoStack.length === 0; }

const categoriesRoot = el("#categories");
const colorsList = el("#colorsList");
const tokensEditor = el("#tokensEditor");
const semanticEditor = el("#semanticEditor");
const bundleCount = el("#bundleCount");

// ---------- helpers ----------
function post(type, payload = {}) { vscode.postMessage({ type, ...payload }); }
function postUiState() { post("uiStateChanged", { ui: { liveEnabled, filter: el("#filter").value.trim(), selectedKey } }); }
function postThemeChanged() { post("themeChanged", { theme }); }
function setLiveEnabled(v) { liveEnabled = !!v; post("toggleLive", { value: liveEnabled }); postUiState(); }

function renderCategories() {
	categoriesRoot.innerHTML = "";
	Object.entries(categories).forEach(([cat, keys]) => {
		const div = document.createElement("div");
		div.className = "cat";
		const h = document.createElement("h3"); h.textContent = cat; div.appendChild(h);
		keys.forEach(k => {
			const a = document.createElement("div");
			a.textContent = k; a.className = "key";
			a.addEventListener("click", () => {
				selectedKey = k;
				const field = el(`[data-key="${esc(k)}"]`);
				if (field) field.scrollIntoView({ behavior: "smooth", block: "center" });
				highlightPreview(k);
				renderDiff(k);
				postUiState();
			});
			div.appendChild(a);
		});
		categoriesRoot.appendChild(div);
	});
}

function allKnownKeys() {
	const s = new Set();
	Object.values(categories).forEach(list => list.forEach(k => s.add(k)));
	return s;
}

function renderColors() {
	const keys = Object.keys(theme.colors).length ? Object.keys(theme.colors) : Array.from(allKnownKeys());
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
		rowVal.placeholder = "#rrggbb or #rrggbbaa or rgba(...)";
		rowVal.value = theme.colors[k] || "";
		rowVal.setAttribute("data-key", k);
		rowVal.addEventListener("change", () => {
			pushHistory();
			theme.colors[k] = rowVal.value.trim();
			post("updateColor", { key: k, value: theme.colors[k] });
			highlightPreview(k);
			renderDiff(k);
			postThemeChanged();
		});

		const pick = document.createElement("button");
		pick.className = "pick-btn";
		pick.textContent = "🎨";
		pick.title = "Open color picker";
		pick.addEventListener("click", () => openPicker(k, rowVal));

		colorsList.appendChild(rowKey);
		colorsList.appendChild(rowVal);
		colorsList.appendChild(pick);

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
		name.type = "text"; name.placeholder = "Name"; name.value = rule.name || "";
		name.addEventListener("change", () => {
			pushHistory(); rule.name = name.value; post("updateToken", { index: i, rule }); postThemeChanged();
		});

		const scope = document.createElement("input");
		scope.type = "text"; scope.placeholder = "Scope (comma-separated)";
		scope.value = Array.isArray(rule.scope) ? rule.scope.join(", ") : (rule.scope || "");
		scope.addEventListener("change", () => {
			pushHistory(); rule.scope = scope.value.split(",").map(s => s.trim()).filter(Boolean); post("updateToken", { index: i, rule }); postThemeChanged();
		});

		const color = document.createElement("input");
		color.type = "text"; color.className = "color-input";
		color.placeholder = "#rrggbb or #rrggbbaa or rgba(...)";
		color.value = (rule.settings && rule.settings.foreground) || "";
		color.addEventListener("change", () => {
			pushHistory(); rule.settings = rule.settings || {}; rule.settings.foreground = color.value.trim(); post("updateToken", { index: i, rule }); postThemeChanged();
		});

		const pick = document.createElement("button");
		pick.className = "pick-btn"; pick.textContent = "🎨"; pick.title = "Open color picker";
		pick.addEventListener("click", () => openPickerToken(i, color));

		row.appendChild(name);
		row.appendChild(scope);
		row.appendChild(color);
		row.appendChild(pick);
		tokensEditor.appendChild(row);
	});

	const add = document.createElement("button");
	add.textContent = "Add token rule";
	add.addEventListener("click", () => {
		pushHistory();
		theme.tokenColors.push({ name: "Rule", scope: "", settings: { foreground: "#cccccc" } });
		renderTokens();
		postThemeChanged();
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
		name.type = "text"; name.value = k; name.disabled = true;

		const color = document.createElement("input");
		color.type = "text"; color.className = "color-input";
		color.placeholder = "#rrggbb or #rrggbbaa or rgba(...)";
		const val = theme.semanticTokenColors[k];
		color.value = typeof val === "string" ? val : (val.foreground || "");
		color.addEventListener("change", () => {
			pushHistory();
			const v = color.value.trim();
			if (typeof val === "string") theme.semanticTokenColors[k] = v;
			else theme.semanticTokenColors[k] = { ...(val || {}), foreground: v };
			post("updateSemantic", { key: k, value: theme.semanticTokenColors[k] });
			postThemeChanged();
		});

		const pick = document.createElement("button");
		pick.className = "pick-btn"; pick.textContent = "🎨"; pick.title = "Open color picker";
		pick.addEventListener("click", () => openPickerSemantic(k, color));

		row.appendChild(name);
		row.appendChild(color);
		row.appendChild(pick);
		semanticEditor.appendChild(row);
	});

	const add = document.createElement("button");
	add.textContent = "Add semantic rule";
	add.addEventListener("click", () => {
		const key = prompt("Semantic token selector (e.g. function, class, *.declaration)");
		if (!key) return;
		pushHistory();
		theme.semanticTokenColors[key] = "#cccccc";
		renderSemantic();
		post("updateSemantic", { key, value: theme.semanticTokenColors[key] });
		postThemeChanged();
	});
	semanticEditor.appendChild(add);
}

/** Highlight preview card matching a color key */
function highlightPreview(key) {
	els(".prev-card").forEach(c => c.classList.remove("highlight"));
	const match = els(`.prev-card`).find(d => d.getAttribute("data-element") === key);
	if (match) { match.classList.add("highlight"); match.scrollIntoView({ behavior: "smooth", block: "nearest" }); }
}

function renderProblems(list) {
	const root = el("#problemsList");
	root.innerHTML = "";
	let count = 0;

	if (list.unknown?.length) {
		list.unknown.forEach(k => {
			const d = document.createElement("div");
			d.className = "problem warn";
			d.innerHTML = `<div><b>Unknown color key</b>: ${k}</div><div class="where">colors.${k}</div>`;
			root.appendChild(d); count++;
		});
	}
	if (list.bad?.length) {
		list.bad.forEach(it => {
			const d = document.createElement("div");
			d.className = "problem bad";
			d.innerHTML = `<div><b>Invalid color</b>: ${it.value}</div><div class="where">colors.${it.key}</div>`;
			root.appendChild(d); count++;
		});
	}
	if (!count) root.innerHTML = `<div class="problem good">No problems found.</div>`;
}

function renderDiff(key) {
	const cont = el("#diffView");
	cont.innerHTML = "";
	if (!key) return;

	const oldVal = theme.colors[key] || "";
	const row = document.createElement("div");
	row.className = "row";

	const boxOld = document.createElement("span");
	boxOld.className = "color-box";
	boxOld.style.background = oldVal || "transparent";

	const labOld = document.createElement("span");
	labOld.textContent = `${key}: ${oldVal || "(empty)"}`;

	row.appendChild(boxOld);
	row.appendChild(labOld);
	cont.appendChild(row);
}

function renderAll() {
	el("#themeName").value = theme.name || "My Theme";
	el("#themeType").value = theme.type || "dark";
	renderColors();
	renderTokens();
	renderSemantic();
	updateUndoRedoButtons();
}

// ---------- Tabs ----------
els(".tab").forEach(t => {
	t.addEventListener("click", () => {
		els(".tab").forEach(x => x.classList.remove("active"));
		els(".tabpage").forEach(x => x.classList.remove("active"));
		t.classList.add("active");
		el(`#tab-${t.dataset.tab}`).classList.add("active");
	});
});

// ---------- Color picker overlay ----------
const overlay = el("#pickerOverlay");
const pickerBase = el("#pickerBase");
const pickerHex = el("#pickerHex");
const pickerAlpha = el("#pickerAlpha");
const pickerAlphaVal = el("#pickerAlphaVal");
const swatchesRoot = el("#swatches");
const pickerApply = el("#pickerApply");
const pickerCancel = el("#pickerCancel");

const defaultSwatches = [
	"#000000", "#ffffff", "#ff0000", "#00ff00", "#0000ff",
	"#ffaa00", "#00ffaa", "#aa00ff", "#888888", "#222222"
];

let pickerTarget = null; // { kind: 'color'|'token'|'semantic', key/index, inputEl }

function openPickerColor(key, inputEl) { openPickerCommon(theme.colors[key] || "#ccccccff"); pickerTarget = { kind: "color", key, inputEl }; }
function openPickerToken(index, inputEl) {
	const v = theme.tokenColors[index]?.settings?.foreground || "#ccccccff";
	openPickerCommon(v); pickerTarget = { kind: "token", index, inputEl };
}
function openPickerSemantic(key, inputEl) {
	const val = theme.semanticTokenColors[key];
	const v = typeof val === "string" ? val : (val?.foreground || "#ccccccff");
	openPickerCommon(v); pickerTarget = { kind: "semantic", key, inputEl };
}
function openPicker(key, inputEl) { openPickerColor(key, inputEl); }

function openPickerCommon(initial) {
	const { hex6, alpha } = splitColor(initial);
	pickerBase.value = hex6;
	pickerAlpha.value = String(Math.round(alpha * 100));
	pickerAlphaVal.textContent = `${Math.round(alpha * 100)}%`;
	pickerHex.value = mergeHexAlpha(hex6, alpha);
	buildSwatches();
	overlay.classList.remove("hidden");
}
function closePicker() { overlay.classList.add("hidden"); pickerTarget = null; }

pickerBase.addEventListener("input", () => {
	const a = Number(pickerAlpha.value) / 100;
	pickerHex.value = mergeHexAlpha(pickerBase.value, a);
});
pickerAlpha.addEventListener("input", () => {
	const a = Number(pickerAlpha.value) / 100;
	pickerAlphaVal.textContent = `${Math.round(a * 100)}%`;
	pickerHex.value = mergeHexAlpha(pickerBase.value, a);
});
pickerHex.addEventListener("input", () => {
	const { hex6, alpha } = splitColor(pickerHex.value);
	if (hex6) {
		pickerBase.value = hex6;
		pickerAlpha.value = String(Math.round(alpha * 100));
		pickerAlphaVal.textContent = `${Math.round(alpha * 100)}%`;
	}
});
pickerApply.addEventListener("click", () => {
	if (!pickerTarget) return;
	const val = pickerHex.value.trim();
	pushHistory();
	if (pickerTarget.kind === "color") {
		theme.colors[pickerTarget.key] = val;
		pickerTarget.inputEl.value = val;
		post("updateColor", { key: pickerTarget.key, value: val });
	} else if (pickerTarget.kind === "token") {
		const i = pickerTarget.index;
		theme.tokenColors[i] = theme.tokenColors[i] || { settings: {} };
		theme.tokenColors[i].settings = theme.tokenColors[i].settings || {};
		theme.tokenColors[i].settings.foreground = val;
		pickerTarget.inputEl.value = val;
		post("updateToken", { index: i, rule: theme.tokenColors[i] });
	} else if (pickerTarget.kind === "semantic") {
		const k = pickerTarget.key;
		const cur = theme.semanticTokenColors[k];
		if (typeof cur === "string") theme.semanticTokenColors[k] = val;
		else theme.semanticTokenColors[k] = { ...(cur || {}), foreground: val };
		pickerTarget.inputEl.value = val;
		post("updateSemantic", { key: k, value: theme.semanticTokenColors[k] });
	}
	postThemeChanged();
	closePicker();
});
pickerCancel.addEventListener("click", () => closePicker());

function buildSwatches() {
	swatchesRoot.innerHTML = "";
	defaultSwatches.forEach(s => {
		const div = document.createElement("div");
		div.className = "swatch";
		div.style.background = s;
		div.title = s;
		div.addEventListener("click", () => {
			pickerBase.value = toHex6(s);
			pickerAlpha.value = "100";
			pickerAlphaVal.textContent = "100%";
			pickerHex.value = mergeHexAlpha(pickerBase.value, 1);
		});
		swatchesRoot.appendChild(div);
	});
}

// color utils
function toHex6(s) {
	const m6 = /^#([0-9a-fA-F]{6})$/.exec(s);
	if (m6) return `#${m6[1].toLowerCase()}`;
	const m8 = /^#([0-9a-fA-F]{8})$/.exec(s);
	if (m8) return `#${m8[1].slice(0, 6).toLowerCase()}`;
	return "#cccccc";
}
function mergeHexAlpha(hex6, alpha) {
	const a = Math.round(alpha * 255).toString(16).padStart(2, "0");
	return `${hex6.toLowerCase()}${a}`;
}
function splitColor(value) {
	const v = (value || "").trim();
	const m8 = /^#([0-9a-fA-F]{8})$/.exec(v);
	if (m8) {
		const hex6 = `#${m8[1].slice(0, 6).toLowerCase()}`;
		const a = parseInt(m8[1].slice(6, 8), 16) / 255;
		return { hex6, alpha: a };
	}
	const m6 = /^#([0-9a-fA-F]{6})$/.exec(v);
	if (m6) return { hex6: `#${m6[1].toLowerCase()}`, alpha: 1 };
	return { hex6: "#cccccc", alpha: 1 };
}

// ---------- Wire up header controls ----------
el("#liveToggle").addEventListener("change", e => setLiveEnabled(e.target.checked));
el("#startBlank").addEventListener("click", () => post("startBlank"));
el("#useCurrent").addEventListener("click", () => post("useCurrentTheme"));
el("#importJSON").addEventListener("click", () => post("importJSON"));
el("#importVSIX").addEventListener("click", () => post("importVSIX"));
el("#exportJSON").addEventListener("click", () => post("exportJSON"));
el("#exportCSS").addEventListener("click", () => post("exportCSS"));
el("#exportVSIX").addEventListener("click", () => post("exportVSIX"));
el("#bundleAdd").addEventListener("click", () => post("bundleAdd"));
el("#bundleClear").addEventListener("click", () => post("bundleClear"));
el("#exportBundleVSIX").addEventListener("click", () => post("exportBundleVSIX"));
el("#themeName").addEventListener("change", e => { pushHistory(); post("rename", { name: e.target.value }); theme.name = e.target.value; postThemeChanged(); });
el("#themeType").addEventListener("change", e => { pushHistory(); post("setType", { value: e.target.value }); theme.type = e.target.value; postThemeChanged(); });
el("#filter").addEventListener("input", () => { renderColors(); postUiState(); });
el("#undoBtn").addEventListener("click", undo);
el("#redoBtn").addEventListener("click", redo);
window.addEventListener("keydown", (ev) => {
	if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === "z") { ev.preventDefault(); undo(); }
	if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === "y") { ev.preventDefault(); redo(); }
});

// Messages from extension
window.addEventListener("message", ev => {
	const msg = ev.data;
	if (msg.type === "templateLoaded") {
		descriptions = msg.descriptions || {};
		categories = msg.categories || {};
		if (msg.persisted?.theme) theme = msg.persisted.theme;
		if (msg.persisted?.ui) {
			liveEnabled = !!msg.persisted.ui.liveEnabled;
			const f = msg.persisted.ui.filter || "";
			el("#filter").value = f;
			selectedKey = msg.persisted.ui.selectedKey;
		}
		if (typeof msg.persisted?.bundleCount === "number") {
			bundleCount.textContent = String(msg.persisted.bundleCount);
		}
		el("#themeName").value = theme.name || "My Theme";
		el("#themeType").value = theme.type || "dark";
		el("#liveToggle").checked = !!liveEnabled;
		renderCategories();
		renderAll();
		if (selectedKey) { highlightPreview(selectedKey); renderDiff(selectedKey); }
		postUiState();
	}
	if (msg.type === "themeLoaded") {
		theme = msg.theme;
		el("#themeName").value = theme.name || "My Theme";
		el("#themeType").value = theme.type || "dark";
		renderAll();
		postUiState();
	}
	if (msg.type === "problems") {
		renderProblems(msg.data || {});
	}
	if (msg.type === "bundleCount") {
		bundleCount.textContent = String(msg.count || 0);
	}
});

// initial render guard
renderCategories();
renderAll();
updateUndoRedoButtons();
