import * as fs from 'fs/promises';
import * as vscode from 'vscode';
import { DocxDocument } from './DocxDocument';
import { registerHermesChatParticipant } from './hermesChatParticipant';
import { ExtensionToWebviewMessage, HermesUiMessage, WebviewToExtensionMessage } from './types';

type PendingResolve = {
  resolve: (bytes: Uint8Array) => void;
  reject: (error: Error) => void;
  timer: NodeJS.Timeout;
};

function deserializeUint8Array(data: unknown): Uint8Array {
  if (data instanceof Uint8Array) {
    return data;
  }
  if (Array.isArray(data)) {
    return new Uint8Array(data);
  }
  if (data && typeof data === 'object') {
    return new Uint8Array(Object.values(data as Record<string, unknown>) as number[]);
  }
  return new Uint8Array();
}

export class DocxEditorProvider implements vscode.CustomEditorProvider<DocxDocument> {
  public static readonly viewType = 'docx-editor.docxEditor';

  private readonly _documents = new Map<string, DocxDocument>();
  private readonly _panels = new Map<string, vscode.WebviewPanel>();
  private readonly _pendingDocumentRequests = new Map<string, PendingResolve>();
  private readonly _hermesUiState: HermesUiMessage = {
    type: 'hermesUi',
    phase: 'idle',
    message: 'Hermes is idle.',
  };
  private readonly _onDidChangeCustomDocument = new vscode.EventEmitter<
    vscode.CustomDocumentContentChangeEvent<DocxDocument>
  >();

  public readonly onDidChangeCustomDocument = this._onDidChangeCustomDocument.event;

  constructor(private readonly context: vscode.ExtensionContext) {}

  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    const provider = new DocxEditorProvider(context);
    return vscode.window.registerCustomEditorProvider(DocxEditorProvider.viewType, provider, {
      supportsMultipleEditorsPerDocument: false,
      webviewOptions: {
        retainContextWhenHidden: true,
      },
    });
  }

  async openCustomDocument(
    uri: vscode.Uri,
    openContext: vscode.CustomDocumentOpenContext,
    _token: vscode.CancellationToken
  ): Promise<DocxDocument> {
    const key = uri.toString();
    const existing = this._documents.get(key);
    if (existing) {
      return existing;
    }

    let sourceUri = uri;
    if (openContext && typeof openContext.backupId === 'string') {
      sourceUri = openContext.backupId.startsWith('file:')
        ? vscode.Uri.parse(openContext.backupId)
        : vscode.Uri.file(openContext.backupId);
    }

    const bytes = new Uint8Array(await fs.readFile(sourceUri.fsPath));
    const document = new DocxDocument(uri, bytes);
    this._documents.set(key, document);
    return document;
  }

  async resolveCustomEditor(
    document: DocxDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    const key = document.uri.toString();
    this._panels.set(key, webviewPanel);

    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'webview', 'dist')],
    };
    webviewPanel.webview.html = await this.renderHtml(webviewPanel.webview);

    const messageListener = webviewPanel.webview.onDidReceiveMessage(async (message: WebviewToExtensionMessage) => {
      await this.handleWebviewMessage(document, message);
    });

    webviewPanel.onDidDispose(() => {
      messageListener.dispose();
      this._panels.delete(key);
      this._documents.delete(key);
    });
  }

  async saveCustomDocument(document: DocxDocument, _cancellation: vscode.CancellationToken): Promise<void> {
    const bytes = await this.requestCurrentBytes(document);
    document.setBytes(bytes, false);
    await document.save();
  }

  async saveCustomDocumentAs(
    document: DocxDocument,
    destination: vscode.Uri,
    _cancellation: vscode.CancellationToken
  ): Promise<void> {
    const previousKey = document.uri.toString();
    const bytes = await this.requestCurrentBytes(document);
    document.setBytes(bytes, false);
    await document.saveAs(destination);

    const nextKey = document.uri.toString();
    if (previousKey !== nextKey) {
      const panel = this._panels.get(previousKey);
      if (panel) {
        this._panels.delete(previousKey);
        this._panels.set(nextKey, panel);
        await this.sendInit(document);
      }

      this._documents.delete(previousKey);
      this._documents.set(nextKey, document);
    }
  }

  async revertCustomDocument(document: DocxDocument, _cancellation: vscode.CancellationToken): Promise<void> {
    await document.revert();
    await this.sendToWebview(document, {
      type: 'setDocument',
      documentBytes: Array.from(document.bytes) as unknown as Uint8Array,
    });
  }

  async backupCustomDocument(
    document: DocxDocument,
    context: vscode.CustomDocumentBackupContext,
    _cancellation: vscode.CancellationToken
  ): Promise<vscode.CustomDocumentBackup> {
    await document.backup(context.destination);
    return {
      id: context.destination.toString(),
      delete: async () => {
        await fs.rm(context.destination.fsPath, { force: true });
      },
    };
  }

  private async sendInit(document: DocxDocument): Promise<void> {
    await this.sendToWebview(document, {
      type: 'init',
      fileUri: document.uri.toString(),
      // Uint8Array does not survive VS Code postMessage JSON serialization.
      // Send as a plain number array and reconstruct in the webview.
      documentBytes: Array.from(document.bytes) as unknown as Uint8Array,
      isDirty: document.dirty,
    });
  }

  private async handleWebviewMessage(
    document: DocxDocument,
    message: WebviewToExtensionMessage
  ): Promise<void> {
    switch (message.type) {
      case 'ready':
        await this.sendInit(document);
        return;
      case 'change':
        document.dirty = message.hasChanges;
        this._onDidChangeCustomDocument.fire({ document });
        return;
      case 'save': {
        const bytes = deserializeUint8Array(message.documentBytes);
        if (message.requestId) {
          this.resolvePendingRequest(message.requestId, bytes);
          return;
        }

        document.setBytes(bytes, false);
        await document.save();
        return;
      }
      case 'saveShortcut':
        await vscode.commands.executeCommand('workbench.action.files.save');
        return;
      case 'triggerCommand':
        await vscode.commands.executeCommand(message.command);
        return;
      case 'error':
        void vscode.window.showErrorMessage(`DOCX Editor: ${message.error}`);
        return;
    }
  }

  private async sendToWebview(document: DocxDocument, message: ExtensionToWebviewMessage): Promise<void> {
    const panel = this._panels.get(document.uri.toString());
    if (!panel) {
      return;
    }
    await panel.webview.postMessage(message);
  }

  public broadcastHermesUi(message: HermesUiMessage): void {
    this._hermesUiState.type = 'hermesUi';
    this._hermesUiState.phase = message.phase;
    this._hermesUiState.message = message.message;
    this._hermesUiState.transcript = message.transcript;

    for (const panel of this._panels.values()) {
      void panel.webview.postMessage(this._hermesUiState);
    }
  }

  private async requestCurrentBytes(document: DocxDocument): Promise<Uint8Array> {
    const panel = this._panels.get(document.uri.toString());
    if (!panel) {
      return document.bytes;
    }

    const requestId = this.createRequestId();
    const bytesPromise = new Promise<Uint8Array>((resolve, reject) => {
      const timer = setTimeout(() => {
        this._pendingDocumentRequests.delete(requestId);
        reject(new Error('Timed out waiting for webview document bytes.'));
      }, 30000);

      this._pendingDocumentRequests.set(requestId, { resolve, reject, timer });
    });

    await panel.webview.postMessage({
      type: 'getDocument',
      requestId,
    } satisfies ExtensionToWebviewMessage);

    return bytesPromise;
  }

  private resolvePendingRequest(requestId: string | undefined, bytes: Uint8Array): void {
    if (!requestId) {
      return;
    }

    const pending = this._pendingDocumentRequests.get(requestId);
    if (!pending) {
      return;
    }

    clearTimeout(pending.timer);
    this._pendingDocumentRequests.delete(requestId);
    pending.resolve(bytes);
  }

  private createRequestId(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }

  private async renderHtml(webview: vscode.Webview): Promise<string> {
    const distRoot = vscode.Uri.joinPath(this.context.extensionUri, 'webview', 'dist');
    const manifestUri = vscode.Uri.joinPath(distRoot, 'manifest.json');
    const manifestRaw = await fs.readFile(manifestUri.fsPath, 'utf8');
    const manifest = JSON.parse(manifestRaw) as Record<
      string,
      { file: string; css?: string[] }
    >;

    const entry = manifest['src/main.tsx'] ?? manifest['main.tsx'] ?? Object.values(manifest)[0];
    if (!entry) {
      throw new Error('Webview bundle manifest is missing an entry for main.tsx.');
    }

    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(distRoot, entry.file));
    
    const cssFiles = new Set<string>();
    for (const key in manifest) {
      const entryObj = manifest[key];
      if (entryObj.css) {
        for (const cssFile of entryObj.css) {
          cssFiles.add(cssFile);
        }
      }
    }
    const cssUris = Array.from(cssFiles).map((cssFile) =>
      webview.asWebviewUri(vscode.Uri.joinPath(distRoot, cssFile))
    );
    const nonce = this.createNonce();
    const cspSource = webview.cspSource;

    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta property="csp-nonce" nonce="${nonce}" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${cspSource} https: data: blob:; style-src ${cspSource} 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com; font-src ${cspSource} data: https://fonts.gstatic.com; connect-src ${cspSource} https: data: blob:; script-src 'nonce-${nonce}' ${cspSource} 'wasm-unsafe-eval'; worker-src ${cspSource} blob:; child-src ${cspSource} blob:;" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>DOCX Editor</title>
    ${cssUris.map((uri) => `<link rel="stylesheet" href="${uri}" />`).join('\n    ')}
    <style>
      *, *::before, *::after { box-sizing: border-box; }
      html, body {
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;
        overflow: hidden;
        background: var(--vscode-editor-background);
      }
      #root {
        width: 100%;
        height: 100%;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
      /* Ensure the webview root fills without triggering horizontal overflow */
      .docx-webview-root {
        width: 100%;
        height: 100%;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script nonce="${nonce}" type="module" src="${scriptUri}"></script>
  </body>
</html>`;
  }

  private createNonce(): string {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let text = '';
    for (let i = 0; i < 32; i += 1) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
}

export function activate(context: vscode.ExtensionContext): void {
  const provider = new DocxEditorProvider(context);
  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider(DocxEditorProvider.viewType, provider, {
      supportsMultipleEditorsPerDocument: false,
      webviewOptions: {
        retainContextWhenHidden: true,
      },
    })
  );
  registerHermesChatParticipant(context, (message) => provider.broadcastHermesUi(message));
}

export function deactivate(): void {}
