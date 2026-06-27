import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Font Picker Component (Radix UI)
 *
 * A dropdown selector for choosing font families using Radix Select.
 */
import * as React from 'react';
import { Select, SelectContent, SelectItem, SelectGroup, SelectLabel, SelectSeparator, SelectTrigger, SelectValue, } from './Select';
import { cn } from '../../lib/utils';
import { useTranslation } from '../../i18n';
// ============================================================================
// DEFAULT FONTS
// ============================================================================
const DEFAULT_FONTS = [
    // Sans-serif
    { name: 'Arial', fontFamily: 'Arial, Helvetica, sans-serif', category: 'sans-serif' },
    { name: 'Calibri', fontFamily: '"Calibri", Arial, sans-serif', category: 'sans-serif' },
    { name: 'Helvetica', fontFamily: 'Helvetica, Arial, sans-serif', category: 'sans-serif' },
    { name: 'Verdana', fontFamily: 'Verdana, Geneva, sans-serif', category: 'sans-serif' },
    { name: 'Open Sans', fontFamily: '"Open Sans", sans-serif', category: 'sans-serif' },
    { name: 'Roboto', fontFamily: 'Roboto, sans-serif', category: 'sans-serif' },
    // Serif
    { name: 'Times New Roman', fontFamily: '"Times New Roman", Times, serif', category: 'serif' },
    { name: 'Georgia', fontFamily: 'Georgia, serif', category: 'serif' },
    { name: 'Cambria', fontFamily: 'Cambria, Georgia, serif', category: 'serif' },
    { name: 'Garamond', fontFamily: 'Garamond, serif', category: 'serif' },
    // Monospace
    { name: 'Courier New', fontFamily: '"Courier New", Courier, monospace', category: 'monospace' },
    { name: 'Consolas', fontFamily: 'Consolas, monospace', category: 'monospace' },
];
// ============================================================================
// COMPONENT
// ============================================================================
export function FontPicker({ value, onChange, fonts = DEFAULT_FONTS, disabled = false, className, placeholder = 'Arial', width = 120, showPreview = true, }) {
    const { t } = useTranslation();
    // Find current font name for display
    const displayValue = React.useMemo(() => {
        if (!value)
            return placeholder;
        const font = fonts.find((f) => f.fontFamily === value || f.name.toLowerCase() === value.toLowerCase());
        return (font === null || font === void 0 ? void 0 : font.name) || value;
    }, [value, fonts, placeholder]);
    const handleValueChange = React.useCallback((newValue) => {
        const font = fonts.find((f) => f.name === newValue);
        if (font) {
            onChange === null || onChange === void 0 ? void 0 : onChange(font.fontFamily);
        }
    }, [onChange, fonts]);
    // Group fonts by category
    const groupedFonts = React.useMemo(() => {
        const groups = {
            'sans-serif': [],
            serif: [],
            monospace: [],
            other: [],
        };
        fonts.forEach((font) => {
            const category = font.category || 'other';
            groups[category].push(font);
        });
        return groups;
    }, [fonts]);
    return (_jsxs(Select, { value: displayValue, onValueChange: handleValueChange, disabled: disabled, children: [_jsx(SelectTrigger, { className: cn('h-8 text-sm', className), style: { minWidth: typeof width === 'number' ? `${width}px` : width }, "aria-label": t('font.selectAriaLabel'), children: _jsx(SelectValue, { placeholder: placeholder, children: displayValue }) }), _jsxs(SelectContent, { className: "max-h-[300px]", children: [groupedFonts['sans-serif'].length > 0 && (_jsxs(SelectGroup, { children: [_jsx(SelectLabel, { children: t('font.sansSerif') }), groupedFonts['sans-serif'].map((font) => (_jsx(SelectItem, { value: font.name, style: showPreview ? { fontFamily: font.fontFamily } : undefined, children: font.name }, font.name)))] })), groupedFonts['serif'].length > 0 && (_jsxs(_Fragment, { children: [_jsx(SelectSeparator, {}), _jsxs(SelectGroup, { children: [_jsx(SelectLabel, { children: t('font.serif') }), groupedFonts['serif'].map((font) => (_jsx(SelectItem, { value: font.name, style: showPreview ? { fontFamily: font.fontFamily } : undefined, children: font.name }, font.name)))] })] })), groupedFonts['monospace'].length > 0 && (_jsxs(_Fragment, { children: [_jsx(SelectSeparator, {}), _jsxs(SelectGroup, { children: [_jsx(SelectLabel, { children: t('font.monospace') }), groupedFonts['monospace'].map((font) => (_jsx(SelectItem, { value: font.name, style: showPreview ? { fontFamily: font.fontFamily } : undefined, children: font.name }, font.name)))] })] })), groupedFonts['other'].length > 0 && (_jsxs(_Fragment, { children: [_jsx(SelectSeparator, {}), _jsx(SelectGroup, { children: groupedFonts['other'].map((font) => (_jsx(SelectItem, { value: font.name, style: showPreview ? { fontFamily: font.fontFamily } : undefined, children: font.name }, font.name))) })] }))] })] }));
}
//# sourceMappingURL=FontPicker.js.map