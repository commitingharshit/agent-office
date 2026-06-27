var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import '../../../../packages/react/src/styles/editor.css';
// @ts-ignore Vite asset import.
import affUrl from '../../../../packages/react/src/assets/spellcheck/en.aff?url';
// @ts-ignore Vite asset import.
import dicUrl from '../../../../packages/react/src/assets/spellcheck/en.dic?url';
// @ts-ignore Vite worker asset import.
import writerWorkerUrl from '../../../../packages/react/src/lib/writer/writer.worker.ts?worker&url';
const bootstrapState = {
    mounted: false,
    phase: 'boot',
};
function getVsCodeApi() {
    try {
        if (typeof acquireVsCodeApi !== 'function') {
            return null;
        }
        return acquireVsCodeApi();
    }
    catch (_a) {
        return null;
    }
}
const vscode = getVsCodeApi();
function renderFatalScreen(title, detail) {
    var _a;
    const fallback = (_a = document.getElementById('root')) !== null && _a !== void 0 ? _a : document.body;
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
function reportBootstrapError(error, phase) {
    var _a;
    bootstrapState.phase = phase;
    const detail = error instanceof Error ? `${error.name}: ${error.message}\n${(_a = error.stack) !== null && _a !== void 0 ? _a : ''}` : String(error);
    if (vscode) {
        vscode.postMessage({
            type: 'error',
            error: `Webview bootstrap failed during ${phase}: ${detail}`,
        });
    }
    renderFatalScreen('DOCX webview failed to start', detail);
}
function escapeHtml(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
window.addEventListener('error', (event) => {
    var _a;
    if (bootstrapState.mounted) {
        return;
    }
    reportBootstrapError((_a = event.error) !== null && _a !== void 0 ? _a : event.message, 'window.error');
});
window.addEventListener('unhandledrejection', (event) => {
    if (bootstrapState.mounted) {
        return;
    }
    reportBootstrapError(event.reason, 'window.unhandledrejection');
});
function App() {
    const editorRef = useRef(null);
    const fileUriRef = useRef('');
    const [fileUri, setFileUri] = useState('');
    const [documentBytes, setDocumentBytes] = useState(null);
    const [documentRevision, setDocumentRevision] = useState(0);
    const [isDirty, setIsDirty] = useState(false);
    const [EditorComponent, setEditorComponent] = useState(null);
    const [editorLoadError, setEditorLoadError] = useState(null);
    // Agent panel open by default so the copilot sidebar is visible on first open
    const [agentPanelOpen, setAgentPanelOpen] = useState(true);
    useEffect(() => {
        bootstrapState.phase = 'app-mounted';
        bootstrapState.mounted = true;
    }, []);
    useEffect(() => {
        let cancelled = false;
        const loadEditor = () => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                bootstrapState.phase = 'load-editor-module';
                const mod = (yield import('@casualoffice/docs'));
                mod.setSpellAssetUrls(affUrl, dicUrl);
                mod.setWriterWorkerUrl(writerWorkerUrl);
                if (!cancelled) {
                    setEditorComponent(() => mod.DocxEditor);
                }
            }
            catch (error) {
                const detail = error instanceof Error ? `${error.name}: ${error.message}\n${(_a = error.stack) !== null && _a !== void 0 ? _a : ''}` : String(error);
                if (!cancelled) {
                    setEditorLoadError(detail);
                }
                reportBootstrapError(error, 'load-editor-module');
            }
        });
        void loadEditor();
        return () => {
            cancelled = true;
        };
    }, []);
    useEffect(() => {
        const handleMessage = (event) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const message = event.data;
            if (!message || typeof message !== 'object' || !('type' in message)) {
                return;
            }
            switch (message.type) {
                case 'init':
                    if (fileUriRef.current === message.fileUri) {
                        setIsDirty(message.isDirty);
                        break;
                    }
                    fileUriRef.current = message.fileUri;
                    // Reconstruct Uint8Array — postMessage JSON-serializes binary data into a plain object.
                    setDocumentBytes(new Uint8Array(Object.values(message.documentBytes)));
                    setFileUri(message.fileUri);
                    setIsDirty(message.isDirty);
                    setDocumentRevision((revision) => revision + 1);
                    break;
                case 'setDocument':
                    // Reconstruct Uint8Array — same serialization issue as 'init'.
                    setDocumentBytes(new Uint8Array(Object.values(message.documentBytes)));
                    setIsDirty(false);
                    setDocumentRevision((revision) => revision + 1);
                    break;
                case 'getDocument': {
                    try {
                        const arrayBuffer = yield ((_a = editorRef.current) === null || _a === void 0 ? void 0 : _a.exportDocx());
                        if (!arrayBuffer) {
                            vscode === null || vscode === void 0 ? void 0 : vscode.postMessage({
                                type: 'error',
                                error: 'DOCX editor could not serialize the document.',
                            });
                            return;
                        }
                        const bytes = new Uint8Array(arrayBuffer);
                        vscode === null || vscode === void 0 ? void 0 : vscode.postMessage({
                            type: 'save',
                            documentBytes: Array.from(bytes),
                            requestId: message.requestId,
                        });
                    }
                    catch (error) {
                        vscode === null || vscode === void 0 ? void 0 : vscode.postMessage({
                            type: 'error',
                            error: error instanceof Error ? error.message : 'DOCX editor serialization failed.',
                        });
                    }
                    break;
                }
            }
        });
        const handleKeyDown = (event) => {
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const isCmdOrCtrl = isMac ? event.metaKey : event.ctrlKey;
            // 1. Ctrl+S: Extension save
            if (isCmdOrCtrl && event.key.toLowerCase() === 's' && !event.shiftKey && !event.altKey) {
                event.preventDefault();
                vscode === null || vscode === void 0 ? void 0 : vscode.postMessage({ type: 'saveShortcut' });
                return;
            }
            // 2. Ctrl+P: Code-OSS quick open
            if (isCmdOrCtrl && event.key.toLowerCase() === 'p' && !event.shiftKey && !event.altKey) {
                event.preventDefault();
                vscode === null || vscode === void 0 ? void 0 : vscode.postMessage({ type: 'triggerCommand', command: 'workbench.action.quickOpen' });
                return;
            }
            // 3. Ctrl+Shift+P: Code-OSS command palette
            if (isCmdOrCtrl && event.shiftKey && event.key.toLowerCase() === 'p' && !event.altKey) {
                event.preventDefault();
                vscode === null || vscode === void 0 ? void 0 : vscode.postMessage({ type: 'triggerCommand', command: 'workbench.action.showCommands' });
                return;
            }
            // 4. Ctrl+W: Code-OSS close tab
            if (isCmdOrCtrl && event.key.toLowerCase() === 'w' && !event.shiftKey && !event.altKey) {
                event.preventDefault();
                vscode === null || vscode === void 0 ? void 0 : vscode.postMessage({ type: 'triggerCommand', command: 'workbench.action.closeActiveEditor' });
                return;
            }
        };
        window.addEventListener('message', handleMessage);
        window.addEventListener('keydown', handleKeyDown, true);
        vscode === null || vscode === void 0 ? void 0 : vscode.postMessage({ type: 'ready' });
        return () => {
            window.removeEventListener('message', handleMessage);
            window.removeEventListener('keydown', handleKeyDown, true);
        };
    }, []);
    const handleChange = (document) => {
        void document;
        setIsDirty(true);
        vscode === null || vscode === void 0 ? void 0 : vscode.postMessage({ type: 'change', hasChanges: true });
    };
    const handleSave = () => __awaiter(this, void 0, void 0, function* () {
        // The onSave callback receives the buffer, but we also need to update local state
        // This is called from the editor's onSave prop
    });
    const handleSaveWithBuffer = (buffer) => __awaiter(this, void 0, void 0, function* () {
        const bytes = new Uint8Array(buffer);
        setIsDirty(false);
        vscode === null || vscode === void 0 ? void 0 : vscode.postMessage({
            type: 'save',
            documentBytes: Array.from(bytes),
        });
    });
    const handleEditorReady = (editor) => {
        editorRef.current = editor;
    };
    const handleError = (error) => {
        vscode === null || vscode === void 0 ? void 0 : vscode.postMessage({
            type: 'error',
            error: error.message,
        });
    };
    const editorName = useMemo(() => {
        if (!fileUri) {
            return 'DOCX document';
        }
        const segments = fileUri.split('/');
        return segments[segments.length - 1] || 'DOCX document';
    }, [fileUri]);
    if (!documentBytes) {
        return (_jsx("div", { style: {
                width: '100%',
                height: '100%',
                display: 'grid',
                placeItems: 'center',
                background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(14,165,233,0.06) 35%, transparent)',
                color: 'var(--vscode-editor-foreground)',
                fontFamily: 'var(--vscode-font-family)',
            }, children: _jsxs("div", { style: { textAlign: 'center' }, children: [_jsx("div", { style: { fontSize: 18, fontWeight: 600, marginBottom: 8 }, children: "Loading DOCX editor" }), _jsx("div", { style: { opacity: 0.8 }, children: "Waiting for the extension to send document bytes." })] }) }));
    }
    if (editorLoadError) {
        return (_jsx("div", { style: {
                width: '100%',
                height: '100%',
                display: 'grid',
                placeItems: 'center',
                background: 'var(--vscode-editor-background)',
                color: 'var(--vscode-editor-foreground)',
                fontFamily: 'var(--vscode-font-family)',
                padding: 24,
                boxSizing: 'border-box',
            }, children: _jsxs("div", { style: { maxWidth: 760, width: '100%' }, children: [_jsx("div", { style: { fontSize: 18, fontWeight: 700, marginBottom: 8 }, children: "DOCX editor bootstrap failed" }), _jsxs("div", { style: { fontSize: 13, opacity: 0.8, marginBottom: 12 }, children: ["Phase: ", bootstrapState.phase] }), _jsx("pre", { style: { whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 12, lineHeight: 1.5 }, children: editorLoadError })] }) }));
    }
    if (!EditorComponent) {
        return (_jsx("div", { style: {
                width: '100%',
                height: '100%',
                display: 'grid',
                placeItems: 'center',
                background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(14,165,233,0.06) 35%, transparent)',
                color: 'var(--vscode-editor-foreground)',
                fontFamily: 'var(--vscode-font-family)',
            }, children: _jsxs("div", { style: { textAlign: 'center' }, children: [_jsx("div", { style: { fontSize: 18, fontWeight: 600, marginBottom: 8 }, children: "Loading DOCX engine" }), _jsx("div", { style: { opacity: 0.8 }, children: "Preparing CasualDocx runtime assets and editor modules." })] }) }));
    }
    return (_jsx("div", { style: { width: '100%', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }, children: _jsx(EditorComponent, { ref: editorRef, documentBuffer: documentBytes, documentName: editorName, documentNameEditable: false, chrome: "full", showToolbar: true, showPanelRail: true, showStatusBar: true, showOutline: false, showOutlineButton: true, showRuler: true, showZoomControl: true, initialZoom: 0.75, onChange: handleChange, onSave: handleSaveWithBuffer, onReady: handleEditorReady, onError: handleError, agentPanel: {
                title: 'AI Copilot',
                open: agentPanelOpen,
                onOpenChange: setAgentPanelOpen,
                defaultWidth: 360,
                render: ({ close }) => (_jsxs("div", { style: {
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                        background: 'var(--vscode-sideBar-background)',
                        color: 'var(--vscode-sideBar-foreground)',
                        fontFamily: 'var(--vscode-font-family)',
                    }, children: [_jsxs("div", { style: {
                                padding: '12px 16px',
                                borderBottom: '1px solid var(--vscode-editorWidget-border)',
                                fontWeight: 600,
                                fontSize: 13,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                            }, children: [_jsx("span", { style: { fontSize: 16 }, children: "\u2728" }), "Matter AI Copilot", _jsx("button", { onClick: close, style: {
                                        marginLeft: 'auto',
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: 'var(--vscode-sideBar-foreground)',
                                        fontSize: 16,
                                        lineHeight: 1,
                                        opacity: 0.7,
                                    }, title: "Close panel", children: "\u00D7" })] }), _jsxs("div", { style: { flex: 1, padding: '16px', overflowY: 'auto', fontSize: 13 }, children: [_jsxs("div", { style: {
                                        background: 'var(--vscode-editorWidget-background, rgba(255,255,255,0.05))',
                                        borderRadius: 8,
                                        padding: '10px 14px',
                                        marginBottom: 12,
                                        lineHeight: 1.6,
                                        fontSize: 13,
                                    }, children: [_jsx("strong", { children: "Good morning!" }), " How can I help you with this document?"] }), _jsx("div", { style: {
                                        opacity: 0.6,
                                        fontSize: 12,
                                        textAlign: 'center',
                                        marginTop: 24,
                                    }, children: "AI features coming soon \u2014 connect your AI backend to enable chat, drafting, and review." })] }), _jsxs("div", { style: {
                                padding: '10px 12px',
                                borderTop: '1px solid var(--vscode-editorWidget-border)',
                                display: 'flex',
                                gap: 8,
                            }, children: [_jsx("input", { placeholder: "Ask anything about this document\u2026", style: {
                                        flex: 1,
                                        background: 'var(--vscode-input-background)',
                                        color: 'var(--vscode-input-foreground)',
                                        border: '1px solid var(--vscode-input-border)',
                                        borderRadius: 6,
                                        padding: '6px 10px',
                                        fontSize: 12,
                                        outline: 'none',
                                    } }), _jsx("button", { style: {
                                        background: 'var(--vscode-button-background)',
                                        color: 'var(--vscode-button-foreground)',
                                        border: 'none',
                                        borderRadius: 6,
                                        padding: '6px 12px',
                                        cursor: 'pointer',
                                        fontSize: 12,
                                        fontWeight: 600,
                                    }, children: "Send" })] })] })),
            }, style: { flex: 1, width: '100%', minHeight: 0 } }, `${fileUriRef.current}:${documentRevision}`) }));
}
const container = document.getElementById('root');
if (container) {
    try {
        bootstrapState.phase = 'react-render';
        createRoot(container).render(_jsx("div", { className: "docx-webview-root", children: _jsx(App, {}) }));
    }
    catch (error) {
        reportBootstrapError(error, 'react-render');
    }
}
else {
    renderFatalScreen('DOCX webview failed to start', 'Missing #root container in webview HTML.');
}
//# sourceMappingURL=main.js.map