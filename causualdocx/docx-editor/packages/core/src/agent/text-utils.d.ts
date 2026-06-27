/**
 * Shared Text Utilities for Agent Module
 *
 * Common text extraction and manipulation utilities used by
 * context.ts, selectionContext.ts, and other agent-related code.
 *
 * Consolidates duplicated helper functions into a single location.
 */
import type { DocumentBody, Paragraph, Run, Hyperlink, Table, TextFormatting } from '../types/document';
import type { Position } from '../types/agentApi';
/**
 * Get plain text from a paragraph
 */
export declare function getParagraphText(paragraph: Paragraph): string;
/**
 * Get plain text from a run
 */
export declare function getRunText(run: Run): string;
/**
 * Get plain text from a hyperlink
 */
export declare function getHyperlinkText(hyperlink: Hyperlink): string;
/**
 * Get plain text from a table
 */
export declare function getTableText(table: Table): string;
/**
 * Get plain text from document body
 */
export declare function getBodyText(body: DocumentBody): string;
/**
 * Count words in text
 */
export declare function countWords(text: string): number;
/**
 * Count characters in text
 */
export declare function countCharacters(text: string, includeSpaces?: boolean): number;
/**
 * Get word count from document body
 */
export declare function getBodyWordCount(body: DocumentBody): number;
/**
 * Get word count from table
 */
export declare function getTableWordCount(table: Table): number;
/**
 * Get character count from document body
 */
export declare function getBodyCharacterCount(body: DocumentBody): number;
/**
 * Get character count from table
 */
export declare function getTableCharacterCount(table: Table): number;
/**
 * Get text before a position
 *
 * @param paragraphs - Array of paragraphs
 * @param position - Position to get text before
 * @param maxChars - Maximum characters to return
 * @returns Text before the position
 */
export declare function getTextBefore(paragraphs: Paragraph[], position: Position, maxChars: number): string;
/**
 * Get text after a position
 *
 * @param paragraphs - Array of paragraphs
 * @param position - Position to get text after
 * @param maxChars - Maximum characters to return
 * @returns Text after the position
 */
export declare function getTextAfter(paragraphs: Paragraph[], position: Position, maxChars: number): string;
/**
 * Get formatting at a specific position in a paragraph
 *
 * @param paragraph - The paragraph to check
 * @param offset - Character offset in the paragraph
 * @returns Formatting at that position
 */
export declare function getFormattingAtPosition(paragraph: Paragraph, offset: number): Partial<TextFormatting>;
/**
 * Check if position is within a hyperlink
 *
 * @param paragraph - The paragraph to check
 * @param offset - Character offset in the paragraph
 * @returns True if position is in a hyperlink
 */
export declare function isPositionInHyperlink(paragraph: Paragraph, offset: number): boolean;
/**
 * Get hyperlink at position
 *
 * @param paragraph - The paragraph to check
 * @param offset - Character offset in the paragraph
 * @returns The hyperlink at that position, or undefined
 */
export declare function getHyperlinkAtPosition(paragraph: Paragraph, offset: number): Hyperlink | undefined;
/**
 * Check if style ID represents a heading
 *
 * @param styleId - Style ID to check
 * @returns True if it's a heading style
 */
export declare function isHeadingStyle(styleId?: string): boolean;
/**
 * Parse heading level from style ID
 *
 * @param styleId - Style ID to parse
 * @returns Heading level (1-9) or undefined
 */
export declare function parseHeadingLevel(styleId?: string): number | undefined;
/**
 * Check if document body has images
 *
 * @param body - Document body to check
 * @returns True if contains images
 */
export declare function hasImages(body: DocumentBody): boolean;
/**
 * Check if document body has hyperlinks
 *
 * @param body - Document body to check
 * @returns True if contains hyperlinks
 */
export declare function hasHyperlinks(body: DocumentBody): boolean;
/**
 * Check if document body has tables
 *
 * @param body - Document body to check
 * @returns True if contains tables
 */
export declare function hasTables(body: DocumentBody): boolean;
/**
 * Get all paragraphs from document body
 *
 * @param body - Document body
 * @returns Array of paragraphs
 */
export declare function getParagraphs(body: DocumentBody): Paragraph[];
/**
 * Get paragraph at index from document body
 *
 * @param body - Document body
 * @param index - Paragraph index (0-indexed)
 * @returns Paragraph or undefined
 */
export declare function getParagraphAtIndex(body: DocumentBody, index: number): Paragraph | undefined;
/**
 * Get block index for a paragraph index
 *
 * @param body - Document body
 * @param paragraphIndex - Paragraph index
 * @returns Block index or -1 if not found
 */
export declare function getBlockIndexForParagraph(body: DocumentBody, paragraphIndex: number): number;
declare const _default: {
    getParagraphText: typeof getParagraphText;
    getRunText: typeof getRunText;
    getHyperlinkText: typeof getHyperlinkText;
    getTableText: typeof getTableText;
    getBodyText: typeof getBodyText;
    countWords: typeof countWords;
    countCharacters: typeof countCharacters;
    getBodyWordCount: typeof getBodyWordCount;
    getBodyCharacterCount: typeof getBodyCharacterCount;
    getTextBefore: typeof getTextBefore;
    getTextAfter: typeof getTextAfter;
    getFormattingAtPosition: typeof getFormattingAtPosition;
    isPositionInHyperlink: typeof isPositionInHyperlink;
    getHyperlinkAtPosition: typeof getHyperlinkAtPosition;
    isHeadingStyle: typeof isHeadingStyle;
    parseHeadingLevel: typeof parseHeadingLevel;
    hasImages: typeof hasImages;
    hasHyperlinks: typeof hasHyperlinks;
    hasTables: typeof hasTables;
    getParagraphs: typeof getParagraphs;
    getParagraphAtIndex: typeof getParagraphAtIndex;
    getBlockIndexForParagraph: typeof getBlockIndexForParagraph;
};
export default _default;
//# sourceMappingURL=text-utils.d.ts.map