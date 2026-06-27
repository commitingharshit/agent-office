import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createRoot } from 'react-dom/client';
import type { DocxEditorRef } from '@casualoffice/docs';
import './index.css';
import '../../../../packages/react/src/styles/editor.css';
// @ts-ignore Vite asset import.
import affUrl from '../../../../packages/react/src/assets/spellcheck/en.aff?url';
// @ts-ignore Vite asset import.
import dicUrl from '../../../../packages/react/src/assets/spellcheck/en.dic?url';
// @ts-ignore Vite worker asset import.
import writerWorkerUrl from '../../../../packages/react/src/lib/writer/writer.worker.ts?worker&url';

type VsCodeApi = {
  postMessage: (message: unknown) => void;
  getState: () => unknown;
  setState: (state: unknown) => void;
};

declare const acquireVsCodeApi: () => VsCodeApi;

type ExtensionMessage =
  | {
      type: 'hermesUi';
      phase: 'idle' | 'thinking' | 'streaming' | 'done' | 'error';
      message: string;
      transcript?: string;
    }
  | {
      type: 'init';
      fileUri: string;
      documentBytes: Uint8Array;
      isDirty: boolean;
      requestId?: string;
    }
  | {
      type: 'setDocument';
      documentBytes: Uint8Array;
      requestId?: string;
    }
  | {
      type: 'getDocument';
      requestId: string;
    };

type WebviewMessage =
  | {
      type: 'ready';
    }
  | {
      type: 'change';
      hasChanges: boolean;
      reason?: string;
    }
  | {
      type: 'save';
      documentBytes: Uint8Array;
      requestId?: string;
    }
  | {
      type: 'error';
      error: string;
    };

type BootstrapState = {
  mounted: boolean;
  phase: string;
};

type EditorModule = {
  DocxEditor: ((props: import('@casualoffice/docs').DocxEditorProps & { ref?: import('react').Ref<DocxEditorRef> }) => JSX.Element) | null;
  setSpellAssetUrls: (aff: string, dic: string) => void;
  setWriterWorkerUrl: (url: string) => void;
};


const bootstrapState: BootstrapState = {
  mounted: false,
  phase: 'boot',
};

function getVsCodeApi(): VsCodeApi | null {
  try {
    if (typeof acquireVsCodeApi !== 'function') {
      return null;
    }
    return acquireVsCodeApi();
  } catch {
    return null;
  }
}

const vscode = getVsCodeApi();

function renderFatalScreen(title: string, detail: string): void {
  const fallback = document.getElementById('root') ?? document.body;
  fallback.innerHTML = `
    <div style="width:100vw;height:100vh;display:grid;place-items:center;background:#ffffff;color:#1f2937;font-family:system-ui,sans-serif;padding:24px;box-sizing:border-box;">
      <div style="max-width:720px;width:100%;border:1px solid #e5e7eb;border-radius:12px;padding:20px;background:#f9fafb;box-shadow:0 8px 30px rgba(15,23,42,0.08);">
        <div style="font-size:18px;font-weight:700;margin-bottom:8px;">${escapeHtml(title)}</div>
        <div style="font-size:13px;opacity:0.8;margin-bottom:12px;">Phase: ${escapeHtml(bootstrapState.phase)}</div>
        <pre style="margin:0;white-space:pre-wrap;word-break:break-word;font-size:12px;line-height:1.5;">${escapeHtml(detail)}</pre>
      </div>
    </div>
  `;
}

function reportBootstrapError(error: unknown, phase: string): void {
  bootstrapState.phase = phase;
  const detail = error instanceof Error ? `${error.name}: ${error.message}\n${error.stack ?? ''}` : String(error);
  if (vscode) {
    vscode.postMessage({
      type: 'error',
      error: `Webview bootstrap failed during ${phase}: ${detail}`,
    } satisfies WebviewMessage);
  }
  renderFatalScreen('DOCX webview failed to start', detail);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

window.addEventListener('error', (event) => {
  if (bootstrapState.mounted) {
    return;
  }
  reportBootstrapError(event.error ?? event.message, 'window.error');
});

window.addEventListener('unhandledrejection', (event) => {
  if (bootstrapState.mounted) {
    return;
  }
  reportBootstrapError(event.reason, 'window.unhandledrejection');
});

function App(): JSX.Element {
  const editorRef = useRef<DocxEditorRef | null>(null);
  const fileUriRef = useRef('');
  const [fileUri, setFileUri] = useState('');
  const [documentBytes, setDocumentBytes] = useState<Uint8Array | null>(null);
  const [documentRevision, setDocumentRevision] = useState(0);
  const [isDirty, setIsDirty] = useState(false);
  const [EditorComponent, setEditorComponent] = useState<EditorModule['DocxEditor']>(null);
  const [editorLoadError, setEditorLoadError] = useState<string | null>(null);
  const [hermesUi, setHermesUi] = useState<{
    phase: 'idle' | 'thinking' | 'streaming' | 'done' | 'error';
    message: string;
    transcript: string;
  }>({
    phase: 'idle',
    message: 'Hermes is idle.',
    transcript: '',
  });
  // Agent panel open by default so the copilot sidebar is visible on first open
  const [agentPanelOpen, setAgentPanelOpen] = useState(true);

  useEffect(() => {
    bootstrapState.phase = 'app-mounted';
    bootstrapState.mounted = true;
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadEditor = async () => {
      try {
        bootstrapState.phase = 'load-editor-module';
        const mod = (await import('@casualoffice/docs')) as EditorModule;
        mod.setSpellAssetUrls(affUrl, dicUrl);
        mod.setWriterWorkerUrl(writerWorkerUrl);
        if (!cancelled) {
          setEditorComponent(() => mod.DocxEditor);
        }
      } catch (error) {
        const detail =
          error instanceof Error ? `${error.name}: ${error.message}\n${error.stack ?? ''}` : String(error);
        if (!cancelled) {
          setEditorLoadError(detail);
        }
        reportBootstrapError(error, 'load-editor-module');
      }
    };

    void loadEditor();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handleMessage = async (event: MessageEvent<unknown>) => {
      const message = event.data as ExtensionMessage | undefined;
      if (!message || typeof message !== 'object' || !('type' in message)) {
        return;
      }

      switch (message.type) {
        case 'hermesUi':
          setHermesUi({
            phase: message.phase,
            message: message.message,
            transcript: message.transcript ?? '',
          });
          break;
        case 'init':
          if (fileUriRef.current === message.fileUri) {
            setIsDirty(message.isDirty);
            break;
          }
          fileUriRef.current = message.fileUri;
          // Reconstruct Uint8Array — postMessage JSON-serializes binary data into a plain object.
          setDocumentBytes(new Uint8Array(Object.values(message.documentBytes as unknown as Record<string, number>)));
          setFileUri(message.fileUri);
          setIsDirty(message.isDirty);
          setDocumentRevision((revision) => revision + 1);
          break;
        case 'setDocument':
          // Reconstruct Uint8Array — same serialization issue as 'init'.
          setDocumentBytes(new Uint8Array(Object.values(message.documentBytes as unknown as Record<string, number>)));
          setIsDirty(false);
          setDocumentRevision((revision) => revision + 1);
          break;
        case 'getDocument': {
          try {
            const arrayBuffer = await editorRef.current?.exportDocx();
            if (!arrayBuffer) {
              vscode?.postMessage({
                type: 'error',
                error: 'DOCX editor could not serialize the document.',
              } satisfies WebviewMessage);
              return;
            }

            const bytes = new Uint8Array(arrayBuffer);
            vscode?.postMessage({
              type: 'save',
              documentBytes: Array.from(bytes) as unknown as Uint8Array,
              requestId: message.requestId,
            } satisfies WebviewMessage);
          } catch (error) {
            vscode?.postMessage({
              type: 'error',
              error: error instanceof Error ? error.message : 'DOCX editor serialization failed.',
            } satisfies WebviewMessage);
          }
          break;
        }
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isCmdOrCtrl = isMac ? event.metaKey : event.ctrlKey;

      // 1. Ctrl+S: Extension save
      if (isCmdOrCtrl && event.key.toLowerCase() === 's' && !event.shiftKey && !event.altKey) {
        event.preventDefault();
        vscode?.postMessage({ type: 'saveShortcut' } as any);
        return;
      }

      // 2. Ctrl+P: Code-OSS quick open
      if (isCmdOrCtrl && event.key.toLowerCase() === 'p' && !event.shiftKey && !event.altKey) {
        event.preventDefault();
        vscode?.postMessage({ type: 'triggerCommand', command: 'workbench.action.quickOpen' } as any);
        return;
      }

      // 3. Ctrl+Shift+P: Code-OSS command palette
      if (isCmdOrCtrl && event.shiftKey && event.key.toLowerCase() === 'p' && !event.altKey) {
        event.preventDefault();
        vscode?.postMessage({ type: 'triggerCommand', command: 'workbench.action.showCommands' } as any);
        return;
      }

      // 4. Ctrl+W: Code-OSS close tab
      if (isCmdOrCtrl && event.key.toLowerCase() === 'w' && !event.shiftKey && !event.altKey) {
        event.preventDefault();
        vscode?.postMessage({ type: 'triggerCommand', command: 'workbench.action.closeActiveEditor' } as any);
        return;
      }
    };

    window.addEventListener('message', handleMessage);
    window.addEventListener('keydown', handleKeyDown, true);
    vscode?.postMessage({ type: 'ready' } satisfies WebviewMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, []);

  const handleChange = (document: unknown) => {
    void document;
    setIsDirty(true);
    vscode?.postMessage({ type: 'change', hasChanges: true } satisfies WebviewMessage);
  };

  const handleSave = async () => {
    // The onSave callback receives the buffer, but we also need to update local state
    // This is called from the editor's onSave prop
  };

  const handleSaveWithBuffer = async (buffer: ArrayBuffer) => {
    const bytes = new Uint8Array(buffer);
    setIsDirty(false);
    vscode?.postMessage({
      type: 'save',
      documentBytes: Array.from(bytes) as unknown as Uint8Array,
    } satisfies WebviewMessage);
  };

  const handleEditorReady = (editor: DocxEditorRef) => {
    editorRef.current = editor;
  };

  const handleError = (error: Error) => {
    vscode?.postMessage({
      type: 'error',
      error: error.message,
    } satisfies WebviewMessage);
  };

  const editorName = useMemo(() => {
    if (!fileUri) {
      return 'DOCX document';
    }
    const segments = fileUri.split('/');
    return segments[segments.length - 1] || 'DOCX document';
  }, [fileUri]);

  if (!documentBytes) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'grid',
          placeItems: 'center',
          background:
            'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(14,165,233,0.06) 35%, transparent)',
          color: 'var(--vscode-editor-foreground)',
          fontFamily: 'var(--vscode-font-family)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Loading DOCX editor</div>
          <div style={{ opacity: 0.8 }}>Waiting for the extension to send document bytes.</div>
        </div>
      </div>
    );
  }

  if (editorLoadError) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'grid',
          placeItems: 'center',
          background: 'var(--vscode-editor-background)',
          color: 'var(--vscode-editor-foreground)',
          fontFamily: 'var(--vscode-font-family)',
          padding: 24,
          boxSizing: 'border-box',
        }}
      >
        <div style={{ maxWidth: 760, width: '100%' }}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>DOCX editor bootstrap failed</div>
          <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 12 }}>Phase: {bootstrapState.phase}</div>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 12, lineHeight: 1.5 }}>
            {editorLoadError}
          </pre>
        </div>
      </div>
    );
  }

  if (!EditorComponent) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'grid',
          placeItems: 'center',
          background:
            'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(14,165,233,0.06) 35%, transparent)',
          color: 'var(--vscode-editor-foreground)',
          fontFamily: 'var(--vscode-font-family)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Loading DOCX engine</div>
          <div style={{ opacity: 0.8 }}>Preparing CasualDocx runtime assets and editor modules.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <EditorComponent
        key={`${fileUriRef.current}:${documentRevision}`}
        ref={editorRef}
        documentBuffer={documentBytes}
        documentNameEditable={false}
        chrome="full"
        showToolbar={true}
        showPanelRail={true}
        showStatusBar={true}
        showOutline={false}
        showOutlineButton={true}
        showRuler={true}
        showZoomControl={true}
        initialZoom={0.75}
        onChange={handleChange}
        onSave={handleSaveWithBuffer}
        onReady={handleEditorReady}
        onError={handleError}
        agentPanel={{
          title: 'AI Suggestions',
          open: agentPanelOpen,
          onOpenChange: setAgentPanelOpen,
          defaultWidth: 340,
          render: ({ close }) => (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                background: 'var(--vscode-sideBar-background, #1e1e2e)',
                color: 'var(--vscode-sideBar-foreground, #cdd6f4)',
                fontFamily: 'var(--vscode-font-family, system-ui)',
                fontSize: 13,
              }}
            >
              {/* Header matching target: "AI SUGGESTIONS (7)" with filter + close */}
              <div
                style={{
                  padding: '10px 14px',
                  borderBottom: '1px solid var(--vscode-editorWidget-border, rgba(255,255,255,0.1))',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  flexShrink: 0,
                  background: 'var(--vscode-sideBarSectionHeader-background, rgba(255,255,255,0.04))',
                }}
              >
                <span style={{ fontWeight: 700, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', flex: 1 }}>
                  HERMES
                  <span style={{ marginLeft: 6, fontWeight: 400, opacity: 0.6, fontSize: 11 }}>
                    ({hermesUi.phase === 'idle' ? 'idle' : 'live'})
                  </span>
                </span>
                {/* Filter icon */}
                <button
                  title="Filter suggestions"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', opacity: 0.7, padding: 2, lineHeight: 1 }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/>
                  </svg>
                </button>
                {/* Close icon */}
                <button
                  onClick={close}
                  title="Close"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', opacity: 0.7, padding: 2, lineHeight: 1, fontSize: 14 }}
                >
                  ✕
                </button>
              </div>

              {/* Live Hermes status */}
              <div
                style={{
                  margin: '10px 12px 0',
                  padding: '10px 12px',
                  border: '1px solid var(--vscode-editorWidget-border, rgba(255,255,255,0.08))',
                  borderRadius: 8,
                  background: 'var(--vscode-editorWidget-background, rgba(255,255,255,0.05))',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background:
                        hermesUi.phase === 'error'
                          ? 'var(--vscode-errorForeground, #f87171)'
                          : hermesUi.phase === 'done'
                            ? 'var(--vscode-testing-iconPassed, #22c55e)'
                            : 'var(--vscode-button-background, #3b82f6)',
                      boxShadow:
                        hermesUi.phase === 'thinking' || hermesUi.phase === 'streaming'
                          ? '0 0 0 0 rgba(59,130,246,0.55)'
                          : 'none',
                    }}
                  />
                  <strong style={{ fontSize: 12 }}>{hermesUi.message}</strong>
                </div>
                <div style={{ fontSize: 11, opacity: 0.72, lineHeight: 1.5 }}>
                  We show concise progress and the streamed answer here. We do not expose hidden chain-of-thought.
                </div>
                {hermesUi.transcript ? (
                  <pre
                    style={{
                      margin: '8px 0 0',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontSize: 11,
                      lineHeight: 1.5,
                      maxHeight: 120,
                      overflow: 'auto',
                      background: 'rgba(0,0,0,0.08)',
                      borderRadius: 6,
                      padding: 8,
                    }}
                  >
                    {hermesUi.transcript}
                  </pre>
                ) : null}
              </div>

              {/* Suggestion cards */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { id: 1, label: 'Rephrase for clarity', preview: 'Consider restructuring the opening paragraph to lead with the core argument before supporting evidence.', tag: 'Style' },
                  { id: 2, label: 'Strengthen argument', preview: 'The claim in paragraph 3 would benefit from a cited precedent or statutory reference.', tag: 'Legal' },
                  { id: 3, label: 'Passive voice detected', preview: '"The petition was filed by" → "The petitioner filed" — active voice is preferred in pleadings.', tag: 'Grammar' },
                  { id: 4, label: 'Add concluding prayer', preview: 'The relief sought is mentioned inline but not listed in a formal prayer clause at the end.', tag: 'Structure' },
                  { id: 5, label: 'Citation format', preview: 'Case citation on page 4 should follow the uniform format: Party v. Party (Year) Court.', tag: 'Format' },
                  { id: 6, label: 'Redundant paragraph', preview: 'Paragraph 7 largely repeats the content of paragraph 4. Consider merging or removing.', tag: 'Style' },
                  { id: 7, label: 'Missing date reference', preview: 'The date of the alleged incident is referenced as "the incident" without a prior definition.', tag: 'Clarity' },
                ].map((s) => (
                  <div
                    key={s.id}
                    style={{
                      background: 'var(--vscode-editorWidget-background, rgba(255,255,255,0.05))',
                      border: '1px solid var(--vscode-editorWidget-border, rgba(255,255,255,0.08))',
                      borderRadius: 6,
                      padding: '10px 12px',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          padding: '2px 6px',
                          borderRadius: 99,
                          background: 'var(--vscode-badge-background, rgba(100,160,255,0.2))',
                          color: 'var(--vscode-badge-foreground, #89b4fa)',
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                        }}
                      >{s.tag}</span>
                      <span style={{ fontWeight: 600, fontSize: 12, flex: 1 }}>{s.label}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 11, opacity: 0.75, lineHeight: 1.5 }}>{s.preview}</p>
                    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                      <button style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, border: '1px solid var(--vscode-button-background, #3b82f6)', background: 'var(--vscode-button-background, #3b82f6)', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Apply</button>
                      <button style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, border: '1px solid var(--vscode-editorWidget-border, rgba(255,255,255,0.2))', background: 'transparent', color: 'inherit', cursor: 'pointer' }}>Dismiss</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer: ask AI */}
              <div
                style={{
                  padding: '10px 12px',
                  borderTop: '1px solid var(--vscode-editorWidget-border, rgba(255,255,255,0.1))',
                  display: 'flex',
                  gap: 8,
                  flexShrink: 0,
                }}
              >
                <input
                  placeholder="Ask AI about this document…"
                  style={{
                    flex: 1,
                    background: 'var(--vscode-input-background, rgba(255,255,255,0.06))',
                    color: 'var(--vscode-input-foreground, inherit)',
                    border: '1px solid var(--vscode-input-border, rgba(255,255,255,0.15))',
                    borderRadius: 6,
                    padding: '5px 10px',
                    fontSize: 12,
                    outline: 'none',
                  }}
                />
                <button
                  style={{
                    background: 'var(--vscode-button-background, #3b82f6)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '5px 10px',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >→</button>
              </div>
            </div>
          ),
        }}

        style={{ flex: 1, width: '100%', minHeight: 0 }}
      />
    </div>
  );
}

const container = document.getElementById('root');
if (container) {
  try {
    bootstrapState.phase = 'react-render';
    createRoot(container).render(
      <div className="docx-webview-root">
        <App />
      </div>
    );
  } catch (error) {
    reportBootstrapError(error, 'react-render');
  }
} else {
  renderFatalScreen('DOCX webview failed to start', 'Missing #root container in webview HTML.');
}
