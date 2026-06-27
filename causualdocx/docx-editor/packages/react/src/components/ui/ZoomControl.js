import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Zoom Control Component (Radix UI)
 *
 * A dropdown for controlling document zoom level using Radix Select.
 */
import * as React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './Select';
import { cn } from '../../lib/utils';
import { useTranslation } from '../../i18n';
// ============================================================================
// CONSTANTS
// ============================================================================
const DEFAULT_ZOOM_LEVELS = [
    { value: 0.5, label: '50%' },
    { value: 0.75, label: '75%' },
    { value: 1.0, label: '100%' },
    { value: 1.25, label: '125%' },
    { value: 1.5, label: '150%' },
    { value: 2.0, label: '200%' },
];
// ============================================================================
// COMPONENT
// ============================================================================
export function ZoomControl({ value = 1.0, onChange, levels = DEFAULT_ZOOM_LEVELS, disabled = false, className, compact = false, }) {
    const { t } = useTranslation();
    const displayLabel = React.useMemo(() => {
        const matchingLevel = levels.find((level) => Math.abs(level.value - value) < 0.001);
        if (matchingLevel)
            return matchingLevel.label;
        return `${Math.round(value * 100)}%`;
    }, [levels, value]);
    const handleValueChange = React.useCallback((newValue) => {
        const zoom = parseFloat(newValue);
        if (!isNaN(zoom)) {
            onChange === null || onChange === void 0 ? void 0 : onChange(zoom);
        }
    }, [onChange]);
    return (_jsxs(Select, { value: value.toString(), onValueChange: handleValueChange, disabled: disabled, children: [_jsx(SelectTrigger, { className: cn(compact ? 'h-7 min-w-[55px] text-xs' : 'h-8 min-w-[70px] text-sm', className), "aria-label": t('zoom.ariaLabel', { label: displayLabel }), children: _jsx(SelectValue, { placeholder: "100%", children: displayLabel }) }), _jsx(SelectContent, { children: levels.map((level) => (_jsx(SelectItem, { value: level.value.toString(), children: level.label }, level.value))) })] }));
}
//# sourceMappingURL=ZoomControl.js.map