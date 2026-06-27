/**
 * Insert Operations Utility
 *
 * Utility functions for inserting content into the document.
 * Provides functions for inserting page breaks, horizontal rules, and other elements.
 */
import type { BreakContent, Run, Paragraph, Document, RunContent } from '../types/document';
/**
 * Insert position in the document
 */
export interface InsertPosition {
    /** Paragraph index in the document body */
    paragraphIndex: number;
    /** Run index within the paragraph (optional) */
    runIndex?: number;
    /** Character offset within the run (optional) */
    offset?: number;
}
/**
 * Create a page break content element
 */
export declare function createPageBreak(): BreakContent;
/**
 * Create a column break content element
 */
export declare function createColumnBreak(): BreakContent;
/**
 * Create a text wrapping break (line break)
 */
export declare function createLineBreak(clear?: 'none' | 'left' | 'right' | 'all'): BreakContent;
/**
 * Create a run containing a page break
 */
export declare function createPageBreakRun(): Run;
/**
 * Create an empty paragraph with a page break before it
 */
export declare function createPageBreakParagraph(): Paragraph;
/**
 * Insert a page break at a position in the document
 * This inserts a new paragraph with pageBreakBefore: true
 */
export declare function insertPageBreak(doc: Document, position: InsertPosition): Document;
/**
 * Create a horizontal rule paragraph
 * Uses a paragraph with bottom border to simulate horizontal rule
 */
export declare function createHorizontalRule(): Paragraph;
/**
 * Insert a horizontal rule at a position in the document
 */
export declare function insertHorizontalRule(doc: Document, position: InsertPosition): Document;
/**
 * Check if content is a page break
 */
export declare function isPageBreak(content: RunContent): boolean;
/**
 * Check if content is a column break
 */
export declare function isColumnBreak(content: RunContent): boolean;
/**
 * Check if content is a line break
 */
export declare function isLineBreak(content: RunContent): boolean;
/**
 * Check if content is any type of break
 */
export declare function isBreakContent(content: RunContent): content is BreakContent;
/**
 * Check if a paragraph has pageBreakBefore
 */
export declare function hasPageBreakBefore(paragraph: Paragraph): boolean;
/**
 * Count page breaks in a document
 */
export declare function countPageBreaks(doc: Document): number;
/**
 * Find all page break positions in a document
 */
export declare function findPageBreaks(doc: Document): InsertPosition[];
/**
 * Remove a page break at a specific position
 */
export declare function removePageBreak(doc: Document, position: InsertPosition): Document;
declare const _default: {
    createPageBreak: typeof createPageBreak;
    createColumnBreak: typeof createColumnBreak;
    createLineBreak: typeof createLineBreak;
    createPageBreakRun: typeof createPageBreakRun;
    createPageBreakParagraph: typeof createPageBreakParagraph;
    insertPageBreak: typeof insertPageBreak;
    createHorizontalRule: typeof createHorizontalRule;
    insertHorizontalRule: typeof insertHorizontalRule;
    isPageBreak: typeof isPageBreak;
    isColumnBreak: typeof isColumnBreak;
    isLineBreak: typeof isLineBreak;
    isBreakContent: typeof isBreakContent;
    hasPageBreakBefore: typeof hasPageBreakBefore;
    countPageBreaks: typeof countPageBreaks;
    findPageBreaks: typeof findPageBreaks;
    removePageBreak: typeof removePageBreak;
};
export default _default;
//# sourceMappingURL=insertOperations.d.ts.map