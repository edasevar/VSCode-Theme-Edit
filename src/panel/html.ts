import * as vscode from 'vscode';
export function getWebviewHtml (webview: vscode.Webview, extUri: vscode.Uri) {
	const media = (p: string) => webview.asWebviewUri(vscode.Uri.joinPath(extUri, 'media', p));
	return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} blob:; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource};">
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link href="${media('app.css')}" rel="stylesheet" />
</head>
<body>
  <div id="app">
    <aside class="sidebar">
      <div class="toolbar">
        <input id="filter" placeholder="Filter keys..." />
        <button id="btnImportJson">Import JSON</button>
        <button id="btnImportVsix">Import VSIX</button>
        <button id="btnImportCurrent">Use Current</button>
      </div>
      <nav id="groups"></nav>
    </aside>
    <main class="editor">
      <header class="editor__header">
        <h1 id="themeName"></h1>
        <div class="actions">
          <button id="btnExportJson">Export JSON</button>
          <button id="btnExportCss">Export CSS</button>
          <button id="btnExportVsix">Export VSIX</button>
        </div>
      </header>

      <section id="fields"></section>
    </main>

    <aside class="preview">
      <iframe id="previewFrame" src="${media('preview/editor.html')}" title="live preview"></iframe>
    </aside>
  </div>

  <script src="${media('app.js')}"></script>
</body>
</html>`;
}
