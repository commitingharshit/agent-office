import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Character Spacing Dialog (Phase 1.5 U1).
 *
 * Matches Word's Format > Font > Advanced tab — Scale, Spacing
 * (expanded/condensed by N pt), Position (raised/lowered by N pt),
 * and Kerning threshold. Backed by the `characterSpacing` mark whose
 * OOXML round-trip (w:w / w:spacing / w:position / w:kern) was already
 * wired in the run parser/serializer.
 */
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from '../../i18n';
import { FocusTrap } from '../ui/FocusTrap';
const SCALE_OPTIONS = [200, 150, 100, 90, 80, 66, 50, 33];
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
    minWidth: 'min(440px, calc(100vw - 32px))',
    maxWidth: 520,
    width: '100%',
    margin: 'clamp(8px, 2.5vw, 20px)',
    display: 'flex',
    flexDirection: 'column',
};
const headerStyle = {
    padding: '16px 20px 12px',
    borderBottom: '1px solid var(--doc-border)',
    fontSize: 16,
    fontWeight: 600,
};
const bodyStyle = {
    padding: '14px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
};
const rowStyle = {
    display: 'grid',
    gridTemplateColumns: '110px 1fr 92px',
    alignItems: 'center',
    gap: 10,
};
const labelStyle = {
    fontSize: 13,
    color: 'var(--doc-text-on-surface)',
};
const inputStyle = {
    padding: '4px 8px',
    border: '1px solid var(--doc-border)',
    borderRadius: 4,
    fontSize: 13,
    background: 'var(--doc-surface)',
    color: 'var(--doc-text-on-surface)',
    boxSizing: 'border-box',
    width: '100%',
};
const footerStyle = {
    padding: '12px 20px',
    borderTop: '1px solid var(--doc-border)',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
};
const btnStyle = {
    fontSize: 13,
    padding: '6px 16px',
    borderRadius: 4,
    border: '1px solid var(--doc-border)',
    background: 'var(--doc-surface)',
    color: 'var(--doc-text-on-surface)',
    cursor: 'pointer',
};
const primaryBtnStyle = Object.assign(Object.assign({}, btnStyle), { background: 'var(--doc-accent, #2563eb)', borderColor: 'var(--doc-accent, #2563eb)', color: 'white' });
/** twips → pt (20 twips per pt). */
function twipsToPt(twips) {
    if (twips == null)
        return 0;
    return twips / 20;
}
/** pt → twips. */
function ptToTwips(pt) {
    return Math.round(pt * 20);
}
/** half-points → pt. */
function halfPtToPt(hp) {
    if (hp == null)
        return 0;
    return hp / 2;
}
/** pt → half-points. */
function ptToHalfPt(pt) {
    return Math.round(pt * 2);
}
function modeFromSpacing(spacing) {
    if (!spacing)
        return 'normal';
    return spacing > 0 ? 'expanded' : 'condensed';
}
function modeFromPosition(position) {
    if (!position)
        return 'normal';
    return position > 0 ? 'raised' : 'lowered';
}
export function CharacterSpacingDialog({ isOpen, onClose, initialValue, onSubmit, }) {
    var _a;
    const { t } = useTranslation();
    const [scale, setScale] = useState((_a = initialValue.scale) !== null && _a !== void 0 ? _a : 100);
    const [spacingMode, setSpacingMode] = useState(modeFromSpacing(initialValue.spacing));
    const [spacingByPt, setSpacingByPt] = useState(Math.abs(twipsToPt(initialValue.spacing)));
    const [positionMode, setPositionMode] = useState(modeFromPosition(initialValue.position));
    const [positionByPt, setPositionByPt] = useState(Math.abs(halfPtToPt(initialValue.position)));
    const [kerningEnabled, setKerningEnabled] = useState(initialValue.kerning != null);
    const [kerningPt, setKerningPt] = useState(halfPtToPt(initialValue.kerning) || 12);
    useEffect(() => {
        var _a;
        if (!isOpen)
            return;
        setScale((_a = initialValue.scale) !== null && _a !== void 0 ? _a : 100);
        setSpacingMode(modeFromSpacing(initialValue.spacing));
        setSpacingByPt(Math.abs(twipsToPt(initialValue.spacing)));
        setPositionMode(modeFromPosition(initialValue.position));
        setPositionByPt(Math.abs(halfPtToPt(initialValue.position)));
        setKerningEnabled(initialValue.kerning != null);
        setKerningPt(halfPtToPt(initialValue.kerning) || 12);
    }, [isOpen, initialValue]);
    const submit = () => {
        const next = {
            scale: scale === 100 ? null : scale,
            spacing: spacingMode === 'normal' || spacingByPt === 0
                ? null
                : ptToTwips(spacingByPt) * (spacingMode === 'condensed' ? -1 : 1),
            position: positionMode === 'normal' || positionByPt === 0
                ? null
                : ptToHalfPt(positionByPt) * (positionMode === 'lowered' ? -1 : 1),
            kerning: kerningEnabled ? ptToHalfPt(kerningPt) : null,
        };
        onSubmit(next);
        onClose();
    };
    const previewStyle = useMemo(() => {
        const s = {
            padding: '10px 12px',
            border: '1px dashed var(--doc-border)',
            borderRadius: 4,
            fontSize: 14,
            lineHeight: 1.4,
            color: 'var(--doc-text-on-surface)',
            background: 'var(--doc-surface-muted, #fafafa)',
            minHeight: 40,
        };
        if (scale !== 100)
            s.transform = `scaleX(${scale / 100})`;
        if (spacingMode !== 'normal' && spacingByPt > 0) {
            const px = (spacingByPt * 96) / 72;
            s.letterSpacing = `${spacingMode === 'condensed' ? -px : px}px`;
        }
        return s;
    }, [scale, spacingMode, spacingByPt]);
    if (!isOpen)
        return null;
    return (_jsx("div", { style: overlayStyle, onClick: (e) => {
            if (e.target === e.currentTarget)
                onClose();
        }, onKeyDown: (e) => {
            if (e.key === 'Escape')
                onClose();
            else if (e.key === 'Enter' && e.target.tagName !== 'BUTTON')
                submit();
        }, children: _jsx(FocusTrap, { children: _jsxs("div", { style: dialogStyle, role: "dialog", "aria-modal": "true", "aria-label": t('dialogs.characterSpacing.title'), "data-testid": "character-spacing-dialog", children: [_jsx("div", { style: headerStyle, children: t('dialogs.characterSpacing.title') }), _jsxs("div", { style: bodyStyle, children: [_jsxs("div", { style: rowStyle, children: [_jsx("label", { style: labelStyle, htmlFor: "cs-scale", children: t('dialogs.characterSpacing.scale') }), _jsx("select", { id: "cs-scale", value: scale, onChange: (e) => setScale(Number(e.target.value)), style: inputStyle, "data-testid": "character-spacing-scale", children: SCALE_OPTIONS.map((v) => (_jsxs("option", { value: v, children: [v, "%"] }, v))) }), _jsx("span", {})] }), _jsxs("div", { style: rowStyle, children: [_jsx("label", { style: labelStyle, htmlFor: "cs-spacing", children: t('dialogs.characterSpacing.spacing') }), _jsxs("select", { id: "cs-spacing", value: spacingMode, onChange: (e) => setSpacingMode(e.target.value), style: inputStyle, "data-testid": "character-spacing-spacing", children: [_jsx("option", { value: "normal", children: t('dialogs.characterSpacing.normal') }), _jsx("option", { value: "expanded", children: t('dialogs.characterSpacing.expanded') }), _jsx("option", { value: "condensed", children: t('dialogs.characterSpacing.condensed') })] }), _jsx("input", { type: "number", min: 0, step: 0.1, value: spacingByPt, disabled: spacingMode === 'normal', onChange: (e) => setSpacingByPt(Number(e.target.value)), style: inputStyle, "aria-label": t('dialogs.characterSpacing.spacingBy'), "data-testid": "character-spacing-spacing-by" })] }), _jsxs("div", { style: rowStyle, children: [_jsx("label", { style: labelStyle, htmlFor: "cs-position", children: t('dialogs.characterSpacing.position') }), _jsxs("select", { id: "cs-position", value: positionMode, onChange: (e) => setPositionMode(e.target.value), style: inputStyle, "data-testid": "character-spacing-position", children: [_jsx("option", { value: "normal", children: t('dialogs.characterSpacing.normal') }), _jsx("option", { value: "raised", children: t('dialogs.characterSpacing.raised') }), _jsx("option", { value: "lowered", children: t('dialogs.characterSpacing.lowered') })] }), _jsx("input", { type: "number", min: 0, step: 0.5, value: positionByPt, disabled: positionMode === 'normal', onChange: (e) => setPositionByPt(Number(e.target.value)), style: inputStyle, "aria-label": t('dialogs.characterSpacing.positionBy'), "data-testid": "character-spacing-position-by" })] }), _jsxs("div", { style: rowStyle, children: [_jsxs("label", { style: labelStyle, children: [_jsx("input", { type: "checkbox", checked: kerningEnabled, onChange: (e) => setKerningEnabled(e.target.checked), style: { marginRight: 6, verticalAlign: 'middle' }, "data-testid": "character-spacing-kerning" }), t('dialogs.characterSpacing.kerning')] }), _jsx("span", { style: { fontSize: 12, color: 'var(--doc-text-muted)' }, children: t('dialogs.characterSpacing.kerningHint') }), _jsx("input", { type: "number", min: 1, step: 0.5, value: kerningPt, disabled: !kerningEnabled, onChange: (e) => setKerningPt(Number(e.target.value)), style: inputStyle, "aria-label": t('dialogs.characterSpacing.kerningThreshold'), "data-testid": "character-spacing-kerning-pt" })] }), _jsxs("div", { style: { marginTop: 4 }, children: [_jsx("div", { style: {
                                            fontSize: 12,
                                            color: 'var(--doc-text-muted)',
                                            marginBottom: 4,
                                        }, children: t('dialogs.characterSpacing.preview') }), _jsx("div", { style: previewStyle, children: t('dialogs.characterSpacing.previewSample') })] })] }), _jsxs("div", { style: footerStyle, children: [_jsx("button", { type: "button", style: btnStyle, onClick: onClose, children: t('common.cancel') }), _jsx("button", { type: "button", style: primaryBtnStyle, onClick: submit, "data-testid": "character-spacing-ok", children: t('common.ok') })] })] }) }) }));
}
export default CharacterSpacingDialog;
//# sourceMappingURL=CharacterSpacingDialog.js.map