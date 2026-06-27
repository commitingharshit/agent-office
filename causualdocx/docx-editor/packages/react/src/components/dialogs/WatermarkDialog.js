import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Insert → Watermark.
 *
 * Text-watermark dialog. Text is required; color, opacity, font-size, and
 * rotation are exposed as knobs with Word-like defaults (gray #808080,
 * 50%, 96px, -45°) so the basic flow stays one input + Apply, but power
 * users can dial in the look without leaving the dialog.
 *
 * Painter side: every field is already plumbed through `renderPage` →
 * the layout-painter overlay; the dialog just stops hardcoding them.
 *
 * Visual language mirrors AboutDialog / PreferencesDialog (overlay + shell
 * with header/body/footer split + primary button) for consistency.
 */
import { useEffect, useState } from 'react';
// Defaults match the painter's own defaults so omitting a knob produces
// the same visual as if the field weren't set at all.
const DEFAULT_COLOR = '808080';
const DEFAULT_OPACITY = 0.5;
const DEFAULT_FONT_SIZE = 96;
const DEFAULT_ROTATION = -45;
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
    maxWidth: 520,
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
    gap: 12,
};
const labelStyle = {
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--doc-text-on-surface, #1f2937)',
};
const inputStyle = {
    padding: '8px 10px',
    fontSize: 14,
    border: '1px solid var(--doc-border, #d1d5db)',
    borderRadius: 4,
    outline: 'none',
    width: '100%',
};
const sliderRowStyle = {
    display: 'grid',
    gridTemplateColumns: '120px 1fr 64px',
    alignItems: 'center',
    gap: 12,
};
const knobsRowStyle = {
    display: 'grid',
    gridTemplateColumns: '120px 1fr',
    alignItems: 'center',
    gap: 12,
};
const valueStyle = {
    fontSize: 12,
    color: 'var(--doc-text-muted, #6b7280)',
    textAlign: 'right',
    fontVariantNumeric: 'tabular-nums',
};
const hintStyle = {
    fontSize: 12,
    color: 'var(--doc-text-muted, #6b7280)',
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
const dangerBtnStyle = Object.assign(Object.assign({}, btnBase), { border: '1px solid var(--doc-border, #d1d5db)', background: 'transparent', color: 'var(--doc-error, #d93025)', marginRight: 'auto' });
const colorInputStyle = {
    width: 36,
    height: 28,
    padding: 0,
    border: '1px solid var(--doc-border, #d1d5db)',
    borderRadius: 4,
    cursor: 'pointer',
    background: 'transparent',
};
/** "808080" ↔ "#808080" — `<input type="color">` insists on the hash. */
function toHash(rgb) {
    return rgb.startsWith('#') ? rgb : `#${rgb}`;
}
function stripHash(hex) {
    return hex.replace(/^#/, '');
}
export function WatermarkDialog({ isOpen, onClose, current, onApply }) {
    var _a, _b, _c, _d, _e;
    const [text, setText] = useState((_a = current === null || current === void 0 ? void 0 : current.text) !== null && _a !== void 0 ? _a : '');
    const [color, setColor] = useState((_b = current === null || current === void 0 ? void 0 : current.color) !== null && _b !== void 0 ? _b : DEFAULT_COLOR);
    const [opacity, setOpacity] = useState((_c = current === null || current === void 0 ? void 0 : current.opacity) !== null && _c !== void 0 ? _c : DEFAULT_OPACITY);
    const [fontSize, setFontSize] = useState((_d = current === null || current === void 0 ? void 0 : current.fontSize) !== null && _d !== void 0 ? _d : DEFAULT_FONT_SIZE);
    const [rotation, setRotation] = useState((_e = current === null || current === void 0 ? void 0 : current.rotation) !== null && _e !== void 0 ? _e : DEFAULT_ROTATION);
    useEffect(() => {
        var _a, _b, _c, _d, _e;
        if (isOpen) {
            setText((_a = current === null || current === void 0 ? void 0 : current.text) !== null && _a !== void 0 ? _a : '');
            setColor((_b = current === null || current === void 0 ? void 0 : current.color) !== null && _b !== void 0 ? _b : DEFAULT_COLOR);
            setOpacity((_c = current === null || current === void 0 ? void 0 : current.opacity) !== null && _c !== void 0 ? _c : DEFAULT_OPACITY);
            setFontSize((_d = current === null || current === void 0 ? void 0 : current.fontSize) !== null && _d !== void 0 ? _d : DEFAULT_FONT_SIZE);
            setRotation((_e = current === null || current === void 0 ? void 0 : current.rotation) !== null && _e !== void 0 ? _e : DEFAULT_ROTATION);
        }
    }, [
        isOpen,
        current === null || current === void 0 ? void 0 : current.text,
        current === null || current === void 0 ? void 0 : current.color,
        current === null || current === void 0 ? void 0 : current.opacity,
        current === null || current === void 0 ? void 0 : current.fontSize,
        current === null || current === void 0 ? void 0 : current.rotation,
    ]);
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
    const trimmed = text.trim();
    const apply = () => {
        const value = { text: trimmed };
        // Only persist knobs that diverge from the painter's defaults; an
        // omitted field stays "use the default" so future default changes
        // don't get pinned by accident.
        if (color !== DEFAULT_COLOR)
            value.color = color;
        if (opacity !== DEFAULT_OPACITY)
            value.opacity = opacity;
        if (fontSize !== DEFAULT_FONT_SIZE)
            value.fontSize = fontSize;
        if (rotation !== DEFAULT_ROTATION)
            value.rotation = rotation;
        onApply(value);
        onClose();
    };
    return (_jsx("div", { className: "ep-dialog-overlay", style: overlayStyle, onMouseDown: (e) => {
            if (e.target === e.currentTarget)
                onClose();
        }, children: _jsxs("div", { className: "ep-dialog-shell", style: dialogStyle, role: "dialog", "aria-label": "Watermark", "data-testid": "watermark-dialog", onMouseDown: (e) => e.stopPropagation(), children: [_jsx("div", { style: headerStyle, children: "Watermark" }), _jsxs("div", { style: bodyStyle, children: [_jsxs("div", { style: knobsRowStyle, children: [_jsx("label", { style: labelStyle, htmlFor: "watermark-text", children: "Text" }), _jsx("input", { id: "watermark-text", type: "text", value: text, onChange: (e) => setText(e.target.value), placeholder: "e.g. DRAFT, CONFIDENTIAL", "data-testid": "watermark-text-input", style: inputStyle, autoFocus: true })] }), _jsxs("div", { style: knobsRowStyle, children: [_jsx("label", { style: labelStyle, htmlFor: "watermark-color", children: "Color" }), _jsx("input", { id: "watermark-color", type: "color", value: toHash(color), onChange: (e) => setColor(stripHash(e.target.value)), "data-testid": "watermark-color-input", style: colorInputStyle, "aria-label": "Watermark color" })] }), _jsxs("div", { style: sliderRowStyle, children: [_jsx("label", { style: labelStyle, htmlFor: "watermark-opacity", children: "Opacity" }), _jsx("input", { id: "watermark-opacity", type: "range", min: 10, max: 100, step: 5, value: Math.round(opacity * 100), onChange: (e) => setOpacity(Number(e.target.value) / 100), "data-testid": "watermark-opacity-input" }), _jsxs("span", { style: valueStyle, children: [Math.round(opacity * 100), "%"] })] }), _jsxs("div", { style: sliderRowStyle, children: [_jsx("label", { style: labelStyle, htmlFor: "watermark-size", children: "Font size" }), _jsx("input", { id: "watermark-size", type: "range", min: 48, max: 144, step: 4, value: fontSize, onChange: (e) => setFontSize(Number(e.target.value)), "data-testid": "watermark-size-input" }), _jsxs("span", { style: valueStyle, children: [fontSize, "px"] })] }), _jsxs("div", { style: sliderRowStyle, children: [_jsx("label", { style: labelStyle, htmlFor: "watermark-rotation", children: "Rotation" }), _jsx("input", { id: "watermark-rotation", type: "range", min: -90, max: 90, step: 5, value: rotation, onChange: (e) => setRotation(Number(e.target.value)), "data-testid": "watermark-rotation-input" }), _jsxs("span", { style: valueStyle, children: [rotation, "\u00B0"] })] }), _jsx("div", { style: hintStyle, children: "The watermark sits behind page content, not clickable or selectable, and shows on every page." })] }), _jsxs("div", { style: footerStyle, children: [current && (_jsx("button", { type: "button", style: dangerBtnStyle, "data-testid": "watermark-remove", onClick: () => {
                                onApply(undefined);
                                onClose();
                            }, children: "Remove" })), _jsx("button", { type: "button", style: secondaryBtnStyle, onClick: onClose, children: "Cancel" }), _jsx("button", { type: "button", style: primaryBtnStyle, "data-testid": "watermark-apply", disabled: trimmed.length === 0, onClick: apply, children: "Apply" })] })] }) }));
}
export default WatermarkDialog;
//# sourceMappingURL=WatermarkDialog.js.map