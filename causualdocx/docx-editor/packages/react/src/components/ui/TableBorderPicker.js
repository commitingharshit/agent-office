import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * TableBorderPicker - Google Docs-style border preset popover
 *
 * Shows a grid of border preset buttons: All, Outside, Inside,
 * Top, Bottom, Left, Right, and Clear.
 */
import { useState, useCallback } from 'react';
import { Button } from './Button';
import { Tooltip } from './Tooltip';
import { MaterialSymbol } from './MaterialSymbol';
import { cn } from '../../lib/utils';
import { useFixedDropdown } from './useFixedDropdown';
import { useTranslation } from '../../i18n';
const BORDER_PRESETS = [
    { action: 'borderAll', icon: 'border_all', labelKey: 'table.borders.all' },
    { action: 'borderOutside', icon: 'border_outer', labelKey: 'table.borders.outside' },
    { action: 'borderInside', icon: 'border_inner', labelKey: 'table.borders.inside' },
    { action: 'borderTop', icon: 'border_top', labelKey: 'table.borders.top' },
    { action: 'borderBottom', icon: 'border_bottom', labelKey: 'table.borders.bottom' },
    { action: 'borderLeft', icon: 'border_left', labelKey: 'table.borders.left' },
    { action: 'borderRight', icon: 'border_right', labelKey: 'table.borders.right' },
    { action: 'borderNone', icon: 'border_clear', labelKey: 'table.borders.none' },
];
export function TableBorderPicker({ onAction, disabled = false }) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const close = useCallback(() => setIsOpen(false), []);
    const { containerRef, dropdownRef, dropdownStyle, handleMouseDown } = useFixedDropdown({
        isOpen,
        onClose: close,
    });
    const handlePreset = useCallback((action) => {
        onAction(action);
        setIsOpen(false);
    }, [onAction]);
    const button = (_jsxs(Button, { variant: "ghost", size: "icon-sm", className: cn('text-[color:var(--doc-text-on-surface-muted,#5f6368)] hover:text-[color:var(--doc-text-on-surface,#1f2937)] hover:bg-[color:var(--doc-bg-hover,#f1f3f4)]', isOpen && 'bg-[color:var(--doc-bg-hover)]', disabled && 'opacity-30 cursor-not-allowed'), onMouseDown: handleMouseDown, onClick: () => !disabled && setIsOpen((prev) => !prev), disabled: disabled, "aria-label": t('table.borders.styleAriaLabel'), "aria-expanded": isOpen, "aria-haspopup": "true", "data-testid": "toolbar-table-borders", children: [_jsx(MaterialSymbol, { name: "border_all", size: 20 }), _jsx(MaterialSymbol, { name: "arrow_drop_down", size: 14, className: "-ml-1" })] }));
    return (_jsxs("div", { ref: containerRef, style: { position: 'relative', display: 'inline-block' }, children: [!isOpen ? _jsx(Tooltip, { content: t('table.borders.tooltip'), children: button }) : button, isOpen && !disabled && (_jsx("div", { ref: dropdownRef, style: Object.assign(Object.assign({}, dropdownStyle), { backgroundColor: 'var(--doc-surface, white)', border: '1px solid var(--doc-border)', borderRadius: 8, boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)', padding: 6 }), onMouseDown: (e) => e.stopPropagation(), children: _jsx("div", { style: {
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: 2,
                    }, children: BORDER_PRESETS.map(({ action, icon, labelKey }) => (_jsx("button", { type: "button", title: t(labelKey), style: {
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 32,
                            height: 32,
                            border: '1px solid transparent',
                            borderRadius: 4,
                            backgroundColor: 'transparent',
                            cursor: 'pointer',
                            color: 'var(--doc-text)',
                        }, onMouseDown: (e) => e.preventDefault(), onMouseEnter: (e) => {
                            e.currentTarget.style.backgroundColor =
                                'var(--doc-bg-hover)';
                        }, onMouseLeave: (e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                        }, onClick: () => handlePreset(action), children: _jsx(MaterialSymbol, { name: icon, size: 18 }) }, typeof action === 'string' ? action : action.type))) }) }))] }));
}
export default TableBorderPicker;
//# sourceMappingURL=TableBorderPicker.js.map