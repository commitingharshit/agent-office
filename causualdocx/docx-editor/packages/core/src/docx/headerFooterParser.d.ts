/**
 * Header/Footer Parser - Parse header*.xml and footer*.xml files
 *
 * Headers and footers are stored in separate XML files within the DOCX package:
 * - word/header1.xml, word/header2.xml, etc.
 * - word/footer1.xml, word/footer2.xml, etc.
 *
 * Each header/footer is referenced from document.xml via:
 * - w:sectPr > w:headerReference (type="default|first|even", r:id="rIdX")
 * - w:sectPr > w:footerReference (type="default|first|even", r:id="rIdX")
 *
 * Header/footer types:
 * - default: Used for all pages unless first/even specified
 * - first: Used only for the first page of a section
 * - even: Used for even-numbered pages (when different odd/even enabled)
 *
 * Content structure:
 * - w:hdr or w:ftr root element
 * - Contains w:p (paragraphs) and w:tbl (tables)
 * - Can contain images, shapes, page numbers, etc.
 *
 * OOXML Reference:
 * - Root: w:hdr (header) or w:ftr (footer)
 * - Content: w:p, w:tbl
 */
import type { HeaderFooter, HeaderFooterType, HeaderReference, FooterReference, Theme, RelationshipMap, MediaFile } from '../types/document';
import type { StyleMap } from './styleParser';
import type { NumberingMap } from './numberingParser';
import { type XmlElement } from './xmlParser';
/**
 * Map of header/footer ID to HeaderFooter content
 */
export interface HeaderFooterMap {
    /** Map of rId to HeaderFooter */
    byId: Map<string, HeaderFooter>;
    /** Get header/footer by rId */
    get(rId: string): HeaderFooter | undefined;
    /** Check if header/footer exists */
    has(rId: string): boolean;
    /** Get all headers/footers */
    getAll(): HeaderFooter[];
    /** Get by type */
    getByType(type: HeaderFooterType): HeaderFooter | undefined;
}
/**
 * Parse a header reference from sectPr (w:headerReference)
 *
 * @param element - The w:headerReference element
 * @returns HeaderReference with type and rId
 */
export declare function parseHeaderReference(element: XmlElement): HeaderReference;
/**
 * Parse a footer reference from sectPr (w:footerReference)
 *
 * @param element - The w:footerReference element
 * @returns FooterReference with type and rId
 */
export declare function parseFooterReference(element: XmlElement): FooterReference;
/**
 * Parse all header references from a sectPr element
 *
 * @param sectPr - The w:sectPr element
 * @returns Array of HeaderReference objects
 */
export declare function parseHeaderReferences(sectPr: XmlElement): HeaderReference[];
/**
 * Parse all footer references from a sectPr element
 *
 * @param sectPr - The w:sectPr element
 * @returns Array of FooterReference objects
 */
export declare function parseFooterReferences(sectPr: XmlElement): FooterReference[];
/**
 * Parse a header XML file (word/header*.xml)
 *
 * @param headerXml - The raw XML content of the header file
 * @param hdrFtrType - The type of header (default, first, even)
 * @param styles - Parsed style map for applying styles
 * @param theme - Parsed theme for color resolution
 * @param numbering - Parsed numbering definitions for lists
 * @param rels - Relationships for resolving hyperlinks/images
 * @param media - Media files for images
 * @returns HeaderFooter object
 */
export declare function parseHeader(headerXml: string, hdrFtrType?: HeaderFooterType, styles?: StyleMap | null, theme?: Theme | null, numbering?: NumberingMap | null, rels?: RelationshipMap | null, media?: Map<string, MediaFile> | null): HeaderFooter;
/**
 * Parse a footer XML file (word/footer*.xml)
 *
 * @param footerXml - The raw XML content of the footer file
 * @param hdrFtrType - The type of footer (default, first, even)
 * @param styles - Parsed style map for applying styles
 * @param theme - Parsed theme for color resolution
 * @param numbering - Parsed numbering definitions for lists
 * @param rels - Relationships for resolving hyperlinks/images
 * @param media - Media files for images
 * @returns HeaderFooter object
 */
export declare function parseFooter(footerXml: string, hdrFtrType?: HeaderFooterType, styles?: StyleMap | null, theme?: Theme | null, numbering?: NumberingMap | null, rels?: RelationshipMap | null, media?: Map<string, MediaFile> | null): HeaderFooter;
/**
 * Generic function to parse either header or footer
 *
 * @param xml - Raw XML content
 * @param isHeader - true for header, false for footer
 * @param hdrFtrType - The type (default, first, even)
 * @param styles - Style map
 * @param theme - Theme
 * @param numbering - Numbering definitions
 * @param rels - Relationships
 * @param media - Media files
 * @returns HeaderFooter object
 */
export declare function parseHeaderFooter(xml: string, isHeader: boolean, hdrFtrType?: HeaderFooterType, styles?: StyleMap | null, theme?: Theme | null, numbering?: NumberingMap | null, rels?: RelationshipMap | null, media?: Map<string, MediaFile> | null): HeaderFooter;
/**
 * Create an empty HeaderFooterMap
 */
export declare function createEmptyHeaderFooterMap(): HeaderFooterMap;
/**
 * Build a HeaderFooterMap from references and XML content
 *
 * @param references - Header or footer references from sectPr
 * @param xmlContents - Map of rId to XML content
 * @param isHeader - true for headers, false for footers
 * @param styles - Style map
 * @param theme - Theme
 * @param numbering - Numbering definitions
 * @param rels - Relationships
 * @param media - Media files
 * @returns HeaderFooterMap with all parsed headers/footers
 */
export declare function buildHeaderFooterMap(references: (HeaderReference | FooterReference)[], xmlContents: Map<string, string>, isHeader: boolean, styles?: StyleMap | null, theme?: Theme | null, numbering?: NumberingMap | null, rels?: RelationshipMap | null, media?: Map<string, MediaFile> | null): HeaderFooterMap;
/**
 * Get plain text content of a header/footer
 */
export declare function getHeaderFooterText(hf: HeaderFooter): string;
/**
 * Check if header/footer is empty (no content)
 */
export declare function isEmptyHeaderFooter(hf: HeaderFooter): boolean;
/**
 * Check if header/footer has page number field
 */
export declare function hasPageNumberField(hf: HeaderFooter): boolean;
/**
 * Get the header for a given page considering type rules
 *
 * @param headers - Map of type to HeaderFooter
 * @param pageNumber - 1-based page number
 * @param isFirstPage - Whether this is the first page of the section
 * @param hasDifferentFirstPage - Whether different first page is enabled
 * @param hasDifferentOddEven - Whether different odd/even pages is enabled
 * @returns The appropriate HeaderFooter or undefined
 */
export declare function getHeaderForPage(headers: Map<HeaderFooterType, HeaderFooter>, pageNumber: number, isFirstPage: boolean, hasDifferentFirstPage: boolean, hasDifferentOddEven: boolean): HeaderFooter | undefined;
/**
 * Get the footer for a given page considering type rules
 * (Same logic as getHeaderForPage)
 */
export declare function getFooterForPage(footers: Map<HeaderFooterType, HeaderFooter>, pageNumber: number, isFirstPage: boolean, hasDifferentFirstPage: boolean, hasDifferentOddEven: boolean): HeaderFooter | undefined;
/**
 * Convert HeaderFooterMap to type-indexed Map
 *
 * @param map - HeaderFooterMap
 * @returns Map indexed by HeaderFooterType
 */
export declare function headerFooterMapToTypeMap(map: HeaderFooterMap): Map<HeaderFooterType, HeaderFooter>;
/**
 * Check if a HeaderFooter contains any images
 */
export declare function hasImages(hf: HeaderFooter): boolean;
/**
 * Check if a HeaderFooter contains any tables
 */
export declare function hasTables(hf: HeaderFooter): boolean;
//# sourceMappingURL=headerFooterParser.d.ts.map