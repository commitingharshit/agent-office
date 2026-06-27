import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Tools → Citations (A6 v0). Local-only citation manager.
 *
 * Two regions:
 *   1. Top — "Add citation" form (author, title, year, URL).
 *   2. Bottom — list of saved citations with Insert + Delete per row,
 *      plus a style chooser (APA / MLA / Chicago) shared across rows.
 *
 * Insert calls back to the host with the formatted text + the URL (if
 * any), so the host can wrap the URL substring in a hyperlink mark.
 * Storage is `localStorage` — same pattern as Building Blocks.
 *
 * The "real" .docx bibliography-field round-trip is a follow-up; the
 * parity note flags it as "queue last."
 */
import { useEffect, useState } from 'react';
import { formatCitation } from '../../utils/citations';
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
    gap: 16,
    maxHeight: '60vh',
    overflowY: 'auto',
};
const sectionLabelStyle = {
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: 'var(--doc-text-muted, #6b7280)',
};
const formRowStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
};
const inputStyle = {
    padding: '8px 10px',
    fontSize: 13,
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
const styleRowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
    color: 'var(--doc-text-on-surface, #1f2937)',
};
const emptyStateStyle = {
    padding: '12px 0',
    fontSize: 13,
    color: 'var(--doc-text-muted, #6b7280)',
    textAlign: 'center',
};
const citationRowStyle = {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    padding: '10px 12px',
    borderRadius: 4,
    border: '1px solid var(--doc-border, #e5e7eb)',
};
const citationTextStyle = {
    fontSize: 13,
    lineHeight: 1.5,
    color: 'var(--doc-text-on-surface, #1f2937)',
};
const rowActionsStyle = {
    display: 'flex',
    gap: 6,
    flexShrink: 0,
};
const rowBtnStyle = {
    padding: '4px 10px',
    fontSize: 12,
    border: '1px solid var(--doc-border, #d1d5db)',
    background: 'transparent',
    borderRadius: 4,
    cursor: 'pointer',
    fontWeight: 500,
};
const insertBtnStyle = Object.assign(Object.assign({}, rowBtnStyle), { color: 'var(--doc-primary, #1a73e8)', borderColor: 'var(--doc-primary, #1a73e8)' });
const deleteBtnStyle = Object.assign(Object.assign({}, rowBtnStyle), { color: 'var(--doc-error, #d93025)' });
const footerStyle = {
    padding: '12px 20px 16px',
    borderTop: '1px solid var(--doc-border, #ddd)',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
};
export function CitationsDialog({ isOpen, onClose, citations, onAdd, onDelete, onInsert, }) {
    const [author, setAuthor] = useState('');
    const [title, setTitle] = useState('');
    const [year, setYear] = useState('');
    const [url, setUrl] = useState('');
    const [style, setStyle] = useState('apa');
    useEffect(() => {
        if (isOpen) {
            setAuthor('');
            setTitle('');
            setYear('');
            setUrl('');
            setStyle('apa');
        }
    }, [isOpen]);
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
    const canAdd = author.trim().length > 0 && title.trim().length > 0;
    const submit = () => {
        if (!canAdd)
            return;
        onAdd({ author, title, year, url });
        setAuthor('');
        setTitle('');
        setYear('');
        setUrl('');
    };
    return (_jsx("div", { className: "ep-dialog-overlay", style: overlayStyle, onMouseDown: (e) => {
            if (e.target === e.currentTarget)
                onClose();
        }, children: _jsxs("div", { className: "ep-dialog-shell", style: dialogStyle, role: "dialog", "aria-label": "Citations", "data-testid": "citations-dialog", onMouseDown: (e) => e.stopPropagation(), children: [_jsx("div", { style: headerStyle, children: "Citations" }), _jsxs("div", { style: bodyStyle, children: [_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: 8 }, children: [_jsx("div", { style: sectionLabelStyle, children: "Add a citation" }), _jsxs("div", { style: formRowStyle, children: [_jsx("input", { type: "text", placeholder: "Author (e.g. Knuth, D.)", value: author, onChange: (e) => setAuthor(e.target.value), style: inputStyle, "data-testid": "citation-author" }), _jsx("input", { type: "text", placeholder: "Year", value: year, onChange: (e) => setYear(e.target.value), style: inputStyle, "data-testid": "citation-year" }), _jsx("input", { type: "text", placeholder: "Title", value: title, onChange: (e) => setTitle(e.target.value), style: Object.assign(Object.assign({}, inputStyle), { gridColumn: '1 / span 2' }), "data-testid": "citation-title" }), _jsx("input", { type: "text", placeholder: "URL (optional)", value: url, onChange: (e) => setUrl(e.target.value), style: Object.assign(Object.assign({}, inputStyle), { gridColumn: '1 / span 2' }), "data-testid": "citation-url" })] }), _jsx("div", { style: { display: 'flex', justifyContent: 'flex-end' }, children: _jsx("button", { type: "button", style: primaryBtnStyle, "data-testid": "citation-add", disabled: !canAdd, onClick: submit, children: "Save citation" }) })] }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: 8 }, children: [_jsxs("div", { style: sectionLabelStyle, children: ["Saved citations", citations.length > 0 ? ` (${citations.length})` : ''] }), _jsxs("div", { style: styleRowStyle, children: [_jsx("span", { children: "Format:" }), ['apa', 'mla', 'chicago'].map((s) => (_jsxs("label", { style: { display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }, children: [_jsx("input", { type: "radio", name: "citation-style", value: s, checked: style === s, onChange: () => setStyle(s), "data-testid": `citation-style-${s}` }), s.toUpperCase()] }, s)))] }), citations.length === 0 ? (_jsx("div", { style: emptyStateStyle, "data-testid": "citation-empty", children: "No citations saved yet." })) : (citations.map((c) => {
                                    const formatted = formatCitation(c, style);
                                    return (_jsxs("div", { style: citationRowStyle, "data-testid": `citation-row-${c.id}`, children: [_jsx("div", { style: { minWidth: 0, flex: 1 }, children: _jsx("div", { style: citationTextStyle, children: formatted }) }), _jsxs("div", { style: rowActionsStyle, children: [_jsx("button", { type: "button", style: insertBtnStyle, "data-testid": `citation-insert-${c.id}`, onClick: () => onInsert(formatted, c.url), children: "Insert" }), _jsx("button", { type: "button", style: deleteBtnStyle, "data-testid": `citation-delete-${c.id}`, onClick: () => onDelete(c.id), "aria-label": `Delete citation: ${c.title}`, children: "Delete" })] })] }, c.id));
                                }))] })] }), _jsx("div", { style: footerStyle, children: _jsx("button", { type: "button", style: secondaryBtnStyle, onClick: onClose, children: "Close" }) })] }) }));
}
export default CitationsDialog;
//# sourceMappingURL=CitationsDialog.js.map