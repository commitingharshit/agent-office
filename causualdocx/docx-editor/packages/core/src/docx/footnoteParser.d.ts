/**
 * Footnote/Endnote Parser - Parse footnotes.xml and endnotes.xml
 *
 * Footnotes and endnotes are stored in separate XML files within the DOCX package:
 * - word/footnotes.xml - Contains all footnote definitions
 * - word/endnotes.xml - Contains all endnote definitions
 *
 * Each note contains:
 * - An ID that matches references in document.xml (w:footnoteReference, w:endnoteReference)
 * - A type (normal, separator, continuationSeparator, continuationNotice)
 * - Content (paragraphs)
 *
 * The references in the document body are parsed by runParser as NoteReferenceContent.
 *
 * OOXML Reference:
 * - Footnote: w:footnote[@w:id][@w:type]
 * - Endnote: w:endnote[@w:id][@w:type]
 * - Content: w:p (paragraphs)
 */
import type { Footnote, Endnote, FootnoteProperties, EndnoteProperties, Theme, RelationshipMap, MediaFile } from '../types/document';
import type { StyleMap } from './styleParser';
import type { NumberingMap } from './numberingParser';
import { type XmlElement } from './xmlParser';
/**
 * Footnote map returned by parseFootnotes
 */
export interface FootnoteMap {
    /** All footnotes indexed by ID */
    byId: Map<number, Footnote>;
    /** Array of all footnotes in document order */
    footnotes: Footnote[];
    /** Get footnote by ID */
    getFootnote(id: number): Footnote | undefined;
    /** Check if footnote exists */
    hasFootnote(id: number): boolean;
    /** Get all normal (non-separator) footnotes */
    getNormalFootnotes(): Footnote[];
    /** Get separator footnote if exists */
    getSeparator(): Footnote | undefined;
    /** Get continuation separator if exists */
    getContinuationSeparator(): Footnote | undefined;
}
/**
 * Endnote map returned by parseEndnotes
 */
export interface EndnoteMap {
    /** All endnotes indexed by ID */
    byId: Map<number, Endnote>;
    /** Array of all endnotes in document order */
    endnotes: Endnote[];
    /** Get endnote by ID */
    getEndnote(id: number): Endnote | undefined;
    /** Check if endnote exists */
    hasEndnote(id: number): boolean;
    /** Get all normal (non-separator) endnotes */
    getNormalEndnotes(): Endnote[];
    /** Get separator endnote if exists */
    getSeparator(): Endnote | undefined;
    /** Get continuation separator if exists */
    getContinuationSeparator(): Endnote | undefined;
}
/**
 * Parse footnotes.xml
 *
 * @param footnotesXml - The raw XML content of word/footnotes.xml
 * @param styles - Parsed style map for applying styles
 * @param theme - Parsed theme for color resolution
 * @param numbering - Parsed numbering definitions for lists
 * @param rels - Relationships for resolving hyperlinks
 * @param media - Media files for images
 * @returns FootnoteMap with all footnotes
 */
export declare function parseFootnotes(footnotesXml: string | null, styles?: StyleMap | null, theme?: Theme | null, numbering?: NumberingMap | null, rels?: RelationshipMap | null, media?: Map<string, MediaFile> | null): FootnoteMap;
/**
 * Parse endnotes.xml
 *
 * @param endnotesXml - The raw XML content of word/endnotes.xml
 * @param styles - Parsed style map for applying styles
 * @param theme - Parsed theme for color resolution
 * @param numbering - Parsed numbering definitions for lists
 * @param rels - Relationships for resolving hyperlinks
 * @param media - Media files for images
 * @returns EndnoteMap with all endnotes
 */
export declare function parseEndnotes(endnotesXml: string | null, styles?: StyleMap | null, theme?: Theme | null, numbering?: NumberingMap | null, rels?: RelationshipMap | null, media?: Map<string, MediaFile> | null): EndnoteMap;
/**
 * Parse footnote properties from w:footnotePr element
 * (Can appear in w:sectPr or w:settings)
 */
export declare function parseFootnoteProperties(element: XmlElement | null): FootnoteProperties;
/**
 * Parse endnote properties from w:endnotePr element
 * (Can appear in w:sectPr or w:settings)
 */
export declare function parseEndnoteProperties(element: XmlElement | null): EndnoteProperties;
/**
 * Get plain text content of a footnote
 */
export declare function getFootnoteText(footnote: Footnote): string;
/**
 * Get plain text content of an endnote
 */
export declare function getEndnoteText(endnote: Endnote): string;
/**
 * Check if a footnote is a separator (not regular content)
 */
export declare function isSeparatorFootnote(footnote: Footnote): boolean;
/**
 * Check if an endnote is a separator (not regular content)
 */
export declare function isSeparatorEndnote(endnote: Endnote): boolean;
/**
 * Get footnote number for display (excluding separators)
 * @param footnote - The footnote to get the number for
 * @param footnoteMap - The footnote map
 * @param startNumber - Starting number (default 1)
 * @returns The display number, or null for separator footnotes
 */
export declare function getFootnoteDisplayNumber(footnote: Footnote, footnoteMap: FootnoteMap, startNumber?: number): number | null;
/**
 * Get endnote number for display (excluding separators)
 * @param endnote - The endnote to get the number for
 * @param endnoteMap - The endnote map
 * @param startNumber - Starting number (default 1)
 * @returns The display number, or null for separator endnotes
 */
export declare function getEndnoteDisplayNumber(endnote: Endnote, endnoteMap: EndnoteMap, startNumber?: number): number | null;
/**
 * Create an empty footnote map
 */
export declare function createEmptyFootnoteMap(): FootnoteMap;
/**
 * Create an empty endnote map
 */
export declare function createEmptyEndnoteMap(): EndnoteMap;
/**
 * Merge multiple footnote maps (e.g., from different documents)
 */
export declare function mergeFootnoteMaps(...maps: FootnoteMap[]): FootnoteMap;
/**
 * Merge multiple endnote maps (e.g., from different documents)
 */
export declare function mergeEndnoteMaps(...maps: EndnoteMap[]): EndnoteMap;
//# sourceMappingURL=footnoteParser.d.ts.map