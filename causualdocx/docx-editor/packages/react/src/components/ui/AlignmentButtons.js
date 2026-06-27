import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Alignment Dropdown Component (Google Docs style)
 *
 * A single dropdown button for paragraph alignment controls:
 * - Shows current alignment icon + chevron
 * - Opens a floating panel with Left, Center, Right, Justify options
 * - Active option is highlighted
 */
import { useState, useCallback } from 'react';
import { MaterialSymbol } from './MaterialSymbol';
import { Button } from './Button';
import { Tooltip } from './Tooltip';
import { cn } from '../../lib/utils';
import { useFixedDropdown } from './useFixedDropdown';
import { useTranslation } from '../../i18n';
// ============================================================================
// ICON SIZE CONSTANT
// ============================================================================
const ICON_SIZE = 20;
// ============================================================================
// ALIGNMENT OPTIONS
// ============================================================================
const ALIGNMENT_OPTIONS = [
    {
        value: 'left',
        label: 'Align Left',
        labelKey: 'alignment.alignLeft',
        shortcutKey: 'alignment.alignLeftShortcut',
        icon: _jsx(MaterialSymbol, { name: "format_align_left", size: ICON_SIZE }),
        iconName: 'format_align_left',
        shortcut: 'Ctrl+L',
    },
    {
        value: 'center',
        label: 'Center',
        labelKey: 'alignment.center',
        shortcutKey: 'alignment.centerShortcut',
        icon: _jsx(MaterialSymbol, { name: "format_align_center", size: ICON_SIZE }),
        iconName: 'format_align_center',
        shortcut: 'Ctrl+E',
    },
    {
        value: 'right',
        label: 'Align Right',
        labelKey: 'alignment.alignRight',
        shortcutKey: 'alignment.alignRightShortcut',
        icon: _jsx(MaterialSymbol, { name: "format_align_right", size: ICON_SIZE }),
        iconName: 'format_align_right',
        shortcut: 'Ctrl+R',
    },
    {
        value: 'both',
        label: 'Justify',
        labelKey: 'alignment.justify',
        shortcutKey: 'alignment.justifyShortcut',
        icon: _jsx(MaterialSymbol, { name: "format_align_justify", size: ICON_SIZE }),
        iconName: 'format_align_justify',
        shortcut: 'Ctrl+J',
    },
];
// ============================================================================
// MAIN COMPONENT
// ============================================================================
/**
 * Alignment dropdown component — single button with popover panel
 */
export function AlignmentButtons({ value = 'left', onChange, disabled = false, }) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const onClose = useCallback(() => setIsOpen(false), []);
    const { containerRef, dropdownRef, dropdownStyle, handleMouseDown } = useFixedDropdown({
        isOpen,
        onClose,
    });
    const handleOptionClick = useCallback((alignment) => {
        if (!disabled) {
            onChange === null || onChange === void 0 ? void 0 : onChange(alignment);
        }
        setIsOpen(false);
    }, [disabled, onChange]);
    // Find the current alignment option for the trigger icon
    const currentOption = ALIGNMENT_OPTIONS.find((opt) => opt.value === value) || ALIGNMENT_OPTIONS[0];
    const currentLabel = t(currentOption.labelKey);
    const currentShortcut = currentOption.shortcutKey ? t(currentOption.shortcutKey) : undefined;
    const ariaText = `${currentLabel}${currentShortcut ? ` (${currentShortcut})` : ''}`;
    const triggerButton = (_jsxs(Button, { variant: "ghost", size: "icon-sm", className: cn('text-[color:var(--doc-text-on-surface-muted,#5f6368)] hover:text-[color:var(--doc-text-on-surface,#1f2937)] hover:bg-[color:var(--doc-bg-hover,#f1f3f4)]', isOpen && 'bg-[color:var(--doc-bg-hover)]', disabled && 'opacity-30 cursor-not-allowed'), onMouseDown: handleMouseDown, onClick: () => !disabled && setIsOpen((prev) => !prev), disabled: disabled, "aria-label": ariaText, "aria-expanded": isOpen, "aria-haspopup": "true", "data-testid": "toolbar-alignment", children: [_jsx(MaterialSymbol, { name: currentOption.iconName, size: ICON_SIZE }), _jsx(MaterialSymbol, { name: "arrow_drop_down", size: 14, className: "-ml-1" })] }));
    return (_jsxs("div", { ref: containerRef, style: { position: 'relative', display: 'inline-block' }, children: [!isOpen ? _jsx(Tooltip, { content: ariaText, children: triggerButton }) : triggerButton, isOpen && !disabled && (_jsx("div", { ref: dropdownRef, style: Object.assign(Object.assign({}, dropdownStyle), { backgroundColor: 'var(--doc-surface, white)', border: '1px solid var(--doc-border)', borderRadius: 8, boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)', padding: 6 }), onMouseDown: (e) => e.stopPropagation(), children: _jsx("div", { style: { display: 'flex', gap: 2 }, children: ALIGNMENT_OPTIONS.map((option) => {
                        const isActive = value === option.value;
                        const optLabel = t(option.labelKey);
                        const optShortcut = option.shortcutKey ? t(option.shortcutKey) : undefined;
                        return (_jsx("button", { type: "button", title: `${optLabel}${optShortcut ? ` (${optShortcut})` : ''}`, "aria-label": optLabel, "aria-pressed": isActive, "data-testid": `alignment-${option.value}`, style: {
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 32,
                                height: 32,
                                border: '1px solid transparent',
                                borderRadius: 4,
                                backgroundColor: isActive ? 'var(--doc-primary-light)' : 'transparent',
                                cursor: 'pointer',
                                color: isActive ? 'var(--doc-primary)' : 'var(--doc-text)',
                            }, onMouseDown: (e) => e.preventDefault(), onMouseEnter: (e) => {
                                if (!isActive) {
                                    e.currentTarget.style.backgroundColor =
                                        'var(--doc-bg-hover)';
                                }
                            }, onMouseLeave: (e) => {
                                e.currentTarget.style.backgroundColor = isActive
                                    ? 'var(--doc-primary-light)'
                                    : 'transparent';
                            }, onClick: () => handleOptionClick(option.value), children: _jsx(MaterialSymbol, { name: option.iconName, size: 18 }) }, option.value));
                    }) }) }))] }));
}
// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
/**
 * Get default alignment options
 */
export function getAlignmentOptions() {
    return [...ALIGNMENT_OPTIONS];
}
/**
 * Check if an alignment value is valid
 */
export function isValidAlignment(value) {
    return ['left', 'center', 'right', 'both', 'distribute'].includes(value);
}
/**
 * Get alignment label from value
 */
export function getAlignmentLabel(value) {
    const option = ALIGNMENT_OPTIONS.find((opt) => opt.value === value);
    return (option === null || option === void 0 ? void 0 : option.label) || 'Left';
}
/**
 * Get alignment icon from value
 */
export function getAlignmentIcon(value) {
    const option = ALIGNMENT_OPTIONS.find((opt) => opt.value === value);
    return (option === null || option === void 0 ? void 0 : option.icon) || _jsx(MaterialSymbol, { name: "format_align_left", size: ICON_SIZE });
}
/**
 * Get alignment shortcut from value
 */
export function getAlignmentShortcut(value) {
    const option = ALIGNMENT_OPTIONS.find((opt) => opt.value === value);
    return option === null || option === void 0 ? void 0 : option.shortcut;
}
/**
 * Get CSS text-align value from OOXML alignment
 */
export function alignmentToCss(alignment) {
    switch (alignment) {
        case 'left':
            return 'left';
        case 'center':
            return 'center';
        case 'right':
            return 'right';
        case 'both':
        case 'distribute':
            return 'justify';
        default:
            return 'left';
    }
}
/**
 * Get OOXML alignment value from CSS text-align
 */
export function cssToAlignment(textAlign) {
    switch (textAlign) {
        case 'left':
        case 'start':
            return 'left';
        case 'center':
            return 'center';
        case 'right':
        case 'end':
            return 'right';
        case 'justify':
            return 'both';
        default:
            return 'left';
    }
}
/**
 * Cycle to next alignment (left -> center -> right -> justify -> left)
 */
export function cycleAlignment(current) {
    const order = ['left', 'center', 'right', 'both'];
    const currentIndex = order.indexOf(current);
    const nextIndex = (currentIndex + 1) % order.length;
    return order[nextIndex];
}
/**
 * Handle keyboard shortcut for alignment
 * Returns the alignment if matched, undefined otherwise
 */
export function handleAlignmentShortcut(event) {
    if (!event.ctrlKey && !event.metaKey) {
        return undefined;
    }
    const key = event.key.toLowerCase();
    switch (key) {
        case 'l':
            return 'left';
        case 'e':
            return 'center';
        case 'r':
            return 'right';
        case 'j':
            return 'both';
        default:
            return undefined;
    }
}
// ============================================================================
// EXPORTS
// ============================================================================
export default AlignmentButtons;
//# sourceMappingURL=AlignmentButtons.js.map