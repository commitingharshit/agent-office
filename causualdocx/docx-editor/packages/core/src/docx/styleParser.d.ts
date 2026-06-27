/**
 * Style Parser - Parse styles.xml with full inheritance resolution
 *
 * Parses all style types (paragraph, character, table, list) with
 * complete basedOn inheritance chain resolution.
 *
 * OOXML Reference:
 * - Style file is at: word/styles.xml
 * - Uses WordprocessingML namespace (w:)
 *
 * Style Cascade (lowest to highest priority):
 * 1. Document defaults (w:docDefaults)
 * 2. Parent style properties (w:basedOn chain)
 * 3. Current style properties
 * 4. Direct formatting in document
 */
import type { Theme, Style, StyleType, StyleDefinitions } from '../types/document';
/**
 * Style map keyed by styleId
 */
export type StyleMap = Map<string, Style>;
/**
 * Parse styles.xml content
 *
 * @param stylesXml - XML content of styles.xml
 * @param theme - Parsed theme for resolving theme references
 * @returns StyleMap with resolved inheritance
 */
export declare function parseStyles(stylesXml: string, theme: Theme | null): StyleMap;
/**
 * Parse complete style definitions including docDefaults
 *
 * @param stylesXml - XML content of styles.xml
 * @param theme - Parsed theme for resolving theme references
 * @returns StyleDefinitions with docDefaults and resolved styles
 */
export declare function parseStyleDefinitions(stylesXml: string, theme: Theme | null): StyleDefinitions;
/**
 * Get the resolved properties for a style
 *
 * @param styleId - Style ID to look up
 * @param styleMap - Style map from parseStyles
 * @returns Resolved style or undefined
 */
export declare function getResolvedStyle(styleId: string, styleMap: StyleMap): Style | undefined;
/**
 * Get the default paragraph style
 */
export declare function getDefaultParagraphStyle(styleMap: StyleMap): Style | undefined;
/**
 * Get the default character style
 */
export declare function getDefaultCharacterStyle(styleMap: StyleMap): Style | undefined;
/**
 * Get the default table style.
 *
 * Per ECMA-376 §17.7.4.18 (`<w:default>`), exactly one style of each type may
 * be marked default; tables that do not specify a `w:tblStyle` inherit from
 * that style. The styleId varies by document language ("Normal Table",
 * "TableNormal", "Tabelanormal", etc.) — find it by the parsed `default` flag,
 * not by name.
 */
export declare function getDefaultTableStyle(styleMap: StyleMap): Style | undefined;
/**
 * Get all styles of a specific type
 */
export declare function getStylesByType(styleMap: StyleMap, type: StyleType): Style[];
//# sourceMappingURL=styleParser.d.ts.map