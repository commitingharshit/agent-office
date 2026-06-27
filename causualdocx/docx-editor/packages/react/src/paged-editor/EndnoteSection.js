import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Endnote section — rendered at the END of the document (after the last page),
 * since the paged layout-painter has no endnote area of its own. Plain-text v1,
 * styled to match the page width + the footnote area. Double-click an entry to
 * edit it (mirrors footnotes); each entry carries `data-endnote-id` so the host
 * can route the edit.
 */
import { getEndnoteText } from '@eigenpal/docx-core/docx';
const WRAP = {
    display: 'flex',
    justifyContent: 'center',
    padding: '0 0 32px',
};
const CARD = {
    background: 'var(--doc-surface, #fff)',
    boxShadow: '0 1px 3px rgba(60,64,67,0.15)',
    padding: '24px 48px',
    fontSize: '10px',
    lineHeight: 1.4,
    color: '#000',
    boxSizing: 'border-box',
};
const TITLE = { fontWeight: 700, fontSize: '12px', marginBottom: '10px' };
const ITEM = { marginBottom: '4px', cursor: 'text' };
const SUP = { fontSize: '7px', marginRight: '2px' };
export function EndnoteSection({ endnotes, width, onEditEndnote }) {
    const items = endnotes.filter((e) => { var _a; return ((_a = e.noteType) !== null && _a !== void 0 ? _a : 'normal') === 'normal'; });
    if (items.length === 0)
        return null;
    return (_jsx("div", { style: WRAP, "data-testid": "endnote-section", children: _jsxs("div", { style: Object.assign(Object.assign({}, CARD), { width: width !== null && width !== void 0 ? width : 816 }), children: [_jsx("div", { style: TITLE, children: "Endnotes" }), items.map((en, i) => (_jsxs("div", { className: "layout-endnote", "data-endnote-id": en.id, style: ITEM, title: onEditEndnote ? 'Double-click to edit endnote' : undefined, onDoubleClick: () => onEditEndnote === null || onEditEndnote === void 0 ? void 0 : onEditEndnote(en.id), children: [_jsx("sup", { style: SUP, children: i + 1 }), _jsx("span", { className: "layout-endnote-text", children: getEndnoteText(en) })] }, en.id)))] }) }));
}
//# sourceMappingURL=EndnoteSection.js.map