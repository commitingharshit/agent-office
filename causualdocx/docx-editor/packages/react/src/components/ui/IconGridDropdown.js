import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Shared icon-grid dropdown used by image toolbar controls.
 *
 * Renders a trigger button (icon + chevron) that opens a floating
 * row of icon buttons. Handles click-outside, Escape, focus-stealing
 * prevention, and optional active-state highlighting.
 */
import { useState, useCallback } from 'react';
import { MaterialSymbol } from './MaterialSymbol';
import { Button } from './Button';
import { Tooltip } from './Tooltip';
import { cn } from '../../lib/utils';
import { useFixedDropdown } from './useFixedDropdown';
const ICON_SIZE = 20;
export function IconGridDropdown({ options, activeValue, triggerIcon, tooltipContent, onSelect, disabled = false, ariaLabel, testId, showLabels = false, }) {
    const [isOpen, setIsOpen] = useState(false);
    const onClose = useCallback(() => setIsOpen(false), []);
    const { containerRef, dropdownRef, dropdownStyle, handleMouseDown } = useFixedDropdown({
        isOpen,
        onClose,
    });
    const handleOptionClick = useCallback((value) => {
        if (!disabled)
            onSelect(value);
        setIsOpen(false);
    }, [disabled, onSelect]);
    const triggerButton = (_jsxs(Button, { variant: "ghost", size: "icon-sm", className: cn('text-[color:var(--doc-text-on-surface-muted,#5f6368)] hover:text-[color:var(--doc-text-on-surface,#1f2937)] hover:bg-[color:var(--doc-bg-hover,#f1f3f4)]', isOpen && 'bg-[color:var(--doc-bg-hover)]', disabled && 'opacity-30 cursor-not-allowed'), onMouseDown: handleMouseDown, onClick: () => !disabled && setIsOpen((prev) => !prev), disabled: disabled, "aria-label": ariaLabel !== null && ariaLabel !== void 0 ? ariaLabel : tooltipContent, "aria-expanded": isOpen, "aria-haspopup": "true", "data-testid": testId, children: [_jsx(MaterialSymbol, { name: triggerIcon, size: ICON_SIZE }), _jsx(MaterialSymbol, { name: "arrow_drop_down", size: 14, className: "-ml-1" })] }));
    return (_jsxs("div", { ref: containerRef, style: { position: 'relative', display: 'inline-block' }, children: [!isOpen ? _jsx(Tooltip, { content: tooltipContent, children: triggerButton }) : triggerButton, isOpen && !disabled && (_jsx("div", { ref: dropdownRef, style: Object.assign(Object.assign({}, dropdownStyle), { backgroundColor: 'var(--doc-surface, white)', border: '1px solid var(--doc-border)', borderRadius: 8, boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)', padding: 6 }), onMouseDown: (e) => e.stopPropagation(), children: _jsx("div", { style: {
                        display: 'flex',
                        flexDirection: showLabels ? 'column' : 'row',
                        gap: showLabels ? 1 : 2,
                        minWidth: showLabels ? 200 : undefined,
                    }, children: options.map((option) => {
                        const isActive = activeValue === option.value;
                        return (_jsxs("button", { type: "button", title: option.label, "data-testid": testId ? `${testId}-${option.value}` : undefined, style: Object.assign({ display: 'flex', alignItems: 'center', height: 32, border: '1px solid transparent', borderRadius: 4, backgroundColor: isActive ? 'var(--doc-primary-light)' : 'transparent', cursor: 'pointer', color: isActive ? 'var(--doc-primary)' : 'var(--doc-text)' }, (showLabels
                                ? {
                                    width: '100%',
                                    gap: 10,
                                    padding: '0 10px',
                                    justifyContent: 'flex-start',
                                    fontSize: 13,
                                    textAlign: 'left',
                                }
                                : { width: 32, justifyContent: 'center' })), onMouseDown: (e) => e.preventDefault(), onMouseEnter: (e) => {
                                if (!isActive) {
                                    e.currentTarget.style.backgroundColor =
                                        'var(--doc-bg-hover)';
                                }
                            }, onMouseLeave: (e) => {
                                e.currentTarget.style.backgroundColor = isActive
                                    ? 'var(--doc-primary-light)'
                                    : 'transparent';
                            }, onClick: () => handleOptionClick(option.value), children: [_jsx(MaterialSymbol, { name: option.iconName, size: 18 }), showLabels && _jsx("span", { style: { flex: 1 }, children: option.label })] }, option.value));
                    }) }) }))] }));
}
//# sourceMappingURL=IconGridDropdown.js.map