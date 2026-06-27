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
 * Tools → Dictionary (A4). Looks up a word via the free public
 * `dictionaryapi.dev` endpoint and shows part-of-speech + the first
 * definition for each meaning. No API key, no auth — fine for a v0
 * demo; a host integration can swap the fetcher later.
 *
 * The dialog seeds its input from the selection passed in. Loading
 * and error states route through the shared `PanelState` helper so
 * they look the same as every other panel in the editor.
 */
import { useEffect, useState } from 'react';
import { PanelState } from '../ui/PanelState';
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
    minWidth: 460,
    maxWidth: 560,
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
const lookupRowStyle = {
    display: 'flex',
    gap: 8,
};
const inputStyle = {
    flex: 1,
    padding: '8px 10px',
    fontSize: 14,
    border: '1px solid var(--doc-border, #d1d5db)',
    borderRadius: 4,
    outline: 'none',
};
const btnBase = {
    padding: '6px 16px',
    fontSize: 13,
    borderRadius: 4,
    cursor: 'pointer',
    fontWeight: 500,
};
const primaryBtnStyle = Object.assign(Object.assign({}, btnBase), { border: '1px solid var(--doc-primary, #1a73e8)', background: 'var(--doc-primary, #1a73e8)', color: 'white' });
const secondaryBtnStyle = Object.assign(Object.assign({}, btnBase), { border: '1px solid var(--doc-border, #d1d5db)', background: 'transparent', color: 'var(--doc-text-on-surface, #1f2937)' });
const meaningStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    paddingBottom: 8,
    borderBottom: '1px solid var(--doc-border-light, #f0eee9)',
};
const posStyle = {
    fontSize: 12,
    fontStyle: 'italic',
    color: 'var(--doc-text-muted, #6b7280)',
};
const definitionStyle = {
    fontSize: 14,
    lineHeight: 1.5,
    color: 'var(--doc-text-on-surface, #1f2937)',
};
const wordHeadingStyle = {
    fontSize: 18,
    fontWeight: 600,
    color: 'var(--doc-text-on-surface, #1f2937)',
    margin: 0,
};
const footerStyle = {
    padding: '12px 20px 16px',
    borderTop: '1px solid var(--doc-border, #ddd)',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
};
function lookupWord(word, signal) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;
        const res = yield fetch(url, { signal });
        if (res.status === 404) {
            throw new Error('not-found');
        }
        if (!res.ok) {
            throw new Error('http-error');
        }
        const data = (yield res.json());
        const first = data[0];
        if (!first)
            throw new Error('not-found');
        const meanings = [];
        for (const m of (_a = first.meanings) !== null && _a !== void 0 ? _a : []) {
            const def = (_c = (_b = m.definitions) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.definition;
            if (m.partOfSpeech && def) {
                meanings.push({ partOfSpeech: m.partOfSpeech, definition: def });
            }
        }
        if (meanings.length === 0)
            throw new Error('not-found');
        return { word: (_d = first.word) !== null && _d !== void 0 ? _d : word, meanings };
    });
}
export function DictionaryDialog({ isOpen, onClose, initialWord }) {
    const [input, setInput] = useState(initialWord !== null && initialWord !== void 0 ? initialWord : '');
    const [activeQuery, setActiveQuery] = useState(initialWord);
    const [status, setStatus] = useState(initialWord ? 'loading' : 'idle');
    const [result, setResult] = useState(null);
    useEffect(() => {
        if (isOpen) {
            setInput(initialWord !== null && initialWord !== void 0 ? initialWord : '');
            setActiveQuery(initialWord);
            setStatus(initialWord ? 'loading' : 'idle');
            setResult(null);
        }
    }, [isOpen, initialWord]);
    useEffect(() => {
        if (!isOpen || !activeQuery)
            return;
        const controller = new AbortController();
        setStatus('loading');
        setResult(null);
        lookupWord(activeQuery.trim(), controller.signal)
            .then((r) => {
            setResult(r);
            setStatus('success');
        })
            .catch((err) => {
            if (err.name === 'AbortError')
                return;
            setStatus(err.message === 'not-found' ? 'not-found' : 'error');
        });
        return () => controller.abort();
    }, [isOpen, activeQuery]);
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
    const submit = () => {
        const trimmed = input.trim();
        if (!trimmed)
            return;
        setActiveQuery(trimmed);
    };
    return (_jsx("div", { className: "ep-dialog-overlay", style: overlayStyle, onMouseDown: (e) => {
            if (e.target === e.currentTarget)
                onClose();
        }, children: _jsxs("div", { className: "ep-dialog-shell", style: dialogStyle, role: "dialog", "aria-label": "Dictionary", "data-testid": "dictionary-dialog", onMouseDown: (e) => e.stopPropagation(), children: [_jsx("div", { style: headerStyle, children: "Dictionary" }), _jsxs("div", { style: bodyStyle, children: [_jsxs("div", { style: lookupRowStyle, children: [_jsx("input", { type: "text", placeholder: "Look up a word", value: input, onChange: (e) => setInput(e.target.value), onKeyDown: (e) => {
                                        if (e.key === 'Enter')
                                            submit();
                                    }, "data-testid": "dictionary-input", style: inputStyle, autoFocus: true }), _jsx("button", { type: "button", style: primaryBtnStyle, "data-testid": "dictionary-lookup", disabled: input.trim().length === 0, onClick: submit, children: "Look up" })] }), status === 'loading' && (_jsx(PanelState, { kind: "loading", message: `Looking up “${activeQuery !== null && activeQuery !== void 0 ? activeQuery : ''}”…` })), status === 'not-found' && (_jsx(PanelState, { kind: "error", message: `No definition found for “${activeQuery !== null && activeQuery !== void 0 ? activeQuery : ''}”.`, hint: "Try a different spelling or root word." })), status === 'error' && (_jsx(PanelState, { kind: "error", message: "Couldn't reach the dictionary service.", hint: "Check your connection and try again.", onRetry: () => setActiveQuery((q) => (q ? `${q}` : q)) })), status === 'success' && result && (_jsxs(_Fragment, { children: [_jsx("h3", { style: wordHeadingStyle, "data-testid": "dictionary-word", children: result.word }), result.meanings.map((m, i) => (_jsxs("div", { style: meaningStyle, children: [_jsx("span", { style: posStyle, children: m.partOfSpeech }), _jsx("span", { style: definitionStyle, children: m.definition })] }, `${m.partOfSpeech}-${i}`)))] }))] }), _jsx("div", { style: footerStyle, children: _jsx("button", { type: "button", style: secondaryBtnStyle, onClick: onClose, children: "Close" }) })] }) }));
}
export default DictionaryDialog;
//# sourceMappingURL=DictionaryDialog.js.map