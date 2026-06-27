import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Minimal footnote text editor. Opened by double-clicking a footnote at the
 * bottom of a page. v1 edits plain text; on apply the host writes the new text
 * into the footnote model (live re-paint) and marks it edited so the save path
 * regenerates only that footnote's text in footnotes.xml.
 */
import { useEffect, useRef, useState } from 'react';
const OVERLAY = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.32)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
};
const CARD = {
    width: 480,
    maxWidth: '90vw',
    background: 'var(--doc-surface, #fff)',
    borderRadius: 10,
    boxShadow: '0 8px 32px rgba(0,0,0,0.24)',
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
};
const TITLE = { fontSize: 15, fontWeight: 600, color: 'var(--doc-text, #202124)' };
const TEXTAREA = {
    width: '100%',
    minHeight: 96,
    resize: 'vertical',
    padding: '8px 10px',
    fontSize: 13,
    lineHeight: 1.4,
    border: '1px solid var(--doc-border, #dadce0)',
    borderRadius: 6,
    background: 'var(--doc-surface, #fff)',
    color: 'var(--doc-text, #202124)',
    boxSizing: 'border-box',
};
const ROW = { display: 'flex', justifyContent: 'flex-end', gap: 8 };
const btn = (primary) => ({
    height: 34,
    padding: '0 16px',
    fontSize: 13,
    fontWeight: 600,
    borderRadius: 6,
    cursor: 'pointer',
    border: primary ? 'none' : '1px solid var(--doc-border, #dadce0)',
    background: primary ? 'var(--doc-primary, #1a73e8)' : 'transparent',
    color: primary ? '#fff' : 'var(--doc-text, #202124)',
});
export function FootnoteEditDialog({ initialText, onApply, onCancel, title = 'Edit footnote', }) {
    const [text, setText] = useState(initialText);
    const ref = useRef(null);
    useEffect(() => {
        var _a, _b;
        (_a = ref.current) === null || _a === void 0 ? void 0 : _a.focus();
        (_b = ref.current) === null || _b === void 0 ? void 0 : _b.select();
    }, []);
    return (_jsx("div", { style: OVERLAY, "data-testid": "footnote-edit-dialog", onMouseDown: onCancel, children: _jsxs("div", { style: CARD, onMouseDown: (e) => e.stopPropagation(), children: [_jsx("div", { style: TITLE, children: title }), _jsx("textarea", { ref: ref, style: TEXTAREA, value: text, "data-testid": "footnote-edit-text", onChange: (e) => setText(e.target.value), onKeyDown: (e) => {
                        if (e.key === 'Escape')
                            onCancel();
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey))
                            onApply(text);
                    } }), _jsxs("div", { style: ROW, children: [_jsx("button", { type: "button", style: btn(false), "data-testid": "footnote-edit-cancel", onClick: onCancel, children: "Cancel" }), _jsx("button", { type: "button", style: btn(true), "data-testid": "footnote-edit-apply", onClick: () => onApply(text), children: "Save" })] })] }) }));
}
//# sourceMappingURL=FootnoteEditDialog.js.map