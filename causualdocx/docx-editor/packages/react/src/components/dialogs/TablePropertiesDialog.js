import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Table Properties Dialog
 *
 * Modal for editing table-level settings:
 * - Preferred width (twips or percentage)
 * - Alignment (left, center, right)
 */
import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from '../../i18n';
import { FocusTrap } from '../ui/FocusTrap';
// ============================================================================
// STYLES
// ============================================================================
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
    width: 80,
    fontSize: 13,
    color: 'var(--doc-text-muted)',
};
const inputStyle = {
    background: 'var(--doc-surface)',
    color: 'var(--doc-text-on-surface)',
    flex: 1,
    padding: '6px 8px',
    border: '1px solid var(--doc-border)',
    borderRadius: 4,
    fontSize: 13,
};
const selectStyle = Object.assign({}, inputStyle);
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
// ============================================================================
// COMPONENT
// ============================================================================
export function TablePropertiesDialog({ isOpen, onClose, onApply, currentProps, }) {
    var _a, _b;
    const { t } = useTranslation();
    const [width, setWidth] = useState((currentProps === null || currentProps === void 0 ? void 0 : currentProps.width) || 0);
    const [widthType, setWidthType] = useState((currentProps === null || currentProps === void 0 ? void 0 : currentProps.widthType) || 'auto');
    const [justification, setJustification] = useState((currentProps === null || currentProps === void 0 ? void 0 : currentProps.justification) || 'left');
    // Banded rows / columns are stored inverted on the table look attr
    // (noHBand=true means NO horizontal banding). Read with the inverse
    // so the checkbox sense is positive ("yes, alternate row shading").
    const [bandedRows, setBandedRows] = useState(!((_a = currentProps === null || currentProps === void 0 ? void 0 : currentProps.look) === null || _a === void 0 ? void 0 : _a.noHBand));
    const [bandedColumns, setBandedColumns] = useState(!((_b = currentProps === null || currentProps === void 0 ? void 0 : currentProps.look) === null || _b === void 0 ? void 0 : _b.noVBand));
    useEffect(() => {
        var _a, _b;
        if (isOpen) {
            setWidth((currentProps === null || currentProps === void 0 ? void 0 : currentProps.width) || 0);
            setWidthType((currentProps === null || currentProps === void 0 ? void 0 : currentProps.widthType) || 'auto');
            setJustification((currentProps === null || currentProps === void 0 ? void 0 : currentProps.justification) || 'left');
            setBandedRows(!((_a = currentProps === null || currentProps === void 0 ? void 0 : currentProps.look) === null || _a === void 0 ? void 0 : _a.noHBand));
            setBandedColumns(!((_b = currentProps === null || currentProps === void 0 ? void 0 : currentProps.look) === null || _b === void 0 ? void 0 : _b.noVBand));
        }
    }, [isOpen, currentProps]);
    const handleApply = useCallback(() => {
        const props = {};
        if (widthType === 'auto') {
            props.width = null;
            props.widthType = 'auto';
        }
        else {
            props.width = width;
            props.widthType = widthType;
        }
        props.justification = justification;
        props.bandedRows = bandedRows;
        props.bandedColumns = bandedColumns;
        onApply(props);
        onClose();
    }, [width, widthType, justification, bandedRows, bandedColumns, onApply, onClose]);
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Escape')
            onClose();
        if (e.key === 'Enter')
            handleApply();
    }, [onClose, handleApply]);
    if (!isOpen)
        return null;
    return (_jsx("div", { style: overlayStyle, onClick: onClose, onKeyDown: handleKeyDown, children: _jsx(FocusTrap, { children: _jsxs("div", { style: dialogStyle, onClick: (e) => e.stopPropagation(), role: "dialog", "aria-modal": "true", "aria-label": t('dialogs.tableProperties.title'), children: [_jsx("div", { style: headerStyle, children: t('dialogs.tableProperties.title') }), _jsxs("div", { style: bodyStyle, children: [_jsxs("div", { style: rowStyle, children: [_jsx("label", { htmlFor: "table-props-width-type", style: labelStyle, children: t('dialogs.tableProperties.widthType') }), _jsxs("select", { id: "table-props-width-type", style: selectStyle, value: widthType, onChange: (e) => setWidthType(e.target.value), children: [_jsx("option", { value: "auto", children: t('dialogs.tableProperties.widthTypes.auto') }), _jsx("option", { value: "dxa", children: t('dialogs.tableProperties.widthTypes.fixed') }), _jsx("option", { value: "pct", children: t('dialogs.tableProperties.widthTypes.percentage') })] })] }), widthType !== 'auto' && (_jsxs("div", { style: rowStyle, children: [_jsx("label", { htmlFor: "table-props-width", style: labelStyle, children: t('dialogs.tableProperties.widthLabel') }), _jsx("input", { id: "table-props-width", type: "number", style: inputStyle, min: 0, step: widthType === 'pct' ? 5 : 100, value: width, onChange: (e) => setWidth(Number(e.target.value) || 0) }), _jsx("span", { style: { fontSize: 11, color: 'var(--doc-text-muted)' }, children: widthType === 'pct'
                                            ? t('dialogs.tableProperties.units.fiftiethsPercent')
                                            : t('dialogs.tableProperties.units.twips') })] })), _jsxs("div", { style: rowStyle, children: [_jsx("label", { htmlFor: "table-props-alignment", style: labelStyle, children: t('dialogs.tableProperties.alignmentLabel') }), _jsxs("select", { id: "table-props-alignment", style: selectStyle, value: justification, onChange: (e) => setJustification(e.target.value), children: [_jsx("option", { value: "left", children: t('dialogs.tableProperties.alignOptions.left') }), _jsx("option", { value: "center", children: t('dialogs.tableProperties.alignOptions.center') }), _jsx("option", { value: "right", children: t('dialogs.tableProperties.alignOptions.right') })] })] }), _jsx("div", { style: rowStyle, children: _jsxs("label", { style: Object.assign(Object.assign({}, labelStyle), { display: 'flex', alignItems: 'center', gap: 6 }), children: [_jsx("input", { type: "checkbox", "data-testid": "table-props-banded-rows", checked: bandedRows, onChange: (e) => setBandedRows(e.target.checked) }), t('dialogs.tableProperties.bandedRows')] }) }), _jsx("div", { style: rowStyle, children: _jsxs("label", { style: Object.assign(Object.assign({}, labelStyle), { display: 'flex', alignItems: 'center', gap: 6 }), children: [_jsx("input", { type: "checkbox", "data-testid": "table-props-banded-columns", checked: bandedColumns, onChange: (e) => setBandedColumns(e.target.checked) }), t('dialogs.tableProperties.bandedColumns')] }) })] }), _jsxs("div", { style: footerStyle, children: [_jsx("button", { type: "button", style: btnStyle, onClick: onClose, children: t('common.cancel') }), _jsx("button", { type: "button", style: Object.assign(Object.assign({}, btnStyle), { backgroundColor: 'var(--doc-primary)', color: 'white', borderColor: 'var(--doc-primary)' }), onClick: handleApply, children: t('common.apply') })] })] }) }) }));
}
//# sourceMappingURL=TablePropertiesDialog.js.map