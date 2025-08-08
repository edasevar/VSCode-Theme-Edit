// Ensure this script is running in a VS Code Webview context
let acquireVsCodeApi = function() {};

let vscode;
if (typeof acquireVsCodeApi !== "undefined") {
	vscode = acquireVsCodeApi();
} else {
	console.error("acquireVsCodeApi is not available. Ensure this script is running in a VS Code Webview context.");
}

const el = s => document.querySelector(s);
const els = s => Array.from(document.querySelectorAll(s));
const esc = s => (window.CSS && CSS.escape ? CSS.escape(s) : String(s).replace(/"/g, '\\"'));

let theme = {
	$schema: "vscode://schemas/color-theme",
	name: "My Theme",
	type: "dark",
	colors: {},
	tokenColors: /** @type {{ name?: string; scope?: string | string[]; settings?: { foreground?: string } }[]} */ ([]),
	semanticTokenColors: {}
};

let descriptions = {};
let categories = {};
let tree = [];
let filteredKeys = [];
let liveEnabled = true;
let selectedKey;

const undoStack = [];
const redoStack = [];
function clone(o) { return JSON.parse(JSON.stringify(o)); }
function pushHistory() { undoStack.push(clone(theme)); redoStack.length = 0; updateUndoRedoButtons(); }
function undo() { if (!undoStack.length) return; redoStack.push(clone(theme)); theme = undoStack.pop(); renderAll(); postThemeChanged(); updateUndoRedoButtons(); }
function redo() { if (!redoStack.length) return; undoStack.push(clone(theme)); theme = redoStack.pop(); renderAll(); postThemeChanged(); updateUndoRedoButtons(); }
function updateUndoRedoButtons() { el("#undoBtn").disabled = !undoStack.length; el("#redoBtn").disabled = !redoStack.length; }

const categoriesRoot = el("#categories");
const colorsList = el("#colorsList");
const tokensEditor = el("#tokensEditor");
const semanticEditor = el("#semanticEditor");
const bundleCount = el("#bundleCount");

function post(type, payload = {}) { vscode.postMessage({ type, ...payload }); }
function postUiState() { post("uiStateChanged", { ui: { liveEnabled, filter: el("#filter").value.trim(), selectedKey } }); }
function postThemeChanged() { post("themeChanged", { theme }); }
function setLiveEnabled(v) { liveEnabled = !!v; post("toggleLive", { value: liveEnabled }); postUiState(); }

function normalizeColor(input) {
	if (!input || typeof input !== "string") return input;
	const v = input.trim(); const m = /^#([0-9a-fA-F]{8})$/.exec(v);
	if (!m) return v;
	const h = m[1], r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16), a = Math.round((parseInt(h.slice(6, 8), 16) / 255) * 1000) / 1000;
	return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/* ========== Categories (tree) ========== */
function renderCategoriesTree() {
	categoriesRoot.innerHTML = `
    <div id="catHeader">
      <input id="catFilter" placeholder="Filter categories..." class="tooltip" data-tooltip="Search through theme categories and color keys" />
      <button id="expandAll" class="secondary tooltip" data-tooltip="Expand all category sections">Expand All</button>
      <button id="collapseAll" class="secondary tooltip" data-tooltip="Collapse all category sections">Collapse</button>
    </div>
    <div id="catBody"></div>
    <div class="help-section">
      <div class="help-icon tooltip" data-tooltip="Click on any color name to select and edit it. The preview will update to show the affected UI elements.">?</div>
      <span>Click colors to edit</span>
    </div>
  `;
	const q = (el("#catFilter")?.value || "").toLowerCase();
	const root = el("#catBody");

	function addNode(node, container) {
		const wrap = document.createElement("div"); wrap.className = "node";
		const head = document.createElement("div"); head.className = "node-head";
		const chev = document.createElement("div"); chev.className = "chev"; chev.textContent = "▸";
		const label = document.createElement("div"); label.className = "label"; label.textContent = node.label;
		const count = document.createElement("div"); count.className = "count";
		const nKeys = (node.keys?.length || 0) + (node.children?.reduce((s, c) => s + (c.keys?.length || 0), 0) || 0);
		count.textContent = nKeys ? String(nKeys) : "";
		head.appendChild(chev); head.appendChild(label); head.appendChild(count);
		wrap.appendChild(head);

		const children = document.createElement("div"); children.className = "children"; children.style.display = "none";

		(node.keys || []).forEach(k => {
			if (q && !k.toLowerCase().includes(q)) return;
			const row = document.createElement("div"); row.className = "key-item";
			const chip = document.createElement("div"); chip.className = "key-chip"; chip.style.background = theme.colors[k] || "transparent";
			const name = document.createElement("div"); name.className = "key-name"; name.textContent = k;
			row.appendChild(chip); row.appendChild(name);
			row.addEventListener("click", () => {
				selectedKey = k;
				const field = el(`[data-key="${esc(k)}"]`); if (field) field.scrollIntoView({ behavior: "smooth", block: "center" });
				highlightPreview(k); renderDiff(k); postUiState();
			});
			children.appendChild(row);
		});

		(node.children || []).forEach(c => {
			const matchesLabel = !q || c.label.toLowerCase().includes(q);
			const matchesKeys = !q || (c.keys || []).some(k => k.toLowerCase().includes(q));
			if (matchesLabel || matchesKeys) addNode(c, children);
		});

		head.addEventListener("click", () => {
			const open = children.style.display !== "none";
			children.style.display = open ? "none" : "block";
			chev.textContent = open ? "▸" : "▾";
		});

		container.appendChild(wrap);
	}

	tree.forEach(n => addNode(n, root));

	el("#expandAll").onclick = () => { els("#catBody .children").forEach(c => c.style.display = "block"); els("#catBody .chev").forEach(c => c.textContent = "▾"); };
	el("#collapseAll").onclick = () => { els("#catBody .children").forEach(c => c.style.display = "none"); els("#catBody .chev").forEach(c => c.textContent = "▸"); };
	el("#catFilter").addEventListener("input", () => renderCategoriesTree());
}

function allKnownKeys() {
	const s = new Set();
	(tree || []).forEach(sec => {
		(sec.keys || []).forEach(k => s.add(k));
		(sec.children || []).forEach(ch => (ch.keys || []).forEach(k => s.add(k)));
	});
	if (!s.size) Object.values(categories).forEach(list => list.forEach(k => s.add(k)));
	return s;
}

/* ========== Colors editor ========== */
function renderColors() {
	const keys = Object.keys(theme.colors).length ? Object.keys(theme.colors) : Array.from(allKnownKeys());
	const f = el("#filter").value.trim().toLowerCase();
	filteredKeys = keys.filter(k => !f || k.toLowerCase().includes(f));

	colorsList.innerHTML = "";
	filteredKeys.forEach(k => {
		const rowKey = document.createElement("div"); rowKey.textContent = k; rowKey.className = "key";
		const rowVal = document.createElement("input"); rowVal.type = "text"; rowVal.className = "color-input tooltip";
		rowVal.placeholder = "Enter color: #rrggbb, #rrggbbaa, or rgba(...)";
		rowVal.setAttribute("data-tooltip", "Supported formats: #rrggbb (RGB), #rrggbbaa (RGBA), rgba(r,g,b,a), or color names");
		rowVal.value = theme.colors[k] || ""; rowVal.setAttribute("data-key", k);
		rowVal.addEventListener("change", () => {
			pushHistory();
			theme.colors[k] = rowVal.value.trim();
			post("updateColor", { key: k, value: theme.colors[k] });
			updatePreviewStyleForKey(k); renderDiff(k);
			els(".key-item .key-name").filter(n => n.textContent === k).map(n => n.previousSibling).forEach(ch => ch.style.background = theme.colors[k] || "transparent");
			postThemeChanged();
		});
		const pick = document.createElement("button"); pick.className = "pick-btn tooltip"; pick.textContent = "🎨";
		pick.setAttribute("data-tooltip", "Open visual color picker");
		pick.addEventListener("click", () => openPicker(k, rowVal));

		colorsList.appendChild(rowKey); colorsList.appendChild(rowVal); colorsList.appendChild(pick);
		if (descriptions[k]) { const d = document.createElement("div"); d.className = "key-desc"; d.textContent = descriptions[k]; colorsList.appendChild(d); }
	});
}

/* ========== Tokens editor ========== */
function renderTokens() {
	tokensEditor.innerHTML = "";
	/** @type {{ name?: string, scope?: string | string[], settings?: { foreground?: string } }} */
	theme.tokenColors.forEach((/** @type {any} */ rule, i) => {
		const row = document.createElement("div"); row.className = "token-row";
		const name = document.createElement("input"); name.type = "text"; name.placeholder = "Name"; name.value = rule.name || "";
		name.addEventListener("change", () => { pushHistory(); rule.name = name.value; post("updateToken", { index: i, rule }); postThemeChanged(); applyTokenPreview(); });

		const scope = document.createElement("input"); scope.type = "text"; scope.placeholder = "Scope (comma-separated)";
		scope.value = Array.isArray(rule.scope) ? rule.scope.join(", ") : (rule.scope || "");
		scope.addEventListener("change", () => { pushHistory(); rule.scope = scope.value.split(",").map(s => s.trim()).filter(Boolean); post("updateToken", { index: i, rule }); postThemeChanged(); applyTokenPreview(); });

		const color = document.createElement("input"); color.type = "text"; color.className = "color-input";
		color.placeholder = "#rrggbb or #rrggbbaa or rgba(...)";
		color.value = (rule.settings && rule.settings.foreground) || "";
		color.addEventListener("change", () => { pushHistory(); rule.settings = rule.settings || {}; rule.settings.foreground = color.value.trim(); post("updateToken", { index: i, rule }); postThemeChanged(); applyTokenPreview(); });

		const pick = document.createElement("button"); pick.className = "pick-btn"; pick.textContent = "🎨"; pick.title = "Open color picker";
		pick.addEventListener("click", () => openPickerToken(i, color));

		row.appendChild(name); row.appendChild(scope); row.appendChild(color); row.appendChild(pick);
		tokensEditor.appendChild(row);
	});

	const add = document.createElement("button"); add.textContent = "Add token rule";
	add.addEventListener("click", () => { pushHistory(); theme.tokenColors.push({ name: "Rule", scope: "", settings: { foreground: "#cccccc" } }); renderTokens(); postThemeChanged(); applyTokenPreview(); });
	tokensEditor.appendChild(add);
}

function renderSemantic() {
	semanticEditor.innerHTML = "";
	Object.keys(theme.semanticTokenColors).forEach(k => {
		const row = document.createElement("div"); row.className = "token-row";
		const name = document.createElement("input"); name.type = "text"; name.value = k; name.disabled = true;
		const color = document.createElement("input"); color.type = "text"; color.className = "color-input";
		color.placeholder = "#rrggbb or #rrggbbaa or rgba(...)";
		const val = theme.semanticTokenColors[k]; color.value = typeof val === "string" ? val : (val?.foreground || "");
		color.addEventListener("change", () => { pushHistory(); const v = color.value.trim(); theme.semanticTokenColors[k] = typeof val === "string" ? v : { ...(val || {}), foreground: v }; post("updateSemantic", { key: k, value: theme.semanticTokenColors[k] }); postThemeChanged(); });
		const pick = document.createElement("button"); pick.className = "pick-btn"; pick.textContent = "🎨";
		pick.addEventListener("click", () => openPickerSemantic(k, color));
		row.appendChild(name); row.appendChild(color); row.appendChild(pick);
		semanticEditor.appendChild(row);
	});
	const add = document.createElement("button"); add.textContent = "Add semantic rule";
	add.addEventListener("click", () => { const key = prompt("Semantic token selector (e.g. function, class, *.declaration)"); if (!key) return; pushHistory(); theme.semanticTokenColors[key] = "#cccccc"; renderSemantic(); post("updateSemantic", { key, value: theme.semanticTokenColors[key] }); postThemeChanged(); });
	semanticEditor.appendChild(add);
}

/* ========== Better preview mapping ========== */
const previewMap = {
	"editor.background": v => setVar("--pv-editor-bg", v),
	"editor.foreground": v => setVar("--pv-editor-fg", v),
	"editor.selectionBackground": v => setVar("--pv-selection-bg", v),
	"editor.lineHighlightBackground": v => setVar("--pv-linehighlight-bg", v),
	"editorCursor.foreground": v => setVar("--pv-cursor", v),

	"button.background": v => setVar("--pv-accent", v),
	"focusBorder": v => setVar("--pv-focus", v),

	"tab.activeBackground": v => setVar("--pv-tab-active-bg", v),
	"tab.inactiveBackground": v => setVar("--pv-tab-inactive-bg", v),

	"input.background": v => setVar("--pv-input-bg", v),
	"input.foreground": v => setVar("--pv-input-fg", v),
	"input.border": v => setVar("--pv-input-border", v),

	"sideBar.background": v => setVar("--pv-sidebar-bg", v),
	"sideBar.foreground": v => setVar("--pv-sidebar-fg", v),

	"activityBar.background": v => setVar("--pv-activity-bg", v),
	"activityBarBadge.background": v => setVar("--pv-activity-active", v),

	"panel.background": v => setVar("--pv-panel-bg", v),
	"panelTitle.activeForeground": v => setVar("--pv-panel-fg", v),
	"panelTitle.activeBorder": v => setVar("--pv-panel-header", v),

	"statusBar.background": v => setVar("--pv-statusbar-bg", v),
	"statusBar.foreground": v => setVar("--pv-statusbar-fg", v),

	"titleBar.activeBackground": v => setVar("--pv-titlebar-bg", v),
	"titleBar.activeForeground": v => setVar("--pv-titlebar-fg", v),

	"list.activeSelectionBackground": v => document.querySelectorAll(".explorer li.active").forEach(li => {
		const element = li instanceof HTMLElement ? li : null;
		if (element) {
			element.style.background = normalizeColor(v);
		}
	}),
};

function setVar(name, val) { document.documentElement.style.setProperty(name, normalizeColor(val)); }
function applyPreviewStyles() { Object.keys(theme.colors || {}).forEach(updatePreviewStyleForKey); applyTokenPreview(); }
function updatePreviewStyleForKey(key) {
	const fn = previewMap[key]; if (fn) fn(theme.colors[key]);
	if (key === "button.background") els(".demo-btn").forEach(b => b.style.background = normalizeColor(theme.colors[key]));
	if (key === "input.background") els(".demo-input").forEach(i => i.style.background = normalizeColor(theme.colors[key]));
	if (key === "input.foreground") els(".demo-input").forEach(i => i.style.color = normalizeColor(theme.colors[key]));
	if (key === "input.border") els(".demo-input").forEach(i => i.style.borderColor = normalizeColor(theme.colors[key]));
}

/* Heuristic token color application */
function findColor(scopesList) {
	for (const rule of (theme.tokenColors || [])) {
		if (!rule.scope || !rule.settings?.foreground) continue;
		const scopes = Array.isArray(rule.scope) ? rule.scope : String(rule.scope).split(",").map(s => s.trim());
		if (scopes.some(s => scopesList.some(want => s.includes(want)))) return rule.settings.foreground;
	}
	return null;
}
function applyTokenPreview() {
	const map = {
		"--tok-comment": findColor(["comment"]),
		"--tok-keyword": findColor(["keyword", "storage.type", "storage.modifier"]),
		"--tok-string": findColor(["string"]),
		"--tok-number": findColor(["constant.numeric"]),
		"--tok-func": findColor(["entity.name.function", "support.function"]),
		"--tok-var": findColor(["variable", "variable.parameter"])
	};
	for (const [k, v] of Object.entries(map)) { if (v) document.documentElement.style.setProperty(k, normalizeColor(v)); }
}

/* misc UI */
function highlightPreview(key) {
	els(".prev-card").forEach(c => c.classList.remove("highlight"));
	const m = els(".prev-card").find(d => d.getAttribute("data-element") === key);
	if (m) { m.classList.add("highlight"); m.scrollIntoView({ behavior: "smooth", block: "nearest" }); }
}
function renderProblems(list) {
	const root = el("#problemsList"); root.innerHTML = ""; let count = 0;
	(list.unknown || []).forEach(k => { const d = document.createElement("div"); d.className = "problem warn"; d.innerHTML = `<div><b>Unknown color key</b>: ${k}</div><div class="where">colors.${k}</div>`; root.appendChild(d); count++; });
	(list.bad || []).forEach(it => { const d = document.createElement("div"); d.className = "problem bad"; d.innerHTML = `<div><b>Invalid color</b>: ${it.value}</div><div class="where">colors.${it.key}</div>`; root.appendChild(d); count++; });
	if (!count) root.innerHTML = `<div class="problem good">No problems found.</div>`;
}
function renderDiff(key) {
	const cont = el("#diffView"); cont.innerHTML = ""; if (!key) return;
	const old = theme.colors[key] || ""; const row = document.createElement("div"); row.className = "row";
	const box = document.createElement("span"); box.className = "color-box"; box.style.background = normalizeColor(old) || "transparent";
	const lab = document.createElement("span"); lab.textContent = `${key}: ${old || "(empty)"}`;
	row.appendChild(box); row.appendChild(lab); cont.appendChild(row);
}

/* Tabs */
els(".tab").forEach(t => {
	t.addEventListener("click", () => {
		els(".tab").forEach(x => x.classList.remove("active"));
		els(".tabpage").forEach(x => x.classList.remove("active"));
		t.classList.add("active"); el(`#tab-${t.dataset.tab}`).classList.add("active");
	});
});

/* Resizable gutters */
(function makeResizable() {
	const cols = el("main");
	const g1 = document.createElement("div"); g1.className = "gutter";
	const g2 = document.createElement("div"); g2.className = "gutter";
	cols.insertBefore(g1, cols.children[1]); cols.insertBefore(g2, cols.children[3]);
	let drag = null;
	function start(which, ev) { drag = { which, x: ev.clientX, sizes: getSizes() }; ev.preventDefault(); }
	function getSizes() { const cs = getComputedStyle(cols); return cs.gridTemplateColumns.split(" ").map(x => x.trim()); }
	function setSizes(arr) { cols.style.gridTemplateColumns = arr.join(" "); }
	g1.addEventListener("mousedown", ev => start(1, ev));
	g2.addEventListener("mousedown", ev => start(2, ev));
	window.addEventListener("mousemove", ev => {
		if (!drag) return;
		const dx = ev.clientX - drag.x; const sizes = drag.sizes.slice();
		if (drag.which === 1) { const a = parseInt(sizes[0]); sizes[0] = Math.max(220, a + dx) + "px"; }
		else { const e = parseInt(sizes[2]); sizes[2] = Math.max(420, e + dx) + "px"; }
		setSizes(sizes);
	});
	window.addEventListener("mouseup", () => drag = null);
})();

/* Color picker */
const overlay = el("#pickerOverlay"), pickerBase = el("#pickerBase"), pickerHex = el("#pickerHex"), pickerAlpha = el("#pickerAlpha"), pickerAlphaVal = el("#pickerAlphaVal"), swatchesRoot = el("#swatches"), pickerApply = el("#pickerApply"), pickerCancel = el("#pickerCancel");
const defaultSwatches = ["#000000", "#ffffff", "#ff0000", "#00ff00", "#0000ff", "#ffaa00", "#00ffaa", "#aa00ff", "#888888", "#222222"];
let pickerTarget = null;
function openPickerColor(key, inputEl) { openPickerCommon(theme.colors[key] || "#ccccccff"); pickerTarget = { kind: "color", key, inputEl }; }
function openPickerToken(index, inputEl) { const v = theme.tokenColors[index]?.settings?.foreground || "#ccccccff"; openPickerCommon(v); pickerTarget = { kind: "token", index, inputEl }; }
function openPickerSemantic(key, inputEl) { const cur = theme.semanticTokenColors[key]; const v = typeof cur === "string" ? cur : (cur?.foreground || "#ccccccff"); openPickerCommon(v); pickerTarget = { kind: "semantic", key, inputEl }; }
function openPicker(key, inputEl) { openPickerColor(key, inputEl); }
function openPickerCommon(initial) {
	const { hex6, alpha } = splitColor(initial);
	pickerBase.value = hex6; pickerAlpha.value = String(Math.round(alpha * 100)); pickerAlphaVal.textContent = `${Math.round(alpha * 100)}%`; pickerHex.value = mergeHexAlpha(hex6, alpha);
	buildSwatches(); overlay.classList.remove("hidden");
}
function closePicker() { overlay.classList.add("hidden"); pickerTarget = null; }
pickerBase.addEventListener("input", () => { const a = Number(pickerAlpha.value) / 100; pickerHex.value = mergeHexAlpha(pickerBase.value, a); });
pickerAlpha.addEventListener("input", () => { const a = Number(pickerAlpha.value) / 100; pickerAlphaVal.textContent = `${Math.round(a * 100)}%`; pickerHex.value = mergeHexAlpha(pickerBase.value, a); });
pickerHex.addEventListener("input", () => { const { hex6, alpha } = splitColor(pickerHex.value); if (hex6) { pickerBase.value = hex6; pickerAlpha.value = String(Math.round(alpha * 100)); pickerAlphaVal.textContent = `${Math.round(alpha * 100)}%`; } });
pickerApply.addEventListener("click", () => {
	if (!pickerTarget) return;
	const val = pickerHex.value.trim(); pushHistory();
	if (pickerTarget.kind === "color") { theme.colors[pickerTarget.key] = val; pickerTarget.inputEl.value = val; post("updateColor", { key: pickerTarget.key, value: val }); updatePreviewStyleForKey(pickerTarget.key); }
	else if (pickerTarget.kind === "token") { const i = pickerTarget.index; theme.tokenColors[i] = theme.tokenColors[i] || { settings: {} }; theme.tokenColors[i].settings = theme.tokenColors[i].settings || {}; theme.tokenColors[i].settings.foreground = val; pickerTarget.inputEl.value = val; post("updateToken", { index: i, rule: theme.tokenColors[i] }); applyTokenPreview(); }
	else { const k = pickerTarget.key; const cur = theme.semanticTokenColors[k]; theme.semanticTokenColors[k] = typeof cur === "string" ? val : { ...(cur || {}), foreground: val }; pickerTarget.inputEl.value = val; post("updateSemantic", { key: k, value: theme.semanticTokenColors[k] }); }
	postThemeChanged(); closePicker();
});
pickerCancel.addEventListener("click", () => closePicker());
function buildSwatches() { swatchesRoot.innerHTML = ""; defaultSwatches.forEach(s => { const d = document.createElement("div"); d.className = "swatch"; d.style.background = s; d.title = s; d.addEventListener("click", () => { pickerBase.value = toHex6(s); pickerAlpha.value = "100"; pickerAlphaVal.textContent = "100%"; pickerHex.value = mergeHexAlpha(pickerBase.value, 1); }); swatchesRoot.appendChild(d); }); }
function toHex6(s) { const m6 = /^#([0-9a-fA-F]{6})$/.exec(s); if (m6) return `#${m6[1].toLowerCase()}`; const m8 = /^#([0-9a-fA-F]{8})$/.exec(s); if (m8) return `#${m8[1].slice(0, 6).toLowerCase()}`; return "#cccccc"; }
function mergeHexAlpha(hex6, a) { const aa = Math.round(a * 255).toString(16).padStart(2, "0"); return `${hex6.toLowerCase()}${aa}`; }
function splitColor(value) { const v = (value || "").trim(); const m8 = /^#([0-9a-fA-F]{8})$/.exec(v); if (m8) { const hex6 = `#${m8[1].slice(0, 6).toLowerCase()}`; const a = parseInt(m8[1].slice(6, 8), 16) / 255; return { hex6, alpha: a }; } const m6 = /^#([0-9a-fA-F]{6})$/.exec(v); if (m6) return { hex6: `#${m6[1].toLowerCase()}`, alpha: 1 }; return { hex6: "#cccccc", alpha: 1 }; }

/* Wire up header */
el("#liveToggle").addEventListener("change", e => {
	setLiveEnabled(e.target.checked);
	// Visual feedback for live preview toggle
	const label = e.target.parentElement;
	if (e.target.checked) {
		label.style.color = "#007acc";
		label.style.fontWeight = "600";
	} else {
		label.style.color = "#cccccc";
		label.style.fontWeight = "400";
	}
});
el("#startBlank").addEventListener("click", () => post("startBlank"));
el("#useCurrent").addEventListener("click", () => post("useCurrentTheme"));
el("#importJSON").addEventListener("click", () => post("importJSON"));
el("#importVSIX").addEventListener("click", () => post("importVSIX"));
el("#loadTemplateBtn").addEventListener("click", () => post("loadTemplate"));
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
window.addEventListener("keydown", (ev) => { if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === "z") { ev.preventDefault(); undo(); } if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === "y") { ev.preventDefault(); redo(); } });

/* Messages from extension */
window.addEventListener("message", ev => {
	const msg = ev.data;
	if (msg.type === "templateLoaded") {
		descriptions = msg.descriptions || {}; categories = msg.categories || {}; tree = msg.tree || [];
		if (msg.persisted?.theme) theme = msg.persisted.theme;
		if (msg.persisted?.ui) { liveEnabled = !!msg.persisted.ui.liveEnabled; el("#filter").value = msg.persisted.ui.filter || ""; selectedKey = msg.persisted.ui.selectedKey; }
		if (typeof msg.persisted?.bundleCount === "number") bundleCount.textContent = String(msg.persisted.bundleCount);
		el("#themeName").value = theme.name || "My Theme"; el("#themeType").value = theme.type || "dark"; el("#liveToggle").checked = !!liveEnabled;
		renderCategoriesTree(); renderAll(); if (selectedKey) { highlightPreview(selectedKey); renderDiff(selectedKey); } postUiState();
	}
	if (msg.type === "themeLoaded") { theme = msg.theme; el("#themeName").value = theme.name || "My Theme"; el("#themeType").value = theme.type || "dark"; renderAll(); postUiState(); }
	if (msg.type === "problems") { renderProblems(msg.data || {}); }
	if (msg.type === "bundleCount") { bundleCount.textContent = String(msg.count || 0); }
});

/* Initial render */
function renderAll() { renderColors(); renderTokens(); renderSemantic(); applyPreviewStyles(); updateUndoRedoButtons(); }
renderCategoriesTree(); renderAll(); updateUndoRedoButtons();
