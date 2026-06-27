import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Text box section of the Format/Properties panel. A text box is edited by
 * clicking inside it (caret model), so its Format chip appears while the caret
 * is in the box; this section gives the box-level properties that aren't text
 * formatting: size (resize by number), fill, and outline.
 *
 * All edits go through setNodeMarkup on the textBox node in the host, so they
 * round-trip and the painter re-renders — no drag overlay needed for resize.
 */
import { useEffect, useState } from 'react';
const GROUP_HEADER = {
    padding: '14px 16px 8px',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: 'var(--doc-text-muted)',
    fontWeight: 600,
};
const ROW = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '2px 16px 6px',
    fontSize: 12,
    color: 'var(--doc-text-muted)',
};
const numInput = {
    width: 64,
    padding: '6px 8px',
    fontSize: 13,
    border: '1px solid var(--doc-border, #dadce0)',
    borderRadius: 6,
    background: 'var(--doc-surface, #fff)',
    color: 'var(--doc-text, #202124)',
};
const swatch = {
    width: 36,
    height: 26,
    padding: 0,
    border: '1px solid var(--doc-border, #dadce0)',
    borderRadius: 6,
    background: 'none',
    cursor: 'pointer',
};
const OUTLINE_PRESETS = [
    { label: 'None', width: null },
    { label: 'Thin', width: 1 },
    { label: 'Medium', width: 2 },
    { label: 'Thick', width: 4 },
];
const presetBtn = (active) => ({
    height: 36,
    padding: '0 12px',
    fontSize: 12.5,
    borderRadius: 8,
    cursor: 'pointer',
    color: active ? 'var(--doc-primary, #1a73e8)' : 'var(--doc-text, #202124)',
    background: active ? 'var(--doc-primary-light, #e8f0fe)' : 'transparent',
    border: active ? '1px solid var(--doc-primary, #1a73e8)' : '1px solid var(--doc-border, #dadce0)',
});
export function TextBoxPropertiesSection({ width, height, fillColor, outlineWidth, outlineColor, posOffsetH, posOffsetV, onSetSize, onSetFill, onSetOutline, onSetPosition, }) {
    const [w, setW] = useState(width != null ? String(Math.round(width)) : '');
    const [h, setH] = useState(height != null ? String(Math.round(height)) : '');
    const [fill, setFill] = useState(fillColor || '#ffffff');
    const [stroke, setStroke] = useState(outlineColor || '#000000');
    const [px, setPx] = useState(posOffsetH != null ? String(Math.round(posOffsetH)) : '');
    const [py, setPy] = useState(posOffsetV != null ? String(Math.round(posOffsetV)) : '');
    useEffect(() => setW(width != null ? String(Math.round(width)) : ''), [width]);
    useEffect(() => setH(height != null ? String(Math.round(height)) : ''), [height]);
    useEffect(() => setFill(fillColor || '#ffffff'), [fillColor]);
    useEffect(() => setStroke(outlineColor || '#000000'), [outlineColor]);
    useEffect(() => setPx(posOffsetH != null ? String(Math.round(posOffsetH)) : ''), [posOffsetH]);
    useEffect(() => setPy(posOffsetV != null ? String(Math.round(posOffsetV)) : ''), [posOffsetV]);
    const commitSize = () => {
        const nw = Number(w);
        if (!Number.isFinite(nw) || nw <= 0)
            return;
        const nh = h.trim() === '' ? null : Number(h);
        onSetSize(nw, Number.isFinite(nh) ? nh : null);
    };
    const onKey = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            commitSize();
        }
    };
    const commitPosition = () => {
        if (!onSetPosition)
            return;
        const nx = Number(px);
        const ny = Number(py);
        if (!Number.isFinite(nx) || !Number.isFinite(ny))
            return;
        onSetPosition(Math.max(0, Math.round(nx)), Math.max(0, Math.round(ny)));
    };
    const onPosKey = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            commitPosition();
        }
    };
    return (_jsxs("div", { "data-testid": "properties-textbox-section", children: [_jsx("div", { style: GROUP_HEADER, children: "Size" }), _jsxs("div", { style: ROW, "data-testid": "properties-textbox-size", children: [_jsxs("label", { style: { color: 'inherit' }, children: ["W", _jsx("input", { style: Object.assign(Object.assign({}, numInput), { marginLeft: 6 }), type: "number", min: 24, max: 2000, value: w, "data-testid": "properties-textbox-width", onChange: (e) => setW(e.target.value), onBlur: commitSize, onKeyDown: onKey })] }), _jsxs("label", { style: { color: 'inherit' }, children: ["H", _jsx("input", { style: Object.assign(Object.assign({}, numInput), { marginLeft: 6 }), type: "number", min: 16, max: 2000, value: h, placeholder: "auto", "data-testid": "properties-textbox-height", onChange: (e) => setH(e.target.value), onBlur: commitSize, onKeyDown: onKey })] })] }), onSetPosition && (_jsxs(_Fragment, { children: [_jsx("div", { style: GROUP_HEADER, children: "Position" }), _jsxs("div", { style: ROW, "data-testid": "properties-textbox-position", children: [_jsxs("label", { style: { color: 'inherit' }, children: ["X", _jsx("input", { style: Object.assign(Object.assign({}, numInput), { marginLeft: 6 }), type: "number", min: 0, max: 2000, value: px, placeholder: "auto", "data-testid": "properties-textbox-pos-x", onChange: (e) => setPx(e.target.value), onBlur: commitPosition, onKeyDown: onPosKey })] }), _jsxs("label", { style: { color: 'inherit' }, children: ["Y", _jsx("input", { style: Object.assign(Object.assign({}, numInput), { marginLeft: 6 }), type: "number", min: 0, max: 2000, value: py, placeholder: "auto", "data-testid": "properties-textbox-pos-y", onChange: (e) => setPy(e.target.value), onBlur: commitPosition, onKeyDown: onPosKey })] })] })] })), _jsx("div", { style: GROUP_HEADER, children: "Fill" }), _jsxs("div", { style: ROW, children: [_jsx("input", { type: "color", value: fill, "data-testid": "properties-textbox-fill", style: swatch, onChange: (e) => {
                            setFill(e.target.value);
                            onSetFill(e.target.value);
                        } }), _jsx("button", { type: "button", style: Object.assign(Object.assign({}, presetBtn(false)), { height: 26 }), "data-testid": "properties-textbox-fill-none", onMouseDown: (e) => {
                            e.preventDefault();
                            onSetFill(null);
                        }, children: "No fill" })] }), _jsx("div", { style: GROUP_HEADER, children: "Outline" }), _jsx("div", { style: { display: 'flex', flexWrap: 'wrap', gap: 6, padding: '0 16px 6px' }, role: "group", "aria-label": "Outline width", children: OUTLINE_PRESETS.map((o) => {
                    const active = (outlineWidth !== null && outlineWidth !== void 0 ? outlineWidth : null) === o.width;
                    return (_jsx("button", { type: "button", style: presetBtn(active), "data-testid": `properties-textbox-outline-${o.label.toLowerCase()}`, onMouseDown: (e) => {
                            e.preventDefault();
                            onSetOutline(o.width, o.width == null ? null : stroke);
                        }, children: o.label }, o.label));
                }) }), _jsxs("label", { style: ROW, children: ["Color", _jsx("input", { type: "color", value: stroke, "data-testid": "properties-textbox-outline-color", style: Object.assign(Object.assign({}, swatch), { marginLeft: 8 }), onChange: (e) => {
                            setStroke(e.target.value);
                            if (outlineWidth)
                                onSetOutline(outlineWidth, e.target.value);
                        } })] })] }));
}
//# sourceMappingURL=TextBoxPropertiesSection.js.map