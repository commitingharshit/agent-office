import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Image Properties Dialog
 *
 * Modal for editing image properties:
 * - Alt text for accessibility
 * - Border/outline style, color, and width
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
    minWidth: 'min(380px, calc(100vw - 32px))',
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
    width: 60,
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
const textareaStyle = Object.assign(Object.assign({}, inputStyle), { minHeight: 60, resize: 'vertical', fontFamily: 'inherit' });
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
export function ImagePropertiesDialog({ isOpen, onClose, onApply, currentData, }) {
    const { t } = useTranslation();
    const [alt, setAlt] = useState('');
    const [borderWidth, setBorderWidth] = useState(0);
    const [borderColor, setBorderColor] = useState('#000000');
    const [borderStyle, setBorderStyle] = useState('solid');
    useEffect(() => {
        var _a, _b, _c, _d;
        if (!isOpen)
            return;
        setAlt((_a = currentData === null || currentData === void 0 ? void 0 : currentData.alt) !== null && _a !== void 0 ? _a : '');
        setBorderWidth((_b = currentData === null || currentData === void 0 ? void 0 : currentData.borderWidth) !== null && _b !== void 0 ? _b : 0);
        setBorderColor((_c = currentData === null || currentData === void 0 ? void 0 : currentData.borderColor) !== null && _c !== void 0 ? _c : '#000000');
        setBorderStyle((_d = currentData === null || currentData === void 0 ? void 0 : currentData.borderStyle) !== null && _d !== void 0 ? _d : 'solid');
    }, [isOpen, currentData]);
    const handleApply = useCallback(() => {
        onApply({
            alt: alt || undefined,
            borderWidth: borderWidth > 0 ? borderWidth : undefined,
            borderColor: borderWidth > 0 ? borderColor : undefined,
            borderStyle: borderWidth > 0 ? borderStyle : undefined,
        });
        onClose();
    }, [alt, borderWidth, borderColor, borderStyle, onApply, onClose]);
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Escape')
            onClose();
        if (e.key === 'Enter' && !e.shiftKey) {
            // Don't hijack Enter when the user is typing inside a
            // multiline field or focused on a button — textareas need
            // newlines, buttons need their default click. The dialog-level
            // submit only fires when focus is on the dialog chrome or on
            // single-line inputs where Enter-to-submit is the convention.
            const target = e.target;
            const tag = target === null || target === void 0 ? void 0 : target.tagName;
            if (tag === 'TEXTAREA' || tag === 'BUTTON')
                return;
            handleApply();
        }
    }, [onClose, handleApply]);
    if (!isOpen)
        return null;
    return (_jsx("div", { style: overlayStyle, onClick: onClose, onKeyDown: handleKeyDown, children: _jsx(FocusTrap, { children: _jsxs("div", { style: dialogStyle, onClick: (e) => e.stopPropagation(), role: "dialog", "aria-modal": "true", "aria-label": t('dialogs.imageProperties.title'), children: [_jsx("div", { style: headerStyle, children: t('dialogs.imageProperties.title') }), _jsxs("div", { style: bodyStyle, children: [_jsxs("div", { style: sectionStyle, children: [_jsx("div", { style: sectionLabelStyle, children: t('dialogs.imageProperties.altText') }), _jsx("textarea", { style: textareaStyle, value: alt, onChange: (e) => setAlt(e.target.value), placeholder: t('dialogs.imageProperties.altTextPlaceholder') })] }), _jsxs("div", { style: sectionStyle, children: [_jsx("div", { style: sectionLabelStyle, children: t('dialogs.imageProperties.border') }), _jsxs("div", { style: rowStyle, children: [_jsx("label", { style: labelStyle, children: t('dialogs.imageProperties.width') }), _jsx("input", { type: "number", style: Object.assign(Object.assign({}, inputStyle), { maxWidth: 80 }), min: 0, max: 20, step: 0.5, value: borderWidth, onChange: (e) => setBorderWidth(Number(e.target.value) || 0) }), _jsx("span", { style: { fontSize: 12, color: 'var(--doc-text-muted)' }, children: t('common.px') })] }), _jsxs("div", { style: rowStyle, children: [_jsx("label", { style: labelStyle, children: t('dialogs.imageProperties.style') }), _jsxs("select", { style: selectStyle, value: borderStyle, onChange: (e) => setBorderStyle(e.target.value), children: [_jsx("option", { value: "solid", children: t('dialogs.imageProperties.borderStyles.solid') }), _jsx("option", { value: "dashed", children: t('dialogs.imageProperties.borderStyles.dashed') }), _jsx("option", { value: "dotted", children: t('dialogs.imageProperties.borderStyles.dotted') }), _jsx("option", { value: "double", children: t('dialogs.imageProperties.borderStyles.double') }), _jsx("option", { value: "groove", children: t('dialogs.imageProperties.borderStyles.groove') }), _jsx("option", { value: "ridge", children: t('dialogs.imageProperties.borderStyles.ridge') }), _jsx("option", { value: "inset", children: t('dialogs.imageProperties.borderStyles.inset') }), _jsx("option", { value: "outset", children: t('dialogs.imageProperties.borderStyles.outset') })] })] }), _jsxs("div", { style: rowStyle, children: [_jsx("label", { style: labelStyle, children: t('dialogs.imageProperties.color') }), _jsx("input", { type: "color", value: borderColor, onChange: (e) => setBorderColor(e.target.value), style: {
                                                    width: 32,
                                                    height: 24,
                                                    padding: 0,
                                                    border: '1px solid var(--doc-border)',
                                                    borderRadius: 4,
                                                    cursor: 'pointer',
                                                } }), _jsx("input", { type: "text", style: Object.assign(Object.assign({}, inputStyle), { maxWidth: 90 }), value: borderColor, onChange: (e) => setBorderColor(e.target.value) })] }), borderWidth > 0 && (_jsx("div", { style: {
                                            marginTop: 4,
                                            padding: 8,
                                            border: `${borderWidth}px ${borderStyle} ${borderColor}`,
                                            borderRadius: 4,
                                            fontSize: 11,
                                            color: 'var(--doc-text-muted)',
                                            textAlign: 'center',
                                        }, children: t('dialogs.imageProperties.preview') }))] })] }), _jsxs("div", { style: footerStyle, children: [_jsx("button", { type: "button", style: btnStyle, onClick: onClose, children: t('common.cancel') }), _jsx("button", { type: "button", style: Object.assign(Object.assign({}, btnStyle), { backgroundColor: 'var(--doc-primary)', color: 'white', borderColor: 'var(--doc-primary)' }), onClick: handleApply, children: t('common.apply') })] })] }) }) }));
}
//# sourceMappingURL=ImagePropertiesDialog.js.map