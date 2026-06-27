import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Image Position Dialog
 *
 * Modal for editing image positioning settings:
 * - Horizontal: alignment or offset, relative to page/column/margin/paragraph
 * - Vertical: alignment or offset, relative to page/margin/paragraph/line
 * - Distance from text (top/bottom/left/right)
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
    minWidth: 'min(400px, calc(100vw - 32px))',
    maxWidth: 480,
    width: '100%',
    margin: 20,
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
    gap: 16,
};
const sectionStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
};
const sectionLabelStyle = {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--doc-text)',
};
const rowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
};
const labelStyle = {
    width: 75,
    fontSize: 12,
    color: 'var(--doc-text-muted)',
};
const inputStyle = {
    background: 'var(--doc-surface)',
    color: 'var(--doc-text-on-surface)',
    flex: 1,
    padding: '4px 6px',
    border: '1px solid var(--doc-border)',
    borderRadius: 4,
    fontSize: 12,
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
export function ImagePositionDialog({ isOpen, onClose, onApply, currentData, }) {
    const { t } = useTranslation();
    const [hMode, setHMode] = useState('align');
    const [hAlign, setHAlign] = useState('center');
    const [hRelativeTo, setHRelativeTo] = useState('column');
    const [hOffset, setHOffset] = useState(0);
    const [vMode, setVMode] = useState('align');
    const [vAlign, setVAlign] = useState('top');
    const [vRelativeTo, setVRelativeTo] = useState('paragraph');
    const [vOffset, setVOffset] = useState(0);
    const [distTop, setDistTop] = useState(0);
    const [distBottom, setDistBottom] = useState(0);
    const [distLeft, setDistLeft] = useState(0);
    const [distRight, setDistRight] = useState(0);
    useEffect(() => {
        var _a, _b, _c, _d;
        if (!isOpen)
            return;
        const h = currentData === null || currentData === void 0 ? void 0 : currentData.horizontal;
        const v = currentData === null || currentData === void 0 ? void 0 : currentData.vertical;
        if (h === null || h === void 0 ? void 0 : h.align) {
            setHMode('align');
            setHAlign(h.align);
        }
        else if ((h === null || h === void 0 ? void 0 : h.posOffset) != null) {
            setHMode('offset');
            setHOffset(h.posOffset);
        }
        if (h === null || h === void 0 ? void 0 : h.relativeTo)
            setHRelativeTo(h.relativeTo);
        if (v === null || v === void 0 ? void 0 : v.align) {
            setVMode('align');
            setVAlign(v.align);
        }
        else if ((v === null || v === void 0 ? void 0 : v.posOffset) != null) {
            setVMode('offset');
            setVOffset(v.posOffset);
        }
        if (v === null || v === void 0 ? void 0 : v.relativeTo)
            setVRelativeTo(v.relativeTo);
        setDistTop((_a = currentData === null || currentData === void 0 ? void 0 : currentData.distTop) !== null && _a !== void 0 ? _a : 0);
        setDistBottom((_b = currentData === null || currentData === void 0 ? void 0 : currentData.distBottom) !== null && _b !== void 0 ? _b : 0);
        setDistLeft((_c = currentData === null || currentData === void 0 ? void 0 : currentData.distLeft) !== null && _c !== void 0 ? _c : 0);
        setDistRight((_d = currentData === null || currentData === void 0 ? void 0 : currentData.distRight) !== null && _d !== void 0 ? _d : 0);
    }, [isOpen, currentData]);
    const handleApply = useCallback(() => {
        const data = {};
        data.horizontal = Object.assign({ relativeTo: hRelativeTo }, (hMode === 'align' ? { align: hAlign } : { posOffset: hOffset }));
        data.vertical = Object.assign({ relativeTo: vRelativeTo }, (vMode === 'align' ? { align: vAlign } : { posOffset: vOffset }));
        data.distTop = distTop;
        data.distBottom = distBottom;
        data.distLeft = distLeft;
        data.distRight = distRight;
        onApply(data);
        onClose();
    }, [
        hMode,
        hAlign,
        hRelativeTo,
        hOffset,
        vMode,
        vAlign,
        vRelativeTo,
        vOffset,
        distTop,
        distBottom,
        distLeft,
        distRight,
        onApply,
        onClose,
    ]);
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Escape')
            onClose();
        if (e.key === 'Enter')
            handleApply();
    }, [onClose, handleApply]);
    if (!isOpen)
        return null;
    return (_jsx("div", { style: overlayStyle, onClick: onClose, onKeyDown: handleKeyDown, children: _jsx(FocusTrap, { children: _jsxs("div", { style: dialogStyle, onClick: (e) => e.stopPropagation(), role: "dialog", "aria-modal": "true", "aria-label": t('dialogs.imagePosition.title'), children: [_jsx("div", { style: headerStyle, children: t('dialogs.imagePosition.title') }), _jsxs("div", { style: bodyStyle, children: [_jsxs("div", { style: sectionStyle, children: [_jsx("div", { style: sectionLabelStyle, children: t('dialogs.imagePosition.horizontal') }), _jsxs("div", { style: rowStyle, children: [_jsx("label", { style: labelStyle, children: t('dialogs.imagePosition.position') }), _jsxs("select", { style: selectStyle, value: hMode, onChange: (e) => setHMode(e.target.value), children: [_jsx("option", { value: "align", children: t('dialogs.imagePosition.alignment') }), _jsx("option", { value: "offset", children: t('dialogs.imagePosition.offset') })] })] }), hMode === 'align' ? (_jsxs("div", { style: rowStyle, children: [_jsx("label", { style: labelStyle, children: t('dialogs.imagePosition.align') }), _jsxs("select", { style: selectStyle, value: hAlign, onChange: (e) => setHAlign(e.target.value), children: [_jsx("option", { value: "left", children: t('dialogs.imagePosition.alignOptions.left') }), _jsx("option", { value: "center", children: t('dialogs.imagePosition.alignOptions.center') }), _jsx("option", { value: "right", children: t('dialogs.imagePosition.alignOptions.right') })] })] })) : (_jsxs("div", { style: rowStyle, children: [_jsx("label", { style: labelStyle, children: t('dialogs.imagePosition.offsetPx') }), _jsx("input", { type: "number", style: inputStyle, value: hOffset, onChange: (e) => setHOffset(Number(e.target.value) || 0) })] })), _jsxs("div", { style: rowStyle, children: [_jsx("label", { style: labelStyle, children: t('dialogs.imagePosition.relativeTo') }), _jsxs("select", { style: selectStyle, value: hRelativeTo, onChange: (e) => setHRelativeTo(e.target.value), children: [_jsx("option", { value: "page", children: t('dialogs.imagePosition.relativeOptions.page') }), _jsx("option", { value: "column", children: t('dialogs.imagePosition.relativeOptions.column') }), _jsx("option", { value: "margin", children: t('dialogs.imagePosition.relativeOptions.margin') }), _jsx("option", { value: "character", children: t('dialogs.imagePosition.relativeOptions.character') })] })] })] }), _jsxs("div", { style: sectionStyle, children: [_jsx("div", { style: sectionLabelStyle, children: t('dialogs.imagePosition.vertical') }), _jsxs("div", { style: rowStyle, children: [_jsx("label", { style: labelStyle, children: t('dialogs.imagePosition.position') }), _jsxs("select", { style: selectStyle, value: vMode, onChange: (e) => setVMode(e.target.value), children: [_jsx("option", { value: "align", children: t('dialogs.imagePosition.alignment') }), _jsx("option", { value: "offset", children: t('dialogs.imagePosition.offset') })] })] }), vMode === 'align' ? (_jsxs("div", { style: rowStyle, children: [_jsx("label", { style: labelStyle, children: t('dialogs.imagePosition.align') }), _jsxs("select", { style: selectStyle, value: vAlign, onChange: (e) => setVAlign(e.target.value), children: [_jsx("option", { value: "top", children: t('dialogs.imagePosition.alignOptions.top') }), _jsx("option", { value: "center", children: t('dialogs.imagePosition.alignOptions.center') }), _jsx("option", { value: "bottom", children: t('dialogs.imagePosition.alignOptions.bottom') })] })] })) : (_jsxs("div", { style: rowStyle, children: [_jsx("label", { style: labelStyle, children: t('dialogs.imagePosition.offsetPx') }), _jsx("input", { type: "number", style: inputStyle, value: vOffset, onChange: (e) => setVOffset(Number(e.target.value) || 0) })] })), _jsxs("div", { style: rowStyle, children: [_jsx("label", { style: labelStyle, children: t('dialogs.imagePosition.relativeTo') }), _jsxs("select", { style: selectStyle, value: vRelativeTo, onChange: (e) => setVRelativeTo(e.target.value), children: [_jsx("option", { value: "page", children: t('dialogs.imagePosition.relativeOptions.page') }), _jsx("option", { value: "margin", children: t('dialogs.imagePosition.relativeOptions.margin') }), _jsx("option", { value: "paragraph", children: t('dialogs.imagePosition.relativeOptions.paragraph') }), _jsx("option", { value: "line", children: t('dialogs.imagePosition.relativeOptions.line') })] })] })] }), _jsxs("div", { style: sectionStyle, children: [_jsx("div", { style: sectionLabelStyle, children: "Distance from text (px)" }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }, children: [_jsxs("div", { style: rowStyle, children: [_jsx("label", { style: Object.assign(Object.assign({}, labelStyle), { width: 45 }), children: t('dialogs.imagePosition.alignOptions.top') }), _jsx("input", { type: "number", style: inputStyle, min: 0, value: distTop, onChange: (e) => setDistTop(Number(e.target.value) || 0) })] }), _jsxs("div", { style: rowStyle, children: [_jsx("label", { style: Object.assign(Object.assign({}, labelStyle), { width: 45 }), children: t('dialogs.imagePosition.alignOptions.bottom') }), _jsx("input", { type: "number", style: inputStyle, min: 0, value: distBottom, onChange: (e) => setDistBottom(Number(e.target.value) || 0) })] }), _jsxs("div", { style: rowStyle, children: [_jsx("label", { style: Object.assign(Object.assign({}, labelStyle), { width: 45 }), children: t('dialogs.imagePosition.alignOptions.left') }), _jsx("input", { type: "number", style: inputStyle, min: 0, value: distLeft, onChange: (e) => setDistLeft(Number(e.target.value) || 0) })] }), _jsxs("div", { style: rowStyle, children: [_jsx("label", { style: Object.assign(Object.assign({}, labelStyle), { width: 45 }), children: t('dialogs.imagePosition.alignOptions.right') }), _jsx("input", { type: "number", style: inputStyle, min: 0, value: distRight, onChange: (e) => setDistRight(Number(e.target.value) || 0) })] })] })] })] }), _jsxs("div", { style: footerStyle, children: [_jsx("button", { type: "button", style: btnStyle, onClick: onClose, children: t('common.cancel') }), _jsx("button", { type: "button", style: Object.assign(Object.assign({}, btnStyle), { backgroundColor: 'var(--doc-primary)', color: 'white', borderColor: 'var(--doc-primary)' }), onClick: handleApply, children: t('common.apply') })] })] }) }) }));
}
//# sourceMappingURL=ImagePositionDialog.js.map