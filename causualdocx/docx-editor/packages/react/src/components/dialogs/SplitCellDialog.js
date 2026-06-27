import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from '../../i18n';
import { FocusTrap } from '../ui/FocusTrap';
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
    borderRadius: 8,
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    minWidth: 'min(360px, calc(100vw - 32px))',
    maxWidth: 440,
    width: '100%',
    margin: 'clamp(8px, 2.5vw, 20px)',
};
const headerStyle = {
    padding: '16px 20px 12px',
    borderBottom: '1px solid var(--doc-border)',
    fontSize: 16,
    fontWeight: 600,
};
const bodyStyle = {
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
};
const rowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
};
const labelStyle = {
    width: 88,
    fontSize: 13,
    color: 'var(--doc-text-muted)',
};
const inputStyle = {
    flex: 1,
    padding: '6px 8px',
    border: '1px solid var(--doc-border)',
    borderRadius: 4,
    fontSize: 13,
};
const helperStyle = {
    fontSize: 12,
    color: 'var(--doc-text-muted)',
    lineHeight: 1.5,
};
const errorStyle = Object.assign(Object.assign({}, helperStyle), { color: 'var(--doc-error)' });
const footerStyle = {
    padding: '12px 20px 16px',
    borderTop: '1px solid var(--doc-border)',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
};
const btnStyle = {
    background: 'var(--doc-surface)',
    color: 'var(--doc-text-on-surface)',
    padding: '6px 16px',
    fontSize: 13,
    border: '1px solid var(--doc-border)',
    borderRadius: 4,
    cursor: 'pointer',
};
export function SplitCellDialog({ isOpen, onClose, onApply, initialRows = 1, initialCols = 1, minRows = 1, minCols = 1, }) {
    const { t } = useTranslation();
    const [rows, setRows] = useState(initialRows);
    const [cols, setCols] = useState(initialCols);
    useEffect(() => {
        if (isOpen) {
            setRows(initialRows);
            setCols(initialCols);
        }
    }, [initialCols, initialRows, isOpen]);
    const validationError = useMemo(() => {
        if (rows < minRows || cols < minCols) {
            return t('dialogs.splitCell.minValue', { rows: minRows, cols: minCols });
        }
        if (rows === 1 && cols === 1) {
            return t('dialogs.splitCell.notOneByOne');
        }
        return null;
    }, [cols, minCols, minRows, rows, t]);
    const handleApply = useCallback(() => {
        if (validationError)
            return;
        onApply(rows, cols);
        onClose();
    }, [cols, onApply, onClose, rows, validationError]);
    const handleKeyDown = useCallback((event) => {
        if (event.key === 'Escape')
            onClose();
        if (event.key === 'Enter')
            handleApply();
    }, [handleApply, onClose]);
    if (!isOpen)
        return null;
    return (_jsx("div", { style: overlayStyle, onClick: onClose, onKeyDown: handleKeyDown, onMouseDown: (event) => event.stopPropagation(), children: _jsx(FocusTrap, { children: _jsxs("div", { style: dialogStyle, onClick: (event) => event.stopPropagation(), role: "dialog", "aria-modal": "true", "aria-label": t('dialogs.splitCell.title'), children: [_jsx("div", { style: headerStyle, children: t('dialogs.splitCell.title') }), _jsxs("div", { style: bodyStyle, children: [_jsx("div", { style: helperStyle, children: t('dialogs.splitCell.description') }), _jsxs("div", { style: rowStyle, children: [_jsx("label", { style: labelStyle, children: t('dialogs.splitCell.rowsLabel') }), _jsx("input", { type: "number", style: inputStyle, min: minRows, step: 1, value: rows, onChange: (event) => setRows(Math.max(0, Number(event.target.value) || 0)) })] }), _jsxs("div", { style: rowStyle, children: [_jsx("label", { style: labelStyle, children: t('dialogs.splitCell.columnsLabel') }), _jsx("input", { type: "number", style: inputStyle, min: minCols, step: 1, value: cols, onChange: (event) => setCols(Math.max(0, Number(event.target.value) || 0)) })] }), _jsx("div", { style: validationError ? errorStyle : helperStyle, children: validationError !== null && validationError !== void 0 ? validationError : t('dialogs.splitCell.currentMinimum', { rows: minRows, cols: minCols }) })] }), _jsxs("div", { style: footerStyle, children: [_jsx("button", { type: "button", style: btnStyle, onClick: onClose, children: t('common.cancel') }), _jsx("button", { type: "button", style: Object.assign(Object.assign({}, btnStyle), { backgroundColor: 'var(--doc-primary)', color: 'white', borderColor: 'var(--doc-primary)', opacity: validationError ? 0.6 : 1, cursor: validationError ? 'not-allowed' : 'pointer' }), disabled: !!validationError, onClick: handleApply, children: t('common.apply') })] })] }) }) }));
}
export default SplitCellDialog;
//# sourceMappingURL=SplitCellDialog.js.map