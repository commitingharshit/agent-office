import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useMemo, useCallback } from 'react';
import en from '../../i18n/en.json';
const defaultLocale = en;
const LocaleContext = createContext(defaultLocale);
const LangContext = createContext('en');
function isRecord(v) {
    return v !== null && typeof v === 'object' && !Array.isArray(v);
}
/**
 * Deep merge locale objects. Null values in the override are treated as
 * "not yet translated" and fall back to the base (English) value.
 */
function deepMerge(base, override) {
    if (!override)
        return base;
    const result = Object.assign({}, base);
    for (const key of Object.keys(override)) {
        const overVal = override[key];
        if (overVal === null)
            continue;
        if (isRecord(base[key]) && isRecord(overVal)) {
            result[key] = deepMerge(base[key], overVal);
        }
        else if (overVal !== undefined) {
            result[key] = overVal;
        }
    }
    return result;
}
function getNestedValue(obj, path) {
    let current = obj;
    for (const part of path.split('.')) {
        if (!isRecord(current))
            return undefined;
        current = current[part];
    }
    return typeof current === 'string' ? current : undefined;
}
/**
 * Parse ICU plural branches: "=0 {none} one {# item} other {# items}"
 */
function parseBranches(branchStr) {
    const parsed = {};
    const regex = /(=\d+|\w+)\s*\{([^}]*)\}/g;
    let match;
    while ((match = regex.exec(branchStr)) !== null) {
        parsed[match[1]] = match[2];
    }
    return parsed;
}
/**
 * Process ICU MessageFormat plurals and simple {variable} interpolation.
 *
 * Supports (same subset as next-intl):
 *   - Interpolation: "Hello {name}"
 *   - Cardinal plural: "{count, plural, =0 {none} one {# item} other {# items}}"
 *   - Exact matches: =0, =1, =2 take priority over CLDR categories
 *   - # inside branches is replaced with the count value
 */
function formatMessage(template, vars, lang) {
    if (!vars)
        return template;
    const result = template.replace(/\{(\w+),\s*plural,\s*((?:[^{}]|\{[^{}]*\})*)\}/g, (full, varName, branchStr) => {
        var _a, _b;
        const count = Number(vars[varName]);
        if (isNaN(count))
            return full;
        const parsed = parseBranches(branchStr);
        // Exact match (=0, =1) takes priority
        const exact = parsed[`=${count}`];
        if (exact !== undefined)
            return exact.replace(/#/g, String(count));
        // CLDR plural category via Intl.PluralRules
        let category;
        try {
            category = new Intl.PluralRules(lang || 'en').select(count);
        }
        catch (_c) {
            category = count === 1 ? 'one' : 'other';
        }
        const text = (_b = (_a = parsed[category]) !== null && _a !== void 0 ? _a : parsed['other']) !== null && _b !== void 0 ? _b : '';
        return text.replace(/#/g, String(count));
    });
    return result.replace(/\{(\w+)\}/g, (_, key) => {
        const val = vars[key];
        return val !== undefined ? String(val) : `{${key}}`;
    });
}
export function LocaleProvider({ i18n, children }) {
    const i18nRecord = i18n;
    const lang = typeof (i18nRecord === null || i18nRecord === void 0 ? void 0 : i18nRecord._lang) === 'string' ? i18nRecord._lang : 'en';
    const merged = useMemo(() => deepMerge(defaultLocale, i18nRecord), [i18nRecord]);
    return (_jsx(LangContext.Provider, { value: lang, children: _jsx(LocaleContext.Provider, { value: merged, children: children }) }));
}
export function useTranslation() {
    const strings = useContext(LocaleContext);
    const lang = useContext(LangContext);
    const t = useCallback((key, vars) => {
        const value = getNestedValue(strings, key);
        return formatMessage(value !== null && value !== void 0 ? value : key, vars, lang);
    }, [strings, lang]);
    return { t };
}
//# sourceMappingURL=LocaleContext.js.map