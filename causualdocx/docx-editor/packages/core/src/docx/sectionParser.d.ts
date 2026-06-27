/**
 * Section Properties Parser - Parse section properties (w:sectPr)
 *
 * Section properties define page layout and settings for a section of the document.
 * They appear in two places:
 * 1. Within a paragraph's properties (w:p/w:pPr/w:sectPr) - marks end of a section
 * 2. At the end of the document body (w:body/w:sectPr) - final section properties
 *
 * OOXML Reference:
 * - w:pgSz: Page size (width, height, orientation)
 * - w:pgMar: Page margins (top, bottom, left, right, header, footer, gutter)
 * - w:cols: Column definitions
 * - w:type: Section start type
 * - w:vAlign: Vertical alignment
 * - w:headerReference, w:footerReference: Header/footer references
 * - w:titlePg: Different first page
 * - w:lnNumType: Line numbering
 * - w:pgBorders: Page borders
 * - w:docGrid: Document grid
 * - w:footnotePr, w:endnotePr: Footnote/endnote properties
 */
import type { SectionProperties, RelationshipMap } from '../types/document';
import { type XmlElement } from './xmlParser';
/**
 * Parse section properties (w:sectPr)
 *
 * @param sectPr - The w:sectPr element
 * @param rels - Optional relationships for resolving header/footer references
 * @returns SectionProperties object
 */
export declare function parseSectionProperties(sectPr: XmlElement | null, _rels?: RelationshipMap | null): SectionProperties;
/**
 * Get page width in pixels (96 DPI)
 *
 * @param props - Section properties
 * @param defaultWidth - Default width in twips (default: 12240 = 8.5 inches)
 * @returns Width in pixels
 */
export declare function getPageWidthPixels(props: SectionProperties, defaultWidth?: number): number;
/**
 * Get page height in pixels (96 DPI)
 *
 * @param props - Section properties
 * @param defaultHeight - Default height in twips (default: 15840 = 11 inches)
 * @returns Height in pixels
 */
export declare function getPageHeightPixels(props: SectionProperties, defaultHeight?: number): number;
/**
 * Get content width (page width minus margins) in pixels
 *
 * @param props - Section properties
 * @returns Content width in pixels
 */
export declare function getContentWidthPixels(props: SectionProperties): number;
/**
 * Get content height (page height minus margins) in pixels
 *
 * @param props - Section properties
 * @returns Content height in pixels
 */
export declare function getContentHeightPixels(props: SectionProperties): number;
/**
 * Get margins in pixels
 *
 * @param props - Section properties
 * @returns Object with all margins in pixels
 */
export declare function getMarginsPixels(props: SectionProperties): {
    top: number;
    bottom: number;
    left: number;
    right: number;
    header: number;
    footer: number;
    gutter: number;
};
/**
 * Check if section has different first page header/footer
 */
export declare function hasDifferentFirstPage(props: SectionProperties): boolean;
/**
 * Check if section has different odd/even page headers/footers
 */
export declare function hasDifferentOddEven(props: SectionProperties): boolean;
/**
 * Get effective column count (minimum 1)
 */
export declare function getColumnCount(props: SectionProperties): number;
/**
 * Check if section is landscape
 */
export declare function isLandscape(props: SectionProperties): boolean;
/**
 * Check if section has page borders
 */
export declare function hasPageBorders(props: SectionProperties): boolean;
/**
 * Check if section has line numbers
 */
export declare function hasLineNumbers(props: SectionProperties): boolean;
/**
 * Get default section properties (US Letter size, 1 inch margins)
 */
export declare function getDefaultSectionProperties(): SectionProperties;
/**
 * Merge section properties (later values override earlier)
 *
 * @param base - Base properties
 * @param override - Override properties
 * @returns Merged properties
 */
export declare function mergeSectionProperties(base: SectionProperties, override: SectionProperties): SectionProperties;
//# sourceMappingURL=sectionParser.d.ts.map