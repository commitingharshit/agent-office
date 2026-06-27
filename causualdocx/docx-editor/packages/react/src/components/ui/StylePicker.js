import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Style Picker Component (Radix UI)
 *
 * A dropdown selector for applying named paragraph styles using Radix Select.
 * Shows each style with its visual appearance (font size, bold, color).
 */
import * as React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger } from './Select';
import { cn } from '../../lib/utils';
import { useTranslation } from '../../i18n';
// ============================================================================
// DEFAULT STYLES (matching Google Docs order and appearance)
// ============================================================================
const DEFAULT_STYLES = [
    {
        styleId: 'Normal',
        name: 'Normal text',
        nameKey: 'styles.normalText',
        type: 'paragraph',
        isDefault: true,
        priority: 0,
        qFormat: true,
        fontSize: 22, // 11pt
    },
    {
        styleId: 'Title',
        name: 'Title',
        nameKey: 'styles.title',
        type: 'paragraph',
        priority: 1,
        qFormat: true,
        fontSize: 52, // 26pt
        bold: true,
    },
    {
        styleId: 'Subtitle',
        name: 'Subtitle',
        nameKey: 'styles.subtitle',
        type: 'paragraph',
        priority: 2,
        qFormat: true,
        fontSize: 30, // 15pt
        color: '666666', // Gray
    },
    {
        styleId: 'Heading1',
        name: 'Heading 1',
        nameKey: 'styles.heading1',
        type: 'paragraph',
        priority: 3,
        qFormat: true,
        fontSize: 40, // 20pt
        bold: true,
    },
    {
        styleId: 'Heading2',
        name: 'Heading 2',
        nameKey: 'styles.heading2',
        type: 'paragraph',
        priority: 4,
        qFormat: true,
        fontSize: 32, // 16pt
        bold: true,
    },
    {
        styleId: 'Heading3',
        name: 'Heading 3',
        nameKey: 'styles.heading3',
        type: 'paragraph',
        priority: 5,
        qFormat: true,
        fontSize: 28, // 14pt
        bold: true,
    },
];
// ============================================================================
// COMPONENT
// ============================================================================
/** Google Docs heading color */
const HEADING_COLOR = '#4a6c8c';
/** Preview sizes per style (px), matching Google Docs dropdown appearance */
const STYLE_PREVIEW_SIZES = {
    Title: 26,
    Subtitle: 18,
    Heading1: 24,
    Heading2: 18,
    Heading3: 16,
    Heading4: 14,
    Heading5: 13,
    Heading6: 13,
    Normal: 14,
};
/**
 * Get inline styles for a style option's visual preview.
 * Uses hardcoded preview sizes for well-known styles (Title, Heading1, etc.)
 * and derives a clamped size from the style's fontSize for custom styles.
 */
function getStylePreviewCSS(style) {
    const css = {};
    // Use hardcoded size for well-known styles, otherwise derive from fontSize (half-points → px)
    const knownSize = STYLE_PREVIEW_SIZES[style.styleId];
    if (knownSize) {
        css.fontSize = `${knownSize}px`;
    }
    else {
        // fontSize is in half-points; convert to pt then clamp for dropdown readability
        const pt = style.fontSize ? style.fontSize / 2 : 11;
        const px = Math.min(Math.max(pt, 11), 20);
        css.fontSize = `${px}px`;
    }
    css.lineHeight = '1.3';
    if (style.bold) {
        css.fontWeight = 'bold';
    }
    if (style.italic) {
        css.fontStyle = 'italic';
    }
    // Use explicit color if provided, otherwise apply heading color for heading styles
    if (style.color) {
        css.color = `#${style.color}`;
    }
    else if (style.styleId.startsWith('Heading')) {
        css.color = HEADING_COLOR;
    }
    return css;
}
export function StylePicker({ value, onChange, styles, disabled = false, className, width = 120, }) {
    const { t } = useTranslation();
    // Convert document styles to options with visual info
    const styleOptions = React.useMemo(() => {
        if (!styles || styles.length === 0) {
            return DEFAULT_STYLES;
        }
        // Show all paragraph styles that are visible:
        // - Not hidden and not semiHidden, OR
        // - Marked as qFormat (quick format / gallery style)
        const visibleDocStyles = styles
            .filter((s) => s.type === 'paragraph')
            .filter((s) => {
            if (s.qFormat)
                return true;
            if (s.hidden || s.semiHidden)
                return false;
            return true;
        });
        // Some real-world Word docs ship without a `Normal` (or other
        // built-in) style entry, or mark it semiHidden — leaving the user
        // unable to clear back to the default. Pull in any DEFAULT_STYLES
        // that the document didn't supply so the gallery is always
        // navigable. Doc-provided styles win on collision.
        const docStyleIds = new Set(visibleDocStyles.map((s) => s.styleId));
        const fallbackStyles = DEFAULT_STYLES.filter((d) => !docStyleIds.has(d.styleId)).map((d) => ({
            // Synth a minimal Style shape from the hardcoded preset. Cast
            // through `unknown` since the synthetic record only fills the
            // properties the mapper below reads.
            styleId: d.styleId,
            name: d.name,
            type: 'paragraph',
            qFormat: d.qFormat,
            uiPriority: d.priority,
        }));
        const docStyles = [...visibleDocStyles, ...fallbackStyles].map((s) => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
            const defaultStyle = DEFAULT_STYLES.find((d) => d.styleId === s.styleId);
            return {
                styleId: s.styleId,
                name: s.name || s.styleId,
                nameKey: defaultStyle === null || defaultStyle === void 0 ? void 0 : defaultStyle.nameKey,
                type: s.type,
                isDefault: s.default,
                qFormat: s.qFormat,
                priority: (_a = s.uiPriority) !== null && _a !== void 0 ? _a : 99,
                // Extract visual properties from rPr, fall back to hardcoded defaults
                fontSize: (_c = (_b = s.rPr) === null || _b === void 0 ? void 0 : _b.fontSize) !== null && _c !== void 0 ? _c : defaultStyle === null || defaultStyle === void 0 ? void 0 : defaultStyle.fontSize,
                bold: (_e = (_d = s.rPr) === null || _d === void 0 ? void 0 : _d.bold) !== null && _e !== void 0 ? _e : defaultStyle === null || defaultStyle === void 0 ? void 0 : defaultStyle.bold,
                italic: (_g = (_f = s.rPr) === null || _f === void 0 ? void 0 : _f.italic) !== null && _g !== void 0 ? _g : defaultStyle === null || defaultStyle === void 0 ? void 0 : defaultStyle.italic,
                color: (_k = (_j = (_h = s.rPr) === null || _h === void 0 ? void 0 : _h.color) === null || _j === void 0 ? void 0 : _j.rgb) !== null && _k !== void 0 ? _k : defaultStyle === null || defaultStyle === void 0 ? void 0 : defaultStyle.color,
            };
        });
        // Sort by priority
        return docStyles.sort((a, b) => { var _a, _b; return ((_a = a.priority) !== null && _a !== void 0 ? _a : 99) - ((_b = b.priority) !== null && _b !== void 0 ? _b : 99); });
    }, [styles]);
    const handleValueChange = React.useCallback((newValue) => {
        onChange === null || onChange === void 0 ? void 0 : onChange(newValue);
    }, [onChange]);
    const getStyleName = (style) => (style.nameKey ? t(style.nameKey) : style.name);
    const currentValue = value || 'Normal';
    const currentStyle = styleOptions.find((s) => s.styleId === currentValue);
    const displayName = currentStyle ? getStyleName(currentStyle) : currentValue;
    return (_jsxs(Select, { value: currentValue, onValueChange: handleValueChange, disabled: disabled, children: [_jsx(SelectTrigger, { className: cn('h-8 text-sm', className), style: { width: typeof width === 'number' ? `${width}px` : width }, "aria-label": t('styles.selectAriaLabel'), children: _jsx("span", { className: "truncate", children: displayName }) }), _jsx(SelectContent, { className: "min-w-[260px] max-h-[400px]", children: styleOptions.map((style) => (_jsx(SelectItem, { value: style.styleId, className: "py-2.5 px-3", children: _jsx("span", { style: getStylePreviewCSS(style), children: getStyleName(style) }) }, style.styleId))) })] }));
}
//# sourceMappingURL=StylePicker.js.map