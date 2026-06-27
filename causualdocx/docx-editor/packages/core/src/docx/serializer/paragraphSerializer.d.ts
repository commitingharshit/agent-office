/**
 * Paragraph Serializer - Serialize paragraphs to OOXML XML
 *
 * Converts Paragraph objects back to <w:p> XML format for DOCX files.
 * Handles all paragraph properties and child content (runs, hyperlinks, fields, bookmarks).
 *
 * OOXML Reference:
 * - Paragraph: w:p
 * - Paragraph properties: w:pPr
 * - Runs, hyperlinks, bookmarks, fields as child elements
 */
import type { Paragraph, ParagraphFormatting, ParagraphPropertyChange, TextFormatting } from '../../types/document';
/**
 * Serialize paragraph formatting properties to w:pPr XML
 */
export declare function serializeParagraphFormatting(formatting: ParagraphFormatting | undefined, propertyChanges?: ParagraphPropertyChange[]): string;
/**
 * Serialize a paragraph to OOXML XML (w:p)
 *
 * @param paragraph - The paragraph to serialize
 * @returns XML string for the paragraph
 */
export declare function serializeParagraph(paragraph: Paragraph): string;
/**
 * Serialize multiple paragraphs to OOXML XML
 *
 * @param paragraphs - The paragraphs to serialize
 * @returns XML string for all paragraphs
 */
export declare function serializeParagraphs(paragraphs: Paragraph[]): string;
/**
 * Check if a paragraph has any content
 */
export declare function hasParagraphContent(paragraph: Paragraph): boolean;
/**
 * Check if a paragraph has formatting
 */
export declare function hasParagraphFormatting(paragraph: Paragraph): boolean;
/**
 * Get plain text from a paragraph (for comparison/debugging)
 */
export declare function getParagraphPlainText(paragraph: Paragraph): string;
/**
 * Create an empty paragraph
 */
export declare function createEmptyParagraph(formatting?: ParagraphFormatting): Paragraph;
/**
 * Create a paragraph with a single text run
 */
export declare function createTextParagraph(text: string, paragraphFormatting?: ParagraphFormatting, textFormatting?: TextFormatting): Paragraph;
/**
 * Check if paragraph is a list item
 */
export declare function isListParagraph(paragraph: Paragraph): boolean;
/**
 * Get list level of a paragraph (0-8, or -1 if not a list)
 */
export declare function getListLevel(paragraph: Paragraph): number;
export default serializeParagraph;
//# sourceMappingURL=paragraphSerializer.d.ts.map