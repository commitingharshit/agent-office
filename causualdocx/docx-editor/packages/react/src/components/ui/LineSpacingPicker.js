import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Line Spacing Picker Component (Radix UI)
 *
 * A dropdown selector for choosing line spacing values using Radix Select.
 * Styled like Google Docs with options: Single, 1.15, 1.5, Double
 */
import * as React from 'react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, } from './Select';
import { cn } from '../../lib/utils';
import { IconLineSpacing } from './Icons';
import { useTranslation } from '../../i18n';
/** 8pt in twips — default paragraph spacing amount */
export const DEFAULT_PARAGRAPH_SPACE_TWIPS = 160;
// ============================================================================
// CONSTANTS
// ============================================================================
/**
 * Standard line spacing options (Google Docs style)
 * OOXML uses twips for line spacing when lineRule="auto"
 * 240 twips = 1.0 line spacing (single)
 */
const DEFAULT_OPTIONS = [
    { label: 'Single', labelKey: 'lineSpacing.single', value: 1.0, twipsValue: 240 },
    { label: '1.15', value: 1.15, twipsValue: 276 },
    { label: '1.5', value: 1.5, twipsValue: 360 },
    { label: 'Double', labelKey: 'lineSpacing.double', value: 2.0, twipsValue: 480 },
];
// ============================================================================
// COMPONENT
// ============================================================================
export function LineSpacingPicker({ value, onChange, options = DEFAULT_OPTIONS, disabled = false, className, spaceBefore, spaceAfter, onSpaceBeforeChange, onSpaceAfterChange, onOpenCustomSpacing, keepNext, keepLines, pageBreakBefore, widowControl, onTogglePagination, }) {
    const { t } = useTranslation();
    // Find current option by twips value
    const currentOption = React.useMemo(() => {
        if (value === undefined)
            return options[0]; // Default to Single
        return options.find((opt) => opt.twipsValue === value) || options[0];
    }, [value, options]);
    const handleValueChange = React.useCallback((newValue) => {
        const twips = parseInt(newValue, 10);
        if (!isNaN(twips)) {
            onChange === null || onChange === void 0 ? void 0 : onChange(twips);
        }
    }, [onChange]);
    const getOptionLabel = (option) => option.labelKey ? t(option.labelKey) : option.label;
    return (_jsxs(Select, { value: currentOption.twipsValue.toString(), onValueChange: handleValueChange, disabled: disabled, children: [_jsx(SelectTrigger, { className: cn('h-8 text-sm gap-0.5 px-2', className), style: { width: 'auto' }, title: t('lineSpacing.lineSpacingTitle', { label: getOptionLabel(currentOption) }), "aria-label": "Line spacing", children: _jsx(IconLineSpacing, { className: "h-5 w-5 shrink-0" }) }), _jsxs(SelectContent, { children: [options.map((option) => (_jsx(SelectItem, { value: option.twipsValue.toString(), children: getOptionLabel(option) }, option.twipsValue))), _jsx(SelectSeparator, {}), _jsxs(SelectGroup, { children: [_jsx(SelectLabel, { children: t('lineSpacing.paragraphSpacing') }), onSpaceBeforeChange && (_jsx(SelectItem, { value: "__spaceBefore__", onMouseDown: (e) => {
                                    e.preventDefault();
                                    onSpaceBeforeChange === null || onSpaceBeforeChange === void 0 ? void 0 : onSpaceBeforeChange(spaceBefore ? 0 : DEFAULT_PARAGRAPH_SPACE_TWIPS);
                                }, children: spaceBefore ? 'Remove space before paragraph' : 'Add space before paragraph' })), onSpaceAfterChange && (_jsx(SelectItem, { value: "__spaceAfter__", onMouseDown: (e) => {
                                    e.preventDefault();
                                    onSpaceAfterChange === null || onSpaceAfterChange === void 0 ? void 0 : onSpaceAfterChange(spaceAfter ? 0 : DEFAULT_PARAGRAPH_SPACE_TWIPS);
                                }, children: spaceAfter ? 'Remove space after paragraph' : 'Add space after paragraph' })), onOpenCustomSpacing && (_jsx(SelectItem, { value: "__customSpacing__", onMouseDown: (e) => {
                                    e.preventDefault();
                                    onOpenCustomSpacing === null || onOpenCustomSpacing === void 0 ? void 0 : onOpenCustomSpacing();
                                }, children: "Custom spacing\u2026" }))] }), onTogglePagination && (_jsxs(_Fragment, { children: [_jsx(SelectSeparator, {}), _jsxs(SelectGroup, { children: [_jsx(SelectLabel, { children: "Pagination" }), _jsxs(SelectItem, { value: "__keepNext__", onMouseDown: (e) => {
                                            e.preventDefault();
                                            onTogglePagination('keepNext');
                                        }, children: [keepNext ? '✓ ' : '', "Keep with next"] }), _jsxs(SelectItem, { value: "__keepLines__", onMouseDown: (e) => {
                                            e.preventDefault();
                                            onTogglePagination('keepLines');
                                        }, children: [keepLines ? '✓ ' : '', "Keep lines together"] }), _jsxs(SelectItem, { value: "__pageBreakBefore__", onMouseDown: (e) => {
                                            e.preventDefault();
                                            onTogglePagination('pageBreakBefore');
                                        }, children: [pageBreakBefore ? '✓ ' : '', "Page break before"] }), _jsxs(SelectItem, { value: "__widowControl__", onMouseDown: (e) => {
                                            e.preventDefault();
                                            onTogglePagination('widowControl');
                                        }, children: [widowControl ? '✓ ' : '', "Prevent single lines"] })] })] }))] })] }));
}
// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
export function getDefaultLineSpacingOptions() {
    return [...DEFAULT_OPTIONS];
}
export function lineSpacingMultiplierToTwips(multiplier) {
    return Math.round(multiplier * 240);
}
export function twipsToLineSpacingMultiplier(twips) {
    return twips / 240;
}
export function getLineSpacingLabel(twips) {
    const option = DEFAULT_OPTIONS.find((opt) => opt.twipsValue === twips);
    if (option)
        return option.label;
    const multiplier = twipsToLineSpacingMultiplier(twips);
    return multiplier.toFixed(2).replace(/\.?0+$/, '');
}
export function isStandardLineSpacing(twips) {
    return DEFAULT_OPTIONS.some((opt) => opt.twipsValue === twips);
}
export function nearestStandardLineSpacing(twips) {
    let nearest = DEFAULT_OPTIONS[0];
    let minDiff = Math.abs(twips - nearest.twipsValue);
    for (const option of DEFAULT_OPTIONS) {
        const diff = Math.abs(twips - option.twipsValue);
        if (diff < minDiff) {
            minDiff = diff;
            nearest = option;
        }
    }
    return nearest;
}
export function createLineSpacingOption(multiplier) {
    const twipsValue = lineSpacingMultiplierToTwips(multiplier);
    const label = multiplier.toFixed(2).replace(/\.?0+$/, '');
    return { label, value: multiplier, twipsValue };
}
export default LineSpacingPicker;
//# sourceMappingURL=LineSpacingPicker.js.map