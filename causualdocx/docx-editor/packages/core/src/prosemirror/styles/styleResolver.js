/**
 * Style Resolver for ProseMirror Editor
 *
 * Resolves OOXML style definitions to final paragraph and run properties.
 * Handles the cascade:
 * 1. Document defaults (docDefaults)
 * 2. Normal style (if no explicit styleId)
 * 3. Style chain (basedOn inheritance - already resolved by styleParser)
 * 4. Inline properties
 *
 * Based on ECMA-376 style cascade rules.
 */
import { mergeTextFormatting } from '../../utils/textFormattingMerge';
/**
 * Word's built-in Normal style defaults, used when the document
 * doesn't define its own Normal style. Per ECMA-376, Word applies
 * these defaults: 8pt (160 twips) after spacing, 1.08x line spacing.
 */
const BUILTIN_NORMAL_STYLE = {
    styleId: 'Normal',
    type: 'paragraph',
    name: 'Normal',
    default: true,
    pPr: {
        spaceAfter: 160,
        lineSpacing: 259,
        lineSpacingRule: 'auto',
    },
};
/**
 * StyleResolver provides efficient access to resolved style properties
 */
export class StyleResolver {
    constructor(styleDefinitions) {
        this.stylesById = new Map();
        this.docDefaults = styleDefinitions === null || styleDefinitions === void 0 ? void 0 : styleDefinitions.docDefaults;
        // Build lookup map
        if (styleDefinitions === null || styleDefinitions === void 0 ? void 0 : styleDefinitions.styles) {
            for (const style of styleDefinitions.styles) {
                if (style.styleId) {
                    this.stylesById.set(style.styleId, style);
                }
            }
        }
        // Find defaults — one per type per ECMA-376 §17.7.4.18.
        this.defaultParagraphStyle = this.findDefaultStyle('paragraph');
        this.defaultTableStyle = this.findDefaultStyle('table');
        this.defaultCharacterStyle = this.findDefaultStyle('character');
    }
    /**
     * Get a style by ID
     */
    getStyle(styleId) {
        return this.stylesById.get(styleId);
    }
    /**
     * Get all available paragraph styles (for toolbar dropdown)
     */
    getParagraphStyles() {
        const styles = [];
        for (const style of this.stylesById.values()) {
            if (style.type === 'paragraph' && !style.hidden && !style.semiHidden) {
                styles.push(style);
            }
        }
        // Sort by uiPriority, then by name
        return styles.sort((a, b) => {
            var _a, _b, _c, _d;
            const priorityA = (_a = a.uiPriority) !== null && _a !== void 0 ? _a : 99;
            const priorityB = (_b = b.uiPriority) !== null && _b !== void 0 ? _b : 99;
            if (priorityA !== priorityB)
                return priorityA - priorityB;
            return ((_c = a.name) !== null && _c !== void 0 ? _c : a.styleId).localeCompare((_d = b.name) !== null && _d !== void 0 ? _d : b.styleId);
        });
    }
    /**
     * Whether a paragraph style with the given id is defined in the
     * document's `styles.xml`. Used by the agent toolkit to refuse
     * `set_paragraph_style({ styleId: 'NoSuchStyle' })` instead of
     * silently writing an invalid `<w:pStyle>` reference.
     */
    hasParagraphStyle(styleId) {
        const style = this.stylesById.get(styleId);
        return (style === null || style === void 0 ? void 0 : style.type) === 'paragraph';
    }
    /**
     * Resolve paragraph style properties, including docDefaults cascade
     *
     * @param styleId - The style ID to resolve (e.g., 'Heading1', 'Normal')
     * @returns Resolved paragraph and run formatting
     */
    resolveParagraphStyle(styleId) {
        var _a, _b;
        const result = {};
        // Start with document defaults
        if ((_a = this.docDefaults) === null || _a === void 0 ? void 0 : _a.pPr) {
            result.paragraphFormatting = Object.assign({}, this.docDefaults.pPr);
        }
        if ((_b = this.docDefaults) === null || _b === void 0 ? void 0 : _b.rPr) {
            result.runFormatting = Object.assign({}, this.docDefaults.rPr);
        }
        // If no styleId, apply Normal style (if exists)
        if (!styleId) {
            if (this.defaultParagraphStyle) {
                this.mergeStyleIntoResult(result, this.defaultParagraphStyle);
            }
            return result;
        }
        // Get the requested style (already has basedOn chain resolved by styleParser)
        const style = this.stylesById.get(styleId);
        if (!style) {
            // Style not found, fall back to Normal
            if (this.defaultParagraphStyle) {
                this.mergeStyleIntoResult(result, this.defaultParagraphStyle);
            }
            return result;
        }
        // Merge style properties into result
        this.mergeStyleIntoResult(result, style);
        return result;
    }
    /**
     * Get all available table styles (for style gallery)
     */
    getTableStyles() {
        const styles = [];
        for (const style of this.stylesById.values()) {
            if (style.type === 'table' && !style.hidden && !style.semiHidden) {
                styles.push(style);
            }
        }
        return styles.sort((a, b) => {
            var _a, _b, _c, _d;
            const priorityA = (_a = a.uiPriority) !== null && _a !== void 0 ? _a : 99;
            const priorityB = (_b = b.uiPriority) !== null && _b !== void 0 ? _b : 99;
            if (priorityA !== priorityB)
                return priorityA - priorityB;
            return ((_c = a.name) !== null && _c !== void 0 ? _c : a.styleId).localeCompare((_d = b.name) !== null && _d !== void 0 ? _d : b.styleId);
        });
    }
    /**
     * Resolve run (character) style properties
     *
     * @param styleId - The character style ID to resolve
     * @returns Resolved text formatting
     */
    resolveRunStyle(styleId) {
        var _a, _b, _c;
        // OOXML §17.7.4.18 + §17.3.2 cascade for run formatting:
        //   1. docDefaults.rPr            (rPrDefault)
        //   2. default character style    (the style marked w:default="1")
        //   3. explicit character style   (from <w:rStyle> on the run)
        // Pre-PR this method skipped step 2, so any property set on the default
        // character style (typically "Default Paragraph Font" / "FontePadrao")
        // never reached runs without an explicit <w:rStyle>.
        let result = {};
        if ((_a = this.docDefaults) === null || _a === void 0 ? void 0 : _a.rPr) {
            result = Object.assign({}, this.docDefaults.rPr);
        }
        if ((_b = this.defaultCharacterStyle) === null || _b === void 0 ? void 0 : _b.rPr) {
            result = (_c = this.mergeTextFormatting(result, this.defaultCharacterStyle.rPr)) !== null && _c !== void 0 ? _c : result;
        }
        if (!styleId) {
            return Object.keys(result).length > 0 ? result : undefined;
        }
        const style = this.stylesById.get(styleId);
        if (!(style === null || style === void 0 ? void 0 : style.rPr)) {
            return Object.keys(result).length > 0 ? result : undefined;
        }
        const merged = this.mergeTextFormatting(result, style.rPr);
        return merged && Object.keys(merged).length > 0 ? merged : undefined;
    }
    /**
     * Get a character style's own properties WITHOUT docDefaults.
     * Used when the caller already has docDefaults applied (e.g., from paragraph style resolution).
     * This prevents docDefault fonts from incorrectly overriding paragraph style fonts.
     */
    getRunStyleOwnProperties(styleId) {
        if (!styleId)
            return undefined;
        const style = this.stylesById.get(styleId);
        if (!(style === null || style === void 0 ? void 0 : style.rPr))
            return undefined;
        return Object.keys(style.rPr).length > 0 ? Object.assign({}, style.rPr) : undefined;
    }
    /**
     * Get document defaults
     */
    getDocDefaults() {
        return this.docDefaults;
    }
    /**
     * Get default paragraph style (usually "Normal")
     */
    getDefaultParagraphStyle() {
        return this.defaultParagraphStyle;
    }
    /**
     * Get the default table style (the one marked `w:default="1"`).
     *
     * Per ECMA-376 §17.7.4.18, tables that don't specify a `w:tblStyle`
     * inherit from this style. The styleId varies by document language
     * ("Normal Table", "TableNormal", "Tabelanormal", etc.) — find it by
     * the parsed `default` flag, not by name.
     */
    getDefaultTableStyle() {
        return this.defaultTableStyle;
    }
    /**
     * Get the default character style (the one marked `w:default="1"`).
     *
     * Per ECMA-376 §17.7.4.18, runs without an explicit `w:rStyle` reference
     * inherit from this style. The styleId varies by document language
     * ("Default Paragraph Font", "FontePadrao", "Fontepargpadro" in
     * Portuguese fixtures, etc.) — find it by the parsed `default` flag.
     */
    getDefaultCharacterStyle() {
        return this.defaultCharacterStyle;
    }
    /**
     * Check if a style exists
     */
    hasStyle(styleId) {
        return this.stylesById.has(styleId);
    }
    // ============================================================================
    // Private helpers
    // ============================================================================
    findDefaultStyle(type) {
        var _a;
        // First try to find explicitly marked default
        for (const style of this.stylesById.values()) {
            if (style.type === type && style.default) {
                return style;
            }
        }
        // Fall back to "Normal" for paragraph styles
        if (type === 'paragraph') {
            const normal = this.stylesById.get('Normal');
            if (normal)
                return normal;
            // No Normal style in the document. If it defines its own
            // `docDefaults`, THOSE are the paragraph defaults (ECMA-376
            // §17.7.2) — substituting Word's built-in Normal (8pt after /
            // 1.08 line) here would merge OVER and override the document's
            // explicit docDefaults, compressing spacing vs Word/LibreOffice on
            // every doc that relies on docDefaults without a Normal style.
            // Only use the built-in when the document provides no paragraph
            // defaults at all.
            return ((_a = this.docDefaults) === null || _a === void 0 ? void 0 : _a.pPr) ? undefined : BUILTIN_NORMAL_STYLE;
        }
        return undefined;
    }
    mergeStyleIntoResult(result, style) {
        if (style.pPr) {
            result.paragraphFormatting = this.mergeParagraphFormatting(result.paragraphFormatting, style.pPr);
        }
        if (style.rPr) {
            result.runFormatting = this.mergeTextFormatting(result.runFormatting, style.rPr);
        }
    }
    /**
     * Merge paragraph formatting (source overrides target)
     */
    mergeParagraphFormatting(target, source) {
        if (!source)
            return target;
        if (!target)
            return source ? Object.assign({}, source) : undefined;
        const result = Object.assign({}, target);
        for (const key of Object.keys(source)) {
            const value = source[key];
            if (value !== undefined) {
                if (key === 'runProperties') {
                    result.runProperties = this.mergeTextFormatting(result.runProperties, source.runProperties);
                }
                else if (key === 'borders' || key === 'numPr' || key === 'frame') {
                    const baseValue = result[key];
                    const sourceValue = value;
                    result[key] = Object.assign(Object.assign({}, (baseValue || {})), (sourceValue || {}));
                }
                else if (key === 'tabs' && Array.isArray(value)) {
                    // Tabs from higher priority source replace lower priority
                    result.tabs = [...value];
                }
                else {
                    result[key] = value;
                }
            }
        }
        return result;
    }
    mergeTextFormatting(target, source) {
        return mergeTextFormatting(target, source);
    }
}
/**
 * Create a style resolver from document's style definitions
 */
export function createStyleResolver(styleDefinitions) {
    return new StyleResolver(styleDefinitions);
}
//# sourceMappingURL=styleResolver.js.map