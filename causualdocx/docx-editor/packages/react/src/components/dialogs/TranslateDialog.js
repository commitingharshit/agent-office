var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Tools → Translate (A5). Translates the editor selection via the free
 * public MyMemory endpoint. No API key, no auth — fine for the v0
 * "cheap selection translate" the parity doc asks for; full-document
 * and paid providers are a follow-up.
 *
 * UX: original text on the left, translated text on the right, language
 * pickers at the top. Loading / error states route through `PanelState`
 * so the dialog looks like every other panel in the editor. A "Copy"
 * button next to the translation lets the user paste the result back
 * into the doc themselves.
 */
import { useEffect, useState } from 'react';
import { PanelState } from '../ui/PanelState';
import { translateText, TRANSLATE_LANGUAGES as LANGUAGES } from '../../lib/translate';
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
    minWidth: 600,
    maxWidth: 720,
    width: '100%',
    margin: 20,
};
const headerStyle = {
    padding: '16px 20px 12px',
    borderBottom: '1px solid var(--doc-border, #ddd)',
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--doc-text-on-surface, #1f2937)',
};
const bodyStyle = {
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    maxHeight: '60vh',
    overflowY: 'auto',
};
const langRowStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr auto 1fr',
    alignItems: 'center',
    gap: 12,
};
const selectStyle = {
    padding: '6px 10px',
    fontSize: 13,
    border: '1px solid var(--doc-border, #d1d5db)',
    borderRadius: 4,
    background: 'var(--doc-surface, white)',
    // Explicit colour — without this, dark-mode renders the text in the
    // browser's default near-black on the themed dark background, which
    // makes the language label invisible. The `option` rule in
    // editor.css carries the same colour through to the dropdown popup.
    color: 'var(--doc-text-on-surface, #1f2937)',
};
const arrowStyle = {
    color: 'var(--doc-text-muted)',
    fontSize: 18,
    textAlign: 'center',
};
const sideStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
};
const labelStyle = {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    fontWeight: 600,
    color: 'var(--doc-text-muted)',
};
const sourceBoxStyle = {
    padding: '10px 12px',
    fontSize: 14,
    lineHeight: 1.5,
    background: 'var(--doc-surface-sunken, #f5f5f5)',
    borderRadius: 4,
    border: '1px solid var(--doc-border)',
    minHeight: 90,
    whiteSpace: 'pre-wrap',
    color: 'var(--doc-text-on-surface)',
};
const targetBoxStyle = Object.assign(Object.assign({}, sourceBoxStyle), { background: 'var(--doc-surface)' });
const swapBtnStyle = {
    padding: '6px 10px',
    fontSize: 13,
    border: '1px solid var(--doc-border)',
    background: 'transparent',
    color: 'var(--doc-text-on-surface)',
    borderRadius: 4,
    cursor: 'pointer',
};
const btnBase = {
    padding: '6px 16px',
    fontSize: 13,
    borderRadius: 4,
    cursor: 'pointer',
    fontWeight: 500,
};
const secondaryBtnStyle = Object.assign(Object.assign({}, btnBase), { border: '1px solid var(--doc-border, #d1d5db)', background: 'transparent', color: 'var(--doc-text-on-surface, #1f2937)' });
const copyBtnStyle = {
    padding: '4px 10px',
    fontSize: 12,
    border: '1px solid var(--doc-border)',
    background: 'transparent',
    color: 'var(--doc-primary)',
    borderRadius: 4,
    cursor: 'pointer',
    fontWeight: 500,
    alignSelf: 'flex-end',
};
const footerStyle = {
    padding: '12px 20px 16px',
    borderTop: '1px solid var(--doc-border, #ddd)',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
};
export function TranslateDialog({ isOpen, onClose, initialText, onReplace }) {
    const [source, setSource] = useState('en');
    const [target, setTarget] = useState('es');
    const [text, setText] = useState(initialText !== null && initialText !== void 0 ? initialText : '');
    const [status, setStatus] = useState(initialText ? 'loading' : 'idle');
    const [result, setResult] = useState('');
    const [copyHint, setCopyHint] = useState(false);
    const [replaceStatus, setReplaceStatus] = useState('idle');
    useEffect(() => {
        if (isOpen) {
            setText(initialText !== null && initialText !== void 0 ? initialText : '');
            setSource('en');
            setTarget('es');
            setStatus(initialText ? 'loading' : 'idle');
            setResult('');
        }
    }, [isOpen, initialText]);
    useEffect(() => {
        if (!isOpen)
            return;
        const trimmed = text.trim();
        if (!trimmed) {
            setStatus('idle');
            return;
        }
        if (source === target) {
            setResult(trimmed);
            setStatus('success');
            return;
        }
        const controller = new AbortController();
        setStatus('loading');
        setResult('');
        translateText(trimmed, source, target, controller.signal)
            .then((out) => {
            setResult(out);
            setStatus('success');
        })
            .catch((err) => {
            if (err.name === 'AbortError')
                return;
            setStatus('error');
        });
        return () => controller.abort();
    }, [isOpen, text, source, target]);
    useEffect(() => {
        if (!isOpen)
            return;
        const onKey = (e) => {
            if (e.key === 'Escape')
                onClose();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);
    if (!isOpen)
        return null;
    const swap = () => {
        setSource(target);
        setTarget(source);
    };
    const copy = () => __awaiter(this, void 0, void 0, function* () {
        if (!result)
            return;
        try {
            yield navigator.clipboard.writeText(result);
            setCopyHint(true);
            setTimeout(() => setCopyHint(false), 1500);
        }
        catch (_a) {
            // Clipboard denied — silently no-op.
        }
    });
    return (_jsx("div", { className: "ep-dialog-overlay", style: overlayStyle, onMouseDown: (e) => {
            if (e.target === e.currentTarget)
                onClose();
        }, children: _jsxs("div", { className: "ep-dialog-shell", style: dialogStyle, role: "dialog", "aria-label": "Translate", "data-testid": "translate-dialog", onMouseDown: (e) => e.stopPropagation(), children: [_jsx("div", { style: headerStyle, children: "Translate" }), _jsxs("div", { style: bodyStyle, children: [_jsxs("div", { style: langRowStyle, children: [_jsx("select", { style: selectStyle, value: source, onChange: (e) => setSource(e.target.value), "data-testid": "translate-source", "aria-label": "Source language", children: LANGUAGES.map((l) => (_jsx("option", { value: l.code, children: l.label }, l.code))) }), _jsx("button", { type: "button", style: swapBtnStyle, "data-testid": "translate-swap", onClick: swap, "aria-label": "Swap languages", children: "\u21C4" }), _jsx("select", { style: selectStyle, value: target, onChange: (e) => setTarget(e.target.value), "data-testid": "translate-target", "aria-label": "Target language", children: LANGUAGES.map((l) => (_jsx("option", { value: l.code, children: l.label }, l.code))) })] }), _jsxs("div", { style: langRowStyle, children: [_jsxs("div", { style: sideStyle, children: [_jsx("span", { style: labelStyle, children: "Original" }), _jsx("div", { style: sourceBoxStyle, "data-testid": "translate-source-text", children: text || _jsx("span", { style: { color: 'var(--doc-text-muted)' }, children: "(no selection)" }) })] }), _jsx("span", { style: arrowStyle, "aria-hidden": "true", children: "\u2192" }), _jsxs("div", { style: sideStyle, children: [_jsx("span", { style: labelStyle, children: "Translation" }), status === 'loading' && _jsx(PanelState, { kind: "loading", message: "Translating\u2026" }), status === 'error' && (_jsx(PanelState, { kind: "error", message: "Couldn't reach the translation service.", hint: "Check your connection and try again.", onRetry: () => setText((t) => t) })), status === 'idle' && (_jsx("div", { style: targetBoxStyle, children: _jsx("span", { style: { color: 'var(--doc-text-muted)' }, children: "Select text in the document, or paste it on the left." }) })), status === 'success' && (_jsxs(_Fragment, { children: [_jsx("div", { style: targetBoxStyle, "data-testid": "translate-result", children: result }), _jsx("button", { type: "button", style: copyBtnStyle, "data-testid": "translate-copy", onClick: copy, children: copyHint ? 'Copied' : 'Copy' })] }))] })] })] }), _jsxs("div", { style: footerStyle, children: [_jsx("button", { type: "button", style: secondaryBtnStyle, onClick: onClose, children: "Close" }), onReplace && (_jsx("button", { type: "button", "data-testid": "translate-replace", style: Object.assign(Object.assign({}, btnBase), { border: '1px solid var(--doc-primary, #1a73e8)', background: 'var(--doc-primary, #1a73e8)', color: 'white', opacity: status === 'success' && replaceStatus === 'idle' ? 1 : 0.6, cursor: status === 'success' && replaceStatus === 'idle' ? 'pointer' : 'not-allowed' }), disabled: status !== 'success' || replaceStatus !== 'idle', onClick: () => __awaiter(this, void 0, void 0, function* () {
                                setReplaceStatus('running');
                                try {
                                    yield onReplace(source, target);
                                    onClose();
                                }
                                catch (_a) {
                                    // Failure is surfaced as a toast by the caller; just
                                    // re-enable the button so the user can retry.
                                }
                                finally {
                                    setReplaceStatus('idle');
                                }
                            }), children: replaceStatus === 'running' ? 'Replacing…' : 'Replace in document' }))] })] }) }));
}
export default TranslateDialog;
//# sourceMappingURL=TranslateDialog.js.map