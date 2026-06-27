import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Insert → Building blocks.
 *
 * Word's "Quick parts" equivalent: reusable named snippets the user has
 * saved from previous selections. The dialog has two regions —
 *
 *   1. Top: "Save current selection" — name input + Save button. Visible
 *      only when the host captured a non-empty selection at open time.
 *   2. Bottom: list of saved blocks (name + preview + Insert + Delete).
 *
 * Storage is host-owned (localStorage today). The dialog is pure UI: it
 * just calls the callbacks the host passes in.
 *
 * Visual language mirrors AccessibilityDialog / WatermarkDialog for
 * consistency.
 */
import { useEffect, useState } from 'react';
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
const saveRowStyle = {
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
const previewHintStyle = {
    fontSize: 12,
    color: 'var(--doc-text-muted, #6b7280)',
    fontStyle: 'italic',
    marginTop: 6,
};
const noSelectionHintStyle = {
    fontSize: 13,
    color: 'var(--doc-text-muted, #6b7280)',
    padding: '8px 10px',
    background: 'var(--doc-bg-subtle, #f9fafb)',
    border: '1px dashed var(--doc-border, #e5e7eb)',
    borderRadius: 4,
};
const emptyStateStyle = {
    padding: '12px 0',
    fontSize: 14,
    color: 'var(--doc-text-muted, #6b7280)',
    textAlign: 'center',
};
const blockRowStyle = {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    padding: '10px 12px',
    borderRadius: 4,
    border: '1px solid var(--doc-border, #e5e7eb)',
};
const blockNameStyle = {
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--doc-text-on-surface, #1f2937)',
};
const blockPreviewStyle = {
    fontSize: 12,
    color: 'var(--doc-text-muted, #6b7280)',
    marginTop: 2,
};
const rowActionsStyle = {
    display: 'flex',
    gap: 6,
    flexShrink: 0,
};
const footerStyle = {
    padding: '12px 20px 16px',
    borderTop: '1px solid var(--doc-border, #ddd)',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
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
export function BuildingBlocksDialog({ isOpen, onClose, blocks, pendingPreview, onSaveSelection, onInsert, onDelete, }) {
    const [name, setName] = useState('');
    // Reset the name field whenever the dialog opens — stale text from a
    // previous open would otherwise bleed into the next save.
    useEffect(() => {
        if (isOpen)
            setName('');
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
    const trimmedName = name.trim();
    const canSave = pendingPreview !== null && trimmedName.length > 0;
    const submitSave = () => {
        if (!canSave)
            return;
        onSaveSelection(trimmedName);
        setName('');
    };
    return (_jsx("div", { className: "ep-dialog-overlay", style: overlayStyle, onMouseDown: (e) => {
            if (e.target === e.currentTarget)
                onClose();
        }, children: _jsxs("div", { className: "ep-dialog-shell", style: dialogStyle, role: "dialog", "aria-label": "Building blocks", "data-testid": "building-blocks-dialog", onMouseDown: (e) => e.stopPropagation(), children: [_jsx("div", { style: headerStyle, children: "Building blocks" }), _jsxs("div", { style: bodyStyle, children: [_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: 8 }, children: [_jsx("div", { style: sectionLabelStyle, children: "Save current selection" }), pendingPreview === null ? (_jsx("div", { style: noSelectionHintStyle, "data-testid": "bb-no-selection", children: "Select text or content in the document, then reopen this dialog to save it as a reusable block." })) : (_jsxs(_Fragment, { children: [_jsxs("div", { style: saveRowStyle, children: [_jsx("input", { type: "text", placeholder: "Block name (e.g. Signature)", value: name, onChange: (e) => setName(e.target.value), onKeyDown: (e) => {
                                                        if (e.key === 'Enter')
                                                            submitSave();
                                                    }, "data-testid": "bb-name-input", style: inputStyle, autoFocus: true }), _jsx("button", { type: "button", style: primaryBtnStyle, "data-testid": "bb-save", disabled: !canSave, onClick: submitSave, children: "Save" })] }), _jsxs("div", { style: previewHintStyle, children: ["\u201C", pendingPreview, "\u201D"] })] }))] }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: 8 }, children: [_jsxs("div", { style: sectionLabelStyle, children: ["Saved blocks", blocks.length > 0 ? ` (${blocks.length})` : ''] }), blocks.length === 0 ? (_jsx("div", { style: emptyStateStyle, "data-testid": "bb-empty", children: "No building blocks saved yet." })) : (blocks.map((block) => (_jsxs("div", { style: blockRowStyle, "data-testid": `bb-row-${block.id}`, children: [_jsxs("div", { style: { minWidth: 0, flex: 1 }, children: [_jsx("div", { style: blockNameStyle, children: block.name }), _jsx("div", { style: Object.assign(Object.assign({}, blockPreviewStyle), { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }), children: block.preview })] }), _jsxs("div", { style: rowActionsStyle, children: [_jsx("button", { type: "button", style: insertBtnStyle, "data-testid": `bb-insert-${block.id}`, onClick: () => onInsert(block.id), children: "Insert" }), _jsx("button", { type: "button", style: deleteBtnStyle, "data-testid": `bb-delete-${block.id}`, onClick: () => onDelete(block.id), "aria-label": `Delete ${block.name}`, children: "Delete" })] })] }, block.id))))] })] }), _jsx("div", { style: footerStyle, children: _jsx("button", { type: "button", style: secondaryBtnStyle, onClick: onClose, children: "Close" }) })] }) }));
}
export default BuildingBlocksDialog;
//# sourceMappingURL=BuildingBlocksDialog.js.map