// Purpose: webview UI logic: state, controls, color w/alpha, navigation, messaging.

const vscode = acquireVsCodeApi();

let TEMPLATE = null;
let STATE = null;

// --- Utilities --- //
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const post = (type, payload = {}) => vscode.postMessage({ type, ...payload });
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const isHex = (v) => /^#([0-9a-f]{6}|[0-9a-f]{8})$/i.test(v);

function hex8ToRGBA(hex) {
	const h = hex.replace("#", "");
	const hh = h.length === 6 ? h + "ff" : h;
	const r = parseInt(hh.slice(0, 2), 16);
	const g = parseInt(hh.slice(2, 4), 16);
	const b = parseInt(hh.slice(4, 6), 16);
	const a = parseInt(hh.slice(6, 8), 16);
	return { r, g, b, a };
}
function rgbaToHex8({ r, g, b, a }) {
	const to2 = (n) => n.toString(16).padStart(2, "0");
	return `#${to2(r)}${to2(g)}${to2(b)}${to2(a)}`;
}
function rgbHex6({ r, g, b }) {
	const to2 = (n) => n.toString(16).padStart(2, "0");
	return `#${to2(r)}${to2(g)}${to2(b)}`;
}
function toCssVarKey(colorKey) {
	// Map VS Code workbench key to CSS var name used in preview.css
	return colorKey
		.replace(/\./g, "-")
		.replace("titleBar.activeBackground", "titleBar-activeBackground")
		.replace("sideBar.background", "sideBar-background")
		.replace("statusBar.background", "statusBar-background")
		.replace("editor.background", "editor-background")
		.replace("editor.foreground", "editor-foreground")
		.replace("editorCursor.foreground", "editorCursor-foreground");
}

// --- Boot --- //
async function loadTemplate() {
	try {
		const el = document.getElementById("themelab-template");
		const raw = el ? el.textContent || "{}" : "{}";
		TEMPLATE = JSON.parse(raw);
	} catch (e) {
		console.warn("Failed to parse embedded template JSON; using fallback.", e);
		TEMPLATE = {
			colors: { "All": { "editor.background": { description: "Editor background" } } },
			semanticTokenColors: { types: {}, modifiers: {} },
			tokenColors: [],
		};
	}
}

function initTabs() {
	$$(".tab").forEach((btn) => {
		btn.addEventListener("click", () => {
			$$(".tab").forEach((b) => b.classList.toggle("active", b === btn));
			$$(".pane").forEach((p) => p.classList.remove("active"));
			$("#pane-" + btn.dataset.tab).classList.add("active");
		});
	});
}

function fillColorSelectors() {
	const catSel = $("#color-category");
	const keySel = $("#color-key");
	catSel.innerHTML = "";

	// Determine if colors are grouped (object-of-objects) or flat (key->value)
	const colorsRoot = TEMPLATE.colors || {};
	const isGrouped = Object.values(colorsRoot).some(
		(v) => v && typeof v === "object" && !Array.isArray(v)
	);
	let categories = [];
	if (isGrouped) {
		categories = Object.keys(colorsRoot);
	} else {
		categories = ["All"];
	}
	categories.forEach((cat) => {
		const opt = document.createElement("option");
		opt.value = cat;
		opt.textContent = cat;
		catSel.appendChild(opt);
	});
	catSel.addEventListener("change", () => {
		const cat = catSel.value;
		keySel.innerHTML = "";
		let keys = [];
		if (isGrouped) {
			keys = Object.keys(colorsRoot[cat] || {});
		} else {
			keys = Object.keys(colorsRoot);
		}
		keys.sort().forEach((k) => {
			const opt = document.createElement("option");
			opt.value = k;
			opt.textContent = k;
			keySel.appendChild(opt);
		});
		keySel.dispatchEvent(new Event("change"));
	});
	keySel.addEventListener("change", () => {
		const cat = catSel.value;
		const key = keySel.value;
		let desc = "";
		if (isGrouped) {
			desc = (colorsRoot[cat] && colorsRoot[cat][key] && colorsRoot[cat][key].description) || "";
		} else {
			// no descriptions in flat form
			desc = "";
		}
		$("#color-desc").textContent = desc;
		setColorInputs(STATE.colors[key] || "#000000ff");
		navHighlight(key);
	});
	catSel.dispatchEvent(new Event("change"));
}

function setColorInputs(hex) {
	const { r, g, b, a } = hex8ToRGBA(hex);
	$("#color-picker").value = rgbHex6({ r, g, b });
	$("#alpha").value = a;
	$("#alpha-num").value = a;
	$("#color-hex").value = hex.startsWith("#") ? hex : "#" + hex;
}

function getColorInputs() {
	const hex6 = $("#color-picker").value;
	const a = clamp(parseInt($("#alpha").value, 10) || 0, 0, 255);
	return hex6 + a.toString(16).padStart(2, "0");
}

function initColorTools() {
	$("#color-picker").addEventListener("input", () => {
		const { r, g, b } = hex8ToRGBA(getColorInputs());
		$("#color-hex").value =
			rgbHex6({ r, g, b }) + $("#alpha").value.toString(16).padStart(2, "0");
	});
	$("#alpha").addEventListener("input", () => {
		$("#alpha-num").value = $("#alpha").value;
		const hx = $("#color-hex").value;
		if (isHex(hx)) {
			const { r, g, b } = hex8ToRGBA(hx);
			$("#color-hex").value =
				rgbHex6({ r, g, b }) +
				parseInt($("#alpha").value, 10).toString(16).padStart(2, "0");
		}
	});
	$("#alpha-num").addEventListener("input", () => {
		$("#alpha").value = clamp(parseInt($("#alpha-num").value, 10) || 0, 0, 255);
		$("#alpha").dispatchEvent(new Event("input"));
	});
	$("#color-hex").addEventListener("input", () => {
		const v = $("#color-hex").value.trim();
		if (isHex(v)) {
			const { r, g, b, a } = hex8ToRGBA(v);
			$("#color-picker").value = rgbHex6({ r, g, b });
			$("#alpha").value = a;
			$("#alpha-num").value = a;
		}
	});
	$("#apply-color").addEventListener("click", () => {
		const cat = $("#color-category").value;
		const key = $("#color-key").value;
		const hex = $("#color-hex").value;
		if (!isHex(hex)) return alert("Invalid color hex (#RRGGBB or #RRGGBBAA)");
		STATE.colors[key] = hex.length === 7 ? hex + "ff" : hex;
		syncState();
		applyPreviewColor(key, STATE.colors[key]);
	});
	$("#nav-color").addEventListener("click", () => {
		navHighlight($("#color-key").value);
	});
}

function fillTokenSelectors() {
	const sel = $("#token-rule");
	sel.innerHTML = "";
	const tc = TEMPLATE.tokenColors || [];
	const rules = Array.isArray(tc)
		? tc
		: Object.values(tc).flat(); // support grouped templates
	rules.forEach((r, i) => {
		const opt = document.createElement("option");
		opt.value = i;
		opt.textContent = r.name || `Rule ${i + 1}`;
		sel.appendChild(opt);
	});
	sel.addEventListener("change", () => {
		const idx = parseInt(sel.value, 10);
		const ref = rules[idx];
		$("#token-scope").value = Array.isArray(ref.scope)
			? ref.scope.join(", ")
			: ref.scope || "";
		$("#token-hex").value = ref.settings.foreground || "";
		setFontStyle(".pane#pane-tokens", ref.settings.fontStyle || "");
		$("#token-desc").textContent = ref.description || "";
		navHighlight("editor.foreground"); // generic anchor
	});
	$("#apply-token").addEventListener("click", () => {
		const idx = parseInt(sel.value, 10);
		const ref = rules[idx];
		const scopeRaw = $("#token-scope").value.trim();
		const scopes = scopeRaw.includes(",")
			? scopeRaw.split(",").map((s) => s.trim())
			: scopeRaw;
		const fs = readFontStyle(".pane#pane-tokens");
		const fg = $("#token-hex").value.trim() || undefined;
		const rule = {
			name: ref.name,
			scope: scopes,
			settings: { fontStyle: fs, foreground: fg },
		};
		// Find existing in STATE by name, else push
		const i = (STATE.tokenColors || []).findIndex(
			(r) => (r.name || "") === (ref.name || "")
		);
		if (i >= 0) STATE.tokenColors[i] = rule;
		else STATE.tokenColors.push(rule);
		syncState();
		applyPreviewTokens();
	});
	$("#nav-token").addEventListener("click", () =>
		navHighlight("editor.foreground")
	);
	$("#add-token").addEventListener("click", () => {
		const name = prompt("Name this token rule:");
		if (!name) return;
		STATE.tokenColors.push({ name, scope: "", settings: {} });
		syncState();
		alert("New token rule added. Edit scopes/style, then Apply.");
	});
	sel.dispatchEvent(new Event("change"));
}

function fillSemanticSelectors() {
	const sel = $("#sem-token");
	sel.innerHTML = "";
	const parts = TEMPLATE.semanticTokenColors || {};
	const items = [];
	if (parts.types || parts.modifiers) {
		Object.entries(parts.types || {}).forEach(([k, v]) => items.push([k, v?.description || ""]))
		Object.entries(parts.modifiers || {}).forEach(([k, v]) => items.push([k, v?.description || ""]))
	} else {
		Object.keys(parts).forEach((k) => items.push([k, ""]))
	}
	items.forEach(([k]) => {
		const opt = document.createElement("option");
		opt.value = k;
		opt.textContent = k;
		sel.appendChild(opt);
	});
	sel.addEventListener("change", () => {
		const tok = sel.value;
		const def = STATE.semanticTokenColors[tok] || {};
		$("#sem-hex").value = def.foreground || "";
		setFontStyle("#pane-semantics", def.fontStyle || "");
		let meta = "";
		if (parts.types || parts.modifiers) {
			meta = (parts.types?.[tok]?.description || parts.modifiers?.[tok]?.description || "");
		}
		$("#sem-desc").textContent = meta;
		navHighlight("editor.foreground");
	});
	$("#apply-sem").addEventListener("click", () => {
		const tok = sel.value;
		const fs = readFontStyle("#pane-semantics");
		const fg = $("#sem-hex").value.trim() || undefined;
		STATE.semanticTokenColors[tok] = { fontStyle: fs, foreground: fg };
		syncState();
		applyPreviewTokens();
	});
	$("#nav-sem").addEventListener("click", () =>
		navHighlight("editor.foreground")
	);
	sel.dispatchEvent(new Event("change"));
}

function setFontStyle(rootSel, fontStyle) {
	const set = new Set((fontStyle || "").split(/\s+/).filter(Boolean));
	$$(rootSel + " .fontstyle input[type=checkbox]").forEach(
		(cb) => (cb.checked = set.has(cb.value))
	);
}
function readFontStyle(rootSel) {
	const vals = $$(rootSel + " .fontstyle input[type=checkbox]")
		.filter((cb) => cb.checked)
		.map((cb) => cb.value);
	return vals.join(" ");
}

// --- Preview application --- //
function applyPreviewColor(key, hex) {
	const varKey = toCssVarKey(key);
	document.documentElement.style.setProperty(`--${varKey}`, hex);
}

function applyPreviewTokens() {
	// Map a few demo scopes to preview spans:
	const rule = (name) =>
		(STATE.tokenColors || []).find((r) => (r.name || "") === name);
	const apply = (varName, color) => {
		if (color)
			document.documentElement.style.setProperty(`--${varName}`, color);
	};
	apply("tm-keyword", (rule("Keyword") || {}).settings?.foreground);
	apply("tm-entity", (rule("Entity") || {}).settings?.foreground);
	apply("tm-variable", (rule("Variable") || {}).settings?.foreground);
	apply("tm-string", (rule("String") || {}).settings?.foreground);
	apply("tm-type", (rule("Type") || {}).settings?.foreground);
	apply("tm-operator", (rule("Operator") || {}).settings?.foreground);
	apply("tm-punct", (rule("Punctuation") || {}).settings?.foreground);
}

function navHighlight(colorKey) {
	const target = document.querySelector(`[data-preview-target="${colorKey}"]`);
	if (!target) return;
	target.classList.add("highlight");
	target.scrollIntoView({ behavior: "smooth", block: "center" });
	setTimeout(() => target.classList.remove("highlight"), 1200);
}

// --- Messaging / Persistence --- //
function syncState() {
	post("set-state", { state: STATE });
}

// --- Exports & start modes --- //
function initHeaderButtons() {
	$$(".start-modes button").forEach((b) => {
		b.addEventListener("click", () => {
			post("choose-start", { mode: b.dataset.start });
		});
	});
	$$(".exports button").forEach((b) => {
		b.addEventListener("click", () =>
			post("export", { format: b.dataset.export })
		);
	});
}

// --- Init --- //
async function main() {
	initTabs();
	initHeaderButtons();
	await loadTemplate();
	fillColorSelectors();
	initColorTools();
	fillTokenSelectors();
	fillSemanticSelectors();
	post("init-request");
}

window.addEventListener("message", (event) => {
	const msg = event.data;
	if (msg.type === "init-data") {
		STATE = msg.state;
		// seed preview with known colors
		Object.entries(STATE.colors || {}).forEach(([k, v]) =>
			applyPreviewColor(k, v)
		);
		applyPreviewTokens();
		// refresh selectors to reflect initial state
		$("#color-category").dispatchEvent(new Event("change"));
	}
});

main();
