import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Page Setup Dialog
 *
 * Modal for editing page layout properties:
 * - Page size (Letter, A4, Legal, etc.)
 * - Orientation (portrait/landscape)
 * - Margins (top, bottom, left, right) in inches
 */
import { useState, useCallback, useEffect } from 'react';
import { TWIPS_PER_INCH } from '@eigenpal/docx-core/utils';
import { useTranslation } from '../../i18n';
import { FocusTrap } from '../ui/FocusTrap';
import { ColorPicker } from '../ui/ColorPicker';
/** Common page sizes in twips (width x height in portrait orientation) */
const PAGE_SIZES = [
    { labelKey: 'dialogs.pageSetup.pageSizes.letter', width: 12240, height: 15840 },
    { labelKey: 'dialogs.pageSetup.pageSizes.a4', width: 11906, height: 16838 },
    { labelKey: 'dialogs.pageSetup.pageSizes.legal', width: 12240, height: 20160 },
    { labelKey: 'dialogs.pageSetup.pageSizes.a3', width: 16838, height: 23811 },
    { labelKey: 'dialogs.pageSetup.pageSizes.a5', width: 8391, height: 11906 },
    { labelKey: 'dialogs.pageSetup.pageSizes.b5', width: 9979, height: 14175 },
    { labelKey: 'dialogs.pageSetup.pageSizes.executive', width: 10440, height: 15120 },
];
// ============================================================================
// HELPERS
// ============================================================================
function twipsToInches(twips) {
    return Math.round((twips / TWIPS_PER_INCH) * 100) / 100;
}
function inchesToTwips(inches) {
    return Math.round(inches * TWIPS_PER_INCH);
}
/** Find matching page size preset, ignoring orientation */
function findPageSizeIndex(w, h) {
    // Normalize to portrait (smaller dimension = width)
    const pw = Math.min(w, h);
    const ph = Math.max(w, h);
    return PAGE_SIZES.findIndex((s) => Math.abs(s.width - pw) < 20 && Math.abs(s.height - ph) < 20);
}
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
    gap: 14,
};
const sectionLabelStyle = {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--doc-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
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
    flex: 1,
    padding: '6px 8px',
    border: '1px solid var(--doc-border)',
    borderRadius: 4,
    fontSize: 13,
    background: 'var(--doc-surface)',
    color: 'var(--doc-text-on-surface)',
};
const selectStyle = Object.assign({}, inputStyle);
const unitStyle = {
    fontSize: 11,
    color: 'var(--doc-text-muted)',
    width: 16,
};
const footerStyle = {
    padding: '12px 20px 16px',
    borderTop: '1px solid var(--doc-border)',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
};
const btnStyle = {
    padding: '6px 16px',
    fontSize: 13,
    border: '1px solid var(--doc-border)',
    borderRadius: 4,
    cursor: 'pointer',
    background: 'var(--doc-surface)',
    color: 'var(--doc-text-on-surface)',
};
// ============================================================================
// COMPONENT
// ============================================================================
// Default Word values (Letter, 1" margins)
const DEFAULT_WIDTH = 12240;
const DEFAULT_HEIGHT = 15840;
const DEFAULT_MARGIN = 1440;
export function PageSetupDialog({ isOpen, onClose, onApply, currentProps, currentPageColor, onPageColorChange, }) {
    const { t } = useTranslation();
    const [pageWidth, setPageWidth] = useState(DEFAULT_WIDTH);
    const [pageHeight, setPageHeight] = useState(DEFAULT_HEIGHT);
    const [orientation, setOrientation] = useState('portrait');
    const [marginTop, setMarginTop] = useState(DEFAULT_MARGIN);
    const [marginBottom, setMarginBottom] = useState(DEFAULT_MARGIN);
    const [marginLeft, setMarginLeft] = useState(DEFAULT_MARGIN);
    const [marginRight, setMarginRight] = useState(DEFAULT_MARGIN);
    // Page color (#RRGGBB) or undefined for default white. Tracked
    // locally so the user can preview before clicking Apply.
    const [pageColor, setPageColor] = useState(undefined);
    useEffect(() => {
        var _a, _b, _c, _d;
        if (!isOpen)
            return;
        const w = (currentProps === null || currentProps === void 0 ? void 0 : currentProps.pageWidth) || DEFAULT_WIDTH;
        const h = (currentProps === null || currentProps === void 0 ? void 0 : currentProps.pageHeight) || DEFAULT_HEIGHT;
        const orient = (currentProps === null || currentProps === void 0 ? void 0 : currentProps.orientation) || (w > h ? 'landscape' : 'portrait');
        setPageWidth(w);
        setPageHeight(h);
        setOrientation(orient);
        setMarginTop((_a = currentProps === null || currentProps === void 0 ? void 0 : currentProps.marginTop) !== null && _a !== void 0 ? _a : DEFAULT_MARGIN);
        setMarginBottom((_b = currentProps === null || currentProps === void 0 ? void 0 : currentProps.marginBottom) !== null && _b !== void 0 ? _b : DEFAULT_MARGIN);
        setMarginLeft((_c = currentProps === null || currentProps === void 0 ? void 0 : currentProps.marginLeft) !== null && _c !== void 0 ? _c : DEFAULT_MARGIN);
        setMarginRight((_d = currentProps === null || currentProps === void 0 ? void 0 : currentProps.marginRight) !== null && _d !== void 0 ? _d : DEFAULT_MARGIN);
        setPageColor(currentPageColor);
    }, [isOpen, currentProps, currentPageColor]);
    const handlePageSizeChange = useCallback((index) => {
        if (index < 0)
            return;
        const size = PAGE_SIZES[index];
        if (orientation === 'landscape') {
            setPageWidth(size.height);
            setPageHeight(size.width);
        }
        else {
            setPageWidth(size.width);
            setPageHeight(size.height);
        }
    }, [orientation]);
    const handleOrientationChange = useCallback((newOrientation) => {
        if (newOrientation === orientation)
            return;
        setOrientation(newOrientation);
        // Swap width and height
        setPageWidth(pageHeight);
        setPageHeight(pageWidth);
    }, [orientation, pageWidth, pageHeight]);
    const handleApply = useCallback(() => {
        onApply({
            pageWidth,
            pageHeight,
            orientation,
            marginTop,
            marginBottom,
            marginLeft,
            marginRight,
        });
        // Emit page-color change only when it actually differs from the
        // current value so hosts that don't supply `onPageColorChange`
        // don't have to defensively no-op every Apply click.
        if (onPageColorChange && pageColor !== currentPageColor) {
            onPageColorChange(pageColor);
        }
        onClose();
    }, [
        pageWidth,
        pageHeight,
        orientation,
        marginTop,
        marginBottom,
        marginLeft,
        marginRight,
        pageColor,
        currentPageColor,
        onApply,
        onPageColorChange,
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
    const sizeIndex = findPageSizeIndex(pageWidth, pageHeight);
    return (_jsx("div", { style: overlayStyle, onClick: onClose, onKeyDown: handleKeyDown, children: _jsx(FocusTrap, { children: _jsxs("div", { style: dialogStyle, onClick: (e) => e.stopPropagation(), onMouseDown: (e) => e.stopPropagation(), role: "dialog", "aria-modal": "true", "aria-label": t('dialogs.pageSetup.title'), children: [_jsx("div", { style: headerStyle, children: t('dialogs.pageSetup.title') }), _jsxs("div", { style: bodyStyle, children: [_jsx("div", { style: sectionLabelStyle, children: t('dialogs.pageSetup.pageSize') }), _jsxs("div", { style: rowStyle, children: [_jsx("label", { htmlFor: "page-setup-size", style: labelStyle, children: t('dialogs.pageSetup.sizeLabel') }), _jsxs("select", { id: "page-setup-size", style: selectStyle, value: sizeIndex, onChange: (e) => handlePageSizeChange(Number(e.target.value)), children: [PAGE_SIZES.map((size, i) => (_jsx("option", { value: i, children: t(size.labelKey) }, size.labelKey))), sizeIndex < 0 && _jsx("option", { value: -1, children: t('dialogs.pageSetup.custom') })] })] }), _jsxs("div", { style: rowStyle, children: [_jsx("label", { htmlFor: "page-setup-orientation", style: labelStyle, children: t('dialogs.pageSetup.orientation') }), _jsxs("select", { id: "page-setup-orientation", style: selectStyle, value: orientation, onChange: (e) => handleOrientationChange(e.target.value), children: [_jsx("option", { value: "portrait", children: t('dialogs.pageSetup.portrait') }), _jsx("option", { value: "landscape", children: t('dialogs.pageSetup.landscape') })] })] }), _jsx("div", { style: Object.assign(Object.assign({}, sectionLabelStyle), { marginTop: 4 }), children: t('dialogs.pageSetup.margins') }), _jsxs("div", { style: rowStyle, children: [_jsx("label", { htmlFor: "page-setup-margin-top", style: labelStyle, children: t('dialogs.pageSetup.top') }), _jsx("input", { id: "page-setup-margin-top", type: "number", style: inputStyle, min: 0, max: 10, step: 0.1, value: twipsToInches(marginTop), onChange: (e) => setMarginTop(inchesToTwips(Number(e.target.value) || 0)) }), _jsx("span", { style: unitStyle, children: "in" })] }), _jsxs("div", { style: rowStyle, children: [_jsx("label", { htmlFor: "page-setup-margin-bottom", style: labelStyle, children: t('dialogs.pageSetup.bottom') }), _jsx("input", { id: "page-setup-margin-bottom", type: "number", style: inputStyle, min: 0, max: 10, step: 0.1, value: twipsToInches(marginBottom), onChange: (e) => setMarginBottom(inchesToTwips(Number(e.target.value) || 0)) }), _jsx("span", { style: unitStyle, children: "in" })] }), _jsxs("div", { style: rowStyle, children: [_jsx("label", { htmlFor: "page-setup-margin-left", style: labelStyle, children: t('dialogs.pageSetup.left') }), _jsx("input", { id: "page-setup-margin-left", type: "number", style: inputStyle, min: 0, max: 10, step: 0.1, value: twipsToInches(marginLeft), onChange: (e) => setMarginLeft(inchesToTwips(Number(e.target.value) || 0)) }), _jsx("span", { style: unitStyle, children: "in" })] }), _jsxs("div", { style: rowStyle, children: [_jsx("label", { htmlFor: "page-setup-margin-right", style: labelStyle, children: t('dialogs.pageSetup.right') }), _jsx("input", { id: "page-setup-margin-right", type: "number", style: inputStyle, min: 0, max: 10, step: 0.1, value: twipsToInches(marginRight), onChange: (e) => setMarginRight(inchesToTwips(Number(e.target.value) || 0)) }), _jsx("span", { style: unitStyle, children: "in" })] }), onPageColorChange && (_jsxs(_Fragment, { children: [_jsx("div", { style: Object.assign(Object.assign({}, sectionLabelStyle), { marginTop: 4 }), children: t('dialogs.pageSetup.pageColor') }), _jsxs("div", { style: rowStyle, children: [_jsx("label", { htmlFor: "page-setup-page-color", style: labelStyle, children: t('dialogs.pageSetup.pageColor') }), _jsxs("div", { "data-testid": "page-setup-page-color", style: { display: 'flex', gap: 8 }, children: [_jsx(ColorPicker, { mode: "border", value: pageColor ? pageColor.replace(/^#/, '') : { auto: true }, onChange: (c) => {
                                                            if (typeof c === 'string')
                                                                setPageColor('#' + c.replace(/^#/, ''));
                                                            else if (c && 'rgb' in c && c.rgb)
                                                                setPageColor('#' + c.rgb);
                                                            else
                                                                setPageColor(undefined);
                                                        }, splitButton: false, autoLabel: t('dialogs.pageSetup.pageColorReset') }), _jsx("button", { type: "button", style: Object.assign(Object.assign({}, btnStyle), { padding: '4px 10px', fontSize: 12 }), onClick: () => setPageColor(undefined), disabled: pageColor === undefined, "data-testid": "page-setup-page-color-reset", children: t('dialogs.pageSetup.pageColorReset') })] })] })] }))] }), _jsxs("div", { style: footerStyle, children: [_jsx("button", { type: "button", style: btnStyle, onClick: onClose, children: t('common.cancel') }), _jsx("button", { type: "button", style: Object.assign(Object.assign({}, btnStyle), { backgroundColor: 'var(--doc-primary)', color: 'white', borderColor: 'var(--doc-primary)' }), onClick: handleApply, children: t('common.apply') })] })] }) }) }));
}
//# sourceMappingURL=PageSetupDialog.js.map