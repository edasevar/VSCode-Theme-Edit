const vscode = acquireVsCodeApi();

const els = {
	groups: document.getElementById('groups'),
	fields: document.getElementById('fields'),
	themeName: document.getElementById('themeName'),
	filter: document.getElementById('filter'),
	preview: document.getElementById('previewFrame'),

	btnImportJson: document.getElementById('btnImportJson'),
	btnImportVsix: document.getElementById('btnImportVsix'),
	btnImportCurrent: document.getElementById('btnImportCurrent'),
	btnExportJson: document.getElementById('btnExportJson'),
	btnExportCss: document.getElementById('btnExportCss'),
	btnExportVsix: document.getElementById('btnExportVsix'),
};

let MODEL = {
	name: '',
	groups: [], // [{ id, title, items: [{ key, value, description }]}]
	map: new Map() // key -> {groupId, idx}
};

function post(type, payload) { vscode.postMessage({ type, ...payload }); }

// init
window.addEventListener('message', (e) => {
	const msg = e.data;
	if (msg.type === 'init') {
		const { themeName, groups } = msg.payload;
		MODEL.name = themeName;
		MODEL.groups = groups;
		MODEL.map = new Map();
		groups.forEach(g => g.items.forEach((it, idx) => MODEL.map.set(it.key, { groupId: g.id, idx })));
		renderSidebar(groups);
		renderFields(groups);
		els.themeName.textContent = themeName || 'Untitled Theme';
	}
	if (msg.type === 'highlight') {
		highlightKey(msg.key);
		els.preview.contentWindow.postMessage({ type: 'highlight', key: msg.key }, '*');
	}
});

function renderSidebar(groups) {
	els.groups.innerHTML = '';
	for (const g of groups) {
		const div = document.createElement('div');
		div.className = 'group';
		const h = document.createElement('h3');
		h.textContent = g.title;
		div.appendChild(h);
		const frag = document.createDocumentFragment();
		for (const it of g.items) {
			const a = document.createElement('div');
			a.className = 'key';
			a.dataset.key = it.key;
			a.textContent = it.key;
			a.title = it.description ?? '';
			a.onclick = () => scrollToField(it.key, true);
			frag.appendChild(a);
		}
		div.appendChild(frag);
		els.groups.appendChild(div);
	}
}

function renderFields(groups) {
	els.fields.innerHTML = '';
	for (const g of groups) {
		const h = document.createElement('h2');
		h.textContent = g.title;
		els.fields.appendChild(h);
		for (const it of g.items) {
			const row = document.createElement('div');
			row.className = 'field';
			row.id = 'field__' + cssId(it.key);

			const label = document.createElement('div');
			label.textContent = it.key;

			const input = document.createElement('input');
			input.className = 'color-input';
			input.type = 'text';
			input.value = it.value || '#000000';
			input.onchange = () => updateColor(it, input.value);

			const picker = document.createElement('input');
			picker.type = 'color';
			picker.value = maybeHex(input.value);
			picker.oninput = () => { input.value = picker.value; updateColor(it, picker.value); };

			const desc = document.createElement('div');
			desc.className = 'desc';
			desc.textContent = it.description || '';

			row.append(label, input, picker, desc);
			els.fields.appendChild(row);
		}
	}
}

function cssId(key) { return key.replace(/[^\w-]+/g, '_'); }

function maybeHex(v) {
	const m = (v || '').match(/^#([0-9a-f]{6}|[0-9a-f]{3})$/i);
	return m ? v : '#000000';
}

function updateColor(item, value) {
	post('update:color', { groupId: item.groupId, key: item.key, value });
}

function scrollToField(key, fromSidebar) {
	const el = document.getElementById('field__' + cssId(key));
	if (!el) return;
	el.scrollIntoView({ behavior: 'smooth', block: 'center' });
	highlightKey(key);
	if (!fromSidebar) {
		const sidebarKey = document.querySelector(`.group .key[data-key="${key}"]`);
		sidebarKey?.classList.add('active');
	}
}

function highlightKey(key) {
	document.querySelectorAll('.group .key.active').forEach(n => n.classList.remove('active'));
	const node = document.querySelector(`.group .key[data-key="${key}"]`);
	node?.classList.add('active');
}

els.filter.addEventListener('input', () => {
	const q = els.filter.value.trim().toLowerCase();
	document.querySelectorAll('.group .key').forEach(n => {
		const show = !q || n.dataset.key.toLowerCase().includes(q);
		n.style.display = show ? '' : 'none';
	});
});

els.btnImportJson.onclick = () => post('request:init') || vscode.postMessage({ type: 'command', command: 'themeDesigner.import.json' });
els.btnImportVsix.onclick = () => vscode.postMessage({ type: 'command', command: 'themeDesigner.import.vsix' });
els.btnImportCurrent.onclick = () => vscode.postMessage({ type: 'command', command: 'themeDesigner.import.current' });
els.btnExportJson.onclick = () => vscode.postMessage({ type: 'command', command: 'themeDesigner.export.json' });
els.btnExportCss.onclick = () => vscode.postMessage({ type: 'command', command: 'themeDesigner.export.css' });
els.btnExportVsix.onclick = () => vscode.postMessage({ type: 'command', command: 'themeDesigner.export.vsix' });

// ask for initial payload
vscode.postMessage({ type: 'request:init' });
