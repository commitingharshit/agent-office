/**
 * Paragraph Parser - Parse paragraphs (w:p) with complete formatting
 *
 * A paragraph is the fundamental block-level element containing text runs,
 * hyperlinks, bookmarks, and fields.
 *
 * OOXML Reference:
 * - Paragraph: w:p
 * - Paragraph properties: w:pPr
 * - Content: runs, hyperlinks, bookmarks, fields
 */
import type { Paragraph, ParagraphFormatting, Theme, BorderSpec, RelationshipMap, MediaFile } from '../types/document';
import type { StyleMap } from './styleParser';
import type { NumberingMap } from './numberingParser';
import { type XmlElement } from './xmlParser';
/**
 * Parse border specification (w:top, w:bottom, w:left, w:right, etc.)
 */
export declare function parseBorderSpec(border: XmlElement | null): BorderSpec | undefined;
/**
 * Parse paragraph formatting properties (w:pPr)
 *
 * Handles ALL pPr properties:
 * - w:jc (alignment: left, center, right, both/justify)
 * - w:spacing (before, after, line, lineRule)
 * - w:ind (left, right, firstLine, hanging)
 * - w:pBdr (paragraph borders: top, bottom, left, right, between)
 * - w:shd (paragraph shading/background)
 * - w:tabs (tab stops with positions and types)
 * - w:keepNext, w:keepLines, w:widowControl, w:pageBreakBefore
 * - w:bidi (right-to-left)
 * - w:numPr (list info)
 * - w:pStyle (style reference)
 * - w:outlineLvl (outline level)
 * - w:framePr (frame properties)
 * - w:rPr (default run properties)
 */
export declare function parseParagraphProperties(pPr: XmlElement | null, theme: Theme | null, styles?: StyleMap): ParagraphFormatting | undefined;
/**
 * Parse a paragraph element (w:p)
 *
 * @param node - The w:p XML element
 * @param styles - Style map for resolving style references
 * @param theme - Theme for resolving theme colors/fonts
 * @param numbering - Numbering definitions for list info
 * @param rels - Relationship map for resolving hyperlink URLs
 * @param media - Media files map for image data
 * @param options - `inHeaderFooter` skips `<w:lastRenderedPageBreak/>`
 *   detection since headers and footers reflow per page.
 * @returns Parsed Paragraph object
 */
export declare function parseParagraph(node: XmlElement, styles: StyleMap | null, theme: Theme | null, numbering: NumberingMap | null, rels?: RelationshipMap | null, media?: Map<string, MediaFile> | null, options?: {
    inHeaderFooter?: boolean;
}): Paragraph;
/**
 * Get plain text from a paragraph
 *
 * @param paragraph - Parsed Paragraph object
 * @returns Concatenated text content
 */
export declare function getParagraphText(paragraph: Paragraph): string;
/**
 * Check if a paragraph is empty (no visible content)
 *
 * @param paragraph - Parsed Paragraph object
 * @returns true if paragraph has no visible content
 */
export declare function isEmptyParagraph(paragraph: Paragraph): boolean;
/**
 * Check if a paragraph is a list item
 *
 * @param paragraph - Parsed Paragraph object
 * @returns true if paragraph has numbering properties
 */
export declare function isListItem(paragraph: Paragraph): boolean;
/**
 * Get the list level of a paragraph (0-8)
 *
 * @param paragraph - Parsed Paragraph object
 * @returns List level or undefined if not a list item
 */
export declare function getListLevel(paragraph: Paragraph): number | undefined;
/**
 * Check if paragraph has a specific style
 *
 * @param paragraph - Parsed Paragraph object
 * @param styleId - Style ID to check for
 * @returns true if paragraph has the specified style
 */
export declare function hasStyle(paragraph: Paragraph, styleId: string): boolean;
/**
 * Check if paragraph starts with a template variable {{...}}
 *
 * @param paragraph - Parsed Paragraph object
 * @returns The variable name or null
 */
export declare function getTemplateVariable(paragraph: Paragraph): string | null;
//# sourceMappingURL=paragraphParser.d.ts.map