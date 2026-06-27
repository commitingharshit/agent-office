import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * File → Properties dialog.
 *
 * Reads/edits the OOXML core properties (`docProps/core.xml`):
 *   - title, subject, creator (author), keywords, description
 *   - lastModifiedBy, revision (read-only)
 *   - created, modified (read-only — Word manages these)
 *
 * The dialog only edits the four user-visible fields; the rest are
 * displayed so the user can confirm what's stored on the file. On save,
 * the editor pushes edits onto `doc.package.properties`, and the next
 * repack writes them back through `applyCorePropertiesToXml`.
 */
import { useState, useEffect, useCallback } from 'react';
import { FocusTrap } from '../ui/FocusTrap';
import { formatSize } from '../../utils/recent-files';
const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
};
const dialogStyle = {
    backgroundColor: 'var(--doc-surface, white)',
    color: 'var(--doc-text-on-surface, #1f2937)',
    borderRadius: 8,
    boxShadow: 'var(--doc-shadow, 0 4px 20px rgba(0, 0, 0, 0.15))',
    minWidth: 460,
    maxWidth: 540,
    width: '100%',
    margin: 'clamp(8px, 2.5vw, 20px)',
};
const headerStyle = {
    padding: '16px 20px 12px',
    borderBottom: '1px solid var(--doc-border, #ddd)',
    fontSize: 16,
    fontWeight: 600,
};
const bodyStyle = {
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    maxHeight: '70vh',
    overflowY: 'auto',
};
const rowStyle = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
};
const labelStyle = {
    width: 130,
    fontSize: 13,
    color: 'var(--doc-text-muted, #555)',
    paddingTop: 6,
};
const inputStyle = {
    flex: 1,
    padding: '6px 8px',
    border: '1px solid var(--doc-border, #ccc)',
    borderRadius: 4,
    fontSize: 13,
    fontFamily: 'inherit',
    background: 'var(--doc-bg-input, white)',
    color: 'var(--doc-text-on-surface, #1f2937)',
};
const readonlyValueStyle = {
    flex: 1,
    padding: '6px 8px',
    fontSize: 13,
    color: 'var(--doc-text-muted, #666)',
};
const footerStyle = {
    padding: '12px 20px 16px',
    borderTop: '1px solid var(--doc-border, #ddd)',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
};
const sectionTitleStyle = {
    fontSize: 11,
    color: 'var(--doc-text-on-surface-muted, #6b7280)',
    margin: '4px 0 8px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
};
const sectionStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
};
const btnStyle = {
    padding: '6px 16px',
    fontSize: 13,
    border: '1px solid var(--doc-border, #ccc)',
    borderRadius: 4,
    cursor: 'pointer',
    background: 'var(--doc-surface, white)',
    color: 'var(--doc-text-on-surface, #1f2937)',
};
const primaryBtnStyle = Object.assign(Object.assign({}, btnStyle), { background: 'var(--doc-primary)', color: 'white', borderColor: 'var(--doc-primary)' });
function formatDate(d) {
    if (!d)
        return '—';
    // Guard Invalid Date (e.g. an unparseable core.xml timestamp) — toLocaleString
    // would render the literal "Invalid Date".
    if (isNaN(d.getTime()))
        return '—';
    try {
        return d.toLocaleString();
    }
    catch (_a) {
        return d.toISOString();
    }
}
// Drop placeholder junk that some producers stamp into core.xml so the dialog
// shows a clean em-dash instead of "Unknown" / "null" / empty.
function sanitize(value) {
    const v = value === null || value === void 0 ? void 0 : value.trim();
    if (!v || v.toLowerCase() === 'unknown' || v.toLowerCase() === 'null')
        return '—';
    return v;
}
export function FilePropertiesDialog({ isOpen, onClose, onApply, current, fileName, sizeBytes, }) {
    var _a;
    const [title, setTitle] = useState('');
    const [subject, setSubject] = useState('');
    const [creator, setCreator] = useState('');
    const [keywords, setKeywords] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    useEffect(() => {
        var _a, _b, _c, _d, _e, _f;
        if (!isOpen)
            return;
        setTitle((_a = current === null || current === void 0 ? void 0 : current.title) !== null && _a !== void 0 ? _a : '');
        setSubject((_b = current === null || current === void 0 ? void 0 : current.subject) !== null && _b !== void 0 ? _b : '');
        setCreator((_c = current === null || current === void 0 ? void 0 : current.creator) !== null && _c !== void 0 ? _c : '');
        setKeywords((_d = current === null || current === void 0 ? void 0 : current.keywords) !== null && _d !== void 0 ? _d : '');
        setDescription((_e = current === null || current === void 0 ? void 0 : current.description) !== null && _e !== void 0 ? _e : '');
        setCategory((_f = current === null || current === void 0 ? void 0 : current.category) !== null && _f !== void 0 ? _f : '');
    }, [isOpen, current]);
    const handleApply = useCallback(() => {
        onApply({
            title,
            subject,
            creator,
            keywords,
            description,
            category,
        });
        onClose();
    }, [title, subject, creator, keywords, description, category, onApply, onClose]);
    const stop = useCallback((e) => {
        e.stopPropagation();
    }, []);
    if (!isOpen)
        return null;
    return (_jsx(FocusTrap, { children: _jsx("div", { role: "dialog", "aria-modal": "true", "aria-label": "File properties", "data-testid": "file-properties-dialog", style: overlayStyle, onMouseDown: onClose, children: _jsxs("div", { style: dialogStyle, onMouseDown: stop, onClick: stop, children: [_jsx("div", { style: headerStyle, children: "File Properties" }), _jsxs("div", { style: bodyStyle, children: [_jsxs("section", { style: sectionStyle, children: [_jsx("h3", { style: sectionTitleStyle, children: "Metadata" }), _jsxs("div", { style: rowStyle, children: [_jsx("label", { style: labelStyle, htmlFor: "fp-title", children: "Title" }), _jsx("input", { id: "fp-title", "data-testid": "fp-title", style: inputStyle, value: title, onChange: (e) => setTitle(e.target.value) })] }), _jsxs("div", { style: rowStyle, children: [_jsx("label", { style: labelStyle, htmlFor: "fp-subject", children: "Subject" }), _jsx("input", { id: "fp-subject", "data-testid": "fp-subject", style: inputStyle, value: subject, onChange: (e) => setSubject(e.target.value) })] }), _jsxs("div", { style: rowStyle, children: [_jsx("label", { style: labelStyle, htmlFor: "fp-creator", children: "Author" }), _jsx("input", { id: "fp-creator", "data-testid": "fp-creator", style: inputStyle, value: creator, onChange: (e) => setCreator(e.target.value) })] }), _jsxs("div", { style: rowStyle, children: [_jsx("label", { style: labelStyle, htmlFor: "fp-keywords", children: "Keywords" }), _jsx("input", { id: "fp-keywords", "data-testid": "fp-keywords", style: inputStyle, value: keywords, onChange: (e) => setKeywords(e.target.value), placeholder: "e.g. finance; annual; report" })] }), _jsxs("div", { style: rowStyle, children: [_jsx("label", { style: labelStyle, htmlFor: "fp-category", children: "Category" }), _jsx("input", { id: "fp-category", "data-testid": "fp-category", style: inputStyle, value: category, onChange: (e) => setCategory(e.target.value) })] }), _jsxs("div", { style: rowStyle, children: [_jsx("label", { style: labelStyle, htmlFor: "fp-description", children: "Description" }), _jsx("textarea", { id: "fp-description", "data-testid": "fp-description", style: Object.assign(Object.assign({}, inputStyle), { minHeight: 60, resize: 'vertical' }), value: description, onChange: (e) => setDescription(e.target.value) })] })] }), _jsxs("section", { style: Object.assign(Object.assign({}, sectionStyle), { marginTop: 16 }), children: [_jsx("h3", { style: sectionTitleStyle, children: "File info" }), _jsxs("div", { style: rowStyle, children: [_jsx("span", { style: labelStyle, children: "File name" }), _jsx("span", { style: readonlyValueStyle, "data-testid": "fp-fileName", children: sanitize(fileName) })] }), _jsxs("div", { style: rowStyle, children: [_jsx("span", { style: labelStyle, children: "Size" }), _jsx("span", { style: readonlyValueStyle, "data-testid": "fp-size", children: typeof sizeBytes === 'number' ? formatSize(sizeBytes) : '—' })] }), _jsxs("div", { style: rowStyle, children: [_jsx("span", { style: labelStyle, children: "Last modified by" }), _jsx("span", { style: readonlyValueStyle, "data-testid": "fp-lastModifiedBy", children: sanitize(current === null || current === void 0 ? void 0 : current.lastModifiedBy) })] }), _jsxs("div", { style: rowStyle, children: [_jsx("span", { style: labelStyle, children: "Revision" }), _jsx("span", { style: readonlyValueStyle, children: (_a = current === null || current === void 0 ? void 0 : current.revision) !== null && _a !== void 0 ? _a : '—' })] }), _jsxs("div", { style: rowStyle, children: [_jsx("span", { style: labelStyle, children: "Created" }), _jsx("span", { style: readonlyValueStyle, children: formatDate(current === null || current === void 0 ? void 0 : current.created) })] }), _jsxs("div", { style: rowStyle, children: [_jsx("span", { style: labelStyle, children: "Modified" }), _jsx("span", { style: readonlyValueStyle, children: formatDate(current === null || current === void 0 ? void 0 : current.modified) })] })] })] }), _jsxs("div", { style: footerStyle, children: [_jsx("button", { type: "button", style: btnStyle, onClick: onClose, children: "Cancel" }), _jsx("button", { type: "button", style: primaryBtnStyle, "data-testid": "fp-apply", onClick: handleApply, children: "Apply" })] })] }) }) }));
}
//# sourceMappingURL=FilePropertiesDialog.js.map