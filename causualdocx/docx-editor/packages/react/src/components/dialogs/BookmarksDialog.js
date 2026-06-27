import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Bookmarks Popover (Phase 1.5-PIVOT).
 *
 * Replaces the old modal "Bookmarks dialog" that the audit flagged
 * as out-of-place vs Google Docs. This is a non-modal floating panel:
 * - no darkening overlay
 * - add-new-bookmark input at the top (Enter to add)
 * - per-row Go-to + Delete actions
 * - dismisses on outside click or Esc
 *
 * The exported symbol is still `BookmarksDialog` for callsite stability;
 * the surface itself is now a popover, not a modal.
 */
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '../../i18n';
const popoverStyle = {
    position: 'fixed',
    top: 72,
    right: 24,
    width: 320,
    maxHeight: 'calc(100vh - 96px)',
    backgroundColor: 'var(--doc-surface, white)',
    borderRadius: 8,
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.18)',
    border: '1px solid var(--doc-border)',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
};
const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 14px',
    borderBottom: '1px solid var(--doc-border)',
};
const titleStyle = {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--doc-text-on-surface)',
};
const closeBtnStyle = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--doc-text-muted)',
    fontSize: 18,
    lineHeight: 1,
    padding: '2px 6px',
    borderRadius: 4,
};
const addRowStyle = {
    display: 'flex',
    gap: 6,
    padding: '10px 14px',
    borderBottom: '1px solid var(--doc-border-light, #f0eee9)',
};
const inputStyle = {
    flex: 1,
    padding: '5px 8px',
    border: '1px solid var(--doc-border)',
    borderRadius: 4,
    fontSize: 13,
    background: 'var(--doc-surface)',
    color: 'var(--doc-text-on-surface)',
};
const addBtnStyle = {
    padding: '5px 12px',
    fontSize: 12,
    border: '1px solid var(--doc-accent, #2563eb)',
    background: 'var(--doc-accent, #2563eb)',
    color: 'white',
    borderRadius: 4,
    cursor: 'pointer',
};
const listStyle = {
    listStyle: 'none',
    margin: 0,
    padding: '4px 0',
    overflowY: 'auto',
    flex: 1,
};
const rowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 14px',
};
const nameStyle = {
    fontSize: 13,
    flex: 1,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    color: 'var(--doc-text-on-surface)',
};
const iconBtnStyle = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--doc-text-muted)',
    padding: '2px 6px',
    borderRadius: 4,
    fontSize: 13,
};
const emptyStyle = {
    padding: '16px 14px',
    textAlign: 'center',
    fontSize: 12,
    color: 'var(--doc-text-muted)',
};
export function BookmarksDialog({ isOpen, onClose, bookmarks, onGoTo, onAdd, onDelete, }) {
    const { t } = useTranslation();
    const popoverRef = useRef(null);
    const inputRef = useRef(null);
    const [name, setName] = useState('');
    useEffect(() => {
        if (!isOpen) {
            setName('');
            return;
        }
        // Autofocus the name input so Enter immediately adds a bookmark.
        setTimeout(() => { var _a; return (_a = inputRef.current) === null || _a === void 0 ? void 0 : _a.focus(); }, 0);
    }, [isOpen]);
    useEffect(() => {
        if (!isOpen)
            return;
        const handleClick = (e) => {
            const t = e.target;
            if (t && popoverRef.current && !popoverRef.current.contains(t))
                onClose();
        };
        const handleKey = (e) => {
            if (e.key === 'Escape')
                onClose();
        };
        // Defer one frame so the click that opened us doesn't immediately close.
        const id = requestAnimationFrame(() => {
            document.addEventListener('mousedown', handleClick);
        });
        document.addEventListener('keydown', handleKey);
        return () => {
            cancelAnimationFrame(id);
            document.removeEventListener('mousedown', handleClick);
            document.removeEventListener('keydown', handleKey);
        };
    }, [isOpen, onClose]);
    if (!isOpen)
        return null;
    const submitAdd = () => {
        const n = name.trim();
        if (!n)
            return;
        onAdd(n);
        setName('');
    };
    return (_jsxs("div", { ref: popoverRef, style: popoverStyle, role: "dialog", "aria-label": t('dialogs.bookmarks.title'), "data-testid": "bookmarks-popover", children: [_jsxs("div", { style: headerStyle, children: [_jsx("span", { style: titleStyle, children: t('dialogs.bookmarks.title') }), _jsx("button", { type: "button", style: closeBtnStyle, "aria-label": t('common.close'), onClick: onClose, children: "\u00D7" })] }), _jsxs("div", { style: addRowStyle, children: [_jsx("input", { ref: inputRef, type: "text", placeholder: t('dialogs.bookmarks.addPlaceholder'), value: name, onChange: (e) => setName(e.target.value), onKeyDown: (e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                submitAdd();
                            }
                        }, style: inputStyle, "data-testid": "bookmarks-add-input" }), _jsx("button", { type: "button", style: addBtnStyle, onClick: submitAdd, disabled: !name.trim(), "data-testid": "bookmarks-add-btn", children: t('common.add') })] }), bookmarks.length === 0 ? (_jsx("div", { style: emptyStyle, children: t('dialogs.bookmarks.noBookmarks') })) : (_jsx("ul", { style: listStyle, children: bookmarks.map((b) => (_jsxs("li", { style: rowStyle, children: [_jsx("span", { style: nameStyle, title: b.name, children: b.name }), _jsx("button", { type: "button", style: iconBtnStyle, onClick: () => {
                                onGoTo(b.paraId);
                                onClose();
                            }, "aria-label": t('dialogs.bookmarks.goTo'), title: t('dialogs.bookmarks.goTo'), "data-testid": `bookmarks-goto-${b.name}`, children: "\u2197" }), _jsx("button", { type: "button", style: iconBtnStyle, onClick: () => onDelete(b), "aria-label": t('common.delete'), title: t('common.delete'), "data-testid": `bookmarks-delete-${b.name}`, children: "\u00D7" })] }, b.paraId + ':' + b.name))) }))] }));
}
export default BookmarksDialog;
//# sourceMappingURL=BookmarksDialog.js.map