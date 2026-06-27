import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useCallback, useMemo, useEffect } from 'react';
import { generateThemeTintShadeMatrix, resolveColor, resolveColorToHex, resolveHighlightColor, } from '@eigenpal/docx-core/utils';
import { useFixedDropdown } from './useFixedDropdown';
import { MaterialSymbol } from './MaterialSymbol';
import { useTranslation } from '../../i18n';
// ============================================================================
// CONSTANTS
// ============================================================================
const STANDARD_COLORS = [
    { name: 'Dark Red', nameKey: 'colorPicker.colors.darkRed', hex: 'C00000' },
    { name: 'Red', nameKey: 'colorPicker.colors.red', hex: 'FF0000' },
    { name: 'Orange', nameKey: 'colorPicker.colors.orange', hex: 'FFC000' },
    { name: 'Yellow', nameKey: 'colorPicker.colors.yellow', hex: 'FFFF00' },
    { name: 'Light Green', nameKey: 'colorPicker.colors.lightGreen', hex: '92D050' },
    { name: 'Green', nameKey: 'colorPicker.colors.green', hex: '00B050' },
    { name: 'Light Blue', nameKey: 'colorPicker.colors.lightBlue', hex: '00B0F0' },
    { name: 'Blue', nameKey: 'colorPicker.colors.blue', hex: '0070C0' },
    { name: 'Dark Blue', nameKey: 'colorPicker.colors.darkBlue', hex: '002060' },
    { name: 'Purple', nameKey: 'colorPicker.colors.purple', hex: '7030A0' },
];
const CELL_SIZE = 18;
const GAP = 2;
// ============================================================================
// STYLES
// ============================================================================
const S_CONTAINER = {
    position: 'relative',
    display: 'inline-block',
};
const S_BUTTON = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '32px',
    padding: '2px 6px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    transition: 'background-color var(--doc-anim-fast)',
    color: 'var(--doc-text-muted)',
};
const S_DROPDOWN = {
    padding: '10px',
    backgroundColor: 'var(--doc-surface, white)',
    border: '1px solid #d0d0d0',
    borderRadius: '6px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
    width: 'auto',
};
const S_SECTION_LABEL = {
    fontSize: '11px',
    color: '#666',
    marginBottom: '4px',
    fontWeight: 500,
};
const S_DIVIDER = {
    height: '1px',
    backgroundColor: '#e0e0e0',
    margin: '8px 0',
};
const S_GRID = {
    display: 'grid',
    gap: `${GAP}px`,
};
const S_CELL = {
    width: `${CELL_SIZE}px`,
    height: `${CELL_SIZE}px`,
    border: '1px solid #c0c0c0',
    borderRadius: '2px',
    cursor: 'pointer',
    padding: 0,
    transition: 'transform var(--doc-anim-fast), border-color var(--doc-anim-fast)',
};
const S_CELL_HOVER = Object.assign(Object.assign({}, S_CELL), { transform: 'scale(1.15)', borderColor: '#333', zIndex: 1 });
const S_CELL_SELECTED = Object.assign(Object.assign({}, S_CELL), { borderWidth: '2px', borderColor: '#0066cc', boxShadow: '0 0 0 1px #0066cc' });
const S_AUTO_BUTTON = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
    padding: '5px 8px',
    border: '1px solid #d0d0d0',
    borderRadius: '4px',
    backgroundColor: 'var(--doc-surface, white)',
    cursor: 'pointer',
    fontSize: '12px',
    color: '#333',
};
const S_CUSTOM_ROW = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
};
const S_HEX_INPUT = {
    width: '70px',
    height: '24px',
    padding: '2px 6px',
    border: '1px solid var(--doc-border, #ccc)',
    borderRadius: '3px',
    fontSize: '12px',
};
const S_APPLY_BTN = {
    height: '24px',
    padding: '0 10px',
    border: '1px solid var(--doc-border, #ccc)',
    borderRadius: '3px',
    backgroundColor: 'var(--doc-bg-subtle, #f5f5f5)',
    color: 'var(--doc-text-on-surface)',
    fontSize: '12px',
    cursor: 'pointer',
};
const S_COLOR_BAR = {
    // Tighter, more polished indicator strip beneath the icon. The old
    // 16×4 px with marginTop -2 made the bar overlap the icon by 2 px
    // and look chunky next to the rest of the toolbar (UX-EDITOR-3:
    // user feedback "highlight button and all CSS is messed up"). 18×3
    // sits cleanly below the 18 px icon with a 1 px breathing gap.
    width: '18px',
    height: '3px',
    borderRadius: '1px',
    marginTop: '1px',
};
// ── Split-button styles ─────────────────────────────────────────────────────
// Two distinct buttons sitting side by side, like in MS Word. Each half has
// full rounded corners and its own hover state; a 2px gap between them sells
// the "two separate buttons" affordance without a visible divider line.
const S_SPLIT_GROUP = {
    display: 'inline-flex',
    alignItems: 'stretch',
    height: '32px',
    gap: '2px',
};
const S_SPLIT_APPLY_BTN = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
    width: '28px',
    padding: '2px 4px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    transition: 'background-color var(--doc-anim-fast)',
    color: 'var(--doc-text-muted)',
};
const S_SPLIT_ARROW_BTN = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '18px',
    padding: 0,
    border: 'none',
    borderRadius: '4px',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    transition: 'background-color var(--doc-anim-fast)',
    color: 'var(--doc-text-muted)',
};
// ============================================================================
// HELPERS
// ============================================================================
function resolveCurrentColor(value, mode, theme) {
    if (!value) {
        return mode === 'text' || mode === 'border' ? '#000000' : 'transparent';
    }
    if (typeof value === 'string') {
        if (mode === 'highlight') {
            // Try OOXML named color first, then treat as hex
            const resolved = resolveHighlightColor(value);
            if (resolved)
                return resolved;
            if (value === 'none')
                return 'transparent';
            return value.startsWith('#') ? value : `#${value}`;
        }
        return value.startsWith('#') ? value : `#${value}`;
    }
    return resolveColor(value, theme);
}
/** Returns true if the hex color (e.g. "#F8FAFC") is very light and needs a border to be visible. */
function isLightColor(hex) {
    const h = hex.replace(/^#/, '');
    if (h.length !== 6)
        return false;
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    // Perceived luminance — threshold at ~90% white
    return (r * 299 + g * 587 + b * 114) / 1000 > 230;
}
function isSelectedCell(value, cellHex, theme) {
    if (!value)
        return false;
    const resolved = typeof value === 'string'
        ? value.replace(/^#/, '').toUpperCase()
        : resolveColorToHex(value, theme);
    return resolved === cellHex.toUpperCase();
}
// ============================================================================
// SUBCOMPONENTS
// ============================================================================
function ThemeColorMatrix({ matrix, selectedColor, theme, onSelect, }) {
    const [hovered, setHovered] = useState(null);
    return (_jsx("div", { style: Object.assign(Object.assign({}, S_GRID), { gridTemplateColumns: `repeat(10, ${CELL_SIZE}px)` }), children: matrix.flatMap((row, ri) => row.map((cell, ci) => {
            const key = `${ri}-${ci}`;
            const isHov = hovered === key;
            const isSel = isSelectedCell(selectedColor, cell.hex, theme);
            return (_jsx("button", { type: "button", style: Object.assign(Object.assign({}, (isSel ? S_CELL_SELECTED : isHov ? S_CELL_HOVER : S_CELL)), { backgroundColor: `#${cell.hex}` }), title: cell.label, "aria-label": cell.label, "aria-selected": isSel, onClick: () => onSelect(cell), onMouseDown: (e) => e.preventDefault(), onMouseEnter: () => setHovered(key), onMouseLeave: () => setHovered(null) }, key));
        })) }));
}
function StandardColorRow({ selectedColor, theme, onSelect, }) {
    const [hovered, setHovered] = useState(null);
    const { t } = useTranslation();
    return (_jsx("div", { style: Object.assign(Object.assign({}, S_GRID), { gridTemplateColumns: `repeat(10, ${CELL_SIZE}px)` }), children: STANDARD_COLORS.map((c, i) => {
            const isHov = hovered === i;
            const isSel = isSelectedCell(selectedColor, c.hex, theme);
            const displayName = t(c.nameKey);
            return (_jsx("button", { type: "button", style: Object.assign(Object.assign({}, (isSel ? S_CELL_SELECTED : isHov ? S_CELL_HOVER : S_CELL)), { backgroundColor: `#${c.hex}` }), title: displayName, "aria-label": displayName, "aria-selected": isSel, onClick: () => onSelect(c.hex), onMouseDown: (e) => e.preventDefault(), onMouseEnter: () => setHovered(i), onMouseLeave: () => setHovered(null) }, c.hex));
        }) }));
}
// ============================================================================
// MAIN COMPONENT
// ============================================================================
export function ColorPicker({ mode, value, onChange, theme, disabled = false, className, style, title, icon: iconOverride, autoLabel, splitButton = true, defaultColor, }) {
    var _a;
    const [isOpen, setIsOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [applyHovered, setApplyHovered] = useState(false);
    const [arrowHovered, setArrowHovered] = useState(false);
    const [customHex, setCustomHex] = useState('');
    // Word-style: a sensible default until the user picks something — red for
    // font color, yellow for highlight, black for border. The swatch still
    // mirrors the selection's actual color when one is set; this is just the
    // fallback for uncolored selections.
    const [pickedColor, setPickedColor] = useState(() => defaultColor !== null && defaultColor !== void 0 ? defaultColor : (mode === 'highlight' ? 'FFFF00' : mode === 'border' ? { rgb: '000000' } : { rgb: 'FF0000' }));
    const { t } = useTranslation();
    // Sync custom hex input with the current value
    useEffect(() => {
        const hex = resolveCurrentColor(value, mode, theme).replace(/^#/, '');
        if (/^[0-9A-Fa-f]{6}$/.test(hex)) {
            setCustomHex(hex.toUpperCase());
        }
    }, [value, mode, theme]);
    const onClose = useCallback(() => setIsOpen(false), []);
    const { containerRef, dropdownRef, dropdownStyle } = useFixedDropdown({
        isOpen,
        onClose,
    });
    const colorScheme = (_a = theme === null || theme === void 0 ? void 0 : theme.colorScheme) !== null && _a !== void 0 ? _a : null;
    const matrix = useMemo(() => generateThemeTintShadeMatrix(colorScheme), [colorScheme]);
    const resolvedColor = useMemo(() => resolveCurrentColor(value, mode, theme), [value, mode, theme]);
    // The swatch shows the last picked color (or the mode default if nothing
    // has been picked yet). It does NOT follow the cursor / selection — Word's
    // behavior is: pick once, the swatch stays put while you move around and
    // click apply on multiple selections. The dropdown's "selected cell"
    // indicator separately reflects the selection's actual color (driven by
    // `value`), so the user can still see what's currently applied.
    const swatchColor = useMemo(() => resolveCurrentColor(pickedColor, mode, theme), [pickedColor, mode, theme]);
    const toggleDropdown = useCallback(() => {
        if (!disabled)
            setIsOpen((prev) => !prev);
    }, [disabled]);
    // --- Handlers ---
    const handleThemeCellSelect = useCallback((cell) => {
        let picked;
        if (mode === 'highlight') {
            picked = cell.hex;
        }
        else {
            const colorValue = {
                themeColor: cell.themeSlot,
                rgb: cell.hex,
            };
            if (cell.tint)
                colorValue.themeTint = cell.tint;
            if (cell.shade)
                colorValue.themeShade = cell.shade;
            picked = colorValue;
        }
        setPickedColor(picked);
        onChange === null || onChange === void 0 ? void 0 : onChange(picked);
        setIsOpen(false);
    }, [mode, onChange]);
    const handleStandardColorSelect = useCallback((hex) => {
        const picked = mode === 'highlight' ? hex : { rgb: hex };
        setPickedColor(picked);
        onChange === null || onChange === void 0 ? void 0 : onChange(picked);
        setIsOpen(false);
    }, [mode, onChange]);
    // Auto / "no color" intentionally does NOT update pickedColor — clearing
    // a color isn't a "color choice" the apply button should remember.
    const handleAutomatic = useCallback(() => {
        if (mode === 'highlight') {
            onChange === null || onChange === void 0 ? void 0 : onChange('none');
        }
        else {
            onChange === null || onChange === void 0 ? void 0 : onChange({ auto: true });
        }
        setIsOpen(false);
    }, [mode, onChange]);
    const handleCustomApply = useCallback(() => {
        const hex = customHex.replace(/^#/, '').toUpperCase();
        if (/^[0-9A-F]{6}$/i.test(hex)) {
            const picked = mode === 'highlight' ? hex : { rgb: hex };
            setPickedColor(picked);
            onChange === null || onChange === void 0 ? void 0 : onChange(picked);
            setIsOpen(false);
            setCustomHex('');
        }
    }, [mode, customHex, onChange]);
    // Click on the "apply" half — apply the last picked color (or seeded default).
    const handleApplyLastColor = useCallback(() => {
        if (disabled)
            return;
        onChange === null || onChange === void 0 ? void 0 : onChange(pickedColor);
    }, [disabled, pickedColor, onChange]);
    // --- Button style ---
    const buttonStyle = Object.assign(Object.assign({}, S_BUTTON), (disabled
        ? { cursor: 'default', opacity: 0.38 }
        : isOpen
            ? { backgroundColor: 'var(--doc-primary-light)', color: 'var(--doc-primary)' }
            : isHovered
                ? { backgroundColor: 'var(--doc-bg-hover)' }
                : {}));
    const defaultTitle = mode === 'text'
        ? t('formattingBar.fontColor')
        : mode === 'highlight'
            ? t('formattingBar.highlightColor')
            : t('table.borderColor');
    const iconName = iconOverride !== null && iconOverride !== void 0 ? iconOverride : (mode === 'text'
        ? 'format_color_text'
        : mode === 'highlight'
            ? 'ink_highlighter'
            : 'border_color');
    return (_jsxs("div", { ref: containerRef, className: `docx-color-picker ${className || ''}`, style: Object.assign(Object.assign({}, S_CONTAINER), style), children: [splitButton ? (_jsxs("div", { className: "docx-color-picker-split", style: Object.assign(Object.assign({}, S_SPLIT_GROUP), (disabled ? { opacity: 0.38, cursor: 'default' } : null)), children: [_jsxs("button", { type: "button", className: "docx-color-picker-apply", style: Object.assign(Object.assign({}, S_SPLIT_APPLY_BTN), (disabled
                            ? { cursor: 'default' }
                            : applyHovered
                                ? { backgroundColor: 'var(--doc-bg-hover)' }
                                : null)), onClick: handleApplyLastColor, onMouseDown: (e) => e.preventDefault(), onMouseEnter: () => setApplyHovered(true), onMouseLeave: () => setApplyHovered(false), disabled: disabled, title: title || defaultTitle, "aria-label": title || defaultTitle, children: [_jsx(MaterialSymbol, { name: iconName, size: 18 }), _jsx("div", { style: Object.assign(Object.assign({}, S_COLOR_BAR), { backgroundColor: swatchColor === 'transparent' ? '#fff' : swatchColor, outline: swatchColor === 'transparent' || isLightColor(swatchColor)
                                        ? '1px solid #bbb'
                                        : 'none' }) })] }), _jsx("button", { type: "button", className: "docx-color-picker-arrow", style: Object.assign(Object.assign({}, S_SPLIT_ARROW_BTN), (disabled
                            ? { cursor: 'default' }
                            : isOpen
                                ? {
                                    backgroundColor: 'var(--doc-primary-light)',
                                    color: 'var(--doc-primary)',
                                }
                                : arrowHovered
                                    ? { backgroundColor: 'var(--doc-bg-hover)' }
                                    : null)), onClick: toggleDropdown, onMouseDown: (e) => e.preventDefault(), onMouseEnter: () => setArrowHovered(true), onMouseLeave: () => setArrowHovered(false), disabled: disabled, title: title || defaultTitle, "aria-label": title || defaultTitle, "aria-haspopup": "true", "aria-expanded": isOpen, children: _jsx(MaterialSymbol, { name: "arrow_drop_down", size: 18 }) })] })) : (_jsxs("button", { type: "button", className: "docx-color-picker-button", style: buttonStyle, onClick: toggleDropdown, onMouseDown: (e) => e.preventDefault(), onMouseEnter: () => setIsHovered(true), onMouseLeave: () => setIsHovered(false), disabled: disabled, title: title || defaultTitle, "aria-label": title || defaultTitle, "aria-haspopup": "true", "aria-expanded": isOpen, children: [_jsxs("div", { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }, children: [_jsx(MaterialSymbol, { name: iconName, size: 18 }), _jsx("div", { style: Object.assign(Object.assign({}, S_COLOR_BAR), { backgroundColor: resolvedColor === 'transparent' ? '#fff' : resolvedColor, outline: resolvedColor === 'transparent' || isLightColor(resolvedColor)
                                        ? '1px solid #bbb'
                                        : 'none' }) })] }), _jsx(MaterialSymbol, { name: "arrow_drop_down", size: 14 })] })), isOpen && (_jsx("div", { ref: dropdownRef, className: "docx-color-picker-dropdown", style: Object.assign(Object.assign({}, dropdownStyle), S_DROPDOWN), role: "dialog", "aria-label": `${defaultTitle} picker`, onMouseDown: (e) => {
                    // Allow input elements to receive focus, prevent focus steal for everything else
                    if (e.target.tagName !== 'INPUT') {
                        e.preventDefault();
                    }
                }, children: _jsxs(_Fragment, { children: [_jsxs("button", { type: "button", style: S_AUTO_BUTTON, onClick: handleAutomatic, onMouseDown: (e) => e.preventDefault(), children: [mode === 'highlight' ? (_jsx("span", { style: {
                                        display: 'inline-block',
                                        width: '16px',
                                        height: '16px',
                                        border: '1px solid var(--doc-border, #ccc)',
                                        borderRadius: '2px',
                                        position: 'relative',
                                        backgroundColor: 'var(--doc-surface, white)',
                                    }, children: _jsx("span", { style: {
                                            position: 'absolute',
                                            top: '50%',
                                            left: '-1px',
                                            right: '-1px',
                                            height: '2px',
                                            backgroundColor: '#ff0000',
                                            transform: 'rotate(-45deg)',
                                        } }) })) : (_jsx("span", { style: {
                                        display: 'inline-block',
                                        width: '16px',
                                        height: '16px',
                                        backgroundColor: '#000',
                                        borderRadius: '2px',
                                    } })), autoLabel !== null && autoLabel !== void 0 ? autoLabel : (mode === 'highlight' ? t('colorPicker.noColor') : t('colorPicker.automatic'))] }), _jsx("div", { style: S_DIVIDER }), _jsx("div", { style: S_SECTION_LABEL, children: t('colorPicker.themeColors') }), _jsx(ThemeColorMatrix, { matrix: matrix, selectedColor: value, theme: theme, onSelect: handleThemeCellSelect }), _jsx("div", { style: S_DIVIDER }), _jsx("div", { style: S_SECTION_LABEL, children: t('colorPicker.standardColors') }), _jsx(StandardColorRow, { selectedColor: value, theme: theme, onSelect: handleStandardColorSelect }), _jsx("div", { style: S_DIVIDER }), _jsx("div", { style: S_SECTION_LABEL, children: t('colorPicker.customColor') }), _jsxs("div", { style: S_CUSTOM_ROW, children: [_jsx("span", { style: { fontSize: '12px', color: '#666' }, children: "#" }), _jsx("input", { type: "text", style: S_HEX_INPUT, value: customHex, onChange: (e) => setCustomHex(e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6)), onKeyDown: (e) => {
                                        if (e.key === 'Enter')
                                            handleCustomApply();
                                    }, onMouseDown: (e) => {
                                        e.stopPropagation();
                                    }, placeholder: "FF0000", maxLength: 6, "aria-label": "Custom hex color" }), _jsx("button", { type: "button", style: Object.assign(Object.assign({}, S_APPLY_BTN), { opacity: /^[0-9A-Fa-f]{6}$/.test(customHex) ? 1 : 0.4, cursor: /^[0-9A-Fa-f]{6}$/.test(customHex) ? 'pointer' : 'default' }), onClick: handleCustomApply, onMouseDown: (e) => e.preventDefault(), disabled: !/^[0-9A-Fa-f]{6}$/.test(customHex), children: t('common.apply') })] })] }) }))] }));
}
export default ColorPicker;
//# sourceMappingURL=ColorPicker.js.map