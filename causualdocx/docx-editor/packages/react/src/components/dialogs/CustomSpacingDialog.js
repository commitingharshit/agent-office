import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Custom Spacing Dialog (Phase 1.5-PIVOT, replaces the old tabbed
 * ParagraphDialog).
 *
 * Mirrors Google Docs' "Custom spacing…" leaf opened from the
 * Line & paragraph spacing toolbar dropdown. Single small dialog
 * with line spacing, before/after spacing, and the four pagination
 * toggles — no tabs, no inch-based indent spinners (indent has its
 * own surface: ruler + Format > Indent options).
 *
 * Apply-on-change: changes dispatch immediately via the host's
 * onSubmit, which calls setParagraphAttrs. The dialog does not
 * gatekeep on OK/Cancel; a single Close button is provided.
 */
import { useEffect, useState } from 'react';
import { useTranslation } from '../../i18n';
const panelStyle = {
    position: 'fixed',
    top: 100,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 380,
    maxHeight: 'calc(100vh - 140px)',
    backgroundColor: 'var(--doc-surface, white)',
    borderRadius: 8,
    boxShadow: '0 8px 28px rgba(0, 0, 0, 0.2)',
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
const bodyStyle = {
    padding: '14px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
};
const rowStyle = {
    display: 'grid',
    gridTemplateColumns: '130px 1fr',
    gap: 10,
    alignItems: 'center',
};
const labelStyle = {
    fontSize: 13,
    color: 'var(--doc-text-on-surface)',
};
const inputStyle = {
    padding: '5px 8px',
    border: '1px solid var(--doc-border)',
    borderRadius: 4,
    fontSize: 13,
    background: 'var(--doc-surface)',
    color: 'var(--doc-text-on-surface)',
    boxSizing: 'border-box',
    width: '100%',
};
const segGroupStyle = {
    display: 'flex',
    gap: 4,
    flexWrap: 'wrap',
};
const segBtnStyle = (active) => ({
    padding: '5px 10px',
    fontSize: 12,
    border: `1px solid ${active ? 'var(--doc-accent, #2563eb)' : 'var(--doc-border)'}`,
    borderRadius: 4,
    background: active ? 'var(--doc-accent-soft, #eff6ff)' : 'var(--doc-surface)',
    color: 'var(--doc-text-on-surface)',
    cursor: 'pointer',
});
const sectionHeadStyle = {
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--doc-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
};
const checkboxLabelStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 13,
    color: 'var(--doc-text-on-surface)',
};
const twipsPerPt = 20;
function twipsToPt(twips) {
    return Math.round((twips / twipsPerPt) * 100) / 100;
}
function ptToTwips(pt) {
    return Math.round(pt * twipsPerPt);
}
const PRESETS = [
    { label: '1.0', twips: 240 },
    { label: '1.15', twips: 276 },
    { label: '1.5', twips: 360 },
    { label: '2.0', twips: 480 },
];
export function CustomSpacingDialog({ isOpen, onClose, initialValue, onChange, }) {
    const { t } = useTranslation();
    const [value, setValue] = useState(initialValue);
    useEffect(() => {
        if (isOpen)
            setValue(initialValue);
    }, [isOpen, initialValue]);
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
    const commit = (next) => {
        setValue(next);
        onChange(next);
    };
    const update = (key, v) => commit(Object.assign(Object.assign({}, value), { [key]: v }));
    return (_jsxs("div", { style: panelStyle, role: "dialog", "aria-label": t('dialogs.customSpacing.title'), "data-testid": "custom-spacing-dialog", children: [_jsxs("div", { style: headerStyle, children: [_jsx("span", { style: titleStyle, children: t('dialogs.customSpacing.title') }), _jsx("button", { type: "button", style: closeBtnStyle, "aria-label": t('common.close'), onClick: onClose, children: "\u00D7" })] }), _jsxs("div", { style: bodyStyle, children: [_jsxs("div", { children: [_jsx("div", { style: sectionHeadStyle, children: t('dialogs.customSpacing.lineSpacing') }), _jsx("div", { style: segGroupStyle, children: PRESETS.map((p) => (_jsx("button", { type: "button", style: segBtnStyle(value.lineSpacingRule === 'auto' && value.lineSpacing === p.twips), onClick: () => commit(Object.assign(Object.assign({}, value), { lineSpacingRule: 'auto', lineSpacing: p.twips })), "data-testid": `spacing-preset-${p.label}`, children: p.label }, p.twips))) }), _jsxs("div", { style: Object.assign(Object.assign({}, rowStyle), { marginTop: 8 }), children: [_jsx("label", { style: labelStyle, htmlFor: "cs-rule", children: t('dialogs.customSpacing.rule') }), _jsx("div", { style: segGroupStyle, children: ['auto', 'atLeast', 'exact'].map((r) => (_jsx("button", { type: "button", style: segBtnStyle(value.lineSpacingRule === r), onClick: () => update('lineSpacingRule', r), children: t(`dialogs.customSpacing.rule_${r}`) }, r))) })] }), _jsxs("div", { style: Object.assign(Object.assign({}, rowStyle), { marginTop: 8 }), children: [_jsx("label", { style: labelStyle, htmlFor: "cs-line-value", children: value.lineSpacingRule === 'auto'
                                            ? t('dialogs.customSpacing.multipleOf')
                                            : t('dialogs.customSpacing.atPt') }), _jsx("input", { id: "cs-line-value", type: "number", step: value.lineSpacingRule === 'auto' ? 0.05 : 1, min: 0, style: inputStyle, value: value.lineSpacingRule === 'auto'
                                            ? Math.round((value.lineSpacing / 240) * 100) / 100 || 1
                                            : twipsToPt(value.lineSpacing), onChange: (e) => {
                                            const n = Number(e.target.value);
                                            update('lineSpacing', value.lineSpacingRule === 'auto' ? Math.round(n * 240) : ptToTwips(n));
                                        }, "data-testid": "spacing-line-value" })] })] }), _jsxs("div", { children: [_jsx("div", { style: sectionHeadStyle, children: t('dialogs.customSpacing.paragraphSpacing') }), _jsxs("div", { style: rowStyle, children: [_jsx("label", { style: labelStyle, htmlFor: "cs-before", children: t('dialogs.customSpacing.beforePt') }), _jsx("input", { id: "cs-before", type: "number", step: 1, min: 0, style: inputStyle, value: twipsToPt(value.spaceBefore), onChange: (e) => update('spaceBefore', ptToTwips(Number(e.target.value))), "data-testid": "spacing-before" })] }), _jsxs("div", { style: Object.assign(Object.assign({}, rowStyle), { marginTop: 6 }), children: [_jsx("label", { style: labelStyle, htmlFor: "cs-after", children: t('dialogs.customSpacing.afterPt') }), _jsx("input", { id: "cs-after", type: "number", step: 1, min: 0, style: inputStyle, value: twipsToPt(value.spaceAfter), onChange: (e) => update('spaceAfter', ptToTwips(Number(e.target.value))), "data-testid": "spacing-after" })] }), _jsxs("label", { style: Object.assign(Object.assign({}, checkboxLabelStyle), { marginTop: 8 }), children: [_jsx("input", { type: "checkbox", checked: value.contextualSpacing, onChange: (e) => update('contextualSpacing', e.target.checked), "data-testid": "spacing-contextual" }), t('dialogs.customSpacing.contextualSpacing')] })] }), _jsxs("div", { children: [_jsx("div", { style: sectionHeadStyle, children: t('dialogs.customSpacing.pagination') }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: 6 }, children: [_jsxs("label", { style: checkboxLabelStyle, children: [_jsx("input", { type: "checkbox", checked: value.widowControl, onChange: (e) => update('widowControl', e.target.checked), "data-testid": "spacing-widow" }), t('dialogs.customSpacing.widowControl')] }), _jsxs("label", { style: checkboxLabelStyle, children: [_jsx("input", { type: "checkbox", checked: value.keepNext, onChange: (e) => update('keepNext', e.target.checked), "data-testid": "spacing-keep-next" }), t('dialogs.customSpacing.keepNext')] }), _jsxs("label", { style: checkboxLabelStyle, children: [_jsx("input", { type: "checkbox", checked: value.keepLines, onChange: (e) => update('keepLines', e.target.checked), "data-testid": "spacing-keep-lines" }), t('dialogs.customSpacing.keepLines')] }), _jsxs("label", { style: checkboxLabelStyle, children: [_jsx("input", { type: "checkbox", checked: value.pageBreakBefore, onChange: (e) => update('pageBreakBefore', e.target.checked), "data-testid": "spacing-page-break-before" }), t('dialogs.customSpacing.pageBreakBefore')] })] })] })] })] }));
}
export default CustomSpacingDialog;
//# sourceMappingURL=CustomSpacingDialog.js.map