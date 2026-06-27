/**
 * Selection Context Builder
 *
 * Builds rich context objects from document selections for AI operations.
 * Includes selected text, formatting, surrounding context, and suggested actions.
 */
import type { Document, Paragraph, TextFormatting } from '../types/document';
import type { SelectionContext, ParagraphContext, SuggestedAction, Range, Position } from '../types/agentApi';
/**
 * Options for building selection context
 */
export interface SelectionContextOptions {
    /** Characters of context before selection (default: 200) */
    contextCharsBefore?: number;
    /** Characters of context after selection (default: 200) */
    contextCharsAfter?: number;
    /** Include suggested actions (default: true) */
    includeSuggestions?: boolean;
    /** Include document summary (default: true) */
    includeDocumentSummary?: boolean;
    /** Maximum suggested actions (default: 8) */
    maxSuggestions?: number;
}
/**
 * Extended selection context with additional details
 */
export interface ExtendedSelectionContext extends SelectionContext {
    /** Document summary for additional context */
    documentSummary?: string;
    /** Selection word count */
    wordCount?: number;
    /** Selection character count */
    characterCount?: number;
    /** Is selection multi-paragraph */
    isMultiParagraph?: boolean;
    /** Selected paragraph indices */
    paragraphIndices?: number[];
    /** Language detection hint */
    detectedLanguage?: string;
    /** Content type hints */
    contentType?: 'prose' | 'list' | 'heading' | 'table' | 'mixed';
}
/**
 * Selection formatting summary
 */
export interface FormattingSummary {
    /** Predominant formatting */
    predominant: Partial<TextFormatting>;
    /** Is formatting consistent across selection */
    isConsistent: boolean;
    /** All formatting found */
    allFormatting: Partial<TextFormatting>[];
}
/**
 * Build selection context for AI operations
 *
 * @param doc - The parsed document
 * @param range - The selected range
 * @param options - Selection context options
 * @returns SelectionContext object
 */
export declare function buildSelectionContext(doc: Document, range: Range, options?: SelectionContextOptions): SelectionContext;
/**
 * Build extended selection context with additional details
 *
 * @param doc - The parsed document
 * @param range - The selected range
 * @param options - Selection context options
 * @returns ExtendedSelectionContext object
 */
export declare function buildExtendedSelectionContext(doc: Document, range: Range, options?: SelectionContextOptions): ExtendedSelectionContext;
/**
 * Get formatting summary for a selection
 *
 * @param doc - The parsed document
 * @param range - The selected range
 * @returns FormattingSummary object
 */
export declare function getSelectionFormattingSummary(doc: Document, range: Range): FormattingSummary;
/**
 * Extract selected text from paragraphs
 */
declare function extractSelectedText(paragraphs: Paragraph[], range: Range): string;
/**
 * Get text before a position
 */
declare function getTextBefore(paragraphs: Paragraph[], position: Position, maxChars: number): string;
/**
 * Get text after a position
 */
declare function getTextAfter(paragraphs: Paragraph[], position: Position, maxChars: number): string;
/**
 * Get formatting at a specific position
 */
declare function getFormattingAtPosition(paragraph: Paragraph, offset: number): Partial<TextFormatting>;
/**
 * Get suggested actions based on selection
 */
declare function getSuggestedActions(selectedText: string, _formatting: Partial<TextFormatting>, _paragraphContext: ParagraphContext): SuggestedAction[];
/**
 * Detect content type of selection
 */
declare function detectContentType(paragraphs: Paragraph[], range: Range): 'prose' | 'list' | 'heading' | 'table' | 'mixed';
/**
 * Simple language detection
 */
declare function detectLanguage(text: string): string | undefined;
/**
 * Count words in text
 */
declare function countWords(text: string): number;
export { buildSelectionContext as default, extractSelectedText, getTextBefore, getTextAfter, getFormattingAtPosition, getSuggestedActions, detectContentType, detectLanguage, countWords, };
//# sourceMappingURL=selectionContext.d.ts.map