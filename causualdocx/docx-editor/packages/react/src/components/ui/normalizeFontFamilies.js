/**
 * Normalize the `fontFamilies` prop (which may mix strings and `FontOption`
 * objects) into a uniform `FontOption[]` for `FontPicker`. Returns
 * `undefined` for `undefined` input so `FontPicker` falls back to its
 * built-in `DEFAULT_FONTS`. Strings expand into the `'other'` group with no
 * CSS fallback chain.
 */
export function normalizeFontFamilies(fontFamilies) {
    if (fontFamilies === undefined)
        return undefined;
    const normalized = fontFamilies.map((f) => (typeof f === 'string' ? { name: f, fontFamily: f, category: 'other' } : f));
    if (isDev()) {
        const warned = new Set();
        const seen = new Set();
        for (const f of normalized) {
            if (seen.has(f.name) && !warned.has(f.name)) {
                console.warn(`[DocxEditor] Duplicate font name in fontFamilies: "${f.name}"`);
                warned.add(f.name);
            }
            seen.add(f.name);
        }
    }
    return normalized;
}
// `process` is undefined in browser bundles unless the host's bundler
// replaces it. Guard so the lib doesn't throw a ReferenceError when shipped
// without a process shim (Vite default, native ESM).
function isDev() {
    var _a;
    return typeof process !== 'undefined' && ((_a = process.env) === null || _a === void 0 ? void 0 : _a.NODE_ENV) !== 'production';
}
//# sourceMappingURL=normalizeFontFamilies.js.map