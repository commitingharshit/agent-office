import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * TableBorderWidthPicker - Popover with border width options
 *
 * Shows 5 width options as horizontal lines at that thickness.
 */
import { useState, useCallback } from 'react';
import { Button } from './Button';
import { Tooltip } from './Tooltip';
import { MaterialSymbol } from './MaterialSymbol';
import { cn } from '../../lib/utils';
import { useFixedDropdown } from './useFixedDropdown';
import { useTranslation } from '../../i18n';
const WIDTH_OPTIONS = [
    { size: 4, label: '0.5 pt', thickness: 0.5 },
    { size: 8, label: '1 pt', thickness: 1 },
    { size: 12, label: '1.5 pt', thickness: 1.5 },
    { size: 16, label: '2 pt', thickness: 2 },
    { size: 24, label: '3 pt', thickness: 3 },
];
export function TableBorderWidthPicker({ onAction, disabled = false, }) {
    const [isOpen, setIsOpen] = useState(false);
    const { t } = useTranslation();
    const close = useCallback(() => setIsOpen(false), []);
    const { containerRef, dropdownRef, dropdownStyle, handleMouseDown } = useFixedDropdown({
        isOpen,
        onClose: close,
    });
    const handleSelect = useCallback((size) => {
        onAction({ type: 'borderWidth', size });
        setIsOpen(false);
    }, [onAction]);
    const button = (_jsxs(Button, { variant: "ghost", size: "icon-sm", className: cn('text-[color:var(--doc-text-on-surface-muted,#5f6368)] hover:text-[color:var(--doc-text-on-surface,#1f2937)] hover:bg-[color:var(--doc-bg-hover,#f1f3f4)]', isOpen && 'bg-[color:var(--doc-bg-hover)]', disabled && 'opacity-30 cursor-not-allowed'), onMouseDown: handleMouseDown, onClick: () => !disabled && setIsOpen((prev) => !prev), disabled: disabled, "aria-label": t('table.borderWidth'), "aria-expanded": isOpen, "aria-haspopup": "true", "data-testid": "toolbar-table-border-width", children: [_jsx(MaterialSymbol, { name: "line_weight", size: 20 }), _jsx(MaterialSymbol, { name: "arrow_drop_down", size: 14, className: "-ml-1" })] }));
    return (_jsxs("div", { ref: containerRef, style: { position: 'relative', display: 'inline-block' }, children: [!isOpen ? _jsx(Tooltip, { content: t('table.borderWidth'), children: button }) : button, isOpen && !disabled && (_jsx("div", { ref: dropdownRef, style: Object.assign(Object.assign({}, dropdownStyle), { backgroundColor: 'var(--doc-surface, white)', border: '1px solid var(--doc-border)', borderRadius: 8, boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)', padding: '4px 0', minWidth: 120 }), onMouseDown: (e) => e.stopPropagation(), children: WIDTH_OPTIONS.map(({ size, label, thickness }) => (_jsxs("button", { type: "button", style: {
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '6px 12px',
                        width: '100%',
                        border: 'none',
                        backgroundColor: 'transparent',
                        cursor: 'pointer',
                        fontSize: 12,
                        color: 'var(--doc-text)',
                    }, onMouseDown: (e) => e.preventDefault(), onMouseEnter: (e) => {
                        e.currentTarget.style.backgroundColor =
                            'var(--doc-bg-hover)';
                    }, onMouseLeave: (e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                    }, onClick: () => handleSelect(size), children: [_jsx("div", { style: {
                                width: 50,
                                height: Math.max(thickness, 1),
                                backgroundColor: '#000',
                                borderRadius: thickness > 2 ? 1 : 0,
                            } }), _jsx("span", { children: label })] }, size))) }))] }));
}
export default TableBorderWidthPicker;
//# sourceMappingURL=TableBorderWidthPicker.js.map