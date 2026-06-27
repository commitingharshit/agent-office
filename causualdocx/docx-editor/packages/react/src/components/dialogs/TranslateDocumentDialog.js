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
/**
 * Tools → Translate document — side-by-side preview that uses the
 * editor's real layout-painter for both panes, not an HTML hack.
 *
 * On open, we ask the host to serialise the current doc to a buffer,
 * then dispatch the translation transaction transiently, serialise
 * again to capture the translated buffer, and undo so the open
 * editor returns to the original. Each pane embeds a read-only
 * `<DocxEditor>` against its buffer — same parsing path, same
 * PagedEditor, same layout-painter as the live editor, so the
 * preview pixel-matches what the downloaded .docx will look like
 * when opened.
 *
 * "Download .docx" replays the same flow (transient apply → save →
 * undo) and triggers the download. The source document on disk is
 * never touched.
 */
import { useEffect, useRef, useState } from 'react';
import { Slice } from 'prosemirror-model';
import { PanelState } from '../ui/PanelState';
import { translateFragment, TRANSLATE_LANGUAGES as LANGUAGES } from '../../lib/translate';
import { translateDocViaMarkdown } from '../../lib/translateMarkdown';
import { isLlmReady } from '../../lib/writer/controller';
import { Markdown } from '../../lib/markdown';
const overlayStyle = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
};
const dialogStyle = {
    backgroundColor: 'var(--doc-surface, white)',
    borderRadius: 8,
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    width: 'min(1280px, 96vw)',
    height: 'min(820px, 92vh)',
    display: 'flex',
    flexDirection: 'column',
    margin: 16,
};
const headerStyle = {
    padding: '14px 20px',
    borderBottom: '1px solid var(--doc-border, #ddd)',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    flexShrink: 0,
};
const titleStyle = {
    fontSize: 16,
    fontWeight: 600,
    marginRight: 'auto',
};
const langRowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
};
const selectStyle = {
    padding: '4px 8px',
    fontSize: 13,
    border: '1px solid var(--doc-border)',
    borderRadius: 4,
    background: 'var(--doc-surface, white)',
    color: 'var(--doc-text-on-surface, #1f2937)',
};
const bodyStyle = {
    display: 'flex',
    flex: 1,
    minHeight: 0,
};
const paneStyle = {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--doc-bg, #f1f3f4)',
};
const paneLabelStyle = {
    padding: '8px 16px',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    fontWeight: 600,
    color: 'var(--doc-text-muted)',
    borderBottom: '1px solid var(--doc-border)',
    background: 'var(--doc-surface-sunken, #fafafa)',
    flexShrink: 0,
};
const paneEditorWrapStyle = {
    flex: 1,
    minHeight: 0,
    position: 'relative',
    overflow: 'hidden',
};
const paneDividerStyle = {
    width: 1,
    background: 'var(--doc-border, #e0e0e0)',
};
const stateOverlayStyle = {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
};
const footerStyle = {
    padding: '10px 20px',
    borderTop: '1px solid var(--doc-border, #ddd)',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
};
const hintStyle = {
    fontSize: 12,
    color: 'var(--doc-text-muted)',
    marginRight: 'auto',
};
const btnBase = {
    padding: '6px 16px',
    fontSize: 13,
    borderRadius: 4,
    cursor: 'pointer',
    fontWeight: 500,
};
const secondaryBtnStyle = Object.assign(Object.assign({}, btnBase), { border: '1px solid var(--doc-border, #d1d5db)', background: 'transparent', color: 'var(--doc-text-on-surface)' });
const primaryBtnStyle = Object.assign(Object.assign({}, btnBase), { border: '1px solid var(--doc-primary, #1a73e8)', background: 'var(--doc-primary, #1a73e8)', color: 'white' });
function downloadBuffer(buffer, filename) {
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function translatedFilename(name, target) {
    const trimmed = name.replace(/\.docx$/i, '').trim() || 'Untitled';
    return `${trimmed} (${target.toUpperCase()}).docx`;
}
/**
 * Run the translate-and-serialise sequence transiently against the
 * live editor. Dispatches the translation, asks `onSave` for the
 * buffer, then undoes — so the editor's visible state never changes
 * for the user.
 */
function captureTranslatedBuffer(getView, onSave, translated) {
    return __awaiter(this, void 0, void 0, function* () {
        const view = getView();
        if (!view)
            return null;
        const docSize = view.state.doc.content.size;
        const tr = view.state.tr.replace(0, docSize, new Slice(translated, 0, 0));
        tr.setMeta('addToHistory', true);
        view.dispatch(tr);
        try {
            const buffer = yield onSave();
            return buffer;
        }
        finally {
            const undoView = getView();
            if (undoView) {
                const { undo } = yield import('prosemirror-history');
                undo(undoView.state, undoView.dispatch);
            }
        }
    });
}
export function TranslateDocumentDialog({ isOpen, onClose, documentName, getView, onSave, renderPreview, onExport, }) {
    var _a, _b, _c, _d;
    const [source, setSource] = useState('en');
    const [target, setTarget] = useState('es');
    const [originalBuffer, setOriginalBuffer] = useState(null);
    const [translatedBuffer, setTranslatedBuffer] = useState(null);
    const [previewStatus, setPreviewStatus] = useState('idle');
    const [previewError, setPreviewError] = useState(null);
    const [progress, setProgress] = useState(null);
    // When the markdown round-trip path is active, the dialog has
    // chunk-level progress information (chunk index / total + a 60-char
    // preview of the source). Surfaces as a second line below the run
    // counter so the user can see what's being translated right now.
    const [chunkInfo, setChunkInfo] = useState(null);
    // Live preview state — translated + in-flight + remaining chunks.
    // When non-null AND previewStatus === 'loading', the pane renders
    // the markdown chunks directly so the user watches the doc
    // transform chunk-by-chunk instead of staring at a counter.
    const [liveChunkState, setLiveChunkState] = useState(null);
    const [exporting, setExporting] = useState(false);
    const abortRef = useRef(null);
    // Translation does NOT start automatically when the dialog opens.
    // The user picks source + target, then clicks Translate. Avoids the
    // surprise-pop where opening the dialog kicked off an English→Spanish
    // run nobody asked for AND froze the tab on long docs while WebLLM
    // warmed up.
    const [hasStarted, setHasStarted] = useState(false);
    // Capture the original buffer once on open so the left pane stays
    // stable even if the user keeps typing.
    useEffect(() => {
        if (!isOpen)
            return;
        let cancelled = false;
        setOriginalBuffer(null);
        setTranslatedBuffer(null);
        setPreviewStatus('loading');
        void (() => __awaiter(this, void 0, void 0, function* () {
            try {
                const buf = yield onSave();
                if (!cancelled)
                    setOriginalBuffer(buf);
            }
            catch (_a) {
                // The left-pane error is folded into the right-pane status —
                // the host save failing is rare and already toasted upstream.
            }
        }))();
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);
    // Translation runs only after the user explicitly starts it. Changing
    // source/target post-start re-runs (the user clearly wants the new
    // pair); changing them PRE-start updates labels only.
    useEffect(() => {
        var _a;
        if (!isOpen || !originalBuffer || !hasStarted)
            return;
        const view = getView();
        if (!view)
            return;
        if (source === target) {
            setTranslatedBuffer(originalBuffer);
            setPreviewStatus('ready');
            return;
        }
        (_a = abortRef.current) === null || _a === void 0 ? void 0 : _a.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        setPreviewStatus('loading');
        setPreviewError(null);
        setTranslatedBuffer(null);
        setProgress({ completed: 0, total: 0 });
        setChunkInfo(null);
        setLiveChunkState(null);
        void (() => __awaiter(this, void 0, void 0, function* () {
            try {
                const usingLlm = isLlmReady();
                const translatedContent = usingLlm
                    ? yield translateDocViaMarkdown(view.state.doc, view.state.schema, source, target, {
                        signal: controller.signal,
                        onProgress: (p) => {
                            if (controller.signal.aborted)
                                return;
                            // The run-count UI copy is reused — total = chunks,
                            // completed = current. Chunk preview goes into the
                            // secondary line so the user can see what text is
                            // being translated right now.
                            setProgress({ completed: p.chunk, total: p.totalChunks });
                            setChunkInfo(p);
                        },
                        onChunkStateChange: (s) => {
                            if (controller.signal.aborted)
                                return;
                            setLiveChunkState(s);
                        },
                    })
                    : yield translateFragment(view.state.doc.content, view.state.schema, source, target, controller.signal, {
                        onProgress: (p) => {
                            if (!controller.signal.aborted)
                                setProgress(p);
                        },
                    });
                if (controller.signal.aborted)
                    return;
                const buf = yield captureTranslatedBuffer(getView, onSave, translatedContent);
                if (controller.signal.aborted)
                    return;
                setTranslatedBuffer(buf);
                setPreviewStatus(buf ? 'ready' : 'error');
                if (!buf)
                    setPreviewError("Couldn't serialise the translated document.");
            }
            catch (err) {
                if (controller.signal.aborted)
                    return;
                if (err.name === 'AbortError')
                    return;
                setPreviewError(isLlmReady()
                    ? 'On-device translation failed mid-document. Try again or pick a shorter section.'
                    : 'Translation service is rate-limiting or unreachable. Try again in a moment, pick a smaller selection, or enable the Advanced LLM tier to translate on-device.');
                setPreviewStatus('error');
            }
        }))();
        return () => controller.abort();
    }, [isOpen, originalBuffer, source, target, getView, onSave, hasStarted]);
    // Reset on close.
    useEffect(() => {
        var _a;
        if (isOpen)
            return;
        setSource('en');
        setTarget('es');
        setOriginalBuffer(null);
        setTranslatedBuffer(null);
        setPreviewStatus('idle');
        setPreviewError(null);
        setProgress(null);
        setChunkInfo(null);
        setLiveChunkState(null);
        setExporting(false);
        setHasStarted(false);
        (_a = abortRef.current) === null || _a === void 0 ? void 0 : _a.abort();
    }, [isOpen]);
    useEffect(() => {
        if (!isOpen)
            return;
        const onKey = (e) => {
            if (e.key === 'Escape' && !exporting)
                onClose();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [isOpen, onClose, exporting]);
    if (!isOpen)
        return null;
    const swap = () => {
        setSource(target);
        setTarget(source);
    };
    const handleDownload = () => __awaiter(this, void 0, void 0, function* () {
        if (!translatedBuffer)
            return;
        setExporting(true);
        try {
            const fileName = translatedFilename(documentName, target);
            // Desktop shell: hand the bytes to the host's native Save dialog so the
            // user picks where the translated copy lands, instead of dropping a
            // phantom blob in ~/Downloads. Web (onExport unset / returns false)
            // falls back to the <a download> path.
            const blob = new Blob([translatedBuffer], {
                type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            });
            const savedViaHost = onExport ? yield onExport(blob, fileName) : false;
            if (!savedViaHost) {
                downloadBuffer(translatedBuffer, fileName);
            }
            onClose();
        }
        finally {
            setExporting(false);
        }
    });
    const sourceLangLabel = (_b = (_a = LANGUAGES.find((l) => l.code === source)) === null || _a === void 0 ? void 0 : _a.label) !== null && _b !== void 0 ? _b : source.toUpperCase();
    const targetLangLabel = (_d = (_c = LANGUAGES.find((l) => l.code === target)) === null || _c === void 0 ? void 0 : _c.label) !== null && _d !== void 0 ? _d : target.toUpperCase();
    return (_jsx("div", { className: "ep-dialog-overlay", style: overlayStyle, onMouseDown: (e) => {
            if (e.target === e.currentTarget && !exporting)
                onClose();
        }, children: _jsxs("div", { className: "ep-dialog-shell", style: dialogStyle, role: "dialog", "aria-label": "Translate document", "data-testid": "translate-document-dialog", onMouseDown: (e) => e.stopPropagation(), children: [_jsxs("div", { style: headerStyle, children: [_jsx("span", { style: titleStyle, children: "Translate document" }), _jsxs("div", { style: langRowStyle, children: [_jsx("select", { style: selectStyle, value: source, onChange: (e) => setSource(e.target.value), "data-testid": "translate-doc-source", "aria-label": "Source language", children: LANGUAGES.map((l) => (_jsx("option", { value: l.code, children: l.label }, l.code))) }), _jsx("button", { type: "button", onClick: swap, style: Object.assign(Object.assign({}, secondaryBtnStyle), { padding: '4px 8px', fontSize: 14 }), "aria-label": "Swap source and target languages", children: "\u21C4" }), _jsx("select", { style: selectStyle, value: target, onChange: (e) => setTarget(e.target.value), "data-testid": "translate-doc-target", "aria-label": "Target language", children: LANGUAGES.map((l) => (_jsx("option", { value: l.code, children: l.label }, l.code))) })] })] }), _jsxs("div", { style: bodyStyle, children: [_jsxs("div", { style: paneStyle, children: [_jsxs("div", { style: paneLabelStyle, children: ["Original \u00B7 ", sourceLangLabel] }), _jsx("div", { style: paneEditorWrapStyle, "data-testid": "translate-doc-preview-source", children: originalBuffer ? (renderPreview(originalBuffer)) : (_jsx("div", { style: stateOverlayStyle, children: _jsx(PanelState, { kind: "loading", message: "Snapshotting original\u2026" }) })) })] }), _jsx("div", { style: paneDividerStyle }), _jsxs("div", { style: paneStyle, children: [_jsxs("div", { style: paneLabelStyle, children: ["Translation \u00B7 ", targetLangLabel] }), _jsxs("div", { style: paneEditorWrapStyle, "data-testid": "translate-doc-preview-target", children: [!hasStarted && previewStatus !== 'error' && (_jsx("div", { style: stateOverlayStyle, children: _jsx(PanelState, { kind: "empty", message: `Pick a target language and click Translate to render ${targetLangLabel}.`, hint: "Nothing runs until you start \u2014 opening this dialog never modifies your document." }) })), hasStarted && previewStatus === 'loading' && !liveChunkState && (_jsx("div", { style: stateOverlayStyle, children: _jsx(PanelState, { kind: "loading", message: (() => {
                                                    // Two label shapes depending on backend:
                                                    //   LLM markdown round-trip: "Translating chunk 3 of 12"
                                                    //   Network per-run:        "Translating 17 of 280 text runs"
                                                    if (chunkInfo) {
                                                        return `Translating chunk ${chunkInfo.chunk} of ${chunkInfo.totalChunks}`;
                                                    }
                                                    if (progress && progress.total > 0) {
                                                        return `Translating… ${progress.completed} of ${progress.total} text runs`;
                                                    }
                                                    return 'Translating your document…';
                                                })(), hint: (() => {
                                                    if (chunkInfo) {
                                                        return `“${chunkInfo.preview}${chunkInfo.preview.length >= 60 ? '…' : ''}”`;
                                                    }
                                                    return 'Each formatting run translates separately so bold / italic / link boundaries stay aligned.';
                                                })() }) })), hasStarted && previewStatus === 'loading' && liveChunkState && (_jsx(LiveTranslationPreview, { state: liveChunkState, chunkLabel: chunkInfo
                                                ? `Translating chunk ${chunkInfo.chunk} of ${chunkInfo.totalChunks}`
                                                : null })), previewStatus === 'error' && previewError && (_jsx("div", { style: stateOverlayStyle, children: _jsx(PanelState, { kind: "error", message: previewError, hint: "Check your connection and try again.", onRetry: () => {
                                                    setPreviewStatus('idle');
                                                    setPreviewError(null);
                                                    // Re-arm the user gate so the dialog returns to
                                                    // the "Pick language + click Translate" idle
                                                    // state. Avoids automatically re-firing the same
                                                    // failing run.
                                                    setHasStarted(false);
                                                } }) })), previewStatus === 'ready' && translatedBuffer && renderPreview(translatedBuffer)] })] })] }), _jsxs("div", { style: footerStyle, children: [_jsx("span", { style: hintStyle, children: "Your open document is unchanged \u2014 only the downloaded copy is translated." }), _jsx("button", { type: "button", style: secondaryBtnStyle, onClick: onClose, disabled: exporting, children: "Close" }), !hasStarted && previewStatus !== 'ready' && (_jsx("button", { type: "button", style: Object.assign(Object.assign({}, primaryBtnStyle), { opacity: originalBuffer && source !== target ? 1 : 0.6, cursor: originalBuffer && source !== target ? 'pointer' : 'not-allowed' }), disabled: !originalBuffer || source === target, onClick: () => setHasStarted(true), "data-testid": "translate-doc-start", children: source === target ? 'Pick a different language' : `Translate to ${targetLangLabel}` })), hasStarted && previewStatus === 'loading' && (_jsx("button", { type: "button", style: secondaryBtnStyle, onClick: () => {
                                var _a;
                                (_a = abortRef.current) === null || _a === void 0 ? void 0 : _a.abort();
                                setHasStarted(false);
                                setPreviewStatus('idle');
                                setProgress(null);
                                setChunkInfo(null);
                                setLiveChunkState(null);
                            }, "data-testid": "translate-doc-stop", children: "Stop" })), previewStatus === 'ready' && (_jsx("button", { type: "button", style: primaryBtnStyle, disabled: exporting || !translatedBuffer, onClick: handleDownload, "data-testid": "translate-doc-export", children: exporting ? 'Downloading…' : 'Download .docx' }))] })] }) }));
}
/**
 * Live "watching the doc translate" preview rendered inside the
 * target pane while the markdown round-trip pipeline is running.
 *
 * Three regions stack vertically:
 *   1. Translated chunks — rendered as crisp prose via the existing
 *      Markdown component. The user sees more of these as time goes
 *      on.
 *   2. In-progress chunk — shown dimmed with a spinning indicator
 *      next to a 60-char preview of the source. Replaced by its
 *      translation when the LLM call lands.
 *   3. Remaining chunks — source-language preview at low opacity so
 *      the user gets a sense of how much is left.
 *
 * No buffer regeneration per chunk (the previous Phase 2 candidate
 * was rejected because `captureTranslatedBuffer` mutates the live
 * editor visibly). This pane is markdown-only; the final `.docx`
 * preview replaces it once `previewStatus === 'ready'`.
 */
const liveWrapStyle = {
    position: 'absolute',
    inset: 0,
    overflow: 'auto',
    padding: '16px 20px',
    background: 'var(--doc-surface, #ffffff)',
    fontSize: 13,
    lineHeight: 1.55,
    color: 'var(--doc-text-on-surface, #1f2937)',
};
const liveStatusBarStyle = {
    position: 'sticky',
    top: -16,
    zIndex: 2,
    marginInline: -20,
    marginBlockEnd: 12,
    padding: '8px 20px',
    background: 'var(--doc-surface, #ffffff)',
    borderBottom: '1px solid var(--doc-border, #e0e0e0)',
    fontSize: 12,
    fontWeight: 500,
    color: 'var(--doc-text-on-surface-muted, #5f6368)',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
};
const liveSpinnerStyle = {
    display: 'inline-block',
    width: 12,
    height: 12,
    border: '2px solid var(--doc-primary, #1a73e8)',
    borderTopColor: 'transparent',
    borderRadius: '50%',
    animation: 'docx-spin 0.8s linear infinite',
    flexShrink: 0,
};
const liveTranslatedBlockStyle = {
    marginBlockEnd: 12,
};
const liveInProgressBlockStyle = {
    marginBlockEnd: 12,
    padding: '8px 12px',
    borderInlineStart: '3px solid var(--doc-primary, #1a73e8)',
    background: 'var(--doc-primary-subtle, rgba(26, 115, 232, 0.06))',
    fontStyle: 'italic',
    display: 'flex',
    gap: 10,
    alignItems: 'flex-start',
};
const liveRemainingBlockStyle = {
    marginBlockEnd: 12,
    opacity: 0.45,
};
function LiveTranslationPreview({ state, chunkLabel, }) {
    return (_jsxs("div", { style: liveWrapStyle, "data-testid": "translate-doc-live-preview", children: [_jsxs("div", { style: liveStatusBarStyle, children: [_jsx("span", { style: liveSpinnerStyle, "aria-hidden": "true" }), _jsx("span", { children: chunkLabel !== null && chunkLabel !== void 0 ? chunkLabel : 'Translating…' })] }), state.translated.map((md, i) => (_jsx("div", { style: liveTranslatedBlockStyle, "data-testid": "translate-doc-live-translated", children: _jsx(Markdown, { text: md }) }, `done-${i}`))), state.inProgress && (_jsxs("div", { style: liveInProgressBlockStyle, "data-testid": "translate-doc-live-inprogress", children: [_jsx("span", { style: liveSpinnerStyle, "aria-hidden": "true" }), _jsx("div", { style: { flex: 1, minWidth: 0 }, children: _jsx(Markdown, { text: state.inProgress }) })] })), state.remaining.map((md, i) => (_jsx("div", { style: liveRemainingBlockStyle, "data-testid": "translate-doc-live-remaining", children: _jsx(Markdown, { text: md }) }, `pending-${i}`)))] }));
}
export default TranslateDocumentDialog;
//# sourceMappingURL=TranslateDocumentDialog.js.map