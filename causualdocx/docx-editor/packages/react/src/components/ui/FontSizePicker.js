import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback, useRef } from 'react';
import { Button } from './Button';
import { MaterialSymbol } from './MaterialSymbol';
import { cn } from '../../lib/utils';
import { useFixedDropdown } from './useFixedDropdown';
import { useTranslation } from '../../i18n';
// ============================================================================
// CONSTANTS
// ============================================================================
const DEFAULT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 36, 48, 72];
const DEFAULT_MIN_SIZE = 1;
const DEFAULT_MAX_SIZE = 400;
// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
/**
 * Convert half-points to points (OOXML uses half-points for font sizes)
 */
export function halfPointsToPoints(halfPoints) {
    return halfPoints / 2;
}
/**
 * Convert points to half-points
 */
export function pointsToHalfPoints(points) {
    return points * 2;
}
/**
 * Find the next size in the preset list (going up)
 */
function getNextSize(currentSize, sizes, maxSize) {
    for (const size of sizes) {
        if (size > currentSize) {
            return size;
        }
    }
    // If current size is beyond preset list, increment by 1
    return Math.min(currentSize + 1, maxSize);
}
/**
 * Find the previous size in the preset list (going down)
 */
function getPrevSize(currentSize, sizes, minSize) {
    for (let i = sizes.length - 1; i >= 0; i--) {
        if (sizes[i] < currentSize) {
            return sizes[i];
        }
    }
    // If current size is below preset list, decrement by 1
    return Math.max(currentSize - 1, minSize);
}
// ============================================================================
// COMPONENT
// ============================================================================
export function FontSizePicker({ value, onChange, sizes = DEFAULT_SIZES, disabled = false, className, placeholder = '11', minSize = DEFAULT_MIN_SIZE, maxSize = DEFAULT_MAX_SIZE, }) {
    const { t } = useTranslation();
    const [isEditing, setIsEditing] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const inputRef = useRef(null);
    const onCloseDropdown = useCallback(() => {
        setIsDropdownOpen(false);
        setIsEditing(false);
    }, []);
    const { containerRef, dropdownRef, dropdownStyle: fixedDropdownStyle, } = useFixedDropdown({
        isOpen: isDropdownOpen,
        onClose: onCloseDropdown,
    });
    const currentValue = value !== null && value !== void 0 ? value : (parseInt(placeholder, 10) || 11);
    const displayValue = value !== undefined ? value.toString() : placeholder;
    // Handle decrease font size
    const handleDecrease = useCallback((e) => {
        e.preventDefault();
        if (disabled)
            return;
        const newSize = getPrevSize(currentValue, sizes, minSize);
        onChange === null || onChange === void 0 ? void 0 : onChange(newSize);
    }, [currentValue, sizes, minSize, disabled, onChange]);
    // Handle increase font size
    const handleIncrease = useCallback((e) => {
        e.preventDefault();
        if (disabled)
            return;
        const newSize = getNextSize(currentValue, sizes, maxSize);
        onChange === null || onChange === void 0 ? void 0 : onChange(newSize);
    }, [currentValue, sizes, maxSize, disabled, onChange]);
    // Handle input click - start editing
    const handleInputClick = useCallback((e) => {
        e.preventDefault();
        if (disabled)
            return;
        setIsEditing(true);
        setInputValue(displayValue);
        setIsDropdownOpen(true);
        // Focus input after state update
        requestAnimationFrame(() => {
            var _a, _b;
            (_a = inputRef.current) === null || _a === void 0 ? void 0 : _a.focus();
            (_b = inputRef.current) === null || _b === void 0 ? void 0 : _b.select();
        });
    }, [disabled, displayValue]);
    // Handle input change
    const handleInputChange = useCallback((e) => {
        setInputValue(e.target.value);
    }, []);
    // Handle input blur - commit change
    const handleInputBlur = useCallback(() => {
        setIsEditing(false);
        const size = parseFloat(inputValue);
        if (!isNaN(size) && size >= minSize && size <= maxSize) {
            // Round to nearest 0.5 to match Word's font size granularity
            const rounded = Math.round(size * 2) / 2;
            onChange === null || onChange === void 0 ? void 0 : onChange(rounded);
        }
    }, [inputValue, minSize, maxSize, onChange]);
    // Handle input keydown
    const handleInputKeyDown = useCallback((e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleInputBlur();
            setIsDropdownOpen(false);
        }
        else if (e.key === 'Escape') {
            setIsEditing(false);
            setIsDropdownOpen(false);
        }
        else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const newSize = getNextSize(currentValue, sizes, maxSize);
            setInputValue(newSize.toString());
            onChange === null || onChange === void 0 ? void 0 : onChange(newSize);
        }
        else if (e.key === 'ArrowDown') {
            e.preventDefault();
            const newSize = getPrevSize(currentValue, sizes, minSize);
            setInputValue(newSize.toString());
            onChange === null || onChange === void 0 ? void 0 : onChange(newSize);
        }
    }, [handleInputBlur, currentValue, sizes, maxSize, minSize, onChange]);
    // Handle dropdown item click
    const handleSizeSelect = useCallback((size) => {
        onChange === null || onChange === void 0 ? void 0 : onChange(size);
        setIsDropdownOpen(false);
        setIsEditing(false);
    }, [onChange]);
    // Prevent mousedown from stealing focus
    const handleMouseDown = useCallback((e) => {
        // Allow input to receive focus
        if (e.target.tagName !== 'INPUT') {
            e.preventDefault();
        }
    }, []);
    return (_jsxs("div", { ref: containerRef, className: cn('flex items-center', className), onMouseDown: handleMouseDown, children: [_jsx(Button, { variant: "ghost", size: "icon-sm", className: cn('h-7 w-7 text-[color:var(--doc-text-on-surface-muted,#5f6368)] hover:text-[color:var(--doc-text-on-surface,#1f2937)] hover:bg-[color:var(--doc-bg-hover,#f1f3f4)] rounded-r-none', disabled && 'opacity-30 cursor-not-allowed'), onMouseDown: handleDecrease, disabled: disabled || currentValue <= minSize, "aria-label": t('fontSize.decrease'), "data-testid": "font-size-decrease", children: _jsx(MaterialSymbol, { name: "remove", size: 18 }) }), _jsx("div", { className: "relative", children: isEditing ? (_jsx("input", { ref: inputRef, type: "text", value: inputValue, onChange: handleInputChange, onBlur: handleInputBlur, onKeyDown: handleInputKeyDown, className: cn('h-7 w-10 text-center text-sm border border-[color:var(--doc-border,#e0e0e0)] bg-[color:var(--doc-surface,white)]', 'focus:outline-none focus:ring-1 focus:ring-slate-400', 'rounded-none'), "aria-label": t('fontSize.label'), "data-testid": "font-size-input" })) : (_jsx("button", { type: "button", onClick: handleInputClick, className: cn('h-7 w-10 text-center text-sm border border-[color:var(--doc-border,#e0e0e0)] bg-[color:var(--doc-surface,white)]', 'hover:border-[color:var(--doc-border,#e0e0e0)] hover:bg-[color:var(--doc-bg-hover,#f1f3f4)]', 'focus:outline-none focus:ring-1 focus:ring-slate-400', 'rounded-none', disabled && 'opacity-50 cursor-not-allowed'), disabled: disabled, "aria-label": t('fontSize.label'), "aria-haspopup": "listbox", "aria-expanded": isDropdownOpen, "data-testid": "font-size-display", children: displayValue })) }), isDropdownOpen && (_jsx("div", { ref: dropdownRef, style: Object.assign(Object.assign({}, fixedDropdownStyle), { backgroundColor: 'var(--doc-surface, white)', border: '1px solid #e2e8f0', borderRadius: 6, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)', maxHeight: 240, overflowY: 'auto', minWidth: 60 }), role: "listbox", "aria-label": t('fontSize.listLabel'), children: sizes.map((size) => (_jsx("button", { type: "button", onClick: () => handleSizeSelect(size), className: cn('w-full px-3 py-1.5 text-sm text-left', 'hover:bg-[color:var(--doc-bg-hover)]', size === currentValue &&
                        'bg-[color:var(--doc-primary-light,#e8f0fe)] text-[color:var(--doc-primary,#1a73e8)] font-medium'), role: "option", "aria-selected": size === currentValue, children: size }, size))) })), _jsx(Button, { variant: "ghost", size: "icon-sm", className: cn('h-7 w-7 text-[color:var(--doc-text-on-surface-muted,#5f6368)] hover:text-[color:var(--doc-text-on-surface,#1f2937)] hover:bg-[color:var(--doc-bg-hover,#f1f3f4)] rounded-l-none', disabled && 'opacity-30 cursor-not-allowed'), onMouseDown: handleIncrease, disabled: disabled || currentValue >= maxSize, "aria-label": t('fontSize.increase'), "data-testid": "font-size-increase", children: _jsx(MaterialSymbol, { name: "add", size: 18 }) })] }));
}
//# sourceMappingURL=FontSizePicker.js.map