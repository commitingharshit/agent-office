import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Borders and Shading Panel (Phase 1.5-PIVOT).
 *
 * Audit (Google Docs UX bar) flagged the previous tabbed modal as the
 * wrong shape. This is a right-anchored floating panel:
 *   - no darkening overlay (document stays visible behind it)
 *   - applies live on every change (no OK/Cancel)
 *   - click an edge of the SVG preview to toggle that side
 *   - inline swatch grid + hex input for colors, no native <input type=color>
 *   - inline icon row for line styles and widths, no native <select>
 *
 * The exported symbol stays `BordersAndShadingDialog` for callsite
 * stability; internally it's now a panel. Renaming and folding into
 * UnifiedSidebar is follow-up.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from '../../i18n';
const STANDARD_COLORS = [
    '000000',
    '434343',
    '666666',
    '999999',
    'B7B7B7',
    'CCCCCC',
    'D9D9D9',
    'EFEFEF',
    'F3F3F3',
    'FFFFFF',
    '980000',
    'FF0000',
    'FF9900',
    'FFFF00',
    '00FF00',
    '00FFFF',
    '4A86E8',
    '0000FF',
    '9900FF',
    'FF00FF',
];
const LINE_STYLES = [
    { value: 'single', label: 'Single' },
    { value: 'double', label: 'Double' },
    { value: 'thick', label: 'Thick' },
    { value: 'dotted', dasharray: '2 2', label: 'Dotted' },
    { value: 'dashed', dasharray: '5 3', label: 'Dashed' },
    { value: 'triple', label: 'Triple' },
];
const LINE_WIDTHS = [
    { size: 2, label: '¼ pt', thickness: 0.25 },
    { size: 4, label: '½ pt', thickness: 0.5 },
    { size: 8, label: '1 pt', thickness: 1 },
    { size: 12, label: '1½ pt', thickness: 1.5 },
    { size: 16, label: '2 pt', thickness: 2 },
    { size: 24, label: '3 pt', thickness: 3 },
];
const SHADING_PATTERNS = [
    { value: 'clear', label: 'Clear' },
    { value: 'solid', label: 'Solid' },
    { value: 'pct10', label: '10%' },
    { value: 'pct15', label: '15%' },
    { value: 'pct20', label: '20%' },
    { value: 'pct25', label: '25%' },
    { value: 'pct30', label: '30%' },
    { value: 'pct40', label: '40%' },
    { value: 'pct50', label: '50%' },
];
const panelStyle = {
    position: 'fixed',
    top: 72,
    right: 24,
    width: 340,
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
const bodyStyle = {
    padding: '12px 14px 14px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
};
const sectionHeadStyle = {
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--doc-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
};
const subLabelStyle = {
    fontSize: 12,
    color: 'var(--doc-text-on-surface)',
    marginBottom: 4,
};
const segGroupStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 4,
};
const segBtnStyle = (active) => ({
    padding: '6px 8px',
    border: `1px solid ${active ? 'var(--doc-accent, #2563eb)' : 'var(--doc-border)'}`,
    borderRadius: 4,
    background: active ? 'var(--doc-accent-soft, #eff6ff)' : 'var(--doc-surface)',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    minHeight: 28,
});
const swatchGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(10, 1fr)',
    gap: 3,
    marginTop: 4,
};
const swatchStyle = (selected) => ({
    width: '100%',
    aspectRatio: '1 / 1',
    border: selected ? '2px solid var(--doc-accent, #2563eb)' : '1px solid var(--doc-border)',
    borderRadius: 2,
    cursor: 'pointer',
    padding: 0,
});
const hexInputRowStyle = {
    display: 'flex',
    gap: 6,
    marginTop: 6,
    alignItems: 'center',
};
const hexInputStyle = {
    flex: 1,
    padding: '4px 8px',
    fontSize: 12,
    fontFamily: 'monospace',
    border: '1px solid var(--doc-border)',
    borderRadius: 4,
    background: 'var(--doc-surface)',
    color: 'var(--doc-text-on-surface)',
};
function normaliseHex(s) {
    const trimmed = s.trim().replace(/^#/, '');
    return /^[0-9a-fA-F]{6}$/.test(trimmed) ? trimmed.toUpperCase() : '';
}
function makeBorder(style, color, size) {
    return { style, colorHex: color, size };
}
// SVG sample of a line at the given style + thickness.
function LineSample({ style, thickness = 2 }) {
    const sample = LINE_STYLES.find((s) => s.value === style);
    const w = 28;
    const h = 14;
    if (style === 'double') {
        return (_jsxs("svg", { width: w, height: h, children: [_jsx("line", { x1: 2, y1: h / 2 - 2, x2: w - 2, y2: h / 2 - 2, stroke: "currentColor", strokeWidth: 1 }), _jsx("line", { x1: 2, y1: h / 2 + 2, x2: w - 2, y2: h / 2 + 2, stroke: "currentColor", strokeWidth: 1 })] }));
    }
    if (style === 'triple') {
        return (_jsxs("svg", { width: w, height: h, children: [_jsx("line", { x1: 2, y1: h / 2 - 3, x2: w - 2, y2: h / 2 - 3, stroke: "currentColor", strokeWidth: 1 }), _jsx("line", { x1: 2, y1: h / 2, x2: w - 2, y2: h / 2, stroke: "currentColor", strokeWidth: 1 }), _jsx("line", { x1: 2, y1: h / 2 + 3, x2: w - 2, y2: h / 2 + 3, stroke: "currentColor", strokeWidth: 1 })] }));
    }
    return (_jsx("svg", { width: w, height: h, children: _jsx("line", { x1: 2, y1: h / 2, x2: w - 2, y2: h / 2, stroke: "currentColor", strokeWidth: style === 'thick' ? Math.max(thickness, 3) : thickness, strokeDasharray: sample === null || sample === void 0 ? void 0 : sample.dasharray }) }));
}
// Click-to-toggle SVG preview of a paragraph with the four border sides.
function BorderEdgePreview({ borders, onToggleSide, }) {
    const w = 220;
    const h = 90;
    const pad = 10;
    const sideLine = (side, x1, y1, x2, y2) => {
        const active = !!borders[side];
        return (_jsxs("g", { onClick: () => onToggleSide(side), style: { cursor: 'pointer' }, "data-testid": `borders-preview-${side}`, children: [_jsx("line", { x1: x1, y1: y1, x2: x2, y2: y2, stroke: "transparent", strokeWidth: 12 }), _jsx("line", { x1: x1, y1: y1, x2: x2, y2: y2, stroke: active ? 'var(--doc-accent, #2563eb)' : 'var(--doc-border)', strokeWidth: active ? 2.5 : 1, strokeDasharray: active ? undefined : '3 3' })] }, side));
    };
    return (_jsxs("svg", { width: w, height: h, style: {
            background: 'var(--doc-surface-muted, #fafafa)',
            borderRadius: 4,
        }, children: [_jsx("rect", { x: pad, y: pad, width: w - pad * 2, height: h - pad * 2, fill: "white", stroke: "none" }), _jsx("text", { x: w / 2, y: h / 2 + 4, textAnchor: "middle", fontSize: 11, fill: "var(--doc-text-muted)", children: "Paragraph" }), sideLine('top', pad, pad, w - pad, pad), sideLine('bottom', pad, h - pad, w - pad, h - pad), sideLine('left', pad, pad, pad, h - pad), sideLine('right', w - pad, pad, w - pad, h - pad)] }));
}
// Reusable swatch grid + hex input.
function ColorField({ label, value, onChange, allowNone = false, }) {
    const [hexDraft, setHexDraft] = useState(value);
    useEffect(() => {
        setHexDraft(value);
    }, [value]);
    return (_jsxs("div", { children: [_jsx("div", { style: subLabelStyle, children: label }), _jsxs("div", { style: swatchGridStyle, children: [allowNone && (_jsx("button", { type: "button", style: Object.assign(Object.assign({}, swatchStyle(value === '')), { background: 'linear-gradient(to top right, transparent calc(50% - 1px), red 50%, transparent calc(50% + 1px))' }), "aria-label": "No color", title: "No color", onClick: () => onChange('') })), STANDARD_COLORS.map((hex) => (_jsx("button", { type: "button", style: Object.assign(Object.assign({}, swatchStyle(value.toUpperCase() === hex)), { background: '#' + hex }), "aria-label": '#' + hex, title: '#' + hex, onClick: () => onChange(hex) }, hex)))] }), _jsxs("div", { style: hexInputRowStyle, children: [_jsx("span", { style: { fontSize: 12, color: 'var(--doc-text-muted)' }, children: "#" }), _jsx("input", { type: "text", value: hexDraft, maxLength: 7, placeholder: "000000", onChange: (e) => setHexDraft(e.target.value), onBlur: () => {
                            const h = normaliseHex(hexDraft);
                            if (h)
                                onChange(h);
                            else
                                setHexDraft(value);
                        }, onKeyDown: (e) => {
                            if (e.key === 'Enter') {
                                const h = normaliseHex(hexDraft);
                                if (h)
                                    onChange(h);
                                else
                                    setHexDraft(value);
                            }
                        }, style: hexInputStyle, "aria-label": label + ' hex' })] })] }));
}
export function BordersAndShadingDialog({ isOpen, onClose, initialValue, onSubmit, }) {
    const { t } = useTranslation();
    const panelRef = useRef(null);
    const [value, setValue] = useState(initialValue);
    // Pen state (the style/color/width used when the user toggles a side
    // ON). Pre-seeded from the first existing side on open.
    const [penStyle, setPenStyle] = useState('single');
    const [penColor, setPenColor] = useState('000000');
    const [penSize, setPenSize] = useState(4);
    useEffect(() => {
        var _a, _b, _c;
        if (!isOpen)
            return;
        setValue(initialValue);
        const sample = (_c = (_b = (_a = initialValue.borders.top) !== null && _a !== void 0 ? _a : initialValue.borders.bottom) !== null && _b !== void 0 ? _b : initialValue.borders.left) !== null && _c !== void 0 ? _c : initialValue.borders.right;
        if (sample) {
            setPenStyle(sample.style === 'none' ? 'single' : sample.style);
            setPenColor(sample.colorHex || '000000');
            setPenSize(sample.size || 4);
        }
        else {
            setPenStyle('single');
            setPenColor('000000');
            setPenSize(4);
        }
    }, [isOpen, initialValue]);
    // Apply-on-change: every value mutation dispatches.
    const commit = (next) => {
        setValue(next);
        onSubmit(next);
    };
    useEffect(() => {
        if (!isOpen)
            return;
        const onDown = (e) => {
            const target = e.target;
            if (target && panelRef.current && !panelRef.current.contains(target))
                onClose();
        };
        const onKey = (e) => {
            if (e.key === 'Escape')
                onClose();
        };
        const id = requestAnimationFrame(() => document.addEventListener('mousedown', onDown));
        document.addEventListener('keydown', onKey);
        return () => {
            cancelAnimationFrame(id);
            document.removeEventListener('mousedown', onDown);
            document.removeEventListener('keydown', onKey);
        };
    }, [isOpen, onClose]);
    const toggleSide = (side) => {
        const next = Object.assign({}, value.borders);
        if (next[side])
            delete next[side];
        else
            next[side] = makeBorder(penStyle, penColor, penSize);
        commit(Object.assign(Object.assign({}, value), { borders: next }));
    };
    const applyAllSides = () => {
        const b = makeBorder(penStyle, penColor, penSize);
        commit(Object.assign(Object.assign({}, value), { borders: { top: b, bottom: b, left: b, right: b } }));
    };
    const clearAllSides = () => {
        commit(Object.assign(Object.assign({}, value), { borders: {} }));
    };
    // Re-paint existing sides with the latest pen attrs whenever the pen changes.
    useEffect(() => {
        if (!isOpen)
            return;
        const sides = Object.keys(value.borders);
        if (sides.length === 0)
            return;
        const same = sides.every((s) => {
            var _a, _b, _c;
            return ((_a = value.borders[s]) === null || _a === void 0 ? void 0 : _a.style) === penStyle &&
                ((_b = value.borders[s]) === null || _b === void 0 ? void 0 : _b.colorHex) === penColor &&
                ((_c = value.borders[s]) === null || _c === void 0 ? void 0 : _c.size) === penSize;
        });
        if (same)
            return;
        const next = {};
        for (const s of sides)
            next[s] = makeBorder(penStyle, penColor, penSize);
        commit(Object.assign(Object.assign({}, value), { borders: next }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [penStyle, penColor, penSize]);
    const previewBorders = useMemo(() => value.borders, [value.borders]);
    if (!isOpen)
        return null;
    return (_jsxs("div", { ref: panelRef, style: panelStyle, role: "dialog", "aria-label": t('dialogs.bordersShading.title'), "data-testid": "borders-shading-panel", children: [_jsxs("div", { style: headerStyle, children: [_jsx("span", { style: titleStyle, children: t('dialogs.bordersShading.title') }), _jsx("button", { type: "button", style: closeBtnStyle, "aria-label": t('common.close'), onClick: onClose, children: "\u00D7" })] }), _jsxs("div", { style: bodyStyle, children: [_jsxs("div", { children: [_jsx("div", { style: sectionHeadStyle, children: t('dialogs.bordersShading.tabBorders') }), _jsx(BorderEdgePreview, { borders: previewBorders, onToggleSide: toggleSide }), _jsxs("div", { style: { display: 'flex', gap: 6, marginTop: 8 }, children: [_jsx("button", { type: "button", style: segBtnStyle(false), onClick: applyAllSides, "data-testid": "borders-preset-all", children: t('dialogs.bordersShading.presetBox') }), _jsx("button", { type: "button", style: segBtnStyle(false), onClick: clearAllSides, "data-testid": "borders-preset-none", children: t('dialogs.bordersShading.presetNone') })] }), _jsxs("div", { style: { marginTop: 12 }, children: [_jsx("div", { style: subLabelStyle, children: t('dialogs.bordersShading.lineStyle') }), _jsx("div", { style: segGroupStyle, children: LINE_STYLES.map((s) => (_jsx("button", { type: "button", style: Object.assign(Object.assign({}, segBtnStyle(penStyle === s.value)), { color: 'var(--doc-text-on-surface)' }), onClick: () => setPenStyle(s.value), "aria-label": s.label, title: s.label, "data-testid": `borders-style-${s.value}`, children: _jsx(LineSample, { style: s.value }) }, s.value))) })] }), _jsxs("div", { style: { marginTop: 12 }, children: [_jsx("div", { style: subLabelStyle, children: t('dialogs.bordersShading.widthPt') }), _jsx("div", { style: segGroupStyle, children: LINE_WIDTHS.map((w) => (_jsx("button", { type: "button", style: Object.assign(Object.assign({}, segBtnStyle(penSize === w.size)), { color: 'var(--doc-text-on-surface)' }), onClick: () => setPenSize(w.size), "aria-label": w.label, title: w.label, "data-testid": `borders-width-${w.size}`, children: _jsx(LineSample, { style: "single", thickness: w.thickness }) }, w.size))) })] }), _jsx("div", { style: { marginTop: 12 }, children: _jsx(ColorField, { label: t('dialogs.bordersShading.color'), value: penColor, onChange: setPenColor }) })] }), _jsxs("div", { style: { borderTop: '1px solid var(--doc-border-light, #f0eee9)', paddingTop: 12 }, children: [_jsx("div", { style: sectionHeadStyle, children: t('dialogs.bordersShading.tabShading') }), _jsx(ColorField, { label: t('dialogs.bordersShading.fillColor'), value: value.shading.fillHex, onChange: (hex) => commit(Object.assign(Object.assign({}, value), { shading: Object.assign(Object.assign({}, value.shading), { fillHex: hex }) })), allowNone: true }), _jsxs("div", { style: { marginTop: 10 }, children: [_jsx("div", { style: subLabelStyle, children: t('dialogs.bordersShading.pattern') }), _jsx("div", { style: segGroupStyle, children: SHADING_PATTERNS.map((p) => (_jsx("button", { type: "button", style: Object.assign(Object.assign({}, segBtnStyle(value.shading.pattern === p.value)), { fontSize: 11 }), onClick: () => commit(Object.assign(Object.assign({}, value), { shading: Object.assign(Object.assign({}, value.shading), { pattern: p.value }) })), "data-testid": `shading-pattern-${p.value}`, children: p.label }, p.value))) })] })] })] })] }));
}
export default BordersAndShadingDialog;
//# sourceMappingURL=BordersAndShadingDialog.js.map