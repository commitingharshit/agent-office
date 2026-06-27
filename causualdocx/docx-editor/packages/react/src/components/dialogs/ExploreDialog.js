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
 * Tools → Explore (A3). The stripped-down version of Google Docs'
 * Explore panel that the parity note sketches: pull a Wikipedia
 * summary for the selection text, surface the extract + a link, and
 * offer a "Cite this" button that drops a hyperlink at the cursor.
 *
 * Free public endpoint — no API key — so the dialog works on the demo
 * without any host integration. Image search and Drive results are
 * intentionally skipped per the parity note.
 *
 * Loading / error states route through `PanelState` so this dialog
 * looks like the rest of the editor.
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
    minWidth: 520,
    maxWidth: 640,
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
const titleStyle = {
    fontSize: 18,
    fontWeight: 600,
    color: 'var(--doc-text-on-surface, #1f2937)',
    margin: 0,
};
const extractStyle = {
    fontSize: 14,
    lineHeight: 1.5,
    color: 'var(--doc-text-on-surface, #1f2937)',
    margin: 0,
};
const linkStyle = {
    color: 'var(--doc-primary, #1a73e8)',
    fontSize: 12,
    textDecoration: 'none',
};
const actionRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
};
const sourceLabelStyle = {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    fontWeight: 600,
    color: 'var(--doc-text-muted, #6b7280)',
};
const footerStyle = {
    padding: '12px 20px 16px',
    borderTop: '1px solid var(--doc-border, #ddd)',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
};
const citeBtnStyle = Object.assign(Object.assign({}, btnBase), { border: '1px solid var(--doc-primary, #1a73e8)', background: 'transparent', color: 'var(--doc-primary, #1a73e8)' });
function explore(query, signal) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        // Wikipedia's REST endpoint accepts a page title path. Convert spaces
        // to underscores (its convention) and let it 404 for unknown topics.
        const title = query.trim().replace(/\s+/g, '_');
        const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
        const res = yield fetch(url, { signal });
        if (res.status === 404)
            throw new Error('not-found');
        if (!res.ok)
            throw new Error('http-error');
        const data = (yield res.json());
        // Disambiguation pages have an empty extract — treat as not-found so
        // the user retries with a more specific query.
        if (data.type === 'disambiguation' || !data.extract)
            throw new Error('not-found');
        return {
            title: (_a = data.title) !== null && _a !== void 0 ? _a : query,
            extract: data.extract,
            url: (_d = (_c = (_b = data.content_urls) === null || _b === void 0 ? void 0 : _b.desktop) === null || _c === void 0 ? void 0 : _c.page) !== null && _d !== void 0 ? _d : `https://en.wikipedia.org/wiki/${title}`,
        };
    });
}
export function ExploreDialog({ isOpen, onClose, initialQuery, onCite }) {
    const [input, setInput] = useState(initialQuery !== null && initialQuery !== void 0 ? initialQuery : '');
    const [activeQuery, setActiveQuery] = useState(initialQuery);
    const [status, setStatus] = useState(initialQuery ? 'loading' : 'idle');
    const [result, setResult] = useState(null);
    useEffect(() => {
        if (isOpen) {
            setInput(initialQuery !== null && initialQuery !== void 0 ? initialQuery : '');
            setActiveQuery(initialQuery);
            setStatus(initialQuery ? 'loading' : 'idle');
            setResult(null);
        }
    }, [isOpen, initialQuery]);
    useEffect(() => {
        if (!isOpen || !activeQuery)
            return;
        const controller = new AbortController();
        setStatus('loading');
        setResult(null);
        explore(activeQuery, controller.signal)
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
        }, children: _jsxs("div", { className: "ep-dialog-shell", style: dialogStyle, role: "dialog", "aria-label": "Explore", "data-testid": "explore-dialog", onMouseDown: (e) => e.stopPropagation(), children: [_jsx("div", { style: headerStyle, children: "Explore" }), _jsxs("div", { style: bodyStyle, children: [_jsxs("div", { style: lookupRowStyle, children: [_jsx("input", { type: "text", placeholder: "Search Wikipedia", value: input, onChange: (e) => setInput(e.target.value), onKeyDown: (e) => {
                                        if (e.key === 'Enter')
                                            submit();
                                    }, "data-testid": "explore-input", style: inputStyle, autoFocus: true }), _jsx("button", { type: "button", style: primaryBtnStyle, "data-testid": "explore-search", disabled: input.trim().length === 0, onClick: submit, children: "Search" })] }), status === 'loading' && (_jsx(PanelState, { kind: "loading", message: `Searching for “${activeQuery !== null && activeQuery !== void 0 ? activeQuery : ''}”…` })), status === 'not-found' && (_jsx(PanelState, { kind: "error", message: `No Wikipedia article found for “${activeQuery !== null && activeQuery !== void 0 ? activeQuery : ''}”.`, hint: "Try a more specific search term." })), status === 'error' && (_jsx(PanelState, { kind: "error", message: "Couldn't reach Wikipedia.", hint: "Check your connection and try again.", onRetry: () => setActiveQuery((q) => (q ? `${q}` : q)) })), status === 'success' && result && (_jsxs(_Fragment, { children: [_jsx("span", { style: sourceLabelStyle, children: "Wikipedia" }), _jsx("h3", { style: titleStyle, "data-testid": "explore-result-title", children: result.title }), _jsx("p", { style: extractStyle, "data-testid": "explore-result-extract", children: result.extract }), _jsxs("div", { style: actionRowStyle, children: [_jsx("a", { style: linkStyle, href: result.url, target: "_blank", rel: "noreferrer noopener", "data-testid": "explore-open-link", children: "Open in Wikipedia \u2197" }), _jsx("button", { type: "button", style: citeBtnStyle, "data-testid": "explore-cite", onClick: () => {
                                                onCite(result.title, result.url);
                                                onClose();
                                            }, children: "Cite this" })] })] }))] }), _jsx("div", { style: footerStyle, children: _jsx("button", { type: "button", style: secondaryBtnStyle, onClick: onClose, children: "Close" }) })] }) }));
}
export default ExploreDialog;
//# sourceMappingURL=ExploreDialog.js.map