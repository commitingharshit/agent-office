import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Footnote & Endnote Properties Dialog
 *
 * Edits position, numbering format, start number, and restart rules.
 */
import { useState, useCallback } from 'react';
import { useTranslation } from '../../i18n';
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
    padding: 24,
    minWidth: 'min(400px, calc(100vw - 32px))',
    maxWidth: 500,
};
const sectionStyle = {
    marginBottom: 16,
    padding: 12,
    border: '1px solid var(--doc-border, #e0e0e0)',
    borderRadius: 4,
};
const labelStyle = {
    display: 'block',
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
};
const selectStyle = {
    width: '100%',
    padding: '4px 8px',
    border: '1px solid var(--doc-border, #ccc)',
    borderRadius: 4,
    fontSize: 13,
    marginBottom: 8,
};
const inputStyle = {
    background: 'var(--doc-surface)',
    color: 'var(--doc-text-on-surface)',
    width: 60,
    padding: '4px 8px',
    border: '1px solid var(--doc-border, #ccc)',
    borderRadius: 4,
    fontSize: 13,
    marginBottom: 8,
};
const buttonRowStyle = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 16,
};
const buttonStyle = {
    padding: '6px 16px',
    border: '1px solid var(--doc-border, #ccc)',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 13,
    backgroundColor: 'var(--doc-surface, white)',
};
const primaryButtonStyle = Object.assign(Object.assign({}, buttonStyle), { backgroundColor: '#2563eb', color: 'white', border: '1px solid #2563eb' });
// ============================================================================
// NUMBER FORMAT OPTIONS
// ============================================================================
const numberFormatOptions = [
    { value: 'decimal', labelKey: 'dialogs.footnoteProperties.formats.decimal' },
    { value: 'lowerRoman', labelKey: 'dialogs.footnoteProperties.formats.lowerRoman' },
    { value: 'upperRoman', labelKey: 'dialogs.footnoteProperties.formats.upperRoman' },
    { value: 'lowerLetter', labelKey: 'dialogs.footnoteProperties.formats.lowerAlpha' },
    { value: 'upperLetter', labelKey: 'dialogs.footnoteProperties.formats.upperAlpha' },
    { value: 'chicago', labelKey: 'dialogs.footnoteProperties.formats.symbols' },
];
// ============================================================================
// COMPONENT
// ============================================================================
export function FootnotePropertiesDialog({ isOpen, onClose, onApply, footnotePr, endnotePr, }) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const { t } = useTranslation();
    const [fnPosition, setFnPosition] = useState((_a = footnotePr === null || footnotePr === void 0 ? void 0 : footnotePr.position) !== null && _a !== void 0 ? _a : 'pageBottom');
    const [fnNumFmt, setFnNumFmt] = useState((_b = footnotePr === null || footnotePr === void 0 ? void 0 : footnotePr.numFmt) !== null && _b !== void 0 ? _b : 'decimal');
    const [fnNumStart, setFnNumStart] = useState((_c = footnotePr === null || footnotePr === void 0 ? void 0 : footnotePr.numStart) !== null && _c !== void 0 ? _c : 1);
    const [fnRestart, setFnRestart] = useState((_d = footnotePr === null || footnotePr === void 0 ? void 0 : footnotePr.numRestart) !== null && _d !== void 0 ? _d : 'continuous');
    const [enPosition, setEnPosition] = useState((_e = endnotePr === null || endnotePr === void 0 ? void 0 : endnotePr.position) !== null && _e !== void 0 ? _e : 'docEnd');
    const [enNumFmt, setEnNumFmt] = useState((_f = endnotePr === null || endnotePr === void 0 ? void 0 : endnotePr.numFmt) !== null && _f !== void 0 ? _f : 'lowerRoman');
    const [enNumStart, setEnNumStart] = useState((_g = endnotePr === null || endnotePr === void 0 ? void 0 : endnotePr.numStart) !== null && _g !== void 0 ? _g : 1);
    const [enRestart, setEnRestart] = useState((_h = endnotePr === null || endnotePr === void 0 ? void 0 : endnotePr.numRestart) !== null && _h !== void 0 ? _h : 'continuous');
    const handleApply = useCallback(() => {
        onApply({ position: fnPosition, numFmt: fnNumFmt, numStart: fnNumStart, numRestart: fnRestart }, { position: enPosition, numFmt: enNumFmt, numStart: enNumStart, numRestart: enRestart });
        onClose();
    }, [
        fnPosition,
        fnNumFmt,
        fnNumStart,
        fnRestart,
        enPosition,
        enNumFmt,
        enNumStart,
        enRestart,
        onApply,
        onClose,
    ]);
    if (!isOpen)
        return null;
    return (_jsx("div", { style: overlayStyle, onClick: onClose, children: _jsxs("div", { style: dialogStyle, onClick: (e) => e.stopPropagation(), children: [_jsx("h3", { style: { margin: '0 0 16px', fontSize: 16 }, children: t('dialogs.footnoteProperties.title') }), _jsxs("div", { style: sectionStyle, children: [_jsx("h4", { style: { margin: '0 0 8px', fontSize: 14 }, children: t('dialogs.footnoteProperties.footnotes') }), _jsx("label", { style: labelStyle, children: t('dialogs.footnoteProperties.position') }), _jsxs("select", { style: selectStyle, value: fnPosition, onChange: (e) => setFnPosition(e.target.value), children: [_jsx("option", { value: "pageBottom", children: t('dialogs.footnoteProperties.footnotePositions.bottomOfPage') }), _jsx("option", { value: "beneathText", children: t('dialogs.footnoteProperties.footnotePositions.belowText') })] }), _jsx("label", { style: labelStyle, children: t('dialogs.footnoteProperties.numberFormat') }), _jsx("select", { style: selectStyle, value: fnNumFmt, onChange: (e) => setFnNumFmt(e.target.value), children: numberFormatOptions.map((o) => (_jsx("option", { value: o.value, children: t(o.labelKey) }, o.value))) }), _jsxs("div", { style: { display: 'flex', gap: 12, alignItems: 'center' }, children: [_jsxs("div", { children: [_jsx("label", { style: labelStyle, children: t('dialogs.footnoteProperties.startAt') }), _jsx("input", { type: "number", min: 1, style: inputStyle, value: fnNumStart, onChange: (e) => setFnNumStart(parseInt(e.target.value, 10) || 1) })] }), _jsxs("div", { style: { flex: 1 }, children: [_jsx("label", { style: labelStyle, children: t('dialogs.footnoteProperties.numbering') }), _jsxs("select", { style: selectStyle, value: fnRestart, onChange: (e) => setFnRestart(e.target.value), children: [_jsx("option", { value: "continuous", children: t('dialogs.footnoteProperties.numberingOptions.continuous') }), _jsx("option", { value: "eachSect", children: t('dialogs.footnoteProperties.numberingOptions.restartSection') }), _jsx("option", { value: "eachPage", children: t('dialogs.footnoteProperties.numberingOptions.restartPage') })] })] })] })] }), _jsxs("div", { style: sectionStyle, children: [_jsx("h4", { style: { margin: '0 0 8px', fontSize: 14 }, children: t('dialogs.footnoteProperties.endnotes') }), _jsx("label", { style: labelStyle, children: t('dialogs.footnoteProperties.position') }), _jsxs("select", { style: selectStyle, value: enPosition, onChange: (e) => setEnPosition(e.target.value), children: [_jsx("option", { value: "docEnd", children: t('dialogs.footnoteProperties.endnotePositions.endOfDocument') }), _jsx("option", { value: "sectEnd", children: t('dialogs.footnoteProperties.endnotePositions.endOfSection') })] }), _jsx("label", { style: labelStyle, children: t('dialogs.footnoteProperties.numberFormat') }), _jsx("select", { style: selectStyle, value: enNumFmt, onChange: (e) => setEnNumFmt(e.target.value), children: numberFormatOptions.map((o) => (_jsx("option", { value: o.value, children: t(o.labelKey) }, o.value))) }), _jsxs("div", { style: { display: 'flex', gap: 12, alignItems: 'center' }, children: [_jsxs("div", { children: [_jsx("label", { style: labelStyle, children: t('dialogs.footnoteProperties.startAt') }), _jsx("input", { type: "number", min: 1, style: inputStyle, value: enNumStart, onChange: (e) => setEnNumStart(parseInt(e.target.value, 10) || 1) })] }), _jsxs("div", { style: { flex: 1 }, children: [_jsx("label", { style: labelStyle, children: t('dialogs.footnoteProperties.numbering') }), _jsxs("select", { style: selectStyle, value: enRestart, onChange: (e) => setEnRestart(e.target.value), children: [_jsx("option", { value: "continuous", children: t('dialogs.footnoteProperties.numberingOptions.continuous') }), _jsx("option", { value: "eachSect", children: t('dialogs.footnoteProperties.numberingOptions.restartSection') })] })] })] })] }), _jsxs("div", { style: buttonRowStyle, children: [_jsx("button", { style: buttonStyle, onClick: onClose, children: t('common.cancel') }), _jsx("button", { style: primaryButtonStyle, onClick: handleApply, children: t('common.apply') })] })] }) }));
}
//# sourceMappingURL=FootnotePropertiesDialog.js.map